

module.exports = {
  // Logger
  USE_LOGGER : true,
  // How many moves to simulate
  // Two moves (one from each snake) is one "turn" in the game. e.g. MINIMAX_DEPTH=2 means that we will only simulate the immediate turn
  MINIMAX_DEPTH : 4,
  MAX_HEALTH: 100,
  // Heuristics:
  HEURISTIC_FUTURE_UNCERTAINTY_FACTOR: 0.87,
}