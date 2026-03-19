const express = require('express')
const router = express.Router()
const db = require('../db')
const { playForcedSpin } = require('../rng')
const { clearCache } = require('../cache')

router.post('/:token', (req, res) => {
  const player = db.prepare('SELECT * FROM players WHERE token = ?').get(req.params.token)
  if (!player) return res.status(404).json({ error: 'Sesi tidak ditemukan' })

  const settings = db.prepare('SELECT key, value FROM settings').all()
  const cfg = {}
  for (const s of settings) cfg[s.key] = s.value

  let extraSpins = parseInt(cfg[`extra_spins_${player.id}`]) || 0
  const baseSpinCount = parseInt(cfg.spin_count) || 6
  let spinCount = baseSpinCount + extraSpins
  const minPrize = parseInt(cfg.min_prize) || 5000
  const maxPrize = parseInt(cfg.max_prize) || 20000

  if (player.finished) {
    return res.status(403).json({ error: 'Semua spin sudah habis!' })
  }

  // Assign a target prize if they haven't started playing yet
  let currentTargetPrize = player.target_prize || 0
  if (currentTargetPrize === 0) {
    // Random target between minPrize and maxPrize, rounded to 500
    currentTargetPrize = Math.floor(Math.random() * (maxPrize - minPrize + 1)) + minPrize
    currentTargetPrize = Math.round(currentTargetPrize / 500) * 500
    db.prepare('UPDATE players SET target_prize = ? WHERE id = ?').run(currentTargetPrize, player.id)
  }

  const spinNumber = player.spins_done + 1
  const spinsRemaining = spinCount - spinNumber + 1 // including this one
  
  // Calculate how much budget is left
  let budgetLeft = currentTargetPrize - player.total_prize
  if (budgetLeft < 0) budgetLeft = 0

  // Determine a requested prize for this spin.
  let requestedPrize = 0
  if (spinsRemaining <= 1) {
    // Last spin gets all remaining budget
    requestedPrize = budgetLeft
  } else if (budgetLeft > 0) {
    // Distribute budget with some randomness. 
    // Usually give 0-40% of the remaining budget to keep it exciting.
    const maxAlloc = budgetLeft * 0.4
    // Make sure we have enough budget left for other spins, but randomly we can give big chunks
    if (Math.random() < 0.2) {
      requestedPrize = 0 // sometimes just give zonk early to build tension
    } else {
      requestedPrize = Math.floor(Math.random() * maxAlloc)
      // Round to nearest 500 to look like a realistic cluster prize
      requestedPrize = Math.round(requestedPrize / 500) * 500
    }
  }

  const { cascades, totalPrize: rawPrize } = playForcedSpin(requestedPrize)

  let prize = rawPrize
  let newTotal = player.total_prize + prize
  if (newTotal > maxPrize) {
    prize = Math.max(0, maxPrize - player.total_prize)
    newTotal = maxPrize
  }

  let isFreeSpin = 0
  let isRare = 0

  if (Math.random() < 0.15) {
    isFreeSpin = 1
    extraSpins += 1
    spinCount += 1
    db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(`extra_spins_${player.id}`, extraSpins)
  } else if (Math.random() < 0.10) {
    isRare = 1
  }

  const isZonk = cascades.length === 1 && cascades[0].clusters.length === 0 ? 1 : 0
  const allDone = spinNumber >= spinCount ? 1 : 0

  db.prepare(
    `INSERT INTO spin_results (player_id, spin_number, grid, clusters, prize, multiplier, is_zonk, is_free_spin, is_rare)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    player.id, spinNumber,
    JSON.stringify(cascades), JSON.stringify({}),
    prize, 0, isZonk, isFreeSpin, isRare
  )

  db.prepare(
    'UPDATE players SET total_prize = ?, spins_done = ?, finished = ? WHERE id = ?'
  ).run(newTotal, spinNumber, allDone, player.id)

  const updatedPlayer = db.prepare('SELECT * FROM players WHERE id = ?').get(player.id)
  
  clearCache() // Invalidate cache since user state changed

  res.json({
    spinNumber,
    cascades,
    prize,
    isZonk: !!isZonk,
    isFreeSpin: !!isFreeSpin,
    isRare: !!isRare,
    totalPrize: newTotal,
    spinsRemaining: allDone ? 0 : spinCount - spinNumber,
    finished: !!allDone,
    player: updatedPlayer
  })
})

module.exports = router
