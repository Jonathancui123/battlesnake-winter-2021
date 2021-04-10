// Takes in a position on the board that your snake could move in, calculates the number
// of open spaces that moving into that position leads to
// 1. Visit node
// 2. Mark as visited
// 3. Add to counter
// 4. Recurse through adjacent nodes

// Below lists detail all four possible movements
row = [1, -1, 0, 0];
col = [0, 0, 1, -1];

// TODO: implement hashmap
const floodfill = (board, x, y, maxFloodfillCount) => {
  grid = board;
  count = 0;
  visited = {};
  let q = [];
  q.push([x, y]);
  while(q.length != 0) {
    poppedNode = q.shift();
    newX = poppedNode[0]
    newY = poppedNode[1]
    if(grid[newX][newY] == 1 && !visited[JSON.stringify(newX) + "," + JSON.stringify(newY)]) {
      count++;
      if (count >= maxFloodfillCount){
        return count;
      }
      visited[JSON.stringify(newX) + "," + JSON.stringify(newY)] = true
      for(i = 0; i < 4; i++) {
        if (isSafe(grid, newX + row[i], newY + col[i])){
          q.push([newX + row[i], newY + col[i]]);
        }
      }
    }
  }
  return count;
}

const isSafe = (board, x, y) => {
  return 0 <= x && x < board.length && 0 <= y && y < board.length && board[x][y] == 1;
}

testgrid = [
  [0, 1, 1, 1, 0],
  [1, 0, 0, 1, 1],
  [1, 1, 1, 0, 1],
  [1, 1, 1, 0, 1],
  [0, 0, 0, 1, 1]
]


console.log(floodfill(testgrid, 2, 2));

module.exports = {
  floodfill
};
