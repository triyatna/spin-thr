const express = require('express')
const router = express.Router()
const db = require('../db')
const { cache, clearCache } = require('../cache')
const { adminOnly } = require('../middleware')

const PUBLIC_SETTINGS = ['site_enabled', 'max_players', 'spin_count', 'min_prize', 'max_prize', 'admin_wa']
const ADMIN_SETTINGS = [...PUBLIC_SETTINGS, 'admin_password']

function pickSettings(keys) {
  const rows = db.prepare('SELECT key, value FROM settings').all()
  const allowedKeys = new Set(keys)
  const result = {}
  for (const row of rows) {
    if (allowedKeys.has(row.key)) result[row.key] = row.value
  }
  return result
}

router.get('/', (req, res) => {
  const cacheKey = 'app_settings_public'
  const cached = cache.get(cacheKey)
  if (cached) return res.json(cached)

  const result = pickSettings(PUBLIC_SETTINGS)
  cache.set(cacheKey, result)
  res.json(result)
})

router.put('/', adminOnly, (req, res) => {
  const update = db.prepare('UPDATE settings SET value = ? WHERE key = ?')
  const updateMany = db.transaction((data) => {
    for (const [k, v] of Object.entries(data)) {
      if (ADMIN_SETTINGS.includes(k)) update.run(String(v), k)
    }
  })
  updateMany(req.body)

  const result = pickSettings(PUBLIC_SETTINGS)
  clearCache() // Invalidate cache on settings change
  res.json(result)
})

module.exports = router
