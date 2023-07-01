const { Client, LocalAuth, RemoteAuth } = require("whatsapp-web.js");
const { MongoStore } = require("wwebjs-mongo");
const mongoose = require("mongoose");
const qrcode = require("qrcode");
const { firestore } = require("./firebase");
const { extractNumbers } = require("./helpers/formatter");
const { dateToString } = require("./helpers/dateToString");
const { getInstanceName } = require("./utils-functions/checkVM");
const fs = require("fs-extra");
const path = require("path");

const authenticatioMethod = "local"; // local or remote
const URI = process.env.MONGODB_URI;

const reset = "\x1b[0m";
const red = "\x1b[31m";
const green = "\x1b[32m";

exports.initializeClient = async (clientId, init = false) => {
    try {
        // Create a new Whatspapp client instance
        console.log(`Initialising client ${clientId}`);
        if (authenticatioMethod === "local") {
            console.log("Using local authentication...");
            const client = new Client({
                authStrategy: new LocalAuth({
                    clientId: clientId
                }),
                puppeteer: {
                    headless: true,
                    args: [
                        "--no-sandbox",
                        "--disable-setuid-sandbox",
                        "--disable-dev-shm-usage",
                        "--disable-accelerated-2d-canvas",
                        "--disable-gpu",
                        "--window-size=1920x1080"
                    ]
                } // set to true when deployed
            });
            return await clientInitialization(clientId, client, init);
        } else if (authenticatioMethod === "remote") {
            console.log("Connecting to MongoDB...", clientId);
            await mongoose.connect(URI);
            console.log("Connected to MongoDB", clientId);
            const store = new MongoStore({ mongoose: mongoose });
            const client = new Client({
                authStrategy: new RemoteAuth({
                    clientId: clientId,
                    store: store,
                    backupSyncIntervalMs: 300000
                }),
                puppeteer: {
                    headless: true,
                    args: [
                        "--no-sandbox",
                        "--disable-setuid-sandbox",
                        "--disable-dev-shm-usage",
                        "--disable-accelerated-2d-canvas",
                        "--disable-gpu",
                        "--window-size=1920x1080"
                    ],
                    timeout: 60000
                } // set to true when deployed
            });
            return await clientInitialization(clientId, client, init);
        }
    } catch (err) {
        console.log(err);
        return null;
    }
};

async function clientInitialization(clientId, client, init) {
    const instanceName = await getInstanceName();
    let qrCount = {};

    if (init) {
        client.on("qr", async (qr) => {
            if (!qrCount[clientId]) qrCount[clientId] = 1;
            try {
                const dataUrl = await qrcode.toDataURL(qr);
                console.log(`${qrCount[clientId]}: QR code generated`);
                qrCount[clientId]++;

                const docRef = firestore
                    .collection("whatsappClients")
                    .doc(clientId);

                if (qrCount[clientId] > 3) {
                    console.log("Times out. Destroying client ", clientId);
                    client.destroy();
                    await docRef.set(
                        {
                            date: new Date(),
                            qr: ""
                        },
                        { merge: true }
                    );
                    qrCount[clientId] = 0;
                } else {
                    try {
                        // set QR code to firestore
                        await docRef.update(
                            {
                                date: new Date(),
                                qr: dataUrl
                            },
                            { merge: true }
                        );
                    } catch (error) {
                        console.error("Error getting doc ", error);
                    }
                }
            } catch (err) {
                console.error(`${red}Error generating QR code:${reset}`, err);
            }
        });
    } else {
        client.on("qr", async () => {
            try {
                // const dataUrl = await qrcode.toDataURL(qr);
                firestore.collection("whatsappClients").doc(clientId).set(
                    {
                        clientId: clientId,
                        status: "disconnected",
                        date: new Date()
                    },
                    { merge: true }
                );
                client.destroy();
                console.log(
                    "QR code generated for client at restartClient:",
                    clientId,
                    "disconnecting client. Reconnect using web interface."
                );
            } catch (err) {
                console.error(`${red}Error generating QR code:${reset}`, err);
            }
        });
    }

    client.on("ready", async () => {
        console.log(`${green}Whatsapp Client ${clientId} is ready!${reset}`);
        firestore.collection("whatsappClients").doc(clientId).set(
            {
                clientId: clientId,
                status: "ready",
                qr: "",
                date: new Date(),
                instanceName
            },
            { merge: true }
        );
        console.log("phone: ", client["info"]["wid"]["user"]);
    });

    client.on("auth_failure", (msg) => {
        console.log("Authentication failure:", msg);
    });

    client.on("disconnected", async (reason) => {
        console.log("Client disconnected:", reason);
        firestore.collection("whatsappClients").doc(clientId).set(
            {
                date: new Date(),
                clientId: clientId,
                status: "disconnected",
                instanceName: "",
                qr: "",
                previousInstanceName: instanceName
            },
            { merge: true }
        );

        await client.destroy();

        // Delete .wwebjs_auth/session-{clienId} folder
        const dirPath = path.join(".wwebjs_auth", `session-${clientId}`);

        async function deleteAll(directoryPath) {
            try {
                const items = await fs.readdir(directoryPath);
                for (const item of items) {
                    const itemPath = path.join(directoryPath, item);
                    try {
                        const stats = await fs.lstat(itemPath);
                        if (stats.isDirectory()) {
                            await deleteAll(itemPath);
                        } else {
                            await fs.remove(itemPath);
                        }
                    } catch (err) {
                        console.error(
                            `Error deleting file or directory: ${itemPath}`,
                            err
                        );
                    }
                }
            } catch (err) {
                console.error(`Error reading directory: ${directoryPath}`, err);
            }
        }

        // Check if folder exists
        if (fs.existsSync(dirPath)) {
            deleteAll(dirPath);
        } else {
            console.log(`${dirPath} does not exist.`);
        }
    });

    client.on("message", async (message) => {
        try {
            let msg = {
                from: message.from,
                to: message.to,
                name: message._data.notifyName,
                type: message._data.type,
                body: message.body
            };

            if (message.hasMedia) {
                const media = await message.downloadMedia();
                const newMsg = { ...msg, media };
                return;
            }
        } catch (err) {
            console.log("Error: ", err.message);
        }
    });

    client.on("message_create", async (message) => {
        try {
            let chatRoomId = "";
            if (message.fromMe) {
                chatRoomId =
                    extractNumbers(message.from) +
                    "-" +
                    extractNumbers(message.to);
            } else {
                chatRoomId =
                    extractNumbers(message.to) +
                    "-" +
                    extractNumbers(message.from);
            }

            const quotedMessagePromise = new Promise((resolve) => {
                if (message.hasQuotedMsg) {
                    try {
                        resolve(message.getQuotedMessage());
                    } catch (err) {
                        console.log(err.message);
                        resolve("");
                    }
                } else {
                    resolve("");
                }
            });

            const quotedMessage = await quotedMessagePromise;
            let body = typeof message.body === "string" ? message.body : "";
            body = quotedMessage
                ? `Quoted message: ${quotedMessage.body}\n\n${body}`
                : body;
            const whatsappMessage = {
                date: new Date(),
                from: message.from,
                to: message.to,
                name: message._data.notifyName || "",
                type: message._data.type || "",
                body: body,
                clientId,
                quotedMessage: quotedMessage.body || "",
                chatRoomId
            };
            console.log(whatsappMessage);

            console.log("Type: ", whatsappMessage.type);

            if (process.env.NODE_ENV === "development") return;

            if (whatsappMessage.type === "chat") {
                try {
                    firestore
                        .collection("whatsappMessages")
                        .doc(chatRoomId)
                        .collection("messages")
                        .doc(dateToString(whatsappMessage.date))
                        .set(whatsappMessage, { merge: true });
                    firestore
                        .collection("whatsappMessages")
                        .doc(chatRoomId)
                        .set(
                            {
                                date: whatsappMessage.date,
                                chatRoomId,
                                clientId
                            },
                            { merge: true }
                        );
                    console.log("Message saved to firestore");
                } catch (err) {
                    console.log(`${red}Error saving to Firestore${reset}`);
                    console.log("Error: ", err.message);
                }
            }
        } catch (err) {
            console.log("Error: ", err.message);
        }
    });

    try {
        await client.initialize();
        return client;
    } catch (err) {
        console.log(
            `${red}Client initialization error: ${err.message}${reset}`
        );
        return null;
    }
}
