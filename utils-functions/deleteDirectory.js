const path = require("path");
const fs = require("fs");

function deleteDirectory(clientId) {
    const dirsToDelete = [
        `../.wwebjs_auth/session-${clientId}/Default/Cache`,
        `../.wwebjs_auth/session-${clientId}/Default/Code Cache`
    ];

    let status = [];
    dirsToDelete.forEach((dir) => {
        const dirPath = path.join(__dirname, dir);

        try {
            fs.rmSync(dirPath, { recursive: true, force: true });
            console.log(`${dirPath} has been deleted successfully`);
            status.push({
                status: true,
                message: `${dirPath} has been deleted successfully`
            });
        } catch (error) {
            console.log(`Error while deleting ${dirPath}: `, error);
            status.push({
                status: false,
                message: `Error while deleting ${dirPath}: ${error}`
            });
        }
    });
    return status;
}

exports.deleteDirectory = deleteDirectory;
