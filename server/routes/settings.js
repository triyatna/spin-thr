const express = require('express')
const router = express.Router()
const db = require('../db')
const { cache, clearCache } = require('../cache')

router.get('/', (req, res) => {
  const cacheKey = 'app_settings'
  const cached = cache.get(cacheKey)
  if (cached) return res.json(cached)

  const rows = db.prepare('SELECT key, value FROM settings').all()
  const result = {}
  for (const row of rows) result[row.key] = row.value
  
  cache.set(cacheKey, result)
  res.json(result)
})

router.put('/', (req, res) => {
  const allowed = ['max_players', 'spin_count', 'min_prize', 'max_prize', 'admin_wa', 'admin_password']
  const update = db.prepare('UPDATE settings SET value = ? WHERE key = ?')
  const updateMany = db.transaction((data) => {
    for (const [k, v] of Object.entries(data)) {
      if (allowed.includes(k)) update.run(String(v), k)
    }
  })
  updateMany(req.body)
  const rows = db.prepare('SELECT key, value FROM settings').all()
  const result = {}
  for (const row of rows) result[row.key] = row.value
  
  clearCache() // Invalidate cache on settings change
  res.json(result)
})

module.exports = router
