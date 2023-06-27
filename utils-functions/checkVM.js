const http = require("http");

function getInstanceName() {
    if (process.env.NODE_ENV === "development") {
        return Promise.resolve("localhost");
    }
    return new Promise((resolve, reject) => {
        const options = {
            hostname: "metadata.google.internal",
            port: 80,
            path: "/computeMetadata/v1/instance/name",
            method: "GET",
            headers: {
                "Metadata-Flavor": "Google"
            }
        };

        const req = http.request(options, (res) => {
            let data = "";
            res.setEncoding("utf8");
            res.on("data", (chunk) => {
                data += chunk;
            });
            res.on("end", () => {
                resolve(data);
            });
        });

        req.on("error", (error) => {
            console.error(error);
            reject(error);
        });

        req.end();
    });
}

exports.getInstanceName = getInstanceName;
