const { google } = require("googleapis");
const compute = google.compute("v1");

// Load the service account key
const serviceAccount = require("./private/serviceAccountKey-CE.json");
const scopes = ["https://www.googleapis.com/auth/compute.readonly"];

// Authenticate with the service account
const auth = new google.auth.JWT(
    serviceAccount.client_email,
    null,
    serviceAccount.private_key,
    scopes
);

// Tell the Compute Engine client to use the auth
compute.setAuthClient(auth);

// Now you can use the compute object to call Compute Engine APIs
exports.compute = compute;
