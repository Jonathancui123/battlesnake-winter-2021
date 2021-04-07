const path = require("path");
const express = require("express");
const {readFileSync} = require('fs')

const PORT = process.env.PORT || 3000;

const app = express();

// Serve the json data for the specified game
app.get("/data/:gameId", (request, response) => {
  console.log("GET: /data/:gameId")
  try {
    const {gameId} = request.params;
    const filePath = path.join(__dirname, "logs", `${gameId}.json`)
    console.log("Game data requested:", filePath)

    jsonFile = readFileSync(filePath);
    jsonData = JSON.parse(jsonFile);
    response.json(jsonData);
  } catch (e) {
    console.error(e);
    response.send(e);
  }
})

app.get("/:gameId", (request, response) => {
  console.log("GET: /:gameId")
  const { gameId } = request.params;
  console.log(`Serving html for gameId: ${gameId} `);
  response.sendFile(path.join(__dirname, "graph.html"));
});

app.get("/", (request, response) => {
  console.log("GET: /")
  response.send("Enter a game ID into the URL path to view the breakdown");
})


app.listen(PORT, () =>
  console.log(`Battlesnake Server listening at http://127.0.0.1:${PORT}`)
);
