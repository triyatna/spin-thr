const express = require('express')
const router = express.Router()
const db = require('../db')
const { cache } = require('../cache')

router.get('/', (req, res) => {
  const cacheKey = 'dashboard_data'
  const cached = cache.get(cacheKey)
  if (cached) return res.json(cached)

  const players = db.prepare('SELECT * FROM players ORDER BY registered_at ASC').all()

  const totalPlayers = players.length
  const finishedPlayers = players.filter(p => p.finished).length
  const totalPrize = players.reduce((s, p) => s + (p.total_prize || 0), 0)

  const spins = db.prepare('SELECT * FROM spin_results ORDER BY created_at DESC').all()
  const totalSpins = spins.length
  const zonkCount = spins.filter(s => s.is_zonk).length
  const rareCount = spins.filter(s => s.is_rare).length
  const freeCount = spins.filter(s => s.is_free_spin).length

  const settings = db.prepare('SELECT key, value FROM settings').all()
  const cfg = {}
  for (const s of settings) cfg[s.key] = s.value

  const data = {
    stats: { totalPlayers, finishedPlayers, totalPrize, totalSpins, zonkCount, rareCount, freeCount },
    players: players.map(p => ({
      ...p,
      spins: spins.filter(s => s.player_id === p.id)
    })),
    settings: cfg
  }
  
  cache.set(cacheKey, data)
  res.json(data)
})

module.exports = router
