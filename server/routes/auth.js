const express = require('express')
const router = express.Router()
const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const db = require('../db')

const JWT_SECRET = process.env.JWT_SECRET || 'thr-spin-secret-2026'

router.post('/login', (req, res) => {
  const { password } = req.body
  const stored = db.prepare("SELECT value FROM settings WHERE key = 'admin_password'").get()
  const adminPass = stored?.value || 'admin123'

  const a = Buffer.from(password || '')
  const b = Buffer.from(adminPass)
  let valid = false
  if (a.length === b.length) {
    valid = crypto.timingSafeEqual(a, b)
  } else {
    crypto.timingSafeEqual(b, b)
  }

  if (!valid) {
    return res.status(401).json({ error: 'Password salah!' })
  }

  const token = jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '8h' })
  res.json({ token })
})

router.post('/verify', (req, res) => {
  const auth = req.headers.authorization || ''
  const token = auth.replace('Bearer ', '')
  try {
    jwt.verify(token, JWT_SECRET)
    res.json({ valid: true })
  } catch {
    res.status(401).json({ valid: false })
  }
})

module.exports = router
module.exports.JWT_SECRET = JWT_SECRET
