const {
  up,
  down,
  left,
  right,
  adjacentTiles,
  directions,
} = require("../utils");

function handleMove(request, response) {
  var gameData = request.body;
  var mySnake = gameData.you;
  var board = gameData.board;
  var allFood = board.food;

  var snakeHead = mySnake.head;
  var snakeBody = mySnake.body;

  var possibleMoves = possibleImmediateMoves(mySnake.head, board);
  var move = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];

  console.log("MOVE: " + move);

  response.status(200).send({
    move: move,
  });
}

// tested :D
const findClosestApple = (allFood, { x, y }) => {
  shortestDistance = 100000;
  closestApple = { x, y };
  currDistance = 0;
  for (i = 0; i < allFood.length; i++) {
    currDistance =
      Math.pow(x - allFood[i].x, 2) + Math.pow(y - allFood[i].y, 2);
    if (currDistance < shortestDistance) {
      closestApple = allFood[i];
      shortestDistance = currDistance;
    }
  }
  return closestApple;
};

appleArr = [
  { x: 1, y: 100 },
  { x: 2, y: 50 },
  { x: 3, y: 4 },
  { x: 3, y: 6 },
  { x: 4, y: 4 },
];

console.log(findClosestApple(appleArr, { x: 5, y: 5 }));

// findClosestApple
// legalMoves --> don't (immediately) run into body, wall, or other snake

const possibleImmediateMoves = (mySnakeHead, board) => {
  // Mark each direction as illegal when an obstacle is seen
  const legals = {
    up: true,
    down: true,
    left: true,
    right: true,
  };

  // don't run into map edge
  if (mySnakeHead.x == 0) {
    legals.left = false;
  }
  if (mySnakeHead.x == board.width - 1) {
    legals.right = false;
  }
  if (mySnakeHead.y == 0) {
    legals.down = false;
  }
  if (mySnakeHead.y == board.height - 1) {
    legals.up = false;
  }

  // Coordinates that are adjacent to mySnakeHead, regardless of whether they are valid coordinates on the map (i.e. will include {x: -1, y: -1})
  const anyAdjacents = {
    up: up(mySnakeHead),
    down: down(mySnakeHead),
    left: left(mySnakeHead),
    right: right(mySnakeHead),
  };

  // don't run into snakes (including your own body)
  const snakes = board.snakes;
  snakes.forEach((snake) => {
    const snakeBody = snake.body;
    snakeBody.forEach((occupiedCoordinate) => {
      directions.forEach((direction) => {
        if (occupiedCoordinate == anyAdjacents[direction]) {
          legals[direction] = false;
        }
      });
    });
  });

  const legalMoves = [];
  directions.forEach((direction) => {
    if (legals[direction]) {
      legalMoves.push(direction);
    }
  });
  return legalMoves;
};

module.exports = handleMove;
