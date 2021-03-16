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
// confirmed!
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

// console.log(adjacentTiles({ x: 0, y: 0 }, 11, 11));
// console.log(adjacentTiles({ x: 10, y: 10 }, 11, 11));
// console.log(adjacentTiles({ x: 0, y: 10 }, 11, 11));
// console.log(adjacentTiles({ x: 10, y: 0 }, 11, 11));
// console.log(adjacentTiles({ x: 0, y: 5 }, 11, 11));
// console.log(adjacentTiles({ x: 10, y: 5 }, 11, 11));
// console.log(adjacentTiles({ x: 5, y: 0 }, 11, 11));
// console.log(adjacentTiles({ x: 5, y: 10 }, 11, 11));
// console.log(adjacentTiles({ x: 5, y: 5 }, 11, 11));

const directions = ["up", "down", "left", "right"];

module.exports = { up, down, left, right, adjacentTiles, directions };
