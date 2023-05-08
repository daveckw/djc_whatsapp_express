const fs = require("fs");
const path = require("path");

function saveMessage(message, filename) {
    if (!message) return;
    const messageJson = {
        ...message,
        from: message?.from || "",
        notifyName: message?._data?.notifyName || "",
        body: message?.body || ""
    };

    const messagesFile = path.join(__dirname, `${filename}.json`);

    // Check if messages.json exists
    fs.access(messagesFile, fs.constants.F_OK, (err) => {
        if (err) {
            // If the file does not exist, create it and write the message
            fs.writeFile(
                messagesFile,
                JSON.stringify([messageJson], null, 2),
                (err) => {
                    if (err) throw err;
                    console.log("New message saved.");
                }
            );
        } else {
            // If the file exists, read its contents, append the message, and write it back
            fs.readFile(messagesFile, "utf8", (err, data) => {
                if (err) throw err;

                const messages = JSON.parse(data);
                messages.push(messageJson);

                fs.writeFile(
                    messagesFile,
                    JSON.stringify(messages, null, 2),
                    (err) => {
                        if (err) throw err;
                        console.log("Message appended.");
                    }
                );
            });
        }
    });
}

exports.saveMessage = saveMessage;
