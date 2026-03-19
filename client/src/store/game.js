import { defineStore } from 'pinia'
import axios from 'axios'

export const useGameStore = defineStore('game', {
  state: () => ({
    settings: {},
    player: null,
    spinHistory: [],
    isSpinning: false,
    lastSpinResult: null,
    error: null,
    token: localStorage.getItem('admin_token') || ''
  }),

  getters: {
    spinsRemaining: (state) => state.lastSpinResult?.spinsRemaining ?? null,
    totalPrize: (state) => state.player?.total_prize ?? 0,
    isFinished: (state) => state.player?.finished === 1,
    isAdmin: (state) => !!state.token,
    isSiteEnabled: (state) => String(state.settings.site_enabled ?? '1') !== '0',
    authHeaders: (state) => ({ Authorization: `Bearer ${state.token}` })
  },

  actions: {
    async login(password) {
      const { data } = await axios.post('/api/auth/login', { password })
      this.token = data.token
      localStorage.setItem('admin_token', data.token)
    },

    logout() {
      this.token = ''
      localStorage.removeItem('admin_token')
    },

    async checkAuth() {
      if (!this.token) return false
      try {
        await axios.post('/api/auth/verify', {}, { headers: this.authHeaders })
        return true
      } catch {
        this.logout()
        return false
      }
    },

    async loadSettings() {
      const { data } = await axios.get('/api/settings')
      this.settings = data
    },

    async saveSettings(payload) {
      const { data } = await axios.put('/api/settings', payload, { headers: this.authHeaders })
      this.settings = data
    },

    async loadDashboard() {
      const { data } = await axios.get('/api/dashboard', { headers: this.authHeaders })
      return data
    },

    async registerPlayer(payload) {
      const config = this.token ? { headers: this.authHeaders } : undefined
      const { data } = await axios.post('/api/players/register', payload, config)
      this.player = data.player
      return data
    },

    async loadPlayerByToken(token) {
      const config = this.token ? { headers: this.authHeaders } : undefined
      const { data } = await axios.get(`/api/players/by-token/${token}`, config)
      this.player = data.player
      this.spinHistory = data.spins
      return data
    },

    async doSpin(token) {
      this.isSpinning = true
      this.error = null
      try {
        const config = this.token ? { headers: this.authHeaders } : undefined
        const { data } = await axios.post(`/api/spin/${token}`, {}, config)
        this.lastSpinResult = data
        this.player = data.player
        this.spinHistory.push(data)
        return data
      } catch (e) {
        this.error = e.response?.data?.error || 'Terjadi kesalahan'
        throw e
      } finally {
        this.isSpinning = false
      }
    },

    async resetAll() {
      await axios.post('/api/players/reset', {}, { headers: this.authHeaders })
      this.player = null
      this.spinHistory = []
      this.lastSpinResult = null
    }
  }
})
