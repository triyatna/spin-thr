const express = require('express')
const router = express.Router()
const crypto = require('crypto')
const db = require('../db')
const { adminOnly, siteEnabledOrAdmin } = require('../middleware')
const { cache, clearCache } = require('../cache')

router.get('/', adminOnly, (req, res) => {
  const cacheKey = 'players_all'
  const cached = cache.get(cacheKey)
  if (cached) return res.json(cached)

  const players = db.prepare('SELECT * FROM players ORDER BY registered_at ASC').all()
  cache.set(cacheKey, players)
  res.json(players)
})

router.get('/by-token/:token', siteEnabledOrAdmin, (req, res) => {
  const token = req.params.token
  const cacheKey = `player_${token}`
  const cached = cache.get(cacheKey)
  if (cached) return res.json(cached)

  const player = db.prepare('SELECT * FROM players WHERE token = ?').get(token)
  if (!player) return res.status(404).json({ error: 'Sesi tidak ditemukan' })
  const spins = db.prepare('SELECT * FROM spin_results WHERE player_id = ? ORDER BY spin_number ASC').all(player.id)
  
  const data = { player, spins }
  cache.set(cacheKey, data)
  res.json(data)
})

router.get('/:id', adminOnly, (req, res) => {
  const id = req.params.id
  const cacheKey = `player_id_${id}`
  const cached = cache.get(cacheKey)
  if (cached) return res.json(cached)

  const player = db.prepare('SELECT * FROM players WHERE id = ?').get(id)
  if (!player) return res.status(404).json({ error: 'Pemain tidak ditemukan' })
  const spins = db.prepare('SELECT * FROM spin_results WHERE player_id = ? ORDER BY spin_number ASC').all(id)
  
  const data = { player, spins }
  cache.set(cacheKey, data)
  res.json(data)
})

router.post('/register', siteEnabledOrAdmin, (req, res) => {
  const { name, ewallet_type, ewallet_number } = req.body
  if (!name || !ewallet_type || !ewallet_number) {
    return res.status(400).json({ error: 'Semua field wajib diisi' })
  }

  const settings = db.prepare('SELECT key, value FROM settings').all()
  const cfg = {}
  for (const s of settings) cfg[s.key] = s.value

  const count = db.prepare('SELECT COUNT(*) as c FROM players').get().c
  if (count >= parseInt(cfg.max_players)) {
    return res.status(403).json({ error: 'Slot peserta sudah penuh! Coba lain kali.' })
  }

  const existing = db.prepare(
    'SELECT id FROM players WHERE ewallet_number = ? AND ewallet_type = ?'
  ).get(ewallet_number, ewallet_type)
  if (existing) {
    return res.status(409).json({ error: 'Nomor ini sudah terdaftar!' })
  }

  const token = crypto.randomBytes(16).toString('hex')

  const result = db.prepare(
    'INSERT INTO players (name, ewallet_type, ewallet_number, token) VALUES (?, ?, ?, ?)'
  ).run(name, ewallet_type, ewallet_number, token)

  const playerId = result.lastInsertRowid

  const player = db.prepare('SELECT * FROM players WHERE id = ?').get(playerId)
  
  clearCache() // Invalidate cache since new player exists
  res.status(201).json({ player })
})

router.post('/reset', adminOnly, (req, res) => {
  const transaction = db.transaction(() => {
    db.prepare('DELETE FROM spin_results').run()
    db.prepare('DELETE FROM players').run()
    db.prepare("DELETE FROM sqlite_sequence WHERE name IN ('players', 'spin_results')").run()
    db.prepare("DELETE FROM settings WHERE key LIKE 'extra_spins_%'").run()
  })
  
  try {
    transaction()
    clearCache() // Important: Clear all caches
    res.json({ message: 'Semua pemain & hasil spin telah direset.' })
  } catch (err) {
    res.status(500).json({ error: 'Gagal mereset data: ' + err.message })
  }
})

module.exports = router
