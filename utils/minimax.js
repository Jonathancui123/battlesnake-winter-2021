const { 
  up,
  down,
  left,
  right,
  directions,
  getAdjacentCoordinate,
  coordinateOutOfBounds
} = require('./utils')


// TODO: Fix "off by one error"
// Game object which represents the board: (explanation: https://www.w3schools.com/js/js_object_constructors.asp)
// Supports methods for modifying the board, undoing modifications, and getting potential moves
function Game(board) {
  this.board = board
  // Somehow keep track of the board changes so we can undo moves, or simply store all previous board positions
  this.changeHistory = []
  // Commit the move to our move history and update this.board
  // move: the direction (string) in which the snake will move
  // snakeID: the snake which is being moved
  this.move = function(moveDirection, snakeID) {
    // TODO: Account for food getting eaten --> remove food from board, grow the snake

    // Find the snake to move
    const currentSnake = this.board.snakes.find(snake => snake.id === snakeID);
    const snakeHeadCoordinate = currentSnake.head;
    const newSnakeHeadCoordinate = getAdjacentCoordinate(snakeHeadCoordinate, moveDirection);
    const snakeTailCoordinate = currentSnake.body[currentSnake.body.length - 1];

    // Create an object that describes the changes to the board on this move
    const newChange = {
      snake: {
        id: snakeID,
        newHeadPosition: newSnakeHeadCoordinate,
        prevTailPosition: snakeTailCoordinate
      }
      // TODO: food: describe food changes
    }
    this.changeHistory.push(newChange)

    // Modify the board object to reflect the changes
    currentSnake.head = newSnakeHeadCoordinate
    currentSnake.body.unshift(newSnakeHeadCoordinate)
    currentSnake.body.pop()
  }

  // Cleanup dead snakes and eaten food from the board, commit it to history
  this.cleanupBoard = function() {
    // TODO: Clean up eaten food.

    // We shouldn't have to deal with any dead snakes because we will evaluate the board and return if either our snake or the opponent snake dies.
  }

  // Undo the move at the top of the change history
  this.undo = function() {
    const lastChange = this.changeHistory.pop()
    if (lastChange.snake !== undefined){
      const currentSnake = this.board.snakes.find(snake => snake.id === lastChange.snake.id);
      
      // Opposite order of modifications made in move() method
      currentSnake.body.push(lastChange.snake.prevTailPosition);
      currentSnake.body.shift();
      currentSnake.head = {...currentSnake.body[0]}; // copy of head (don't reference)
    }
  }
}

// depth: number of moves we want to continue looking forward
// game: object representing the game (and board) state to be evaluated
// mySnakeID: the ID string of our own snake (so that minimax knows who to move)
// otherSnakeID: the ID string of the opponent snake
const calcBestMove = function(depth, game, mySnakeID, otherSnakeID, 
                            alpha=Number.NEGATIVE_INFINITY,
                            beta=Number.POSITIVE_INFINITY,
                            isMaximizingPlayer=true) { 
  // Base case: evaluate board at maximum depth
  if (depth === 0) {
    value = evaluateBoard(game.board, mySnakeID, otherSnakeID);
    return [value, null]
  }
  // Base case 2: evaluate board when either snake is dead
  if (gameOver(game.board, mySnakeID, otherSnakeID)){
    value = evaluateBoard(game.board, mySnakeID, otherSnakeID);
    return [value, null]
  }
  
  // clean up dead snakes and eaten food before proceeding with simulation
  game.cleanupBoard()

  // Recursive case: search possible moves
  var bestMove = null; // best move not set yet
  var possibleMoves = directions
  // Set random order for possible moves
  // Optimize this later to try the highest value moves first for maximizingPlayer and the lowest value moves first for minimizing player
  possibleMoves.sort(function(a, b){return 0.5 - Math.random()});
  // Set a default best move value
  var bestMoveValue = isMaximizingPlayer ? Number.NEGATIVE_INFINITY
                                         : Number.POSITIVE_INFINITY;
  // the snake that we are moving this turn
  const targetSnakeID = isMaximizingPlayer ? mySnakeID
                                         : otherSnakeID;                                         
  // Search through all possible moves
  for (var i = 0; i < possibleMoves.length; i++) {
    var move = possibleMoves[i];
    // Make the move, but undo before exiting loop
    game.move(move, targetSnakeID);
    // Recursively get the value from this move
    value = calcBestMove(depth-1, game, mySnakeID, otherSnakeID, alpha, beta, !isMaximizingPlayer)[0];
    // Log the value of this move
    console.log(isMaximizingPlayer ? 'Max: ' : 'Min: ', depth, move, value,
                bestMove, bestMoveValue);

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
      console.log('Prune', alpha, beta);
      break;
    }
  }

  return [bestMoveValue, bestMove]
}

// Returns true if either of the two specified snakes should die from their current position
const gameOver = (board, mySnakeID, otherSnakeID) => {
  const mySnake = board.snakes.find(snake => snake.id === mySnakeID);
  const otherSnake = board.snakes.find(snake => snake.id === otherSnakeID);

  // my snake head or other snake head out of bounds
  if(coordinateOutOfBounds(mySnake.head, board.height, board.width
  || coordinateOutOfBounds(otherSnake.head, board.height, board.width)){
    return true;
  }

  // my snake head collided with a snake
  // TODO: CONTINUE HERE
  // other snake head collided with a snake


    // don't run into snakes (including your own body)
  const snakes = board.snakes;
  snakes.forEach((snake) => {
    const snakeBody = snake.body;
    snakeBody.forEach((occupiedCoordinate) => {
      directions.forEach((direction) => {
        if (
          occupiedCoordinate.x == getAdjacentCoordinate(mySnakeHead, direction).x &&
          occupiedCoordinate.y == getAdjacentCoordinate(mySnakeHead, direction).y
        ) {
          legals[direction] = false;
        }
      });
    });
  });
}

// Scores the given game board --> higher score if good for mySnake, lower if bad for mySnake
const evaluateBoard = (board, mySnakeID) => { 
  
  return 0
}