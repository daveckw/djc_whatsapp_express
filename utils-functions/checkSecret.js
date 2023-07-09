function checkSecret(clientId, secret) {
    if (!secret || !clientId) return false;

    const code = clientId
        .toLowerCase()
        .split("")
        .map((char) => (char.charCodeAt(0) - "a".charCodeAt(0) + 1) * 2)
        .join("");

    const secretCounter = parseFloat(secret.substring(10, 13));

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
