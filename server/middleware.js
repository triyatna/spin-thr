const jwt = require('jsonwebtoken')
const { JWT_SECRET } = require('./routes/auth')
const db = require('./db')

function parseToken(req) {
  const auth = req.headers.authorization || ''
  return auth.replace('Bearer ', '')
}

function hasValidAdminToken(req) {
  const token = parseToken(req)
  if (!token) return false
  try {
    jwt.verify(token, JWT_SECRET)
    return true
  } catch {
    return false
  }
}

function isSiteEnabled() {
  const row = db.prepare("SELECT value FROM settings WHERE key = 'site_enabled'").get()
  return (row?.value || '1') !== '0'
}

function adminOnly(req, res, next) {
  const token = parseToken(req)
  if (!token) return res.status(401).json({ error: 'Login admin diperlukan.' })
  try {
    jwt.verify(token, JWT_SECRET)
    next()
  } catch {
    res.status(401).json({ error: 'Token tidak valid atau sudah kadaluarsa.' })
  }
}

function siteEnabledOrAdmin(req, res, next) {
  if (hasValidAdminToken(req)) return next()
  if (isSiteEnabled()) return next()
  return res.status(403).json({ error: 'Halaman sedang dinonaktifkan oleh admin.' })
}

module.exports = { adminOnly, hasValidAdminToken, siteEnabledOrAdmin }
