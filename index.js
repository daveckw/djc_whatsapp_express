const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
//const fileUpload = require("express-fileupload");
const cors = require("cors");
const { body, check, validationResult } = require("express-validator");
const { chat } = require("./chat");
const { phoneNumberFormatter } = require("./helpers/formatter");
const { checkRegisteredNumber } = require("./helpers/checkRegisteredNumber");
const { MessageMedia } = require("whatsapp-web.js");

const multer = require("multer");
const upload = multer();

const port = process.env.PORT || 8080;

const app = express();
const corsOptions = {
    origin: "https://djcsystem.com",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(
    express.urlencoded({
        extended: true
    })
);

/*app.use(
    fileUpload({
        debug: false
    })
);
*/

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: [
            "http://localhost:3000",
            "https://app.djc.ai",
            "https://djcsystem.com"
        ], // Replace with your React app's URL
        methods: ["GET", "POST"],
        credentials: true
    }
});

const reset = "\x1b[0m";
const red = "\x1b[31m";
const green = "\x1b[32m";

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/index.html");
});

io.use((socket, next) => {
    const username = socket.handshake.auth.username;
    if (!username) {
        return next(new Error("invalid username"));
    }
    socket.username = username;
    next();
});

let client = {};

io.on("connection", (socket) => {
    console.log("A user: " + socket.username + " connected");
    io.emit("connection", "A user connected");
    io.emit("username", socket.username);

    chat(socket, client); // Initialise client

    socket.on("disconnect", () => {
        console.log(socket.username + " user disconnected");
        io.emit("session", "");
    });
});

process.on("SIGINT", () => {
    console.log("\nShutting down gracefully...");

    // Emit a 'shutdown' event to the React app via Socket.IO
    io.emit("session", "");
    io.emit("username", "");

    // Close the server
    server.close(() => {
        console.log("Server closed.");
        process.exit(0);
    });
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
        console.log("--------sending-------");
        console.log("number: ", req.body.number);
        console.log("message: ", req.body.message);
        console.log("from: ", req.body.from);
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

        const isRegisteredNumber = await checkRegisteredNumber(
            number,
            client[from]
        );

        if (!isRegisteredNumber) {
            console.log(`${red}The number is not registered\n${reset}`);
            return res.status(422).json({
                status: false,
                message: "The number is not registered"
            });
        }

        client[from]
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
        const isRegisteredNumber = await checkRegisteredNumber(
            number,
            client[from]
        );

        if (!isRegisteredNumber) {
            console.log(`${red}The number is not registered\n${reset}`);
            return res.status(422).json({
                status: false,
                message: "The number is not registered"
            });
        }

        client[from]
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

process.on("uncaughtException", (err, origin) => {
    console.log(`Caught exception: ${err}\n` + `Exception origin: ${origin}`);
});

process.on("unhandledRejection", (reason, promise) => {
    console.log("Unhandled Rejection at:", promise, "reason:", reason);
});

server.listen(port, () => {
    console.log("listening on *: " + port);
});

module.exports = {
    server
};
