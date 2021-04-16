const {
  directions,
  getAdjacentCoordinate,
  coordinateOutOfBounds,
  coordinatesAreEqual,
  boardToGrid,
  findClosestApple,
  distanceToClosestCorner,
  prettyPrintGrid,
  gridToString,
  distance,
  safeAdjacentTiles,
  adjacentTiles,
  isAnySnakeHeadAtCoordinate,
} = require("./utils");

const { largestAdjacentFloodfill } = require("./floodfill");

const { astar, Graph } = require("./pathfinding");

const { MINIMAX_DEPTH, MAX_HEALTH, HEURISTIC } = require("../constants");

const { calcFloodfillScore } = require("./heuristics");

// TODO: Fix "off by one error"
// Game object which represents the board: (explanation: https://www.w3schools.com/js/js_object_constructors.asp)
// Supports methods for modifying the board, undoing modifications, and getting potential moves
function MinimaxGame(board) {
  // The state of the board at the current node of Minimax simulation
  // Battlesnake API board object
  this.board = board;

  // this.grid is a 2D array where the outer array indices are vertical from one another, and inner array indices are horizontal from one another
  // i.e. this.grid[y][x]
  this.grid = boardToGrid(this.board);
  // prettyPrintGrid(this.grid)

  // Somehow keep track of the board changes so we can undo moves, or simply store all previous board positions
  this.changeHistory = [];

  // Commit the move to our move history and update this.board
  // move: the direction (string) in which the snake will move
  // snakeID: the snake which is being moved
  this.move = function (moveDirection, snakeID, mySnakeID) {
    // TODO: Account for food getting eaten --> remove food from board, grow the snake

    // Find the snake to move
    const currentSnake = this.board.snakes.find(
      (snake) => snake.id === snakeID
    );
    const snakeHeadCoordinate = currentSnake.head;
    const newSnakeHeadCoordinate = getAdjacentCoordinate(
      snakeHeadCoordinate,
      moveDirection
    );
    const snakeTailCoordinate = {
      ...currentSnake.body[currentSnake.body.length - 1],
    };

    // Object describes the numbers in the grid at the prevTailPosition and the newHeadPosition
    const oldGrid = {
      prevTailPosition: this.grid[snakeTailCoordinate.x][snakeTailCoordinate.y],
    };
    if (
      !coordinateOutOfBounds(
        newSnakeHeadCoordinate,
        this.board.height,
        this.board.width
      )
    ) {
      oldGrid.newHeadPosition = this.grid[newSnakeHeadCoordinate.x][
        newSnakeHeadCoordinate.y
      ];
    }

    var foodsWeAteAlongPath = 0;
    var foodsTheyAteAlongPath = 0;
    // Check if we have eaten food in the previous move. If so, persist info
    if (this.changeHistory.length > 1) {
      foodsWeAteAlongPath = this.changeHistory[this.changeHistory.length - 1]
        .foodsWeAteAlongPath;
      foodsTheyAteAlongPath = this.changeHistory[this.changeHistory.length - 1]
        .foodsTheyAteAlongPath;
    }

    for (var i = 0; i < board.food.length; i++) {
      if (coordinatesAreEqual(board.food[i], snakeHeadCoordinate)) {
        if (snakeID === mySnakeID) {
          foodsWeAteAlongPath++;
          break;
        } else {
          foodsTheyAteAlongPath++;
          break;
        }
      }
    }

    // else {
    //   for(var i = 0; i < board.food.length; i++) {
    //     if(coordinatesAreEqual(board.food[i], snakeHeadCoordinate)) {
    //       foodsEatenAlongPath++;
    //       break;
    //     }
    //   }
    // }

    // Create an object that describes the changes to the board on this move
    const newChange = {
      snake: {
        id: snakeID,
        newHeadPosition: newSnakeHeadCoordinate,
        prevTailPosition: snakeTailCoordinate,
      },
      oldGrid,
      foodsWeAteAlongPath: foodsWeAteAlongPath,
      foodsTheyAteAlongPath: foodsTheyAteAlongPath,
      // TODO: food: describe food changes
    };

    // Set the snakeTailCoordinate to 1 if it should be blank the next turn. Don't change it from 0 if the newSnakeHeadCoordinate is at the snakeTailCoordinate or anySnakeHeadAtCoordinate of the snakeTailCoordinate
    if (
      !coordinatesAreEqual(newSnakeHeadCoordinate, snakeTailCoordinate) &&
      !isAnySnakeHeadAtCoordinate(this.board.snakes, snakeTailCoordinate)
    ) {
      this.grid[snakeTailCoordinate.x][snakeTailCoordinate.y] = 1;
    }
    if (
      !coordinateOutOfBounds(
        newSnakeHeadCoordinate,
        this.board.height,
        this.board.width
      )
    ) {
      this.grid[newSnakeHeadCoordinate.x][newSnakeHeadCoordinate.y] = 0;
    }

    this.changeHistory.push(newChange);
    // 'currentSnake' object is referencing an object in "this.board"
    // Modify the board object to reflect the changes
    currentSnake.head = newSnakeHeadCoordinate;
    currentSnake.body.unshift(newSnakeHeadCoordinate);
    currentSnake.body.pop();
  };

  // Cleanup dead snakes and eaten food from the board, commit it to history
  this.cleanupBoard = function () {
    // TODO: Clean up eaten food.
    // We shouldn't have to deal with any dead snakes because we will evaluate the board and return if either our snake or the opponent snake dies.
  };

  // Undo the move at the top of the change history
  this.undo = function () {
    const lastChange = this.changeHistory.pop();

    const currentSnake = this.board.snakes.find(
      (snake) => snake.id === lastChange.snake.id
    );

    // Adjustment for grid floodfill
    this.grid[lastChange.snake.prevTailPosition.x][
      lastChange.snake.prevTailPosition.y
    ] = lastChange.oldGrid.prevTailPosition;
    if (lastChange.oldGrid.newHeadPosition !== undefined) {
      this.grid[lastChange.snake.newHeadPosition.x][
        lastChange.snake.newHeadPosition.y
      ] = lastChange.oldGrid.newHeadPosition;
    }

    // check if the head is currently on a snakes body. If it is,
    // don't bother undoing that head position on the grid.

    // Opposite order of modifications made in move() method
    currentSnake.body.push(lastChange.snake.prevTailPosition);

    currentSnake.body.shift(); // .shift() gets rid of the first element of an array
    currentSnake.head = { ...currentSnake.body[0] }; // copy of head (don't reference)
  };
}

// depth: number of moves we want to continue looking forward
// game: object representing the game (and board) state to be evaluated
// mySnakeID: the ID string of our own snake (so that minimax knows who to move)
// otherSnakeID: the ID string of the opponent snake
const calcBestMove = function (
  remainingDepth,
  game,
  mySnakeID,
  otherSnakeID,
  logger = undefined,
  alpha = Number.NEGATIVE_INFINITY,
  beta = Number.POSITIVE_INFINITY,
  isMaximizingPlayer = true
) {
  const gridString = gridToString(game.grid);

  if (logger) {
    const heuristicInfo = {
      Grid: gridString,
    };
    logger.logHeuristicDetails(heuristicInfo);
  }

  // Base case: evaluate board at maximum depth
  if (remainingDepth === 0) {
    value = evaluateBoard(
      game.board,
      mySnakeID,
      otherSnakeID,
      game.grid,
      remainingDepth,
      logger,
      game
    );
    if (logger) {
      logger.logCurrentMoveAndValue({ move: null, value });
      logger.goToParent();
    }
    return [value, null];
  }

  // Base case 2: evaluate board when either snake is dead
  // Note: should only evalute when it is our turn (takes 2 moves for a turn), so only
  // when maximizing player is true
  if (isMaximizingPlayer) {
    const gameOverValue = evaluateIfGameOver(
      game.board,
      mySnakeID,
      otherSnakeID,
      remainingDepth,
      logger
    );
    if (gameOverValue) {
      if (logger) {
        logger.logCurrentMoveAndValue({
          move: null,
          value: gameOverValue,
        });
        logger.goToParent();
      }
      return [gameOverValue, null];
    }
  }

  // clean up dead snakes and eaten food before proceeding with simulation
  game.cleanupBoard();
  // TODO: Log changes due to .cleanupBoard()

  // Recursive case: search possible moves
  var bestMove = null; // best move not set yet
  var possibleMoves = [...directions];

  // Set random order for possible moves
  // Optimize this later to try the highest value moves first for maximizingPlayer and the lowest value moves first for minimizing player
  possibleMoves.sort(function (a, b) {
    return 0.5 - Math.random();
  });

  // Set a default best move value
  var bestMoveValue = isMaximizingPlayer
    ? Number.NEGATIVE_INFINITY
    : Number.POSITIVE_INFINITY;
  // the snake that we are moving this turn
  const targetSnakeID = isMaximizingPlayer ? mySnakeID : otherSnakeID;
  // Search through all possible moves
  for (var i = 0; i < possibleMoves.length; i++) {
    var move = possibleMoves[i];
    // Make the move, but undo before exiting loop
    game.move(move, targetSnakeID, mySnakeID);

    if (logger) {
      logger.goDeeper(move);
    }
    // Recursively get the value from this move
    value = calcBestMove(
      remainingDepth - 1,
      game,
      mySnakeID,
      otherSnakeID,
      logger,
      alpha,
      beta,
      !isMaximizingPlayer
    )[0];
    // Log the value of this move
    // console.log(isMaximizingPlayer ? 'Max: ' : 'Min: ', depth, move, value, bestMove, bestMoveValue);

    if (isMaximizingPlayer) {
      // Look for moves that maximize position
      if (value > bestMoveValue) {
        bestMoveValue = value;
        bestMove = move;
      }
      alpha = Math.max(alpha, value);
    } else {
      // Look for moves that minimize position
      if (value < bestMoveValue) {
        bestMoveValue = value;
        bestMove = move;
      }
      beta = Math.min(beta, value);
    }
    // Undo previous move
    game.undo();
    // Check for alpha beta pruning
    if (beta <= alpha) {
      // console.log('Prune', alpha, beta);
      if (logger) {
        logger.pruningAtCurrentNode();
      }
      break;
    }
  }

  if (logger) {
    logger.logCurrentMoveAndValue({ move: bestMove, value: bestMoveValue });
    logger.goToParent();
  }

  return [bestMoveValue, bestMove];
};

// Returns true if either of the two specified snakes should die from their current position
const evaluateIfGameOver = (
  board,
  mySnakeID,
  otherSnakeID,
  remainingDepth,
  logger
) => {
  const mySnake = board.snakes.find((snake) => snake.id === mySnakeID);
  const otherSnake = board.snakes.find((snake) => snake.id === otherSnakeID);
  const mySnakeHead = mySnake.head;
  const otherSnakeHead = otherSnake.head;
  let headOnCollision = false;
  let mySnakeDead = false;
  let mySnakeMaybeDead = false; // opponent may not use the best move (head collisions)
  let otherSnakeDead = false;
  let otherSnakeMaybeDead = false;

  if (coordinateOutOfBounds(mySnakeHead, board.height, board.width)) {
    mySnakeDead = true;
  }
  if (coordinateOutOfBounds(otherSnakeHead, board.height, board.width)) {
    otherSnakeDead = true;
  }

  // Handle snake heads colliding with one another
  if (coordinatesAreEqual(mySnakeHead, otherSnakeHead)) {
    headOnCollision = true;
    if (mySnake.length === otherSnake.length) {
      mySnakeMaybeDead = true;
      otherSnakeMaybeDead = true;
    } else if (mySnake.length > otherSnake.length) {
      otherSnakeDead = true;
    } else {
      mySnakeMaybeDead = true;
    }
  }

  // my snake head or other snake head collided with a snake:
  // A snake head will have 1 coordinate equal to it in all the snake bodies coordinates (due to itself) if it is not colliding
  // A snake head will have 2 coordinates equal to it in the snake bodies if it is colliding with something
  var mySnakeHeadCollisions = 0;
  var otherSnakeHeadCollisions = 0;
  const snakes = board.snakes;
  snakes.forEach((snake) => {
    const snakeBody = snake.body;
    snakeBody.forEach((occupiedCoordinate) => {
      if (coordinatesAreEqual(occupiedCoordinate, mySnakeHead)) {
        mySnakeHeadCollisions++;
      }
      if (coordinatesAreEqual(occupiedCoordinate, otherSnakeHead)) {
        otherSnakeHeadCollisions++;
      }
    });
  });

  if (!headOnCollision) {
    if (mySnakeHeadCollisions > 1) {
      mySnakeDead = true;
    }
    if (otherSnakeHeadCollisions > 1) {
      otherSnakeDead = true;
    }
  } else {
    if (mySnakeHeadCollisions > 2 && otherSnakeHeadCollisions > 2) {
      // We both die by crashing into the same body part
      mySnakeDead = true;
      otherSnakeDead = true;
    }
  }

  const adjustForFutureUncertainty = (score) => {
    return (
      score *
      HEURISTIC.futureUncertaintyFactor ** (MINIMAX_DEPTH - remainingDepth - 2)
    );
  };
  let score;

  if (mySnakeDead) {
    score = adjustForFutureUncertainty(-1000);
  } else if (mySnakeMaybeDead) {
    score = adjustForFutureUncertainty(-500);
  } else if (otherSnakeMaybeDead) {
    score = adjustForFutureUncertainty(500);
  } else if (otherSnakeDead) {
    score = adjustForFutureUncertainty(1000);
  } else {
    score = adjustForFutureUncertainty(0);
  }

  if (score && logger) {
    logger.logCurrentMoveAndValue({ gameOver: true });
  }
  return score;
};

// Scores the given game board --> higher score if good for mySnake, lower if bad for mySnake
const evaluateBoard = (
  board,
  mySnakeID,
  otherSnakeID,
  grid,
  remainingDepth,
  logger,
  game
) => {
  // range = [-1000, 1000]
  // score will only be negative if it might die

  var score = 0;
  const mySnake = board.snakes.find((snake) => snake.id === mySnakeID);
  const otherSnake = board.snakes.find((snake) => snake.id === otherSnakeID);
  const mySnakeHead = mySnake.head;
  const mySnakeLength = mySnake.length;
  const otherSnakeLength = otherSnake.length;
  const otherSnakeHead = otherSnake.head;
  const MAX_DISTANCE = board.width + board.height;
  const bottomNode = game.changeHistory[game.changeHistory.length - 1];

  // ********** HEURISTIC: AGGRESSION LOGIC *************
  
  let aggressionScore = 0;
  let distanceToOtherSnake = 0;
  let otherSnakeNextMove = { x: otherSnakeHead.x, y: otherSnakeHead.y };
  let possibleMove1, possibleMove2;
  
  // edge cases: head is going into a corner or edge
   if (mySnake.length >= otherSnake.length + 2) {

    // find other snake's next move
    const otherSnakeNeck = otherSnake.body[1];

    // handle scenario if snake is currently at a corner
    distanceToClosestCorner(otherSnakeHead, board);
    const origin = { x: 0, y: 0 };
    const bottomRight = { x: board.width - 1, y: 0 };
    const topLeft = { x: 0, y: board.height - 1 };
    const topRight = { x: board.width - 1, y: board.height - 1 };

    if (distanceToClosestCorner(otherSnakeHead, board) == 0) {
      if (coordinatesAreEqual(otherSnakeHead, origin) && otherSnakeNeck.x == 1) {
        otherSnakeNextMove = { x: 0, y: 1 };
      } else if (coordinatesAreEqual(otherSnakeHead, origin) && otherSnakeNeck.y == 1) {
        otherSnakeNextMove = { x: 1, y: 0 };
      } else if (coordinatesAreEqual(otherSnakeHead, topLeft) && otherSnakeNeck.y == board.height - 2) {
        otherSnakeNextMove = { x: 1, y: board.height - 1 };
      } else if (coordinatesAreEqual(otherSnakeHead, topLeft) && otherSnakeNeck.x == 1) {
        otherSnakeNextMove = { x: 0, y: board.height - 2 };
      } else if (coordinatesAreEqual(otherSnakeHead, topRight) && otherSnakeNeck.x == board.width - 2) {
        otherSnakeNextMove = { x: board.width - 1, y: board.height - 2 };
      } else if (coordinatesAreEqual(otherSnakeHead, topRight) && otherSnakeNeck.y == board.height - 2) {
        otherSnakeNextMove = { x: board.width - 2, y: board.height - 1 };
      } else if (coordinatesAreEqual(otherSnakeHead, bottomRight) && otherSnakeNeck.x == board.width - 2) {
        otherSnakeNextMove = { x: board.width - 1, y: 1 };
      } else {
        otherSnakeNextMove = { x: board.width - 2, y: 0 };
      }

    // check if otherSnake is going TOWARDS an edge - assume snake will move in the direction toward food
    // if snake is already moving along an edge, go to next condition
    } else if (otherSnakeHead.x == 0 || otherSnakeHead.x == board.width - 1 || otherSnakeHead.y == 0 || otherSnakeHead.y == board.height -1) {
      if (otherSnakeHead.x == 0 && otherSnakeNeck.x == 1 || otherSnakeHead.x == board.width - 1 && otherSnakeNeck.x == board.width - 2) {
        possibleMove1 = { x: otherSnakeHead.x, y: otherSnakeHead.y + 1 };
        possibleMove2 = { x: otherSnakeHead.x, y: otherSnakeHead.y - 1 };
        otherSnakeNextMove = 
          distance(possibleMove1, findClosestApple(board.food, possibleMove1)) <= distance(possibleMove2, findClosestApple(board.food, possibleMove2)) 
          ? possibleMove1 : possibleMove2;

      } else if (otherSnakeHead.y == 0 && otherSnakeNeck.y == 1 || otherSnakeHead.y == board.height - 1 && otherSnakeNeck.y == board.height - 2) {
        possibleMove1 = { x: otherSnakeHead.x + 1, y: otherSnakeHead.y };
        possibleMove2 = { x: otherSnakeHead.x - 1, y: otherSnakeHead.y };
        otherSnakeNextMove = 
          distance(possibleMove1, findClosestApple(board.food, possibleMove1)) <= distance(possibleMove2, findClosestApple(board.food, possibleMove2)) 
          ? possibleMove1 : possibleMove2;
      }

    // predict other snake's next move normally
    } else {
        if (otherSnakeNeck.x == otherSnakeHead.x - 1) {
        otherSnakeNextMove = { x: otherSnakeHead.x + 1, y: otherSnakeHead.y };
      } else if (otherSnakeNeck.x == otherSnakeHead.x + 1) {
        otherSnakeNextMove = { x: otherSnakeHead.x - 1, y:otherSnakeHead.y };
      } else if (otherSnakeNeck.y == otherSnakeHead.y - 1) {
        otherSnakeNextMove = { x: otherSnakeHead.x, y: otherSnakeHead.y + 1 };
      } else {
        otherSnakeNextMove = { x: otherSnakeHead.x, y: otherSnakeHead.y - 1 };
      }
    }

    // randomly select a safe tile if predicted move is invalid
    const tiles = adjacentTiles(otherSnakeHead, board.height, board.width);
    const safeTiles = safeAdjacentTiles(tiles, mySnake, otherSnake);
    if (coordinateOutOfBounds(otherSnakeNextMove, board.height, board.width) || safeTiles.indexOf(otherSnakeNextMove) == -1) {
      if (safeTiles.length >= 1){
        otherSnakeNextMove = safeTiles[Math.floor(Math.random() * safeTiles.length)];
      }
      // else kill/death will override aggression heuristic
    }

    distanceToOtherSnake = distance(mySnakeHead,otherSnakeNextMove);
    aggressionScore = Math.abs((MAX_DISTANCE - distanceToOtherSnake)) * HEURISTIC.aggressionVal;
  }
  score += aggressionScore;

  // ********** HEURISTIC: KILL/DEATH *************
  // gameOverValue is -500 if mySnake might die
  // gameOverValue is -1000 if mySnake will for sure die
  const gameOverValue = evaluateIfGameOver(
    board,
    mySnakeID,
    otherSnakeID,
    remainingDepth,
    logger
  );
  if (gameOverValue) {
    score = gameOverValue;
    return score;
  }

  // ********** HEURISTIC: FOOD (Health, size) *************

  let foodScore = 0;
  let theirFoodScore = 0;
  const closestApple = findClosestApple(board.food, mySnakeHead);
  const theirClosestApple = findClosestApple(board.food, otherSnakeHead);

  if (otherSnake.health <= 40 ||
    (otherSnake.length < mySnake.length + 2)) {
    if (bottomNode.foodsTheyAteAlongPath) {
      theirFoodScore -= bottomNode.foodsTheyAteAlongPath * HEURISTIC.theirFoodVal;
    } else {
      const closestAppleDistance =
        Math.abs(otherSnakeHead.x - theirClosestApple.x) +
        Math.abs(otherSnakeHead.y - theirClosestApple.y);

      // if (logger) {
      //   const heuristicInfo = {  
      //     closestAppleDist: closestAppleDistance
      //   };
      //   logger.logHeuristicDetails(heuristicInfo);
      // }

      theirFoodScore = ((MAX_DISTANCE - closestAppleDistance) / 4)**2
      // console.log(closestAppleDistance)
      // fix food
      // console.log(foodScore);
    }
  }
    
  if (mySnake.health <= 40 || (mySnakeLength < otherSnake.length + 2)) {
    if (bottomNode.foodsWeAteAlongPath) {
      foodScore = HEURISTIC.foodVal * bottomNode.foodsWeAteAlongPath;
    } else {
      const closestAppleDistance =
        Math.abs(mySnakeHead.x - closestApple.x) +
        Math.abs(mySnakeHead.y - closestApple.y);

      // if (logger) {
      //   const heuristicInfo = {  
      //     closestAppleDist: closestAppleDistance
      //   };
      //   logger.logHeuristicDetails(heuristicInfo);
      // }

      foodScore = ((MAX_DISTANCE - closestAppleDistance) / 4)**2
      // console.log(closestAppleDistance)
      // fix food
      // console.log(foodScore);
    }
  }
  // console.log(foodScore)
  score += foodScore;
  score += theirFoodScore;
  // // ********** HEURISTIC: FLOODFILL *************
  let cavernSize = 0;
  let floodFillScore = 0;

  let ourFloodfillScore = calcFloodfillScore(
    grid,
    mySnakeHead,
    mySnakeLength,
    board.height,
    board.width
  );
  ourFloodfillScore *= HEURISTIC.ourFloodfillScoreMultiplier;

  // Positive number for when their snake has little space left
  let theirFloodfillScore =
    -1 *
    calcFloodfillScore(
      grid,
      otherSnakeHead,
      otherSnakeLength,
      board.height,
      board.width
    );
  theirFloodfillScore *= HEURISTIC.theirFloodfillScoreMultiplier;

  floodFillScore = ourFloodfillScore + theirFloodfillScore;
  score += floodFillScore;

  // ********** HEURISTIC: EDGES *************

  let edgesScore = 0;

  let outerBound = HEURISTIC.edgeValInner;
  let secondOuterBound = HEURISTIC.edgeValOuter;

  // the closer our snake is to the edge, the worse it is
  if (
    mySnakeHead.x == 0 ||
    mySnakeHead.x == board.width - 1 ||
    mySnakeHead.y == 0 ||
    mySnakeHead.y == board.height - 1
  ) {
    edgesScore -= (outerBound / 2);
  }

  if (
    mySnakeHead.x == 1 ||
    mySnakeHead.x == board.width - 2 ||
    mySnakeHead.y == 1 ||
    mySnakeHead.y == board.height - 2
  ) {
    edgesScore -= (secondOuterBound / 2);
  }

  // the closer enemy snake is to the edge, the better
  if (
    otherSnakeHead.x == 0 ||
    otherSnakeHead.x == board.width - 1 ||
    otherSnakeHead.y == 0 ||
    otherSnakeHead.y == board.height - 1
  ) {
    edgesScore += outerBound / 2;
  }

  if (
    otherSnakeHead.x == 1 ||
    otherSnakeHead.x == board.width - 2 ||
    otherSnakeHead.y == 1 ||
    otherSnakeHead.y == board.height - 2
  ) {
    edgesScore += secondOuterBound / 2;
  }

  score += edgesScore;

  // // ********** HEURISTIC: CORNERS *************
  // let cornerScore;
  // cornerScore = MAX_DISTANCE - distanceToClosestCorner(otherSnakeHead, board);
  // cornerScore -= (MAX_DISTANCE - distanceToClosestCorner(mySnakeHead, board)) / 2;
  // score += cornerScore

  if (logger) {
    const heuristicInfo = {
      Food: foodScore,
      OurFoodEaten: bottomNode.foodsWeAteAlongPath,
      TheirFoodEaten: bottomNode.foodsTheyAteAlongPath,
      Floodfill: floodFillScore,
      ourFloodfillScore,
      theirFloodfillScore,
      AggressionDistance: distanceToOtherSnake,
      Aggression: aggressionScore,
      NextMove: otherSnakeNextMove,
      Edges: edgesScore
    };
    logger.logHeuristicDetails(heuristicInfo);
  }

  return score;
  // When the enemy snake is close to the edge, attempt to get closer to
  // their head (blocks their path). Keep in mind to avoid moves that may lead to death.
};

module.exports = {
  calcBestMove,
  MinimaxGame,
};
