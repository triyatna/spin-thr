const express = require('express')
const cors = require('cors')
const authRoutes = require('./routes/auth')
const settingsRoutes = require('./routes/settings')
const playersRoutes = require('./routes/players')
const spinRoutes = require('./routes/spin')
const dashboardRoutes = require('./routes/dashboard')
const { adminOnly } = require('./middleware')

const app = express()
const PORT = 3001

app.use(cors())
app.use(express.json())

app.use('/api/auth', authRoutes)

app.use('/api/settings', adminOnly, settingsRoutes)
app.use('/api/players', playersRoutes)
app.use('/api/spin', spinRoutes)
app.use('/api/dashboard', adminOnly, dashboardRoutes)

app.listen(PORT, () => {
  console.log(`THR Slot Server running on http://localhost:${PORT}`)
})
