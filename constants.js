module.exports = {
  // Logger
  USE_LOGGER: false,
  LOGGER_TURNS_TO_KEEP_BEFORE_OVERWRITE: 50,
  COLOURS: {
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
  MINIMAX_DEPTH: 8,
  MAX_HEALTH: 100,
  // Heuristics:
  HEURISTIC: {
    foodVal: 50, // [0, 100]
    theirFoodVal: 25, // [-50, 0]
    aggressionVal: 7.5, // Max = 150
    edgeValInner: 25,
    edgeValOuter: 12.5,
    // floodfill:
    // HEURISTIC_MIN_FLOODFILL_SCORE and HEURISTIC_MAX_FLOODFILL_SCORE should both be POSITIVE NUMBERS!
    maxFloodfillScore: 100, // The score we wish to assign to a cavern that is of size 0 (maximally unsafe)
    minFloodfillScore: 25, // The score we wish to assign to a cavern that is "barely unsafe" for the "largest conceivable snake"
    safeCavernSize: 1.8, // How many times bigger the cavern must be than our snake to be considered “safe”
    largestConcievableSnake: 30, // How big can our snake possibly get? Affects how fast we go from MAX_FLOODFILL_SCORE to MIN_FLOODFILL_SCORE
    ourFloodfillScoreMultiplier: 1,
    theirFloodfillScoreMultiplier: 0.5,

    // future-death:
    futureUncertaintyFactor: 0.87, //  [-1000, -433.6] for kills/deaths, down to -210 for situations where we both die
  },
};
