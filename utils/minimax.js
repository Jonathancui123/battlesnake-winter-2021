const {
  directions,
  getAdjacentCoordinate,
  coordinateOutOfBounds,
  coordinatesAreEqual,
} = require("./utils");

// TODO: Fix "off by one error"
// Game object which represents the board: (explanation: https://www.w3schools.com/js/js_object_constructors.asp)
// Supports methods for modifying the board, undoing modifications, and getting potential moves
function MinimaxGame(board) {
  this.board = board;
  // Somehow keep track of the board changes so we can undo moves, or simply store all previous board positions
  this.changeHistory = [];
  // Commit the move to our move history and update this.board
  // move: the direction (string) in which the snake will move
  // snakeID: the snake which is being moved
  this.move = function (moveDirection, snakeID) {
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

    // Create an object that describes the changes to the board on this move
    const newChange = {
      snake: {
        id: snakeID,
        newHeadPosition: newSnakeHeadCoordinate,
        prevTailPosition: snakeTailCoordinate,
      },
      // TODO: food: describe food changes
    };
    this.changeHistory.push(newChange);

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

      // Opposite order of modifications made in move() method
      currentSnake.body.push(lastChange.snake.prevTailPosition);
      currentSnake.body.shift();
      currentSnake.head = { ...currentSnake.body[0] }; // copy of head (don't reference)
    }
  };
  return this;
}

// depth: number of moves we want to continue looking forward
// game: object representing the game (and board) state to be evaluated
// mySnakeID: the ID string of our own snake (so that minimax knows who to move)
// otherSnakeID: the ID string of the opponent snake
const calcBestMove = function (
  depth,
  game,
  mySnakeID,
  otherSnakeID,
  turnNumber,
  alpha = Number.NEGATIVE_INFINITY,
  beta = Number.POSITIVE_INFINITY,
  isMaximizingPlayer = true
) {
  // Base case: evaluate board at maximum depth
  if (depth === 0) {
    value = evaluateBoard(game.board, mySnakeID, otherSnakeID);
    return [value, null];
  }

  // Base case 2: evaluate board when either snake is dead
  const gameOverValue = evaluateIfGameOver(game.board, mySnakeID, otherSnakeID);
  if (gameOverValue) {
    return [gameOverValue, null];
  }

  // clean up dead snakes and eaten food before proceeding with simulation
  game.cleanupBoard();

  // Recursive case: search possible moves
  var bestMove = null; // best move not set yet
  var possibleMoves = directions;

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
    game.move(move, targetSnakeID);
    // Recursively get the value from this move
    value = calcBestMove(
      depth - 1,
      game,
      mySnakeID,
      otherSnakeID,
      turnNumber,
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
      break;
    }
  }

  return [bestMoveValue, bestMove];
};

// Returns true if either of the two specified snakes should die from their current position
const evaluateIfGameOver = (board, mySnakeID, otherSnakeID) => {
  const mySnake = board.snakes.find((snake) => snake.id === mySnakeID);
  const otherSnake = board.snakes.find((snake) => snake.id === otherSnakeID);
  const mySnakeHead = mySnake.head;
  const otherSnakeHead = otherSnake.head;

  var mySnakeDead = false;
  var otherSnakeDead = false;

  // my snake head or other snake head out of bounds
  if (coordinateOutOfBounds(mySnakeHead, board.height, board.width)) {
    mySnakeDead = true;
  }
  if (coordinateOutOfBounds(otherSnakeHead, board.height, board.width)) {
    otherSnakeDead = true;
  }

  // Handle snake heads colliding with one another
  if (coordinatesAreEqual(mySnakeHead, otherSnakeHead)) {
    if (mySnake.length === otherSnake.length) {
      mySnakeDead = true;
      otherSnakeDead = true;
    } else if (mySnake.length > otherSnake.length) {
      otherSnakeDead = true;
    } else {
      mySnakeDead = true;
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
  if (mySnakeHeadCollisions > 1) {
    mySnakeDead = true;
  }
  if (mySnakeHeadCollisions > 1) {
    otherSnakeDead = true;
  }

  if (mySnakeDead && otherSnakeDead) {
    return -1000;
  } else if (mySnakeDead) {
    return -1000;
  } else if (otherSnakeDead) {
    return 1000;
  } else {
    return 0;
  }
};

// Scores the given game board --> higher score if good for mySnake, lower if bad for mySnake
const evaluateBoard = (board, mySnakeID, otherSnakeID) => {
  const gameOverValue = evaluateIfGameOver(board, mySnakeID, otherSnakeID);
  if (gameOverValue) {
    return gameOverValue;
  }
  // Return a random value (should be the actual evaluation score of the board)
  // TODO: Heuristic goes here
  return 0.5 - Math.random();
};

module.exports = {
  calcBestMove,
  MinimaxGame,
};
