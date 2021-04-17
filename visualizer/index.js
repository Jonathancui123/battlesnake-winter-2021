// serve an html file which will help visualize a minimax tree
const path = require("path");
const express = require("express");
const { readFileSync, readdirSync, statSync } = require("fs");

const PORT = process.env.PORT || 5000;

const app = express();

// Serve the json data for the specified game
app.get("/data/:gameId", (request, response) => {
  console.log("GET: /data/:gameId");
  try {
    const { gameId } = request.params;
    const filePath = path.join(__dirname, "logs", `${gameId}.json`);
    console.log("Game data requested:", filePath);

    jsonFile = readFileSync(filePath);
    jsonData = JSON.parse(jsonFile);
    response.json(jsonData);
  } catch (e) {
    console.error(e);
    response.send(e);
  }
});

app.get("/:gameId", (request, response) => {
  console.log("GET: /:gameId");
  const { gameId } = request.params;
  console.log(`Serving html for gameId: ${gameId} `);
  response.sendFile(path.join(__dirname, "graph.html"));
});

app.get("/", (request, response) => {
  console.log("GET: /");

  // most recently created file
  let mostRecentFile = undefined;
  let latestCtime = "2021-03-07T05:36:33.582Z";

  const list = readdirSync(path.join(__dirname, "logs"));
  list.forEach(function (file) {
    //  console.log(file);
    stats = statSync(path.join(__dirname, "logs", file));
    if (stats.ctime.toString() > latestCtime) {
      latestCtime = stats.ctime.toString();
      mostRecentFile = file;
    }
  });

  const gameId = mostRecentFile.split(".")[0];
  console.log("Redirecting to ");
  console.log(`***  ${mostRecentFile} ***`);
  response.redirect(`${request.baseUrl}/${gameId}`);
});

app.listen(PORT, () =>
  console.log(`Battlesnake Server listening at http://127.0.0.1:${PORT}`)
);
