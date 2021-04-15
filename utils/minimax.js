const {
  directions,
  getAdjacentCoordinate,
  coordinateOutOfBounds,
  coordinatesAreEqual,
  boardToGrid,
  findClosestApple,
  distanceToClosestCorner,
  prettyPrintGrid,
  distance
} = require("./utils");

const { largestAdjacentFloodfill } = require("./floodfill");

const { astar, Graph } = require("./pathfinding");

const {
  MINIMAX_DEPTH,
  MAX_HEALTH,
  HEURISTIC_FUTURE_UNCERTAINTY_FACTOR,
} = require("../constants");

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
    const snakeTailCoordinate = currentSnake.body[currentSnake.body.length - 1];

    var foodsWeAteAlongPath = 0;
    var foodsTheyAteAlongPath = 0;
    // Check if we have eaten food in the previous move. If so, persist info
    if(this.changeHistory.length > 1) {
      foodsWeAteAlongPath = this.changeHistory[this.changeHistory.length - 1].foodsWeAteAlongPath
      foodsTheyAteAlongPath = this.changeHistory[this.changeHistory.length - 1].foodsTheyAteAlongPath
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
      foodsWeAteAlongPath: foodsWeAteAlongPath,
      foodsTheyAteAlongPath: foodsTheyAteAlongPath
      // TODO: food: describe food changes
    };

    // Grid Changes for floodFill
    // TODO: undo function for grid, account for food changes



    if (
     !coordinateOutOfBounds(newSnakeHeadCoordinate, this.board.height, this.board.width)
    ) {
      this.grid[newSnakeHeadCoordinate.x][newSnakeHeadCoordinate.y] = 0;
      this.grid[snakeTailCoordinate.x][snakeTailCoordinate.y] = 1;
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
    if (lastChange.snake !== undefined) {
      const currentSnake = this.board.snakes.find(
        (snake) => snake.id === lastChange.snake.id
      );

      // Adjustment for grid floodfill
      if (!coordinateOutOfBounds(lastChange.snake.newHeadPosition, this.board.height, this.board.width)) {
        this.grid[lastChange.snake.newHeadPosition.x][
          lastChange.snake.newHeadPosition.y
        ] = 1;
        this.grid[lastChange.snake.prevTailPosition.x][
          lastChange.snake.prevTailPosition.y
        ] = 0;
      }

      // Opposite order of modifications made in move() method
      currentSnake.body.push(lastChange.snake.prevTailPosition);
      currentSnake.body.shift(); // .shift() gets rid of the first element of an array
      currentSnake.head = { ...currentSnake.body[0] }; // copy of head (don't reference)
    }
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
      remainingDepth
    );
    if (gameOverValue) {
      if (logger) {
        logger.logCurrentMoveAndValue({
          move: null,
          value: gameOverValue
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
const evaluateIfGameOver = (board, mySnakeID, otherSnakeID, remainingDepth, logger) => {
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
  }

  const adjustForFutureUncertainty = (score) => {
//    score *= (HEURISTIC_FUTURE_UNCERTAINTY_FACTOR**(MINIMAX_DEPTH - remainingDepth))
    return score;
  };
  let score;

  if (mySnakeDead) {
    score = adjustForFutureUncertainty(-1000);
  } else if (mySnakeMaybeDead) {
    score= adjustForFutureUncertainty(-500);
  } else if (otherSnakeMaybeDead) {
    score= adjustForFutureUncertainty(500);
  } else if (otherSnakeDead) {
    score= adjustForFutureUncertainty(1000);
  } else {
    score= adjustForFutureUncertainty(0);
  }

  if (score && logger){
    logger.logCurrentMoveAndValue({gameOver: true})
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
  const otherSnakeHead = otherSnake.head;
  const MAX_DISTANCE = board.width + board.height;
  const bottomNode = game.changeHistory[game.changeHistory.length - 1];

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
  const mySnakeLength = mySnake.length;
  const closestApple = findClosestApple(board.food, mySnakeHead);

  if (otherSnake.health <= 40 ||
    (otherSnake.length < mySnake.length + 2)) {
    if (bottomNode.foodsWeAteAlongPath) {
      theirFoodScore -= bottomNode.foodsTheyAteAlongPath * 100;
    } else {
      const closestAppleDistance =
        Math.abs(otherSnakeHead.x - closestApple.x) +
        Math.abs(otherSnakeHead.y - closestApple.y);

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
    
  if (
    mySnake.health <= 40 ||
    (mySnakeLength < otherSnake.length + 2)
  ) {
    if (bottomNode.foodsWeAteAlongPath) {
      foodScore = 100 * bottomNode.foodsWeAteAlongPath;
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

  // // ********** HEURISTIC: FLOODFILL *************
  // let cavernSize = 0;
  // let floodFillScore = 0;
  // if (!coordinateOutOfBounds(mySnakeHead, board.height, board.width)) {
  //   cavernSize = largestAdjacentFloodfill(
  //     grid,
  //     mySnakeHead,
  //     mySnakeLength * 2
  //   );
  //   // console.log(
  //   //   "cavernSize for " +
  //   //     mySnakeHead.x +
  //   //     ", " +
  //   //     mySnakeHead.y +
  //   //     ":" +
  //   //     cavernSize
  //   // );
  // }

  // floodFillScore = cavernSize <= mySnakeLength ? -100 : cavernSize;
  // // console.log(floodFillScore)
  // score += floodFillScore;
  
  // ********** HEURISTIC: EDGES *************
  // let edgesScore = 0;

  // let outerBound = 200;
  // let secondOuterBound = 100;

  // // the closer our snake is to the edge, the worse it is
  // if (mySnakeHead.x == 0 || mySnakeHead.x == board.width - 1 ||
  //     mySnakeHead.y == 0 || mySnakeHead.y == board.height -1) {
  //   edgesScore -= outerBound;
  // }

  // if (mySnakeHead.x == 1 || mySnakeHead.x == board.width - 2 ||
  //     mySnakeHead.y == 1 || mySnakeHead.y == board.height -2) {
  //   edgesScore -= secondOuterBound;
  // }

  // // the closer enemy snake is to the edge, the better
  // if (otherSnakeHead.x == 0 || otherSnakeHead.x == board.width - 1 ||
  //     otherSnakeHead.y == 0 || otherSnakeHead.y == board.height -1) {
  //   edgesScore += outerBound;
  // }

  // if (otherSnakeHead.x == 1 || otherSnakeHead.x == board.width - 2 ||
  //     otherSnakeHead.y == 1 || otherSnakeHead.y == board.height -2) {
  //   edgesScore += secondOuterBound;
  // }

  // score += edgesScore;

  // // ********** HEURISTIC: CORNERS *************
  // let cornerScore;
  // cornerScore = MAX_DISTANCE - distanceToClosestCorner(otherSnakeHead, board);
  // cornerScore -= (MAX_DISTANCE - distanceToClosestCorner(mySnakeHead, board)) / 2;
  // score += cornerScore;


  if (logger) {
    const heuristicInfo = {  
      Food: foodScore,
      FoodWeAte: game.changeHistory[game.changeHistory.length - 1].foodsWeAteAlongPath,
      FoodTheyAte: game.changeHistory[game.changeHistory.length - 1].foodsTheyAteAlongPath,
      bobby: 4
      // Floodfill: floodFillScore,
      // Cavern: cavernSize,
      // Edges: edgesScore,
      // Corners: cornerScore,
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
