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
  coordinatesAreEqual
} = require("../utils/utils");

const { 
  floodfill
} = require("../utils/floodfill")

const { astar, Graph } = require("../utils/pathfinding");

const { calcBestMove, MinimaxGame } = require("../utils/minimax");

const {MinimaxLogger} = require("../visualizer/minimaxLogger");

// Logging adds computational overhead, turn on for development only.
const USE_LOGGER = true;

// How many moves to simulate
// Two moves (one from each snake) is one "turn" in the game. e.g. MINIMAX_DEPTH=2 means that we will only simulate the immediate turn
const MINIMAX_DEPTH = 2;

function handleMove(request, response) {
  var gameData = request.body;
  const mySnake = gameData.you;
  const board = gameData.board;
  const turnNumber = gameData.turn;
  const gameId = gameData.game.id;
  const numSnakes = board.snakes.length;
  
  var allFood = board.food;
  var snakeHead = mySnake.head;

  var grid = boardToGrid(board);
  const graph = new Graph(grid);

  let logger = undefined;
  let move = null;
  console.log();
  console.log(`TURN: ${turnNumber}`);
  if (numSnakes === 2){
    // Use minimax snake
    if (USE_LOGGER){
      // instantiate minimax logger
      logger = new MinimaxLogger(gameId, turnNumber);
      logger.init();
    }

    // test minimax implementation
    // choose a random other snake
    const otherSnake = board.snakes.find(
      (anySnake) => anySnake.id !== mySnake.id
    );
    const minimaxGameObj = new MinimaxGame(board);
    move = calcBestMove(
      MINIMAX_DEPTH,
      minimaxGameObj,
      mySnake.id,
      otherSnake.id,
      logger  
    )[1];
  } else {
    // Use "logic" snake
    const closestApple = findClosestApple(allFood, snakeHead);

    if (closestApple && mySnake.length > 10) {
      const start = graph.grid[snakeHead.x][snakeHead.y];
      const end = graph.grid[closestApple.x][closestApple.y];
      const result = astar.search(graph, start, end);
      // console.log("astar: ", result);
      console.log("snakehead: ", snakeHead);
      console.log("closest apple: ", closestApple);

      if (result.length > 0) {
        // If an apple exists on the board:
        const direction = findAdjacentDirection(snakeHead, result[0]);
        console.log("MOVE:", direction);
        response.status(200).send({ move: direction });
        return
      }  
    }

    var possibleMoves = possibleImmediateMoves(mySnake.head, board);

    const safeMovesFromHeadOnDeath = movesWithoutHeadOnDeath(mySnake, board.snakes, possibleMoves, board.height, board.width)
    
    // Check if there is sufficient space for the snake to go for each move. Remove if insufficient.
    const safeMovesFromHeadOnAndFloodfill = [];
    
    console.log("Iterating ", safeMovesFromHeadOnDeath.length);
    var i;
    for (i = 0; i < safeMovesFromHeadOnDeath.length; i++) {
      console.log("beep");
      spotToFloodFill = getAdjacentCoordinate(mySnake.head, safeMovesFromHeadOnDeath[i])
      console.log(spotToFloodFill);
      numSpaces = floodfill(grid, spotToFloodFill.x, spotToFloodFill.y);
      console.log(numSpaces);
      if (numSpaces > mySnake.length * 1.5) {
        safeMovesFromHeadOnAndFloodfill.push(safeMovesFromHeadOnDeath[i]);
      }
    }
    

    console.log(`PossibleMoves: ${possibleMoves}`);
    console.log(`HeadOnSafe: ${safeMovesFromHeadOnDeath}`);
    console.log(`FloodfillSafe: ${safeMovesFromHeadOnAndFloodfill}`);

    if (safeMovesFromHeadOnAndFloodfill.length > 0){
      // Make a move that is safe from head-on and floodfill
      move = safeMovesFromHeadOnAndFloodfill[Math.floor(Math.random() * safeMovesFromHeadOnAndFloodfill.length)]; 
    } else if (safeMovesFromHeadOnDeath.length > 0) {
      // Make a move that is safe from head-on collisions
      move = safeMovesFromHeadOnDeath[Math.floor(Math.random() * safeMovesFromHeadOnDeath.length)]; 
    }
    else {
      // Make an unsafe move
      move = possibleMoves[Math.floor(Math.random() * possibleMoves.length)]; 
    }
  }

  console.log("MOVE: " + move);

  response.status(200).send({
    move: move,
  });

  // write minimax tree to logs
  if (logger){
    logger.writeLogsToJson();
  }
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
  if (mySnakeHead.x == board.width - 1){
    legals.right = false;
  }
  if (mySnakeHead.y == 0) {
    legals.down = false;
  }
  if (mySnakeHead.y == board.height - 1){
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

// Avoids head-on collisions (with larger snakes) in the next turn. Does not take into consideration other forms of collision. 
const movesWithoutHeadOnDeath = (mySnake, allSnakes, possibleMoves, height, width) => {
  
  const safeMoves = []

  possibleMoves.forEach((direction) => {
    const adjacentCoordinate = getAdjacentCoordinate(mySnake.head, direction);
    // The tiles that are adjacent to any tile adjacent to our head are the positions where an enemy snake head can be to kill us with a head-on
    const tilesToCheckForEnemyHeads = []
    for (const tileToCheck of adjacentTiles(adjacentCoordinate, height, width)){
      if (!coordinatesAreEqual(tileToCheck,  mySnake.head)){
        // Don't need to check the tile that our head is currently on
        tilesToCheckForEnemyHeads.push(tileToCheck);
      }
    }
    let largerSnakeThreatensDirection = false;
    // See if any snakes bigger than us occupy 'tilesToCheckForEnemyHeads'
    for (const snake of allSnakes){
      if (snake.length >= mySnake.length && snake.id !== mySnake.id){
        //For every snake that is bigger or equal to our size
        for (const tileToCheck of tilesToCheckForEnemyHeads){
          if (coordinatesAreEqual(snake.head, tileToCheck)){
            largerSnakeThreatensDirection = true;
            break;
          }
        }
        if (largerSnakeThreatensDirection){
          break;
        }
      }     
    }
    // No snake threatening this direction, it is safe
    if (!largerSnakeThreatensDirection){
      safeMoves.push(direction);
    }
  })
  return safeMoves;
}

// resultWithWeight is an array containing the shortest path taking into account the weight of a node

module.exports = handleMove;
