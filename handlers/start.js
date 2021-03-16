function handleStart(request, response) {
  var gameData = request.body;

  console.log("START");
  response.status(200).send("ok");
}

module.exports = handleStart;
