const fs = require("fs");
const path = require("path");

function getDirectorySize(dirPath) {
    let totalSize = 0;
    const files = fs.readdirSync(dirPath);

    files.forEach((file) => {
        const filePath = path.join(dirPath, file);

        try {
            const fileStat = fs.statSync(filePath);

            if (fileStat.isDirectory()) {
                // Recursive call if the file is a directory
                totalSize += getDirectorySize(filePath);
            } else {
                // Add the file size if it is a file
                totalSize += fileStat.size;
            }
        } catch (error) {
            console.log(`Could not stat path: ${filePath}`);
            console.error(error);
        }
    });

    return totalSize;
}

// Call the function with the directory path as argument
exports.getDirectorySize = getDirectorySize;
