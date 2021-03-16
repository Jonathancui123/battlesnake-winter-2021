function handleMove(request, response) {
  var gameData = request.body;

  var possibleMoves = ["up", "down", "left", "right"];
  var move = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];

  console.log("MOVE: " + move);
  response.status(200).send({
    move: move,
  });
}

module.exports = handleMove;
