const { compute } = require("googleapis/build/src/apis/compute");
const { firestore } = require("../firebase");

async function determineDestinationInstance(clientId) {
    // Get the instance name from Firestore.
    const doc = await firestore
        .collection("whatsappClients")
        .doc(clientId)
        .get();
    if (!doc.exists) {
        console.log(`No document for clientId: ${clientId}`);
        return "";
    }
    const instanceName = doc.data().instanceName;

    // Get the instance details from Compute Engine.
    const instance = await compute.instances.get({
        project: "djc-whatsapp", // Replace with your project ID.
        zone: "asia-southeast1-b", // Replace with your zone.
        instance: instanceName
    });

    // Get the IP address from the instance details.
    const ipAddress = instance.data.networkInterfaces[0].accessConfigs[0].natIP;

    return ipAddress;
}

exports.determineDestinationInstance = determineDestinationInstance;
