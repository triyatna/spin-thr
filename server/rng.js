const SYMBOLS = ['🧧', '☪️', '🌙', '💫', '💠', '🙏']

// Weight for standard RNG (index corresponds to SYMBOLS)
const SYMBOL_WEIGHTS = [ 10, 15, 20, 25, 30, 40 ]

const PRIZE_TABLE = {
  '🧧': { 4: 2500, 5: 5000, 6: 7500, 7: 10000, 8: 15000, 10: 25000 },
  '☪️': { 4: 1500, 5: 3000, 6: 5000, 7:  7500, 8: 10000, 10: 15000 },
  '🌙': { 4: 1000, 5: 2000, 6: 3000, 7:  5000, 8:  7500, 10: 10000 },
  '💫': { 4:  800, 5: 1500, 6: 2500, 7:  4000, 8:  5000, 10:  7500 },
  '💠': { 4:  500, 5: 1000, 6: 1500, 7:  2000, 8:  3000, 10:  5000 },
  '🙏': { 4:  250, 5:  500, 6: 1000, 7:  1250, 8:  1500, 10:  2500 },
}

function weightedRandom(weights) {
  const total = weights.reduce((a, b) => a + b, 0)
  let r = Math.random() * total
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i]
    if (r <= 0) return i
  }
  return weights.length - 1
}

function generateGrid() {
  const ROWS = 5
  const COLS = 6
  const grid = []

  for (let r = 0; r < ROWS; r++) {
    const row = []
    for (let c = 0; c < COLS; c++) {
      row.push(SYMBOLS[weightedRandom(SYMBOL_WEIGHTS)])
    }
    grid.push(row)
  }
  return grid
}

function detectClusters(grid) {
  const ROWS = grid.length
  const COLS = grid[0].length
  const visited = Array.from({ length: ROWS }, () => Array(COLS).fill(false))
  const clusters = []

  function bfs(sr, sc, symbol) {
    const cells = []
    const queue = [[sr, sc]]
    visited[sr][sc] = true
    while (queue.length) {
      const [r, c] = queue.shift()
      cells.push([r, c])
      const neighbors = [[r-1,c],[r+1,c],[r,c-1],[r,c+1]]
      for (const [nr, nc] of neighbors) {
        if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && !visited[nr][nc] && grid[nr][nc] === symbol) {
          visited[nr][nc] = true
          queue.push([nr, nc])
        }
      }
    }
    return cells
  }

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (!visited[r][c]) {
        const symbol = grid[r][c]
        const cells = bfs(r, c, symbol)
        if (cells.length >= 4) { // Minimum cluster is 4
          clusters.push({ symbol, cells, size: cells.length })
        }
      }
    }
  }

  return clusters
}

function calcPrize(clusters, multiplier) {
  let total = 0
  for (const cluster of clusters) {
    const info = PRIZE_TABLE[cluster.symbol]
    if (!info) continue
    let amt = 0
    if (cluster.size >= 10) amt = info[10]
    else if (cluster.size >= 8) amt = info[8]
    else if (cluster.size >= 7) amt = info[7]
    else if (cluster.size >= 6) amt = info[6]
    else if (cluster.size >= 5) amt = info[5]
    else if (cluster.size >= 4) amt = info[4]
    
    total += amt
  }
  return total * multiplier
}

function dropSymbols(grid, clusters) {
  const ROWS = grid.length
  const COLS = grid[0].length
  
  // Clone grid to avoid mutating history
  const newGrid = grid.map(row => [...row])
  
  // Set clustered cells to null
  for (const cl of clusters) {
    for (const [r, c] of cl.cells) {
      newGrid[r][c] = null
    }
  }
  
  // Make symbols fall down
  for (let c = 0; c < COLS; c++) {
    const colSymbols = []
    // gather from bottom to top
    for (let r = ROWS - 1; r >= 0; r--) {
      if (newGrid[r][c] !== null) colSymbols.push(newGrid[r][c])
    }
    // fill back from bottom to top
    for (let r = ROWS - 1; r >= 0; r--) {
      if (colSymbols.length > 0) {
        newGrid[r][c] = colSymbols.shift()
      } else {
        newGrid[r][c] = SYMBOLS[weightedRandom(SYMBOL_WEIGHTS)]
      }
    }
  }
  
  return newGrid
}

function playForcedSpin(targetPrize) {
  // If we need a Zonk (0 prize), forcefully generate a grid with no clusters
  if (targetPrize <= 0) {
    while (true) {
      const grid = generateGrid()
      const clusters = detectClusters(grid)
      if (clusters.length === 0) {
        return {
          cascades: [{ grid, clusters: [], prize: 0, multiplier: 1 }],
          totalPrize: 0
        }
      }
    }
  }

  // If we need a specific prize > 0, we brute-force simulate spins
  // until we land on a spin whose total prize exactly matches targetPrize,
  // OR is at least close enough (fallback after 2000 tries).
  let closestResult = null
  let minDiff = Infinity

  for (let i = 0; i < 3000; i++) {
    const { cascades, totalPrize: simPrize } = _simulateNaturalSpin()
    
    if (simPrize === targetPrize) {
      return { cascades, totalPrize: simPrize }
    }
    
    const diff = Math.abs(simPrize - targetPrize)
    if (diff < minDiff && simPrize > 0) {
      minDiff = diff
      closestResult = { cascades, totalPrize: simPrize }
    }
  }

  // Fallback: if we couldn't find an exact match in 3000 simulations,
  // return the closest one we found (or if closestResult is null, a zonk).
  if (closestResult) return closestResult
  
  // Failsafe zonk
  return playForcedSpin(0)
}

function _simulateNaturalSpin() {
  const cascades = []
  let currentGrid = generateGrid()
  let currentMultiplier = 1
  let totalSpinPrize = 0
  
  while (true) {
    const clusters = detectClusters(currentGrid)
    
    if (clusters.length === 0) {
      if (cascades.length === 0) {
        cascades.push({ grid: currentGrid, clusters: [], prize: 0, multiplier: 1 })
      }
      break
    }
    
    const prize = calcPrize(clusters, currentMultiplier)
    totalSpinPrize += prize
    
    cascades.push({
      grid: currentGrid,
      clusters: clusters,
      prize: prize,
      multiplier: currentMultiplier
    })
    
    currentMultiplier++
    currentGrid = dropSymbols(currentGrid, clusters)
  }
  
  return { cascades, totalPrize: totalSpinPrize }
}

module.exports = { generateGrid, detectClusters, calcPrize, dropSymbols, playForcedSpin, SYMBOLS }
