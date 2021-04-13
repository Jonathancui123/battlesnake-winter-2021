

module.exports = {
  // Logger
  USE_LOGGER : false,
  LOGGER_TURNS_TO_KEEP_BEFORE_OVERWRITE: 30,
  COLOURS : {
    red: "#be4b15",
    green: "#52ce60",
    blue: "#6ea5f8",
    lightred: "#fd8852",
    lightblue: "#afd4fe",
    lightgreen: "#b9e986",
    selected: "#faadc1",
    purple: "#d689ff",
    orange: "#fdb400",
  },
  // How many moves to simulate
  // Two moves (one from each snake) is one "turn" in the game. e.g. MINIMAX_DEPTH=2 means that we will only simulate the immediate turn
  MINIMAX_DEPTH : 4,
  MAX_HEALTH: 100,
  // Heuristics:
  HEURISTIC_FUTURE_UNCERTAINTY_FACTOR: 0.87,
}