require('dotenv').config({ path: require('path').join(__dirname, '../.env') })
const express = require('express')
const cors = require('cors')
const rateLimit = require('express-rate-limit')
const authRoutes = require('./routes/auth')
const settingsRoutes = require('./routes/settings')
const playersRoutes = require('./routes/players')
const spinRoutes = require('./routes/spin')
const dashboardRoutes = require('./routes/dashboard')
const { adminOnly } = require('./middleware')
const path = require('path')

const app = express()
const PORT = process.env.PORT || 3001

app.set('trust proxy', 1)

app.use(cors())
app.use(express.json())

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: { error: 'Terlalu banyak permintaan ke server.' },
  standardHeaders: true,
  legacyHeaders: false,
})
app.use(globalLimiter)

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 8,
  message: { error: 'Terlalu banyak percobaan login gagal. Silakan coba 15 menit lagi.' },
})
app.use('/api/auth/login', loginLimiter)

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { error: 'Terlalu banyak pendaftaran dari IP Anda. Coba lagi nanti.' },
})
app.use('/api/players/register', registerLimiter)

const spinLimiter = rateLimit({
  windowMs: 10 * 1000,
  max: 6,
  message: { error: 'Tindak mencurigakan: Terlalu banyak klik spin! Mohon pelan-pelan.' },
})
app.use('/api/spin', spinLimiter)

app.use('/api/auth', authRoutes)

app.use('/api/settings', adminOnly, settingsRoutes)
app.use('/api/players', playersRoutes)
app.use('/api/spin', spinRoutes)
app.use('/api/dashboard', adminOnly, dashboardRoutes)

// ==========================================
// SMART PRODUCTION DEPLOYMENT CONFIGURATION
// ==========================================
// Jika dijalankan di server production (VPS/Panel/Hosting)
// Server akan otomatis menyajikan file build dari Vue Front-End (client/dist)
// Dalam satu domain dan port yang sama tanpa bentrok CORS!
const clientDistPath = path.join(__dirname, '../client/dist')
app.use(express.static(clientDistPath))

// Fallback untuk Vue Router (SPA History Mode)
app.get('*', (req, res) => {
  res.sendFile(path.join(clientDistPath, 'index.html'))
})

app.listen(PORT, () => {
  console.log(`THR Slot API Server running on port ${PORT}`)
  console.log(`Front-End tersinkronisasi otomatis (jika ada di client/dist)`)
})
