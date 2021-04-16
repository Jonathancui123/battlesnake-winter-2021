module.exports = {
  // Logger
<<<<<<< HEAD
  USE_LOGGER : true,
  LOGGER_TURNS_TO_KEEP_BEFORE_OVERWRITE: 100,
=======
  USE_LOGGER : false,
  LOGGER_TURNS_TO_KEEP_BEFORE_OVERWRITE: 30,
>>>>>>> 426ea949c41f20fd7e05c58f9a3844c5298fc0b9
  COLOURS : {
    red: "#be4b15",
    green: "#52ce60",
    blue: "#6ea5f8",
    lightRed: "#ffcccb",
    lightBlue: "#afd4fe",
    lightGreen: "#b9e986",
    selected: "#e872fc",
    purple: "#d689ff",
    orange: "#fdb400",
  },
  // How many moves to simulate
  // Two moves (one from each snake) is one "turn" in the game. e.g. MINIMAX_DEPTH=2 means that we will only simulate the immediate turn
<<<<<<< HEAD
  MINIMAX_DEPTH : 4,
=======
  MINIMAX_DEPTH : 8,
>>>>>>> 426ea949c41f20fd7e05c58f9a3844c5298fc0b9
  MAX_HEALTH: 100,
  // Heuristics:
  HEURISTIC_FUTURE_UNCERTAINTY_FACTOR: 0.87,

  HEURISTIC_SAFE_CAVERN_SIZE: 2, // How many times bigger the cavern must be than our snake to be considered “safe”
  // HEURISTIC_MIN_FLOODFILL_SCORE and HEURISTIC_MAX_FLOODFILL_SCORE should both be POSITIVE NUMBERS!
  HEURISTIC_MIN_FLOODFILL_SCORE: 25, // The score we wish to assign to a cavern that is "barely unsafe" for the "largest conceivable snake"
  HEURISTIC_MAX_FLOODFILL_SCORE: 100, // The score we wish to assign to a cavern that is of size 0 (maximally unsafe)
  HEURISTIC_LARGEST_CONCIEVABLE_SNAKE: 30, // How big can our snake possibly get? Affects how fast we go from MAX_FLOODFILL_SCORE to MIN_FLOODFILL_SCORE
  HEURISTIC: {
    foodVal: 50,
    theirFoodVal: 25,
    aggressionVal: 7.5,
    edgeValInner: 30,
    edgeValOuter: 15
  },
}