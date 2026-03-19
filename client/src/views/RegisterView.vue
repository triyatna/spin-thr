<template>
  <div class="page">
    <div class="card">
      <div class="logo-header">
        <span class="emoji">🎊</span>
        <h1>DAFTAR SEKARANG</h1>
        <p>Masukkan data kamu untuk menerima hadiah THR!</p>
      </div>

      <div v-if="error" class="alert alert-error">{{ error }}</div>
      <div
        v-if="full"
        class="alert alert-info"
        style="text-align: center; font-size: 1.1rem"
      >
        🚫 Slot Pemain Sudah Penuh!<br />
        <small>Semua kesempatan sudah diambil oleh peserta lain.</small>
      </div>

      <template v-if="!full">
        <div class="field">
          <label>Nama Lengkap</label>
          <input v-model="form.name" type="text" placeholder="Nama kamu..." />
        </div>
        <div class="field">
          <label>Pilih E-Wallet</label>
          <div class="ewallet-grid">
            <div
              class="ewallet-card"
              :class="{ active: form.ewallet_type === 'dana' }"
              @click="form.ewallet_type = 'dana'"
            >
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/7/72/Logo_dana_blue.svg"
                alt="Dana"
                class="ewallet-logo"
              />
            </div>
            <div
              class="ewallet-card"
              :class="{ active: form.ewallet_type === 'gopay' }"
              @click="form.ewallet_type = 'gopay'"
            >
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/8/86/Gopay_logo.svg"
                alt="GoPay"
                class="ewallet-logo"
              />
            </div>
            <div
              class="ewallet-card"
              :class="{ active: form.ewallet_type === 'shopeepay' }"
              @click="form.ewallet_type = 'shopeepay'"
            >
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/f/fe/Shopee.svg/960px-Shopee.svg.png"
                alt="ShopeePay"
                class="ewallet-logo"
              />
            </div>
          </div>
        </div>
        <div class="field">
          <label
            >Nomor {{ form.ewallet_type ? ewalletLabel : "E-Wallet" }}</label
          >
          <input
            v-model="form.ewallet_number"
            type="tel"
            placeholder="08xxxxxxxxxx"
          />
        </div>

        <div class="alert alert-info" style="font-size: 0.82rem">
          📋 Nomor ini digunakan untuk pengiriman hadiah THR. Pastikan nomor
          aktif dan benar!
        </div>

        <button class="btn btn-gold" :disabled="loading" @click="register">
          {{ loading ? "Mendaftar..." : "🎰 Daftar & Mulai Spin!" }}
        </button>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { useGameStore } from "@/store/game";

const router = useRouter();
const store = useGameStore();

const form = ref({ name: "", ewallet_type: "", ewallet_number: "" });
const loading = ref(false);
const error = ref("");
const full = ref(false);

const ewalletLabel = computed(() => {
  const map = { dana: "Dana", gopay: "GoPay", shopeepay: "ShopeePay" };
  return map[form.value.ewallet_type] || "E-Wallet";
});

async function register() {
  error.value = "";
  const { name, ewallet_type, ewallet_number } = form.value;
  if (!name.trim() || !ewallet_type || !ewallet_number.trim()) {
    error.value = "Semua field wajib diisi!";
    return;
  }
  loading.value = true;
  try {
    const data = await store.registerPlayer(form.value);
    router.push(`/main/${data.player.token}`);
  } catch (e) {
    const msg = e.response?.data?.error || "Gagal mendaftar.";
    if (msg.includes("penuh") || e.response?.status === 403) {
      full.value = true;
    } else {
      error.value = msg;
    }
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.ewallet-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-top: 4px;
}
.ewallet-card {
  background: #fff8dc;
  border: 1.5px solid rgba(46, 204, 113, 0.3);
  border-radius: 12px;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  height: 54px;
}
.ewallet-card:hover {
  border-color: rgba(240, 192, 64, 0.6);
}
.ewallet-card.active {
  border-color: var(--accent-gold);
  background: rgba(238, 184, 34, 0.749) !important;
  box-shadow: 0 0 12px rgba(240, 192, 64, 0.2);
}
.ewallet-logo {
  max-width: 90%;
  max-height: 80%;
  object-fit: contain;
}
</style>
