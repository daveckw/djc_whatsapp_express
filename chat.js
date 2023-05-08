const { initializeClient } = require("./client");

exports.chat = (socket, client) => {
    socket.on("clientId", async (clientId) => {
        console.log("Client Id: ", clientId);
        socket.emit("clientId", clientId);

        if (client[socket.username]) {
            if (
                clientId ===
                client[socket.username].options.authStrategy.clientId
            ) {
                socket.emit("ready", { clientId, username: socket.username });
                return;
            }

            client[socket.username] = await initializeClient(clientId, socket);
            socket.emit("session", {
                clientId: clientId,
                username: socket.username
            });
        }

        if (!client[socket.username]) {
            client[socket.username] = await initializeClient(clientId, socket);
            socket.emit("session", {
                clientId: clientId,
                username: socket.username
            });
        }
    });

    socket.on("chat message", async (msg) => {
        if (!client[socket.username]) {
            console.log("Client is not ready");
            return;
        }
        const { to, name, body } = msg;
        console.log("to: " + to);
        console.log("Name: " + name);
        console.log("Message: " + body);
        console.log("--------------");

        try {
            const numberId = await client[socket.username].getNumberId(to);
            if (numberId) {
                client[socket.username].sendMessage(to, body);
                socket.emit("chat message", msg);
            } else {
                socket.emit("chat message", { ...msg, body: "Invalid number" });
            }
        } catch (err) {
            console.log(err);
        }
    });
};
