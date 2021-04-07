const path = require("path");
const express = require("express");
const PORT = process.env.PORT || 3000;

const app = express();

app.get("/:gameId", (request, response) => {
  const { gameId } = request.params;

  if (!gameId) {
    response.send("Enter a game ID into the URL to view the breakdown");
  } else {
    response.sendFile(path.join(__dirname, "graph.html"));
  }
});

app.listen(PORT, () =>
  console.log(`Battlesnake Server listening at http://127.0.0.1:${PORT}`)
);
