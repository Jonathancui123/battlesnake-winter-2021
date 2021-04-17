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
  coordinatesAreEqual,
  findClosestApple,
  isCoordinateInArrayOfCoordinates,
} = require("../utils/utils");
const { floodfillHelper } = require("../utils/floodfill");
const { astar, Graph } = require("../utils/pathfinding");
const { calcBestMove, MinimaxGame } = require("../utils/minimax");
const { MinimaxLogger } = require("../visualizer/minimaxLogger");
const { MINIMAX_DEPTH, USE_LOGGER } = require("../constants");

function handleMove(request, response) {
  var gameData = request.body;
  const mySnake = gameData.you;
  const board = gameData.board;
  const turnNumber = gameData.turn;
  const gameId = gameData.game.id;

  // Logging adds computational overhead, turn on for development only.

  const numSnakes = board.snakes.length;

  var allFood = board.food;
  var snakeHead = mySnake.head;

  var grid = boardToGrid(board);
  const graph = new Graph(grid);

  let logger = undefined;
  let move = null;
  console.log();
  console.log(`TURN: ${turnNumber}`);
  if (numSnakes === 2) {
    // Use minimax snake
    if (USE_LOGGER) {
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
    let closestAppleMove = undefined;
    if (closestApple) {
      // && mySnake.length <= 10) {
      const start = graph.grid[snakeHead.x][snakeHead.y];
      const end = graph.grid[closestApple.x][closestApple.y];
      const result = astar.search(graph, start, end);
      // console.log("astar: ", result);
      console.log("snakehead: ", snakeHead);
      console.log("closest apple: ", closestApple);

      if (result.length > 0) {
        // If an apple exists on the board:
        closestAppleMove = findAdjacentDirection(snakeHead, result[0]);
      }
    }

    var possibleMoves = possibleImmediateMoves(mySnake.head, board, mySnake);

    const safeMovesFromHeadOnDeath = movesWithoutHeadOnDeath(
      mySnake,
      board.snakes,
      possibleMoves,
      board.height,
      board.width
    );

    // Check if there is sufficient space for the snake to go for each move. Remove if insufficient.
    const safeMovesFromHeadOnAndFloodfill = [];

    // Stop after floodfill counts this many tiles open tiles (runtime optimization)

    const maxFloodfillCount = mySnake.length * 2;
    var i;
    for (i = 0; i < safeMovesFromHeadOnDeath.length; i++) {
      const visited = {};
      spotToFloodFill = getAdjacentCoordinate(
        mySnake.head,
        safeMovesFromHeadOnDeath[i]
      );
      numSpaces = floodfillHelper(
        grid,
        spotToFloodFill.x,
        spotToFloodFill.y,
        maxFloodfillCount,
        visited
      );
      if (numSpaces > mySnake.length * 1.5) {
        safeMovesFromHeadOnAndFloodfill.push(safeMovesFromHeadOnDeath[i]);
      }
    }

    console.log(`ClosestAppleMove: ${closestAppleMove}`);
    console.log(`PossibleMoves: ${possibleMoves}`);
    console.log(`HeadOnSafe: ${safeMovesFromHeadOnDeath}`);
    console.log(`FloodfillSafe: ${safeMovesFromHeadOnAndFloodfill}`);

    // There is no path to an apple on the board
    if (safeMovesFromHeadOnAndFloodfill.length > 0) {
      // Make a move that is safe from head-on and floodfill
      // Move towards the closeset apple if possible
      if (
        closestAppleMove &&
        safeMovesFromHeadOnAndFloodfill.includes(closestAppleMove)
      ) {
        move = closestAppleMove;
      } else {
        move =
          safeMovesFromHeadOnAndFloodfill[
            Math.floor(Math.random() * safeMovesFromHeadOnAndFloodfill.length)
          ];
      }
    } else if (safeMovesFromHeadOnDeath.length > 0) {
      // Make a move that is safe from head-on collisions
      if (
        closestAppleMove &&
        safeMovesFromHeadOnDeath.includes(closestAppleMove)
      ) {
        move = closestAppleMove;
      } else {
        move =
          safeMovesFromHeadOnDeath[
            Math.floor(Math.random() * safeMovesFromHeadOnDeath.length)
          ];
      }
    } else {
      // Make an unsafe move
      if (closestAppleMove && possibleMoves.includes(closestAppleMove)) {
        move = closestAppleMove;
      } else {
        move = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
      }
    }
  }

  console.log("MOVE: " + move);

  response.status(200).send({
    move: move,
  });

  // write minimax tree to logs
  if (logger) {
    logger.writeLogsToJson();
  }
}

const possibleImmediateMoves = (mySnakeHead, board, mySnake) => {
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

  // Check if our own tail is adjacent to our head
  let safeDirectionToOurTail = undefined;
  const tilesAdjacentToHead = adjacentTiles(
    mySnakeHead,
    board.height,
    board.width
  );
  const myTailCoordinate = mySnake.body[mySnake.body.length - 1];
  for (const adjacentTile of tilesAdjacentToHead) {
    if (coordinatesAreEqual(adjacentTile, myTailCoordinate)) {
      safeDirectionToOurTail = findAdjacentDirection(
        mySnakeHead,
        myTailCoordinate
      );
    }
  }
  // Check if any snake's tails are adjacent to our head
  // (this list will include our own)
  let safeDirectionsToAnyTails = [];
  for (const someSnake of snakes) {
    const snakeTailCoordinate = someSnake.body[someSnake.body.length - 1];
    if (
      isCoordinateInArrayOfCoordinates(snakeTailCoordinate, tilesAdjacentToHead)
    ) {
      safeDirectionsToAnyTails.push(
        findAdjacentDirection(mySnakeHead, snakeTailCoordinate)
      );
    }
  }

  const legalMoves = [];
  directions.forEach((direction) => {
    if (legals[direction]) {
      legalMoves.push(direction);
    }
  });

  if (safeDirectionToOurTail !== undefined) {
    // Mark our own tail as a safe position
    legalMoves.push(safeDirectionToOurTail);
  } else if (legalMoves.length === 0 && safeDirectionsToAnyTails.length > 0) {
    // There are no legal moves. Start considering other snake's tails
    legalMoves = safeDirectionsToAnyTails;
  }

  return legalMoves;
};

// Avoids head-on collisions (with larger snakes) in the next turn. Does not take into consideration other forms of collision.
const movesWithoutHeadOnDeath = (
  mySnake,
  allSnakes,
  possibleMoves,
  height,
  width
) => {
  const safeMoves = [];

  possibleMoves.forEach((direction) => {
    const adjacentCoordinate = getAdjacentCoordinate(mySnake.head, direction);
    // The tiles that are adjacent to any tile adjacent to our head are the positions where an enemy snake head can be to kill us with a head-on
    const tilesToCheckForEnemyHeads = [];
    for (const tileToCheck of adjacentTiles(
      adjacentCoordinate,
      height,
      width
    )) {
      if (!coordinatesAreEqual(tileToCheck, mySnake.head)) {
        // Don't need to check the tile that our head is currently on
        tilesToCheckForEnemyHeads.push(tileToCheck);
      }
    }
    let largerSnakeThreatensDirection = false;
    // See if any snakes bigger than us occupy 'tilesToCheckForEnemyHeads'
    for (const snake of allSnakes) {
      if (snake.length >= mySnake.length && snake.id !== mySnake.id) {
        //For every snake that is bigger or equal to our size
        for (const tileToCheck of tilesToCheckForEnemyHeads) {
          if (coordinatesAreEqual(snake.head, tileToCheck)) {
            largerSnakeThreatensDirection = true;
            break;
          }
        }
        if (largerSnakeThreatensDirection) {
          break;
        }
      }
    }
    // No snake threatening this direction, it is safe
    if (!largerSnakeThreatensDirection) {
      safeMoves.push(direction);
    }
  });
  return safeMoves;
};

// resultWithWeight is an array containing the shortest path taking into account the weight of a node

module.exports = handleMove;
