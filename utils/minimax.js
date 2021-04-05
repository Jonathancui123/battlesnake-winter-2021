const {directions} = require('./utils')

// Game object which represents the board: (explanation: https://www.w3schools.com/js/js_object_constructors.asp)
// Supports methods for modifying the board, undoing modifications, and getting potential moves
function Game(board) {
  this.board = board
  // Somehow keep track of the board changes so we can undo moves, or simply store all previous board positions
  this.boardHistory = []

  // move: the direction (string) in which the snake will move
  // snakeID: the snake which is being moved
  this.move = function(move, snakeID) {
  
    // Commit the move to our move history and update this.board

    // TODO: Account for food getting eaten --> remove food from board, grow the snake
    const newBoard = this.board
  }
  this.undo = function() {
    // Undo the most recent move
  }
}

// depth: number of moves we want to continue looking forward
// game: object representing the game (and board) state to be evaluated
// mySnakeID: the ID string of our own snake (so that minimax knows who to move)
// mySnakeID: the ID string of the opponent snake
const calcBestMove = function(depth, game, mySnakeID, otherSnakeID, 
                            alpha=Number.NEGATIVE_INFINITY,
                            beta=Number.POSITIVE_INFINITY,
                            isMaximizingPlayer=true) {
  // Base case: evaluate board
  if (depth === 0) {
    value = evaluateBoard(game.board, mySnakeID);
    return [value, null]
  }

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
}

// Scores the given game board --> higher score if good for mySnake, lower if bad for mySnake
const evaluateBoard = (board, mySnakeID) => { 
  
  return 0
}