<template>
  <div class="page" id="result-page" style="padding-top:40px">
    <div class="result-card" id="result-capture">
      <div v-if="isPreview" class="alert alert-info" style="margin-bottom:16px;text-align:center;animation:pop-in .3s ease">
        👁️ <b>Mode Preview Admin</b><br>
        <span style="font-size:0.8rem">Anda sedang melihat hasil sebagai Admin.</span>
      </div>
      <div style="font-size:3rem;margin-bottom:8px">🧧</div>
      <h2 style="font-size:1.4rem;font-weight:800;color:var(--accent-gold)">Hasil THR Spin Hari Raya</h2>
      <div style="color:var(--text-muted);font-size:.85rem;margin-bottom:4px">{{ player?.name }}</div>
      <div style="color:var(--text-muted);font-size:.8rem;margin-bottom:12px">
        {{ ewalletIcon }} {{ player?.ewallet_number }}
      </div>

      <div style="color:var(--text-muted);font-size:.9rem">
        {{ isPreview ? 'Total Hadiah Pemain:' : 'Total Hadiah Kamu:' }}
      </div>
      <span class="result-prize">Rp {{ totalPrize.toLocaleString('id') }}</span>

      <div v-if="!isPreview" style="color:var(--text-muted);font-size:.8rem;margin-bottom:16px">
        Silakan klik tombol di bawah untuk klaim hadiahmu!
      </div>
      <div v-else style="height:16px"></div>

      <div v-if="spinHistory.length" style="margin-bottom:16px">
        <div style="font-size:.82rem;color:var(--text-muted);margin-bottom:8px">Rincian Spin:</div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(80px,1fr));gap:6px">
          <div
            v-for="s in spinHistory"
            :key="s.id"
            style="background:var(--bg-cell);border-radius:8px;padding:6px 8px;text-align:center;font-size:.78rem"
            :style="s.is_zonk ? 'border:1px solid rgba(255,68,68,.3)' : 'border:1px solid rgba(255,215,0,.15)'"
          >
            <div style="color:var(--text-muted)">#{{ s.spin_number }}</div>
            <div :style="s.is_zonk ? 'color:#ff6b6b;font-weight:800' : 'color:var(--accent-gold);font-weight:800'">
              Rp {{ s.prize.toLocaleString('id') }}
            </div>
            <div v-if="s.is_free_spin" style="color:var(--accent-green);font-size:.7rem">🎁</div>
            <div v-else-if="s.is_rare" style="color:var(--accent-gold);font-size:.7rem">⭐</div>
            <div v-else-if="s.is_zonk" style="color:#ff6b6b;font-size:.7rem">💀</div>
          </div>
        </div>
      </div>

      <div style="font-size:.75rem;color:var(--text-muted);margin-top:4px">
        {{ new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', dateStyle: 'long', timeStyle: 'short' }) }} WIB
      </div>
    </div>

    <div class="result-actions" style="max-width:480px;width:100%;justify-content:center">
      <button v-if="!isPreview" class="btn btn-wa" @click="sendWa" style="padding:16px 24px;font-size:1.1rem;width:100%">
        💬 Kirim Hasil ke WA Admin
      </button>
      <button v-else class="btn btn-sm" style="background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);color:#fff" @click="closeTab">
        Tutup Preview
      </button>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useGameStore } from '@/store/game'

const route = useRoute()
const router = useRouter()
const store = useGameStore()

const isPreview = computed(() => route.query.preview === 'true' && store.isAdmin)

const player = computed(() => store.player)
const totalPrize = computed(() => store.totalPrize)

const spinHistory = ref([])

const ewalletIcon = computed(() => {
  const icons = { dana: '💙', gopay: '🟢', shopeepay: '🟠' }
  return icons[player.value?.ewallet_type] || '💳'
})

onMounted(async () => {
  try {
    const data = await store.loadPlayerByToken(route.params.token)
    spinHistory.value = data.spins
    await store.loadSettings()
  } catch(e) {
    if (e.response?.status === 404) router.push('/daftar')
  }
})

function sendWa() {
  const adminWa = store.settings.admin_wa || ''
  if (!adminWa) {
    alert('Nomor WhatsApp admin belum diisi di pengaturan.')
    return
  }
  const name = player.value?.name || '-'
  const ewallet = `${player.value?.ewallet_type?.toUpperCase()} ${player.value?.ewallet_number}`
  const prize = `Rp ${totalPrize.value.toLocaleString('id')}`
  const msg = `🎊 *HASIL THR SPIN HARI RAYA* 🎊\n\n👤 Nama: ${name}\n💳 E-Wallet: ${ewallet}\n🏆 Total Hadiah: ${prize}\n\n_Mohon dicairkan hadiah THR saya. Terima kasih!_ 🙏`
  const url = `https://wa.me/${adminWa}?text=${encodeURIComponent(msg)}`
  window.open(url, '_blank')
}

function closeTab() {
  window.close()
}
</script>
