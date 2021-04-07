// Used by the minimax algorithm to output game logs


// Globally available object that implements navigation methods to track of the current position in the minimax simulation tree and log everything in the right place
function MinimaxLogger(gameId, turnNumber){
  // store game Id and turn number to write to correct log
  this.gameId = gameId;
  this.turnNumber = turnNumber;

  // Step one level deeper in the simulation than before
  this.goDeeper = function() {
    return
  }

  // Step one level up in the simulation depth
  this.goToParent = function() {
    return
  }

  // Records that the current node gets pruned
  this.pruneCurrentNode = function() {
    return
  }

  // Records/Updates the logged data for the current simulation node
  this.logCurrentNode = function() {
    // should take in an object with optional properties
    console.log("logging now")
    return
  } 

  // Writes the logged data to a json file after a response has been given to Battlesnake game server
  this.writeLogsToJson = function() {

  }
}

module.exports = {
  MinimaxLogger
}