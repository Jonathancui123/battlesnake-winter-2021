// Used by the minimax algorithm to output game logs
const {writeFileSync, statSync, readFileSync} = require('fs');
const path = require("path");

// Stores the data necessary for the visualizer to represent this node in a graph
function VisualizerNode(minimaxLoggerNode){
  if (minimaxLoggerNode.parentId){
    this.parent = minimaxLoggerNode.parentId;
  }
  this.key = minimaxLoggerNode.nodeId
  this.name = minimaxLoggerNode.nodeId;
  this.body = `Move: ${minimaxLoggerNode.data.move}, Value: ${minimaxLoggerNode.data.value}`
}

// Stores the data for a node (a game board state) in the minimax tree
function MinimaxLoggerNode(childNumber='0', parentId=undefined){
  // To create a unique nodeId, we concatenate the childNumber onto the parentId string
  if (parentId !== undefined){ // parentId is only undefined for the root node
    this.parentId = String(parentId);
    this.nodeId = String(this.parentId +`-${childNumber}`);
  } else {
    this.nodeId = '0';
  }
  
  this.childCount = 0;

  this.data = {}
}

// Globally available object that implements navigation methods to track of the current position in the minimax simulation tree and log everything in the right place
function MinimaxLogger(gameId, turnNumber){
  // store game Id and turn number to write to correct log
  this.gameId = gameId;
  this.turnNumber = turnNumber;
  
  
  this.currentNode = undefined

  // Use a stack to keep track of the DFS-like traversal of the minimax tree
  // Each element of the stack is of type MinimaxLoggerNode and represents a node (a game board state) in the minimax tree -- holds all nodes we are still processing (up to and including the currentNode)
  this.nodeStack = []; // stack implemented as array

  // VisualizerNodes of the minimax simulation states that we have finished processing
  // A list to collect our log data before writing it to json
  this.finishedNodes = []

  this.init = function() {
    this.currentNode = new MinimaxLoggerNode();
    this.nodeStack.push(this.currentNode);
  }

  // Step one level deeper in the simulation than before
  this.goDeeper = function() {

    // create a new child node and set it as the new currentNode    
    const newNodeParentId = this.currentNode.nodeId;
    const newNodeChildNumber = String(this.currentNode.childCount);

    this.currentNode.childCount++;
    this.currentNode = new MinimaxLoggerNode(newNodeChildNumber, newNodeParentId);

    // push new node to nodeStack
    this.nodeStack.push(this.currentNode);

    return
  }

  // Step one level up in the simulation depth
  this.goToParent = function() {

    // pop the node off of the nodeStack (we are finished processing it)
    const newFinishedNode = this.nodeStack.pop();

    if (this.nodeStack.length > 0) { // handle empty nodeStack for the last node we process (root node)
      this.currentNode = this.nodeStack[this.nodeStack.length - 1];
    }

    // We will never return to this node, commit it's contents to the finishedNodes
    const newVisualizerNode = new VisualizerNode(newFinishedNode)
    this.finishedNodes.push(newVisualizerNode);

    return
  }

  // Records that the current node gets pruned
  this.pruningAtCurrentNode = function() {
    return
  }

  // Records/Updates the logged data for the current simulation node
  // info: e.g. {move: "up/down/left/right", value: 1000} <-- value at this node
  this.logCurrentNode = function(info) {
    // should take in an object with optional properties
    Object.assign(this.currentNode.data, info);
    return
  } 

  // Writes the logged data to a json file after a response has been given to Battlesnake game server
  this.writeLogsToJson = function() {
    const filepath = path.join(__dirname, `logs`, `${this.gameId}.json`)
    try { 
      statSync(filepath) // Will throw if the file doesn't exist
      // some other turn, file already exists
      const jsonFile = readFileSync(filepath);
      const jsonObject = JSON.parse(jsonFile);
      jsonObject[`turn_${this.turnNumber}`] = this.finishedNodes;
      const newJsonFile = JSON.stringify(jsonObject);
      writeFileSync(filepath, newJsonFile);
    } catch { // first turn, file doesn't exist yet
      const newJsonObject = {}
      newJsonObject[`turn_${this.turnNumber}`] = this.finishedNodes;
      const newJsonFile = JSON.stringify(newJsonObject);
      writeFileSync(filepath, newJsonFile);
    }
  }
}

module.exports = {
  MinimaxLogger
}