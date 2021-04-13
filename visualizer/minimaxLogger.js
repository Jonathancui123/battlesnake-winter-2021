// Used by the minimax algorithm to output game logs
const {
  writeFileSync,
  statSync,
  readFileSync,
  existsSync,
  mkdirSync,
} = require("fs");
const path = require("path");

const { LOGGER_TURNS_TO_KEEP_BEFORE_OVERWRITE, COLOURS } = require("../constants");

// Stores the data necessary for the visualizer to represent this node in a graph
function VisualizerNode(minimaxLoggerNode, loggerTurnNumber) {
  const newTurnNumber =
    loggerTurnNumber + Math.floor(minimaxLoggerNode.nodeDepth / 2);
  const isMaximizingPlayer = !Boolean(minimaxLoggerNode.nodeDepth % 2); // our turn will be on even node depth
  const our_their = isMaximizingPlayer ? "OUR" : "THEIR";
  const their_our = isMaximizingPlayer ? "THEIR" : "OUR";
  const whose_move = minimaxLoggerNode.data.move
    ? isMaximizingPlayer
      ? "our move"
      : "their move"
    : "no move";

  if (minimaxLoggerNode.parentId) {
    this.parent = minimaxLoggerNode.parentId;
  }
  this.key = minimaxLoggerNode.nodeId;
  this.name = `Turn ${newTurnNumber}, ${whose_move}`;
  // Colours var for the block
  //Background colors
  if (minimaxLoggerNode.data.gameOver && minimaxLoggerNode.data.value < 0){ // We die
    console.log(this.colour)
    this.colour = COLOURS.lightRed
  } else if (minimaxLoggerNode.data.gameOver && minimaxLoggerNode.data.value > 0) {
    // enemy dies
    console.log(this.colour)
    this.colour = COLOURS.lightGreen
  }


  // list items design
  this.items = [];
  if (minimaxLoggerNode.previousMove) {
    this.items.push({
      item: `If ${their_our} snake moved ${minimaxLoggerNode.previousMove.toUpperCase()}:`,
      iskey: true,
    });
  }
  if (minimaxLoggerNode.data.move) {
    // Not a leaf node
    this.items.push({
      item: `${our_their} snake will move ${minimaxLoggerNode.data.move.toUpperCase()}:`,
      iskey: false,
    });
  } else if (minimaxLoggerNode.data.gameOver) {
    // Game over leaf node
    this.items.push({
      item: `The game is over with`,
      iskey: false,
    });
  } else {
    // Max depth leaf node
    this.items.push({
      item: `The game is evaluated at`,
      iskey: false,
    });
  }
  this.items.push({
    item: `Value: ${minimaxLoggerNode.data.value}:`,
    iskey: false,
  });

  // small details design
  this.itemsSmall = [];

  for (const [heuristic, value] of Object.entries(
    minimaxLoggerNode.data.details
  )) {
    this.itemsSmall.push({
      item: `${heuristic}: ${value}`,
      iskey: false,
    });
  }
}

// Stores the data for a node (a game board state) in the minimax tree
function MinimaxLoggerNode(
  depth,
  childNumber = "0",
  parentId = undefined,
  previousMove = undefined
) {
  // To create a unique nodeId, we concatenate the childNumber onto the parentId string
  if (parentId !== undefined) {
    // parentId is only undefined for the root node
    this.parentId = String(parentId);
    this.nodeId = String(this.parentId + `-${childNumber}`);
  } else {
    this.nodeId = "0";
  }

  if (previousMove) {
    this.previousMove = previousMove;
  }

  this.nodeDepth = depth;

  this.childCount = 0;

  this.data = {
    details: {},
  };
}

// Value tree maps the ID of each node to its value
function ValueTreeNode(id) {
  this.id = id;
  this.children = [];
  this.value = undefined;
}

// Globally available object that implements navigation methods to track of the current position in the minimax simulation tree and log everything in the right place
function MinimaxLogger(gameId, turnNumber) {
  // store game Id and turn number to write to correct log
  this.gameId = gameId;
  this.turnNumber = turnNumber;

  this.currentNode = undefined;

  // Use a stack to keep track of the DFS-like traversal of the minimax tree
  // Each element of the stack is of type MinimaxLoggerNode and represents a node (a game board state) in the minimax tree -- holds all nodes we are still processing (up to and including the currentNode)
  this.nodeStack = []; // stack implemented as array

  // VisualizerNodes of the minimax simulation states that we have finished processing
  // A list to collect our log data before writing it to json
  this.finishedNodes = [];
  this.finishedNodesTemp = {}

  // Holdes an object with all of the nodes mapping ID to object
  this.valueTree = {};

  this.init = function () {
    this.currentNode = new MinimaxLoggerNode(0);
    this.nodeStack.push(this.currentNode);
    this.valueTree[this.currentNode.nodeId] = new ValueTreeNode(this.currentNode.nodeId);
  };

  // Step one level deeper in the simulation than before
  this.goDeeper = function (previousMove) {
    // create a new child node and set it as the new currentNode
    const newNodeParentId = this.currentNode.nodeId;
    const newNodeChildNumber = String(this.currentNode.childCount);

    this.currentNode.childCount++;
    this.currentNode = new MinimaxLoggerNode(
      this.nodeStack.length,
      newNodeChildNumber,
      newNodeParentId,
      previousMove
    );

    // push new node to nodeStack
    this.nodeStack.push(this.currentNode);

    // maintain value tree
    this.valueTree[newNodeParentId].children.push(this.currentNode.nodeId);
    this.valueTree[this.currentNode.nodeId] = new ValueTreeNode(this.currentNode.nodeId)    

    return;
  };

  // Step one level up in the simulation depth
  this.goToParent = function () {
    // pop the node off of the nodeStack (we are finished processing it)
    const newFinishedNode = this.nodeStack.pop();

    this.valueTree[newFinishedNode.nodeId].value = newFinishedNode.data.value;

    if (this.nodeStack.length > 0) {
      // handle empty nodeStack for the last node we process (root node)
      this.currentNode = this.nodeStack[this.nodeStack.length - 1];
    }

    // We will never return to this node, commit it's contents to the finishedNodes
    const newVisualizerNode = new VisualizerNode(newFinishedNode, turnNumber);
    
    // this.finishedNodes.push(newVisualizerNode);
    this.finishedNodesTemp[newVisualizerNode.key] = newVisualizerNode;

    return;
  };

  // Records that the current node gets pruned
  this.pruningAtCurrentNode = function () {
    return;
  };

  // Records/Updates the logged data for the current simulation node
  // info: e.g. {move: "up/down/left/right", value: 1000} <-- value at this node
  this.logCurrentMoveAndValue = function (info) {
    // should take in an object with optional properties
    Object.assign(this.currentNode.data, info);
    return;
  };

  // Records heuristic details for a leaf node
  // info should be in the format of {"heuristicName": "value"}
  this.logHeuristicDetails = function (info) {
    Object.assign(this.currentNode.data.details, info);
    return;
  };

  this.modifyColoursToShowSelectedPath = function(nodeId, evenDepth=true){

    

    let comparator = (a, b) => {
      return a > b;
    }
    if (!evenDepth) {
      comparator = (a, b) => {
        return a < b;
      } 
    }

    const currentValueTreeNode = this.valueTree[nodeId];
    console.log(`NODE ID ${nodeId}`)
    console.log(`NODE ${currentValueTreeNode.children}`)

    const currentFinishedNode = this.finishedNodesTemp[nodeId]
    currentFinishedNode.colour = COLOURS.selected;

    let bestValue = evenDepth ? Number.NEGATIVE_INFINITY :  Number.POSITIVE_INFINITY;
    let selectedNodeId = undefined

    for (const childId of currentValueTreeNode.children){
      // console.log("beep")
      if (comparator(this.valueTree[childId].value, bestValue )){
        // console.log("boop")
        bestValue = this.valueTree[childId].value
        selectedNodeId = childId
      }
    }

    if (selectedNodeId) {
      this.modifyColoursToShowSelectedPath(selectedNodeId, !evenDepth);
    }
  }

  // Writes the logged data to a json file after a response has been given to Battlesnake game server
  this.writeLogsToJson = function () {

    // Modify colours of the selected nodes
    this.modifyColoursToShowSelectedPath('0');
    
    this.finishedNodes = [...Object.values(this.finishedNodesTemp)]

    const folderpath = path.join(__dirname, `logs`);
    if (!existsSync(folderpath)) {
      mkdirSync(folderpath);
    }

    const filepath = path.join(__dirname, `logs`, `${this.gameId}.json`);
    try {
      statSync(filepath); // Will throw if the file doesn't exist
      // some other turn, file already exists
      if (this.turnNumber % LOGGER_TURNS_TO_KEEP_BEFORE_OVERWRITE == 0) {
        // Reset the log file for this game every LOGGER_TURNS_TO_KEEP turns
        console.log(this.turnNumber);
        throw "Logs full";
      }
      const jsonFile = readFileSync(filepath);
      const jsonObject = JSON.parse(jsonFile);
      jsonObject[`turn_${this.turnNumber}`] = this.finishedNodes;
      const newJsonFile = JSON.stringify(jsonObject);
      writeFileSync(filepath, newJsonFile);
    } catch {
      // first turn of the game, file doesn't exist yet
      const newJsonObject = {};
      newJsonObject[`turn_${this.turnNumber}`] = this.finishedNodes;
      const newJsonFile = JSON.stringify(newJsonObject);
      writeFileSync(filepath, newJsonFile);
    }
  };
}

module.exports = {
  MinimaxLogger,
};
