const { firestore } = require("../firebase");

async function checkSecret(clientId, secret) {
    if (!secret || !clientId) return false;

    const code = clientId
        .toLowerCase()
        .split("")
        .map((char) => (char.charCodeAt(0) - "a".charCodeAt(0) + 1) * 2)
        .join("");

    const docRef = firestore.collection("whatsappClients").doc(clientId);
    const snapshot = await docRef.get();
    let secretCounter;
    if (!snapshot.exists) {
        console.log(`No document for clientId: ${clientId}`);
        return false;
    } else {
        secretCounter = snapshot.data().secretCounter || 1;
    }

    let generatedCode =
        parseFloat(code.substring(0, 10)) * parseFloat(secretCounter + 2);
    generatedCode = generatedCode.toString();
    generatedCode = generatedCode.split("").reverse().join("");

    const counter = secretCounter.toString().padStart(3, "0");

    const transformedCode = code.substring(0, 10) + counter + generatedCode;
    if (secret === transformedCode) {
        return true;
    } else {
        return false;
    }
}

exports.checkSecret = checkSecret;
