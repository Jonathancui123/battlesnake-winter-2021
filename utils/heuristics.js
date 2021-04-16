const {
  HEURISTIC
} = require("../constants");

const {
  coordinateOutOfBounds
} = require("./utils");

const {
  largestAdjacentFloodfill
} = require("./floodfill");


const calcFloodfillScore = (
  grid,
  snakeHead,
  snakeLength,
  boardHeight,
  boardWidth
) => {
  let floodFillScore = 0;
  if (!coordinateOutOfBounds(snakeHead, boardHeight, boardWidth)) {
    cavernSize = largestAdjacentFloodfill(
      grid,
      snakeHead,
      HEURISTIC.safeCavernSize * snakeLength
    );
  }

  // Logic on google docs
  if (cavernSize >= HEURISTIC.safeCavernSize * snakeLength) {
    // Safe..
    // Due to the floodfill stopping point, the largest cavernSize should be HEURISTIC_SAFE_CAVERN_SIZE * snakeLength
    floodFillScore = 0;
  } else {
    // calculate floodfillscore, based on google doc
    floodFillScore =
      ((HEURISTIC.maxFloodfillScore - HEURISTIC.minFloodfillScore) /
        Math.sqrt(
          HEURISTIC.safeCavernSize * HEURISTIC.largestConcievableSnake
        )) *
        Math.sqrt(cavernSize) -
      HEURISTIC.maxFloodfillScore;
  }
  // floodfill score is a NEGATIVE NUMBER between negative HEURISTIC_MAX_FLOODFILL_SCORE and zero
  return floodFillScore;
};

module.exports = {
  calcFloodfillScore
}