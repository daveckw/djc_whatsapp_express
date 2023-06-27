require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { body, check, validationResult } = require("express-validator");
const { phoneNumberFormatter } = require("./helpers/formatter");
const { checkRegisteredNumber } = require("./helpers/checkRegisteredNumber");
const { MessageMedia } = require("whatsapp-web.js");
const http = require("http");

const multer = require("multer");
const { firestore } = require("./firebase");
const { initializeClient } = require("./client");

const upload = multer();

const port = process.env.PORT || 8080;

const app = express();
app.use(cors());
app.use(express.json());
app.use(
    express.urlencoded({
        extended: true
    })
);

const server = http.createServer(app);

const reset = "\x1b[0m";
const red = "\x1b[31m";
const green = "\x1b[32m";

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/index.html");
});

let clients = {};

const getWhatsAppClients = async () => {
    const collectionRef = firestore
        .collection("whatsappClients")
        .where("status", "==", "ready");

    try {
        const snapshot = await collectionRef.get();
        const clientIds = snapshot.docs.map((doc) => {
            return doc.id;
        });
        clientIds.forEach(async (clientId) => {
            console.log("clientId: ", clientId);
            clients[clientId] = await initializeClient(clientId);
        });
    } catch (error) {
        console.error("Error getting documents: ", error);
    }
};

if (process.env.NODE_ENV !== "development") {
    getWhatsAppClients();
}

app.post("/start", [body("clientId").notEmpty()], async (req, res) => {
    const errors = validationResult(req).formatWith(({ msg }) => {
        return msg;
    });

    if (!errors.isEmpty()) {
        return res.status(422).json({
            status: false,
            message: errors.mapped()
        });
    }

    const clientId = req.body.clientId;

    if (clients[clientId]) {
        try {
            const state = await clients[clientId]?.getState();
            if (
                clientId === clients[clientId].options.authStrategy.clientId &&
                state === "CONNECTED"
            ) {
                console.log(`Client ${clientId} already started`);
                res.status(200).json({
                    status: `Client ${clientId} already started`
                });
                return;
            }
        } catch (err) {
            console.log(err.message);
        }
    }

    try {
        clients[clientId] = await initializeClient(clientId, true);
        console.log("clientId: ", clientId + " started");
        res.status(200).json({
            status: `Client ${clientId} started`
        });
    } catch (err) {
        console.log(err.message);
        res.status(500).json({
            status: "Something went wrong"
        });
    }
});

// Send message
app.post(
    "/send-message",
    [
        body("number").notEmpty(),
        body("message").notEmpty(),
        body("from").notEmpty()
    ],
    async (req, res) => {
        const errors = validationResult(req).formatWith(({ msg }) => {
            return msg;
        });

        if (!errors.isEmpty()) {
            return res.status(422).json({
                status: false,
                message: errors.mapped()
            });
        }

        const number = phoneNumberFormatter(req.body.number);
        const message = req.body.message;
        const from = req.body.from;

        console.log("--------sending-------");
        console.log("number: ", number);
        console.log("message: ", message);
        console.log("from: ", from);

        if (!clients[from]) {
            console.log(
                `${red}${from} is not activated. Please check your DJC System\n${reset}`
            );
            return res.status(422).json({
                status: false,
                message: `${from} is not activated. Please check your DJC System`
            });
        }

        const isRegisteredNumber = await checkRegisteredNumber(
            number,
            clients[from]
        );

        if (!isRegisteredNumber) {
            console.log(`${red}The number is not registered\n${reset}`);
            return res.status(422).json({
                status: false,
                message: "The number is not registered"
            });
        }

        clients[from]
            .sendMessage(number, message)
            .then((response) => {
                console.log(`${green}Sent\n${reset}`);
                res.status(200).json({
                    status: true,
                    response: response
                });
            })
            .catch((err) => {
                console.log(`${red}Error\n${reset}`);
                console.log(err);
                res.status(500).json({
                    status: false,
                    response: err
                });
            });
    }
);

// Sending Image
app.post(
    "/send-image-message",
    upload.single("file"),
    //upload.array('files')

    [
        body("number").notEmpty(),
        check("isFilePresent")
            .custom(
                (value, { req }) =>
                    req.file.size > 0 && Boolean(req.body.isFilePresent)
            )
            .withMessage("File should not be empty"),
        body("from").notEmpty()
    ],
    async (req, res) => {
        const errors = validationResult(req).formatWith(({ msg }) => {
            return msg;
        });

        if (!errors.isEmpty()) {
            console.log(errors);
            return res.status(422).json({
                status: false,
                message: errors.mapped()
            });
        }

        const number = phoneNumberFormatter(req.body.number);
        const message = new MessageMedia(
            req.file.mimetype,
            req.file.buffer.toString("base64"),
            req.file.originalname,
            req.file.size
        );
        const from = req.body.from;
        const caption = req.body.caption;

        if (!clients[from]) {
            console.log(
                `${red}${from} is not activated. Please check your DJC System\n${reset}`
            );
            return res.status(422).json({
                status: false,
                message: `${from} is not activated. Please check your DJC System`
            });
        }

        const isRegisteredNumber = await checkRegisteredNumber(
            number,
            clients[from]
        );

        if (!isRegisteredNumber) {
            console.log(`${red}The number is not registered\n${reset}`);
            return res.status(422).json({
                status: false,
                message: "The number is not registered"
            });
        }

        clients[from]
            .sendMessage(number, message, { caption: caption })
            .then((response) => {
                console.log(`${green}Sent\n${reset}`);
                res.status(200).json({
                    status: true,
                    response: response
                });
            })
            .catch((err) => {
                console.log(`${red}Error\n${reset}`);
                res.status(500).json({
                    status: false,
                    response: err
                });
            });
    }
);

// Sending Image with URL
app.post(
    "/send-image-url-message",
    [
        body("number").notEmpty(),
        body("downloadURL").notEmpty(),
        body("from").notEmpty()
    ],
    async (req, res) => {
        const errors = validationResult(req).formatWith(({ msg }) => {
            return msg;
        });

        if (!errors.isEmpty()) {
            console.log(errors);
            return res.status(422).json({
                status: false,
                message: errors.mapped()
            });
        }

        const downloadURL = req.body.downloadURL;
        const number = phoneNumberFormatter(req.body.number);
        const from = req.body.from;
        const caption = req.body.caption;

        console.log("--------sending-------");
        console.log("number: ", number);
        console.log("from: ", from);
        console.log("message: ", "Attachment");

        const message = await MessageMedia.fromUrl(downloadURL);

        if (!clients[from]) {
            console.log(
                `${red}${from} is not activated. Please check your DJC System\n${reset}`
            );
            return res.status(422).json({
                status: false,
                message: `${from} is not activated. Please check your DJC System`
            });
        }

        const isRegisteredNumber = await checkRegisteredNumber(
            number,
            clients[from]
        );

        if (!isRegisteredNumber) {
            console.log(`${red}The number is not registered\n${reset}`);
            return res.status(422).json({
                status: false,
                message: "The number is not registered"
            });
        }

        clients[from]
            .sendMessage(number, message, { caption: caption })
            .then((response) => {
                console.log(`${green}Sent\n${reset}`);
                res.status(200).json({
                    status: true,
                    response: response
                });
            })
            .catch((err) => {
                console.log(`${red}Error\n${reset}`);
                res.status(500).json({
                    status: false,
                    response: err
                });
            });
    }
);

// Check state API
app.post("/check-state", [body("from").notEmpty()], async (req, res) => {
    const from = req.body.from;
    try {
        const state = await clients[from].getState();
        console.log(state);
        res.status(200).json({
            status: true
        });
    } catch (err) {
        console.log(`${red}${err.message} from: ${from}${reset}`);
        res.status(500).json({
            status: false,
            response: err.message
        });
    }
});

// Check clients
app.post("/check-clients", async (req, res) => {
    try {
        let status = {};
        let numberOfConnectedClients = 0;
        await Promise.all(
            Object.keys(clients).map(async (key) => {
                console.log("key: ", key);
                try {
                    const state = await clients[key].getState();
                    console.log(`Client ${key} state: ${state}`);
                    if (state === "CONNECTED") {
                        status[key] = "active";
                        numberOfConnectedClients++;
                        return Promise.resolve();
                    } else {
                        status[key] = "disconnected";
                        return Promise.resolve();
                    }
                } catch (err) {
                    status[key] = "disconnected";
                    return Promise.resolve();
                }
            })
        );
        console.log("Number of connected clients: ", numberOfConnectedClients);
        res.status(200).json({
            status: true,
            clientStatuses: status,
            numberOfConnectedClients: numberOfConnectedClients
        });
    } catch (err) {
        console.log(`${red}${err.message}${reset}`);
        res.status(500).json({
            status: false,
            response: err.message
        });
    }
});

process.on("uncaughtException", (err, origin) => {
    console.log(
        `${red}Caught exception: ${err.message}\n` +
            `Exception origin: ${origin}${reset}`
    );
});

process.on("unhandledRejection", (reason) => {
    console.log(`${red}Unhandled Rejection.${reset}`, reason);
});

let connections = new Set();

server.on("connection", (conn) => {
    connections.add(conn);
    conn.on("close", () => connections.delete(conn));
});

process.on("SIGINT", () => {
    console.log("\nShutting down gracefully...");

    // Close all connections
    for (let conn of connections) {
        conn.end();
    }

    // Close the server
    server.close(() => {
        console.log("Server closed.");
        process.exit(0);
    });
});

server.listen(port, () => {
    console.log("listening on *: " + port);
});

module.exports = {
    server
};
