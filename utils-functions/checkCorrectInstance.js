const { firestore } = require("../firebase");
const { getInstanceName } = require("./checkVM");

const checkCorrectInstance = async (clientId) => {
    try {
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
        const currentVMInstanceName = await getInstanceName();
        if (instanceName === currentVMInstanceName) {
            return true;
        } else {
            return false;
        }
    } catch (error) {
        console.log(error);
    }
};

exports.checkCorrectInstance = checkCorrectInstance;
