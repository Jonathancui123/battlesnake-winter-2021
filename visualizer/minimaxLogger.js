// Used by the minimax algorithm to output game logs
const {writeFileSync, statSync, readFileSync, existsSync, mkdirSync} = require('fs');
const path = require("path");

const {LOGGER_TURNS_TO_KEEP_BEFORE_OVERWRITE} = require("../constants");

// Stores the data necessary for the visualizer to represent this node in a graph
function VisualizerNode(minimaxLoggerNode, loggerTurnNumber){
  if (minimaxLoggerNode.parentId){
    this.parent = minimaxLoggerNode.parentId;
  }
  this.key = minimaxLoggerNode.nodeId

  const newTurnNumber = loggerTurnNumber + Math.floor(minimaxLoggerNode.nodeDepth / 2);
  const isMaximizingPlayer = !Boolean(minimaxLoggerNode.nodeDepth % 2) // our turn will be on even node depth
  const our_their = isMaximizingPlayer ? "OUR" : "THEIR";
  const their_our = isMaximizingPlayer ?  "THEIR" : "OUR";
  const whose_move = minimaxLoggerNode.data.move ? (isMaximizingPlayer ? "our move" : "their move"): "no move"
  this.name = `Turn ${newTurnNumber}, ${whose_move}`;

  // Colours var for the 
  var colors = {
  'red': '#be4b15',
  'green': '#52ce60',
  'blue': '#6ea5f8',
  'lightred': '#fd8852',
  'lightblue': '#afd4fe',
  'lightgreen': '#b9e986',
  'pink': '#faadc1',
  'purple': '#d689ff',
  'orange': '#fdb400',
  }   

  this.items = [];
  if(minimaxLoggerNode.previousMove){
    this.items.push({
      item: `If ${their_our} snake moved ${minimaxLoggerNode.previousMove.toUpperCase()}:`,
      iskey: true,
      figure: "",
      fill: "",
      stroke: ""
  })
  }
  if (minimaxLoggerNode.data.move){
    // Not a leaf node
    this.items.push({
      item: `${our_their} snake will move ${minimaxLoggerNode.data.move.toUpperCase()}:`,
      iskey: false,
      figure: "",
      fill: "",
      stroke: ""
    })
  } else if(minimaxLoggerNode.data.gameOver) {
    // Game over leaf node
    this.items.push({
      item: `The game is over with`,
      iskey: false,
      figure: "Circle",
      fill: colors.red,
      stroke: colors.red
    })
  } else {
    // Max depth leaf node
        this.items.push({
      item: `The game is evaluated at`,
      iskey: false,
      figure: "",
      fill: "",
      stroke: ""
    })
  }
  this.items.push({
    item: `Value: ${minimaxLoggerNode.data.value}:`,
    iskey: false,
    figure: "",
    fill: "",
    stroke: ""
  })
}

// Stores the data for a node (a game board state) in the minimax tree
function MinimaxLoggerNode(depth, childNumber='0', parentId=undefined, previousMove=undefined){
  // To create a unique nodeId, we concatenate the childNumber onto the parentId string
  if (parentId !== undefined){ // parentId is only undefined for the root node
    this.parentId = String(parentId);
    this.nodeId = String(this.parentId +`-${childNumber}`);
  } else {
    this.nodeId = '0';
  }

  if (previousMove){
    this.previousMove = previousMove;
  }
  
  this.nodeDepth = depth;

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
    this.currentNode = new MinimaxLoggerNode(0);
    this.nodeStack.push(this.currentNode);
  }

  // Step one level deeper in the simulation than before
  this.goDeeper = function(previousMove) {

    // create a new child node and set it as the new currentNode    
    const newNodeParentId = this.currentNode.nodeId;
    const newNodeChildNumber = String(this.currentNode.childCount);

    this.currentNode.childCount++;
    this.currentNode = new MinimaxLoggerNode(this.nodeStack.length, newNodeChildNumber, newNodeParentId, previousMove);

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
    const newVisualizerNode = new VisualizerNode(newFinishedNode, turnNumber)
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
    const folderpath = path.join(__dirname, `logs`);
    if (!existsSync(folderpath)){
      mkdirSync(folderpath);
    }

    const filepath = path.join(__dirname, `logs`, `${this.gameId}.json`)
    try { 
      statSync(filepath) // Will throw if the file doesn't exist
      // some other turn, file already exists
      if (this.turnNumber % LOGGER_TURNS_TO_KEEP_BEFORE_OVERWRITE == 0){
        // Reset the log file for this game every LOGGER_TURNS_TO_KEEP turns 
        console.log(this.turnNumber);
         throw "Logs full"
      } 
      const jsonFile = readFileSync(filepath);
      const jsonObject = JSON.parse(jsonFile);
      jsonObject[`turn_${this.turnNumber}`] = this.finishedNodes;
      const newJsonFile = JSON.stringify(jsonObject);
      writeFileSync(filepath, newJsonFile);
      
    } catch { // first turn of the game, file doesn't exist yet
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