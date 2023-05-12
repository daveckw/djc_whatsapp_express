const { Client, LocalAuth, RemoteAuth } = require("whatsapp-web.js");
const { MongoStore } = require("wwebjs-mongo");
const mongoose = require("mongoose");
const qrcode = require("qrcode");

const authenticatioMethod = "local"; // local or remote
const URI = "";

exports.initializeClient = async (clientId, socket) => {
    try {
        // Create a new Whatspapp client instance
        console.log("Initialising client...");
        if (authenticatioMethod === "local") {
            console.log("Using local authentication...");
            const client = new Client({
                authStrategy: new LocalAuth({
                    clientId: clientId
                }),
                puppeteer: { headless: true, args: ["--no-sandbox"] } // set to true when deployed
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

async function clientInitialization(clientId, client, socket) {
    client.on("qr", async (qr) => {
        try {
            const dataUrl = await qrcode.toDataURL(qr);
            console.log("QR code generated");
            socket.emit("qr", dataUrl);
        } catch (err) {
            console.error("Error generating QR code:", err);
        }
    });

    client.on("ready", () => {
        console.log(`Whatsapp Client ${clientId} is ready!`);
        socket.emit("ready", {
            clientId: clientId,
            username: socket.username
        });
    });

    client.on("remote_session_saved", () => {
        console.log("Remote session has been saved :" + socket.username);
    });

    client.on("auth_failure", (msg) => {
        console.error("Authentication failure:", msg);
    });

    client.on("disconnected", (reason) => {
        console.error("Client disconnected:", reason);
    });

    client.on("error", (err) => {
        console.error("Client error:", err);
    });

    client.on("message", async (message) => {
        try {
            console.log("message.from: ", message.from);
            console.log("Name: ", message._data.notifyName);
            console.log("message.body: ", message.body);
            console.log("type: ", message._data.type);
            console.log("-----------------------------");

            let msg = {
                from: message.from,
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

            socket.emit("message", msg);
        } catch (err) {
            console.log("Error: ", err.message);
        }
    });

    try {
        await client.initialize();
        return client;
    } catch (err) {
        console.error("Client initialization error:", err);
        return null;
    }
}
