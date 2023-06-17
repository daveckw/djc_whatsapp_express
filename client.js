const { Client, LocalAuth, RemoteAuth } = require("whatsapp-web.js");
const { MongoStore } = require("wwebjs-mongo");
const mongoose = require("mongoose");
const qrcode = require("qrcode");
const { firestore } = require("./firebase");
const { dateToString } = require("./helpers/dateToString");

const authenticatioMethod = "local"; // local or remote
const URI = "";

const reset = "\x1b[0m";
const red = "\x1b[31m";
const green = "\x1b[32m";

exports.initializeClient = async (clientId, socket) => {
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
                        "--no-sandbox",
                        "--disable-setuid-sandbox",
                        "--disable-dev-shm-usage",
                        "--disable-accelerated-2d-canvas",
                        "--disable-gpu",
                        "--window-size=1920x1080"
                    ]
                } // set to true when deployed
            });
            return await clientInitialization(clientId, client, socket);
        } else if (authenticatioMethod === "remote") {
            console.log("Connecting to MongoDB...");
            await mongoose.connect(URI);
            console.log("Connected to MongoDB");
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
            return await clientInitialization(clientId, client, socket);
        }
    } catch (err) {
        console.log(err);
        return null;
    }
};

let qrCount = {};

async function clientInitialization(clientId, client, socket) {
    client.on("qr", async (qr) => {
        if (!qrCount[clientId]) qrCount[clientId] = 1;
        try {
            const dataUrl = await qrcode.toDataURL(qr);
            console.log(`${qrCount[clientId]}: QR code generated`);
            qrCount[clientId]++;
            if (qrCount[clientId] > 2) {
                console.log("Times out. Destroying client ", clientId);
                client.destroy();
                socket.emit("qr", "");
                qrCount[clientId] = 0;
            } else {
                socket.emit("qr", dataUrl);
            }
        } catch (err) {
            console.error(`${red}Error generating QR code:${reset}`, err);
        }
    });

    client.on("ready", () => {
        console.log(`${green}Whatsapp Client ${clientId} is ready!${reset}`);
        firestore.collection("whatsappClients").doc(clientId).set(
            {
                clientId: clientId,
                status: "ready",
                date: new Date()
            },
            { merge: true }
        );
        socket.emit("ready", {
            clientId: clientId,
            username: socket.username
        });
    });

    client.on("auth_failure", (msg) => {
        console.log("Authentication failure:", msg);
    });

    client.on("disconnected", (reason) => {
        console.log("Client disconnected:", reason);
        firestore.collection("whatsappClients").doc(clientId).set(
            {
                clientId: clientId,
                status: "disconnected",
                date: new Date()
            },
            { merge: true }
        );
        socket.emit("session", "");
        socket.emit("username", "");
    });

    client.on("message", async (message) => {
        try {
            console.log("message.from: ", message.from);
            console.log("message.to: ", message.to);
            console.log("Name: ", message._data.notifyName);
            console.log("message.body: ", message.body);
            console.log("type: ", message._data.type);
            console.log("-----------------------------");

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
                socket.emit("message", newMsg);
                return;
            }

            const whatsappMessage = {
                date: new Date(message.timestamp * 1000),
                from: message.from,
                to: message.to,
                name: message._data.notifyName,
                type: message._data.type,
                body: message.body
            };
            socket.emit("message", msg);

            // firestore
            //     .collection("whatsappMessages")
            //     .doc(clientId)
            //     .collection("messages")
            //     .doc(dateToString(whatsappMessage.date))
            //     .set(whatsappMessage, { merge: true });
            // console.log("Message saved to firestore");
        } catch (err) {
            console.log("Error: ", err.message);
        }
    });

    client.on("message_create", async (message) => {
        try {
            const whatsappMessage = {
                date: new Date(message.timestamp * 1000),
                from: message.from,
                to: message.to,
                name: message._data.notifyName,
                type: message._data.type,
                body: message.body
            };
            // firestore
            //     .collection("whatsappMessages")
            //     .doc(clientId)
            //     .collection("messages")
            //     .doc(dateToString(whatsappMessage.date))
            //     .set(whatsappMessage, { merge: true });
            // console.log("Message saved to firestore");
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
