function handleMove(request, response) {
  var gameData = request.body;
  var mySnake = request.body.you;
  var snakeBody = mySnake.body;

  var snakeHead = mySnake.head;

  var up = Object.assign({}, snakeHead);
  up["y"] += 1;

  var down = Object.assign({}, snakeHead);
  down["y"] -= 1;

  var left = Object.assign({}, snakeHead);
  left["x"] -= 1;

  var right = Object.assign({}, snakeHead);
  right["x"] += 1;

  if (snakeBody.length > 1) {
  }

  if (down == snakeBody[1]) {
  }

  var possibleMoves = ["up", "down", "left", "right"];
  var move = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];

  console.log("MOVE: " + move);
  response.status(200).send({
    move: move,
  });
}

module.exports = handleMove;
