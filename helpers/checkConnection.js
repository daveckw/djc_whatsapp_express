const checkConnection = async (clients, clientId) => {
    if (!clients[clientId]) return false;
    try {
        const state = await clients[clientId]?.getState();
        if (
            clientId === clients[clientId].options.authStrategy.clientId &&
            state === "CONNECTED"
        ) {
            return true;
        }
    } catch (err) {
        return false;
    }
};

exports.checkConnection = checkConnection;
