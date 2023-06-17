const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode");
const { firestore } = require("../firebase");

const reset = "\x1b[0m";
const red = "\x1b[31m";
const green = "\x1b[32m";

const restartClient = async (clientId, clients) => {
    clients[clientId] = await initializeClient(clientId);
};

const initializeClient = async (clientId) => {
    try {
        console.log(`Initialising client ${clientId}`);
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
        return await clientInitialization(clientId, client);
    } catch (err) {
        console.log(err);
        return null;
    }
};

async function clientInitialization(clientId, client) {
    client.on("qr", async (qr) => {
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

exports.restartClient = restartClient;
