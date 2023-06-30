const admin = require("firebase-admin");

const serviceAccount = require("./private/serviceAccountKey.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});
admin.firestore().settings({
    ignoreUndefinedProperties: true
});

const firestore = admin.firestore();

exports.firestore = firestore;
