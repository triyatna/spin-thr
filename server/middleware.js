const jwt = require('jsonwebtoken')
const { JWT_SECRET } = require('./routes/auth')

function adminOnly(req, res, next) {
  const auth = req.headers.authorization || ''
  const token = auth.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Login admin diperlukan.' })
  try {
    jwt.verify(token, JWT_SECRET)
    next()
  } catch {
    res.status(401).json({ error: 'Token tidak valid atau sudah kadaluarsa.' })
  }
}

module.exports = { adminOnly }
