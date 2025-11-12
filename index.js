/**
 * @param {number[][]} grid
 * @param {number} x
 * @param {number} y
 * @param {number} k
 * @return {number[][]}
 */
var reverseSubmatrix = function (grid, x, y, k) {
  let right = k
  while (x < right) {
    for (let i = y; i < y + k; i++) {
      const temp = grid[x][i]
      grid[x][i] = grid[right][i]
      grid[k][i] = temp
    }
    x++
    right--
  }
  return grid
}

// reverseSubmatrix(
//   [
//     [1, 2, 3, 4],
//     [5, 6, 7, 8],
//     [9, 10, 11, 12],
//     [13, 14, 15, 16],
//   ],
//   1,
//   0,
//   3,
// )
reverseSubmatrix(
  [
    [3, 4, 2, 3],
    [2, 3, 4, 2],
  ],
  0,
  2,
  2,
)
