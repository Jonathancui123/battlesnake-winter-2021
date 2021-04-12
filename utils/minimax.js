const {
  directions,
  getAdjacentCoordinate,
  coordinateOutOfBounds,
  coordinatesAreEqual,
	boardToGrid,
	findClosestApple,
	distanceToClosestCorner
} = require("./utils");

const { astar, Graph } = require("./pathfinding");

// TODO: Fix "off by one error"
// Game object which represents the board: (explanation: https://www.w3schools.com/js/js_object_constructors.asp)
// Supports methods for modifying the board, undoing modifications, and getting potential moves
function MinimaxGame(board) {

  // The state of the board at the current node of Minimax simulation
  // Battlesnake API board object
  this.board = board;
  this.grid = boardToGrid(this.board);
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

    // Grid Changes for floodFill
    // TODO: undo function for grid, account for food changes
    console.log(this.grid[newSnakeHeadCoordinate.x])
    // this.grid[newSnakeHeadCoordinate.x][newSnakeHeadCoordinate.y] = 0;
    // this.grid[snakeTailCoordinate.x][snakeTailCoordinate.y] = 1;

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
      this.grid[lastChange.snake.newHeadPosition.x][lastChange.snake.newHeadPosition.y] = 1
      this.grid[lastChange.snake.prevTailPosition.x][lastChange.snake.prevTailPosition.y] = 0

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
    value = evaluateBoard(game.board, mySnakeID, otherSnakeID);
    if (logger){
      logger.logCurrentNode({move: null, value})
      logger.goToParent();
    }
    return [value, null];
  }
  
  // Base case 2: evaluate board when either snake is dead
  // Note: should only evalute when it is our turn (takes 2 moves for a turn), so only
  // when maximizing player is true
  if (isMaximizingPlayer) {


    const gameOverValue = evaluateIfGameOver(game.board, mySnakeID, otherSnakeID);
    if (gameOverValue) {
      if (logger){
        logger.logCurrentNode({move: null, value: gameOverValue, gameOver: true})
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
    game.move(move, targetSnakeID);
    
    if (logger){
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
      if (logger){
        logger.pruningAtCurrentNode();
      }
      break;
    }
  }

  if (logger){
    logger.logCurrentNode({move: bestMove, value: bestMoveValue})
    logger.goToParent();
  }

  return [bestMoveValue, bestMove];
};

// Returns true if either of the two specified snakes should die from their current position
const evaluateIfGameOver = (board, mySnakeID, otherSnakeID) => {
  const mySnake = board.snakes.find((snake) => snake.id === mySnakeID);
  const otherSnake = board.snakes.find((snake) => snake.id === otherSnakeID);
  const mySnakeHead = mySnake.head;
  const otherSnakeHead = otherSnake.head;
  let headOnCollision = false;

	var mySnakeMaybeDead = false; // opponent may not use the best move (head collisions)
  var otherSnakeDead = false;

  // my snake head or other snake head out of bounds
	// being out of bounds is the only death that is certain
  const mySnakeDead = coordinateOutOfBounds(mySnakeHead, board.height, board.width);

  if (coordinateOutOfBounds(otherSnakeHead, board.height, board.width)) {
    otherSnakeDead = true;
  }

  // Handle snake heads colliding with one another
  if (coordinatesAreEqual(mySnakeHead, otherSnakeHead)) {
    headOnCollision = true;
    if (mySnake.length === otherSnake.length) {
      mySnakeMaybeDead = true;
      otherSnakeDead = true;
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
      mySnakeMaybeDead = true;
    }
    if (mySnakeHeadCollisions > 1) {
      otherSnakeDead = true;
    }
  }
  

  if (mySnakeDead) {
    return -1000;
	} else if (mySnakeMaybeDead) {
		return -500;
  } else if (otherSnakeDead) {
    return 1000;
  } else {
    return 0;
  }
};

// Scores the given game board --> higher score if good for mySnake, lower if bad for mySnake
const evaluateBoard = (board, mySnakeID, otherSnakeID) => {

 	// Some operations to simulate the time it would take to actually evaluate the board
  /*
  var grid = boardToGrid(board);
  const graph = new Graph(grid);
  const start = graph.grid[0][0];
  const end = graph.grid[8][8];
  const result = astar.search(graph, start, end);
  */
  // console.log("astar: ", result);

	// HEURISTICS!!!!

	// range = [-1000, 1000]
	// score will only be negative if it might die
	var score = 0;

	// gameOverValue is -500 if mySnake might die
	// gameOverValue is -1000 if mySnake will for sure die
  const gameOverValue = evaluateIfGameOver(board, mySnakeID, otherSnakeID);
	if (gameOverValue) {
  	score += gameOverValue;
	}
	
	const mySnake = board.snakes.find((snake) => snake.id === mySnakeID);
  const otherSnake = board.snakes.find((snake) => snake.id === otherSnakeID);
	const mySnakeHead = mySnake.head;
	const otherSnakeHead = otherSnake.head;

	// if snake is hungry, the closer the snake to food the better
	if (mySnake.health <= 40) {
		closestAppleDistance = Math.pow(mySnakeHead.x - findClosestApple.x, 2) + Math.pow(mySnakeHead.y - findClosestApple.y, 2);
		score += closestAppleDistance; // heuristic score can be adjusted later
	}

	// the further from the edge the better
	// add the minimum distance between the x and y distance
	const distanceFromEdge = 0;
	var x = 0;
	var y = 0;

	if (mySnakeHead.x < board.width / 2) {
		x = mySnakeHead.x;
	} else {
		x = board.width - mySnakeHead.x;
	}

	if (mySnakeHead.y < board.width / 2) {
		y = mySnakeHead.y;
	} else {
		y = board.width - mySnakeHead.y;
	}

	score += Math.min(x, y);

	// check distance of enemy head from corner
	score += distanceToClosestCorner(otherSnakeHead, board);

	return score;
  // When the enemy snake is close to the edge, attempt to get closer to 
  // their head (blocks their path). Keep in mind to avoid moves that may lead to death.
	
  // Return a random value (should be the actual evaluation score of the board)
  // return 0.5 - Math.random();
};

module.exports = {
  calcBestMove,
  MinimaxGame,
};
