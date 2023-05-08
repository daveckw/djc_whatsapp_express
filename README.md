# WhatsApp Web Client with Socket.IO

This project is a simple WhatsApp Web client using the `whatsapp-web.js` library, Express, and Socket.IO. It allows users to send and receive messages through a web interface.

## Prerequisites

-   Node.js 14.x or later
-   NPM or Yarn package manager
-   A WhatsApp account

## How Socket.IO works in this project

Socket.IO is used for real-time communication between the server (running the WhatsApp Web client) and the web interface (React app). When the server receives a new message from WhatsApp, it emits the message to all connected clients using Socket.IO. Similarly, when a user sends a message from the web interface, the React app emits the message to the server, which then sends it to the recipient using the WhatsApp Web client.

The main components of Socket.IO in this project are:

1. **Server**: The server sets up a WebSocket using Socket.IO to handle incoming connections from clients (web interface). It listens for events, such as a new chat message or a client disconnecting.

2. **Client**: The React app connects to the WebSocket server using the Socket.IO client library. It listens for incoming chat messages from the server and emits messages to the server when the user sends a message.

## Installation

1. Clone the repository:

```
git clone https://github.com/daveckw/express_whatsappweb
cd express_whatsappweb
```

2. Install dependencies:
   npm install

## Usage

1. Start the server:
   `node index.js`

The server will start on port 3002, and you should see a QR code generated in the console.

2. Scan the QR code with your WhatsApp account:

Open WhatsApp on your phone, go to Settings > WhatsApp Web/Desktop, and scan the QR code displayed in the console.

3. Start the React app (assumed to be running on `http://localhost:3000`) and connect to the WebSocket.

4. Use the web interface to send and receive messages.

The application will log received messages and save them to a `messages.json` file in the project directory.

## License

This project is released under the MIT License.
