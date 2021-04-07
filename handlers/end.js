function handleEnd(request, response) {
  var gameData = request.body;

  console.log(`END: ${gameData.game.id}`);
  response.status(200).send("ok");
}

module.exports = handleEnd;
