const admin = require("firebase-admin");

const serviceAccount = require(".\\private\\facebook-api-59e5c-firebase-adminsdk-uqibe-c3ed28858c.json");
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const firestore = admin.firestore();

exports.firestore = firestore;
