const {
  up,
  down,
  left,
  right,
  adjacentTiles,
  directions,
  boardToGrid,
  getAdjacentCoordinate,
  findAdjacentDirection,
} = require("../utils/utils");

const { astar, Graph } = require("../utils/pathfinding");

const { calcBestMove, MinimaxGame } = require("../utils/minimax");

const {MinimaxLogger} = require("../visualizer/minimaxLogger");

// Logging adds computational overhead, turn on for development only.
const USE_LOGGER = false;

function handleMove(request, response) {
  var gameData = request.body;
  const mySnake = gameData.you;
  const board = gameData.board;
  const turnNumber = gameData.turn;
  const gameId = gameData.game.id;
  
  var allFood = board.food;
  var snakeHead = mySnake.head;

  var grid = boardToGrid(board);
  const graph = new Graph(grid);

  let logger = undefined;
  if (USE_LOGGER){
    // instantiate minimax logger
    logger = new MinimaxLogger(gameId, turnNumber);
  }

  // test minimax implementation
  // choose a random other snake
  const otherSnake = board.snakes.find(
    (anySnake) => anySnake.id !== mySnake.id
  );
  const minimaxGameObj = MinimaxGame(board, logger);
  const move = calcBestMove(
    8,
    minimaxGameObj,
    mySnake.id,
    otherSnake.id,
    logger
  )[1];

  /*
  const closestApple = findClosestApple(allFood, snakeHead);

  if (closestApple) {
    const start = graph.grid[snakeHead.x][snakeHead.y];
    const end = graph.grid[closestApple.x][closestApple.y];

    const result = astar.search(graph, start, end);
    console.log("astar: ", result);
    console.log("snakehead: ", snakeHead);
    console.log("closest apple: ", closestApple);

    if (result.length > 0) {
      const direction = findAdjacentDirection(snakeHead, result[0]);
      console.log("MOVE:", direction);
      response.status(200).send({ move: direction });
      return
    }  
  }

  var possibleMoves = possibleImmediateMoves(mySnake.head, board);
  console.log("POSSIBLE:", possibleMoves);
  var move = possibleMoves[Math.floor(Math.random() * possibleMoves.length)]; 
  */

  console.log("MOVE: " + move);

  response.status(200).send({
    move: move,
  });

  // write minimax tree to logs
}

// tested :D
const findClosestApple = (allFood, { x, y }) => {
  shortestDistance = 100000;
  closestApple = { x, y };
  currDistance = 0;

  if (allFood.length === 0) {
    return undefined;
  }

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

// appleArr = [
//   { x: 1, y: 100 },
//   { x: 2, y: 50 },
//   { x: 3, y: 4 },
//   { x: 3, y: 6 },
//   { x: 4, y: 4 },
// ];

// console.log(findClosestApple(appleArr, { x: 5, y: 5 }));

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

  // don't run into snakes (including your own body)
  const snakes = board.snakes;
  snakes.forEach((snake) => {
    const snakeBody = snake.body;
    snakeBody.forEach((occupiedCoordinate) => {
      directions.forEach((direction) => {
        if (
          occupiedCoordinate.x ==
          getAdjacentCoordinate(mySnakeHead, direction).x &&
          occupiedCoordinate.y ==
          getAdjacentCoordinate(mySnakeHead, direction).y
        ) {
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

// resultWithWeight is an array containing the shortest path taking into account the weight of a node

module.exports = handleMove;
