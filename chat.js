const { initializeClient } = require("./client");

exports.chat = (socket, clients) => {
    socket.on("clientId", async (clientId) => {
        console.log("Client Id: ", clientId);
        socket.emit("clientId", clientId);

        if (clients[clientId]) {
            try {
                const state = await clients[clientId]?.getState();
                if (
                    clientId ===
                        clients[clientId].options.authStrategy.clientId &&
                    state === "CONNECTED"
                ) {
                    socket.emit("ready", {
                        clientId,
                        username: socket.username
                    });
                    return;
                }
            } catch (err) {
                console.log(err.message);
            }

            clients[clientId] = await initializeClient(clientId, socket);
            socket.emit("session", {
                clientId: clientId,
                username: socket.username
            });
        }

        if (!clients[clientId]) {
            clients[clientId] = await initializeClient(
                clientId,
                socket,
                clients
            );
            socket.emit("session", {
                clientId: clientId,
                username: socket.username
            });
        }
    });

    socket.on("chat message", async (msg) => {
        if (!clients[socket.username]) {
            console.log("Client is not ready");
            return;
        }
        const { to, name, body } = msg;
        console.log("to: " + to);
        console.log("Name: " + name);
        console.log("Message: " + body);
        console.log("--------------");

        try {
            const numberId = await clients[socket.username].getNumberId(to);
            if (numberId) {
                clients[socket.username].sendMessage(to, body);
                socket.emit("chat message", msg);
            } else {
                socket.emit("chat message", { ...msg, body: "Invalid number" });
            }
        } catch (err) {
            console.log(err);
        }
    });
};
