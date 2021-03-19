const {
  up,
  down,
  left,
  right,
  adjacentTiles,
  directions,
  boardToGrid,
} = require("../utils");

function handleMove(request, response) {
  var gameData = request.body;
  var mySnake = gameData.you;
  var board = gameData.board;
  var allFood = board.food;

  var snakeHead = mySnake.head;
  var snakeBody = mySnake.body;

  var grid = boardToGrid(board);
  const graph = new Graph(grid);

  const closestApple = findClosestApple(allFood, snakeHead);
  if (closestApple) {
    const start = graph.grid[snakeHead.x][snakeHead.y];
  const end = graph.grid[closestApple.x][closestApple.y];
  } else {
    
  }
  

  // var possibleMoves = possibleImmediateMoves(mySnake.head, board);
  // console.log("POSSIBLE:", possibleMoves);
  // var move = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];

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

  if (allFood.length === 0){
    return undefined
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
        if (
          occupiedCoordinate.x == anyAdjacents[direction].x &&
          occupiedCoordinate.y == anyAdjacents[direction].y
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


var graph = new Graph([
  [1,1,1,1],
  [0,1,1,0],
  [0,0,1,1]
]);

var start = graph.grid[0][0];
var end = graph.grid[1][2];
var result = astar.search(graph, start, end);
// result is an array containing the shortest path

var graphDiagonal = new Graph([
  [1,1,1,1],
  [0,1,1,0],
  [0,0,1,1]
], { diagonal: true });

var start = graphDiagonal.grid[0][0];
var end = graphDiagonal.grid[1][2];
var resultWithDiagonals = astar.search(graphDiagonal, start, end, { heuristic: astar.heuristics.diagonal });
// Weight can easily be added by increasing the values within the graph, and where 0 is infinite (a wall)

var graphWithWeight = new Graph([
  [1,1,2,30],
  [0,4,1.3,0],
  [0,0,5,1]
]);
var startWithWeight = graphWithWeight.grid[0][0];
var endWithWeight = graphWithWeight.grid[1][2];
var resultWithWeight = astar.search(graphWithWeight, startWithWeight, endWithWeight);
// resultWithWeight is an array containing the shortest path taking into account the weight of a node


module.exports = handleMove;
