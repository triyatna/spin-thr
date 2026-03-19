<template>
  <div class="page" style="padding-top:40px">
    <div class="card" style="margin-top:20px">
      <div class="logo-header">
        <span class="emoji">⚙️</span>
        <h1>Pengaturan Game</h1>
        <p>Atur parameter game (Admin Only)</p>
      </div>

      <div v-if="saved" class="alert alert-success">✅ Pengaturan tersimpan!</div>
      <div v-if="error" class="alert alert-error">{{ error }}</div>

      <div class="field">
        <label>Maksimum Pemain</label>
        <input v-model.number="form.max_players" type="number" min="1" max="1000" />
      </div>
      <div class="field">
        <label>Jumlah Spin Per Pemain</label>
        <input v-model.number="form.spin_count" type="number" min="1" max="20" />
      </div>
      <div class="field">
        <label>Hadiah Minimum (Rp)</label>
        <input v-model.number="form.min_prize" type="number" min="0" step="1000" />
      </div>
      <div class="field">
        <label>Hadiah Maksimum (Rp)</label>
        <input v-model.number="form.max_prize" type="number" min="1000" step="1000" />
      </div>
      <div class="field">
        <label>Nomor WhatsApp Admin (62...)</label>
        <input v-model="form.admin_wa" type="tel" placeholder="628xxxxxxxxxx" />
      </div>
      <div class="field">
        <label>Password Admin (Ubah jika perlu)</label>
        <input v-model="form.admin_password" type="text" placeholder="Password baru..." />
      </div>

      <div style="display:flex;gap:12px;margin-top:24px;">
        <button class="btn btn-primary" :disabled="saving" @click="save">
          {{ saving ? 'Menyimpan...' : '💾 Simpan Pengaturan' }}
        </button>
      </div>

      <div style="margin-top:16px;">
        <button class="btn btn-sm" style="background:transparent;color:var(--text-muted);border:1px solid rgba(255,255,255,.2);width:100%"
          @click="$router.push('/admin/dashboard')">← Kembali ke Dashboard</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '@/store/game'

const router = useRouter()
const store = useGameStore()

const form = ref({ max_players: 3, spin_count: 6, min_prize: 5000, max_prize: 20000, admin_wa: '', admin_password: '' })
const saving = ref(false)
const saved = ref(false)
const error = ref('')

onMounted(async () => {
  try {
    const data = await store.loadDashboard()
    if (data && data.settings) {
      Object.assign(form.value, data.settings)
      form.value.max_players = parseInt(data.settings.max_players) || 3
      form.value.spin_count = parseInt(data.settings.spin_count) || 6
      form.value.min_prize = parseInt(data.settings.min_prize) || 5000
      form.value.max_prize = parseInt(data.settings.max_prize) || 20000
    }
  } catch(e) {
    if (e.response?.status === 401) router.push('/admin')
  }
})

async function save() {
  saving.value = true
  error.value = ''
  saved.value = false
  try {
    await store.saveSettings(form.value)
    saved.value = true
    setTimeout(() => { saved.value = false }, 2500)
  } catch (e) {
    if (e.response?.status === 401) router.push('/admin')
    else error.value = 'Gagal menyimpan pengaturan.'
  } finally {
    saving.value = false
  }
}
</script>
