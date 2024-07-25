const express = require("express");
const app = express();
const WebSocket = require("ws");
const queryString = require("node:querystring");

app.get("/", (req, res) => res.sendFile(__dirname + "/chat.html"));

const expressServer = app.listen(3000, () =>
  console.log("Server ready on port 3000.")
);

const wsServer = new WebSocket.Server({ server: expressServer });

wsServer.on("connection", (wsClient, connectionRequest) => {
  const [, params] = connectionRequest?.url?.split("?");
  const { name } = queryString.parse(params);

  wsClient.name = name;

  // New client connected
  broadcastTo(wsClient, `Welcome ${wsClient.name}!`);
  broadcastToOthers(wsClient, `${wsClient.name} was joined the chat`);

  // Listen for messages from the client
  wsClient.on("message", (message) => {
    // Send the message back to the sender
    broadcastTo(wsClient, `Me: ${message}`);
    // Broadcast the message to all connected clients
    broadcastToOthers(wsClient, `${wsClient.name}: ${message}`);
  });

  // Listen for the error event
  wsClient.on("error", console.error);

  // Listen for the close event
  wsClient.on("close", () => {
    // Broadcast the message to all connected clients
    broadcastToOthers(wsClient, `${wsClient.name} has left the chat`);
  });
});

const broadcastTo = (wsClient, message) => {
  try {
    wsClient.send(message);
  } catch (error) {
    console.error(error);
  }
};

const broadcastToOthers = (currentWsClient, message) => {
  wsServer.clients.forEach((wsClient) => {
    if (
      wsClient !== currentWsClient &&
      wsClient.readyState === WebSocket.OPEN
    ) {
      try {
        broadcastTo(wsClient, message);
      } catch (error) {
        console.error(error);
      }
    }
  });
};

module.exports = app;
