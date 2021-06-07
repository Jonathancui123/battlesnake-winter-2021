const up = ({ x, y }) => {
  return { x, y: y + 1 };
};

const down = ({ x, y }) => {
  return { x, y: y - 1 };
};

const left = ({ x, y }) => {
  return { x: x - 1, y };
};

const right = ({ x, y }) => {
  return { x: x + 1, y };
};

// adjacentTiles takes position and board dimensions and returns adjacent tiles.
const adjacentTiles = ({ x, y }, height, width) => {
  tileList = [];

  if (x == 0 && y == 0) {
    tileList.push(up({ x, y }));
    tileList.push(right({ x, y }));
  } else if (x == 0 && y == height - 1) {
    tileList.push(right({ x, y }));
    tileList.push(down({ x, y }));
  } else if (x == width - 1 && y == height - 1) {
    tileList.push(left({ x, y }));
    tileList.push(down({ x, y }));
  } else if (x == width - 1 && y == 0) {
    tileList.push(up({ x, y }));
    tileList.push(left({ x, y }));
  } else if (x == 0) {
    tileList.push(up({ x, y }));
    tileList.push(down({ x, y }));
    tileList.push(right({ x, y }));
  } else if (y == 0) {
    tileList.push(up({ x, y }));
    tileList.push(left({ x, y }));
    tileList.push(right({ x, y }));
  } else if (y == height - 1) {
    tileList.push(down({ x, y }));
    tileList.push(left({ x, y }));
    tileList.push(right({ x, y }));
  } else if (x == width - 1) {
    tileList.push(left({ x, y }));
    tileList.push(down({ x, y }));
    tileList.push(up({ x, y }));
  } else {
    tileList.push(up({ x, y }));
    tileList.push(down({ x, y }));
    tileList.push(left({ x, y }));
    tileList.push(right({ x, y }));
  }

  return tileList;
};

const safeAdjacentTiles = (tiles, mySnake, otherSnake) => {
  safeTiles = [];
  mySnakeTailIndex = mySnake.length - 1;
  otherSnakeTailIndex = otherSnake.length - 1;
  tiles.forEach((tile) => {
    if (
      (otherSnake.body.indexOf(tile) == -1 &&
        mySnake.body.indexOf(tile) == -1) ||
      otherSnake.body.indexOf(tile) == otherSnakeTailIndex ||
      mySnake.body.indexOf(tile) == mySnakeTailIndex
    ) {
      safeTiles.push(tile);
    }
  });
  return safeTiles;
};

const boardToGrid = (board) => {
  var value = 1; // by default
  var myGrid = [...Array(board.height)].map((e) =>
    Array(board.width).fill(value)
  );
  const snakes = board.snakes;
  snakes.forEach((snake) => {
    const snakeBody = snake.body;
    snakeBody.forEach((occupiedCoordinate) => {
      myGrid[occupiedCoordinate.x][occupiedCoordinate.y] = 0;
    });
  });
  return myGrid;
};

const directions = ["up", "down", "left", "right"];

// Returns a string representing the direction of a destination that is adjacent to the source
const findAdjacentDirection = (source, destination) => {
  if (destination.x === source.x && destination.y === source.y + 1) {
    return "up";
  } else if (destination.x === source.x && destination.y === source.y - 1) {
    return "down";
  } else if (destination.x === source.x + 1 && destination.y === source.y) {
    return "right";
  } else {
    // defaults to "left" if invalid inputs are not adjacent
    return "left";
  }
};

const distance = (source, dest) => {
  return Math.abs(source.x - dest.x) + Math.abs(source.y - dest.y);
};

const distanceToClosestCorner = (source, board) => {
  width = board.width - 1;
  height = board.height - 1;
  shortestDistance = 100000;
  currDistance = 0;
  closestCorner = { x: 0, y: 0 };

  // check topRight
  currDistance = Math.pow(source.x - width, 2) + Math.pow(source.y - height, 2);
  if (currDistance < shortestDistance) {
    closestCorner = { x: width, y: height };
    shortestDistance = currDistance;
  }

  // check topLeft
  currDistance = Math.pow(source.x, 2) + Math.pow(source.y - height, 2);
  if (currDistance < shortestDistance) {
    closestCorner = { x: 0, y: height };
    shortestDistance = currDistance;
  }

  // check bottomLeft
  currDistance = Math.pow(source.x, 2) + Math.pow(source.y, 2);
  if (currDistance < shortestDistance) {
    closestCorner = { x: 0, y: 0 };
    shortestDistance = currDistance;
  }

  // check bottomRight
  currDistance = Math.pow(source.x - width, 2) + Math.pow(source.y, 2);
  if (currDistance < shortestDistance) {
    closestCorner = { x: width, y: 0 };
    shortestDistance = currDistance;
  }

  return shortestDistance;
};

// Returns the adjacent coordinates object {x: ##, y:##} that is in a certain direction from the source
const getAdjacentCoordinate = (source, directionString) => {
  try {
    if (directionString === "up") {
      return up(source);
    } else if (directionString === "left") {
      return left(source);
    } else if (directionString === "right") {
      return right(source);
    } else if (directionString === "down") {
      return down(source);
    } else {
      // String was invalid
      throw Error("invalid direction string");
    }
  } catch (e) {
    console.error(e);
    return source;
  }
};

// Given a coordinate, the board height, and board width, checks if out of bounds
const coordinateOutOfBounds = ({ x, y }, height, width) => {
  if (x < 0 || y < 0 || x >= width || y >= height) {
    return true;
  } else {
    return false;
  }
};

// Returns true if coordinates are equal, false otherwise
const coordinatesAreEqual = (coordinate1, coordinate2) => {
  return coordinate1.x == coordinate2.x && coordinate1.y == coordinate2.y;
};

const isCoordinateInArrayOfCoordinates = (coordinate, coordinateArray) => {
  for (const coordinateToCheck of coordinateArray) {
    if (coordinatesAreEqual(coordinate, coordinateToCheck)) {
      return true;
    }
  }
  return false;
};

const findClosestApple = (allFood, { x, y }) => {
  shortestDistance = 100000;
  closestApple = { x, y };
  currDistance = 0;

  if (allFood.length === 0) {
    return undefined;
  }

  for (i = 0; i < allFood.length; i++) {
    currDistance =
      Math.pow(x - allFood[i].x, 2) + Math.pow(y - allFood[i].y, 2);
    if (currDistance < shortestDistance) {
      closestApple = allFood[i];
      shortestDistance = currDistance;
    }
  }
  return closestApple;
};

const prettyPrintGrid = (grid) => {
  var transposedGrid = [...Array(11)].map((e) => Array(11).fill(8));
  var i;
  for (i = 10; i >= 0; i--) {
    var j;
    for (j = 0; j < 11; j++) {
      transposedGrid[10 - i][j] = grid[j][i];
    }
  }

  console.log();
  transposedGrid.forEach((row) => {
    console.log(row.join(" "));
  });
};

// Rotates our virtual grid by 90 degrees to match the actual game orientation
// Outputs a string of that grid in 1's and 0's
const gridToString = (grid) => {
  var transposedGrid = [...Array(11)].map((e) => Array(11).fill(8));
  var i;
  for (i = 10; i >= 0; i--) {
    var j;
    for (j = 0; j < 11; j++) {
      transposedGrid[10 - i][j] = grid[j][i];
    }
  }

  var stringGrid = [...Array(11)];
  var k;
  for (k = 0; k < 11; k++) {
    stringGrid[k] = transposedGrid[k].join("");
  }

  const finalString = "\n" + stringGrid.join("\n");

  return finalString;
};

const isAnySnakeHeadAtCoordinate = (snakes, coordinate) => {
  for (const snake of snakes) {
    if (coordinatesAreEqual(snake.head, coordinate)) {
      return true;
    }
  }
  return false;
};

module.exports = {
  up,
  down,
  left,
  right,
  adjacentTiles,
  directions,
  boardToGrid,
  findAdjacentDirection,
  getAdjacentCoordinate,
  coordinateOutOfBounds,
  coordinatesAreEqual,
  findClosestApple,
  distanceToClosestCorner,
  prettyPrintGrid,
  gridToString,
  distance,
  safeAdjacentTiles,
  isAnySnakeHeadAtCoordinate,
  isCoordinateInArrayOfCoordinates,
};
