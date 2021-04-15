

module.exports = {
  // Logger
  USE_LOGGER : true,
  LOGGER_TURNS_TO_KEEP_BEFORE_OVERWRITE: 30,
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
  MINIMAX_DEPTH : 6,
  MAX_HEALTH: 100,
  // Heuristics:
  HEURISTIC_FUTURE_UNCERTAINTY_FACTOR: 0.87,
}