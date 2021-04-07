const path = require("path");
const express = require("express");
const PORT = process.env.PORT || 3000;

const app = express();

app.get("/", (request, response) => {
  response.send("Enter a game ID into the URL path to view the breakdown");
})

app.get("/:gameId", (request, response) => {
  const { gameId } = request.params;
  response.sendFile(path.join(__dirname, "graph.html"));
});

// Serve the json data for the specified game
app.get("/data/:gameId", (request, response) => {
  try {
    const {gameId} = request.params;
  response.sendFile(path.join(__dirname, logs, `${gameId}.json`));
  } catch (e) {
    response.send(e);
  }
})

app.listen(PORT, () =>
  console.log(`Battlesnake Server listening at http://127.0.0.1:${PORT}`)
);
