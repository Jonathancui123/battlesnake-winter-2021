const bodyParser = require("body-parser");
const express = require("express");
const handleIndex = require("./handlers/index");
const handleStart = require("./handlers/start");
const handleMove = require("./handlers/move");
const handleend = require("./handlers/end");

const PORT = process.env.PORT || 3000;

const app = express();
app.use(bodyParser.json());

app.get("/", handleIndex);
app.post("/start", handleStart);
app.post("/move", handleMove);
app.post("/end", handleEnd);

app.listen(PORT, () =>
  console.log(`Battlesnake Server listening at http://127.0.0.1:${PORT}`)
);
