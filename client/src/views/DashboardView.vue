<template>
  <div class="game-bg" style="align-items: center; padding-top: 40px">
    <div style="width: 100%; max-width: 960px">
      <div
        style="
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        "
      >
        <h1
          style="color: var(--accent-gold); font-weight: 900; font-size: 2rem"
        >
          Admin Dashboard
        </h1>
        <div style="display: flex; gap: 12px">
          <button
            class="btn btn-sm btn-primary"
            @click="$router.push('/admin/settings')"
          >
            ⚙️ Pengaturan
          </button>
          <button
            class="btn btn-sm"
            style="background: #ff4444; color: #fff"
            @click="logout"
          >
            Keluar
          </button>
        </div>
      </div>

      <div
        style="
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          margin-bottom: 32px;
        "
        v-if="stats"
      >
        <div class="stat-card">
          <div class="val">
            {{ stats.totalPlayers }} / {{ settings.max_players }}
          </div>
          <div class="lbl">Total Pemain</div>
        </div>
        <div class="stat-card">
          <div class="val" style="color: var(--accent-green)">
            {{ stats.finishedPlayers }}
          </div>
          <div class="lbl">Selesai Spin</div>
        </div>
        <div class="stat-card">
          <div class="val" style="color: var(--accent-gold); font-size: 1.4rem">
            Rp {{ stats.totalPrize.toLocaleString("id") }}
          </div>
          <div class="lbl">Total THR Dikeluarkan</div>
        </div>
        <div class="stat-card">
          <div class="val" style="color: var(--accent-gold)">
            {{ stats.rareCount }} / {{ stats.freeCount }}
          </div>
          <div class="lbl">Rare / Free Spin Triggered</div>
        </div>
      </div>

      <div class="card" style="max-width: 100%">
        <div
          style="
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;
          "
        >
          <h2 style="font-size: 1.3rem; color: #fff">Daftar Pemain</h2>
          <button
            class="btn btn-sm"
            style="
              background: rgba(255, 68, 68, 0.15);
              color: #ff6b6b;
              border: 1px solid rgba(255, 68, 68, 0.3);
            "
            @click="showResetModal = true"
          >
            🗑 Reset Semua Data
          </button>
        </div>

        <table
          style="
            width: 100%;
            border-collapse: collapse;
            text-align: left;
            font-size: 0.9rem;
          "
          v-if="players.length"
        >
          <thead>
            <tr
              style="
                border-bottom: 2px solid rgba(124, 77, 255, 0.3);
                color: var(--text-muted);
              "
            >
              <th style="padding: 12px">Waktu Daftar</th>
              <th style="padding: 12px">Nama & Nomor</th>
              <th style="padding: 12px">Tautan Main</th>
              <th style="padding: 12px">Sisa Spin</th>
              <th style="padding: 12px">Total Hadiah</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="p in players"
              :key="p.id"
              style="border-bottom: 1px solid rgba(255, 255, 255, 0.05)"
            >
              <td style="padding: 12px">
                {{
                  new Date(p.registered_at).toLocaleString("id-ID", {
                    timeZone: "Asia/Jakarta",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                }}
              </td>
              <td style="padding: 12px">
                <b>{{ p.name }}</b
                ><br />
                <div
                  style="
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    margin-top: 4px;
                    background: rgba(255, 255, 255, 0.05);
                    padding: 4px 8px;
                    border-radius: 6px;
                    width: fit-content;
                  "
                >
                  <img
                    v-if="p.ewallet_type === 'dana'"
                    src="https://upload.wikimedia.org/wikipedia/commons/7/72/Logo_dana_blue.svg"
                    alt="Dana"
                    style="height: 12px; object-fit: contain"
                  />
                  <img
                    v-else-if="p.ewallet_type === 'gopay'"
                    src="https://upload.wikimedia.org/wikipedia/commons/8/86/Gopay_logo.svg"
                    alt="GoPay"
                    style="height: 12px; object-fit: contain"
                  />
                  <img
                    v-else-if="p.ewallet_type === 'shopeepay'"
                    src="https://upload.wikimedia.org/wikipedia/commons/thumb/f/fe/Shopee.svg/960px-Shopee.svg.png"
                    alt="ShopeePay"
                    style="height: 14px; object-fit: contain"
                  />
                  <span
                    style="
                      color: var(--text-muted);
                      font-size: 0.8rem;
                      font-weight: 600;
                      letter-spacing: 0.5px;
                    "
                    >{{ p.ewallet_number }}</span
                  >
                </div>
              </td>
              <td style="padding: 12px">
                <input
                  type="text"
                  readonly
                  :value="getLink(p.token)"
                  style="
                    background: var(--bg-deep);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    color: var(--accent-gold);
                    padding: 6px 12px;
                    border-radius: 6px;
                    width: 100%;
                    font-size: 0.8rem;
                  "
                  @click="$event.target.select()"
                />
              </td>
              <td style="padding: 12px">
                <span v-if="p.finished" class="badge-green">Selesai</span>
                <span v-else class="badge-amber"
                  >{{ p.spins_done }} / {{ settings.spin_count }}</span
                >
              </td>
              <td
                style="
                  padding: 12px;
                  font-weight: 700;
                  color: var(--accent-gold);
                "
              >
                Rp {{ p.total_prize.toLocaleString("id") }}
                <div style="margin-top: 8px">
                  <a
                    :href="'/selamat/' + p.token + '?preview=true'"
                    target="_blank"
                    style="
                      font-size: 0.7rem;
                      padding: 4px 8px;
                      background: rgba(255, 255, 255, 0.1);
                      color: #fff;
                      border-radius: 4px;
                      text-decoration: none;
                      display: inline-block;
                    "
                    >👁 Preview Hasil</a
                  >
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <div
          v-else
          style="padding: 40px; text-align: center; color: var(--text-muted)"
        >
          Belum ada pemain yang mendaftar.
        </div>
      </div>
    </div>

    <!-- Reset Confirmation Modal -->
    <div v-if="showResetModal" class="overlay">
      <div
        class="card"
        style="
          max-width: 400px;
          text-align: center;
          animation: pop-in 0.3s ease-out;
        "
      >
        <div
          style="
            font-size: 3rem;
            margin-bottom: 12px;
            filter: drop-shadow(0 0 10px rgba(255, 68, 68, 0.5));
          "
        >
          ⚠️
        </div>
        <h3
          style="
            color: #ff6b6b;
            margin-bottom: 12px;
            font-size: 1.4rem;
            font-weight: 800;
          "
        >
          Konfirmasi Reset
        </h3>
        <p
          style="
            color: var(--text-muted);
            margin-bottom: 24px;
            line-height: 1.5;
            font-size: 0.95rem;
          "
        >
          AWAS! Semua data pemain dan hasil spin akan <b>dihapus permanen</b>.
          Anda yakin ingin melanjutkan?
        </p>
        <div style="display: flex; gap: 12px; justify-content: center">
          <button
            class="btn btn-sm"
            style="
              background: rgba(255, 68, 68, 0.15);
              color: #ff6b6b;
              border: 1px solid rgba(255, 68, 68, 0.3);
              flex: 1;
            "
            @click="confirmReset"
          >
            Tentu, Hapus Semua
          </button>
          <button
            class="btn btn-sm btn-primary"
            style="flex: 1"
            @click="showResetModal = false"
          >
            Batal
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useGameStore } from "@/store/game";

const router = useRouter();
const store = useGameStore();

const stats = ref(null);
const players = ref([]);
const settings = ref({});

async function load() {
  try {
    const data = await store.loadDashboard();
    stats.value = data.stats;
    players.value = data.players;
    settings.value = data.settings;
  } catch (e) {
    if (e.response?.status === 401) router.push("/admin");
  }
}

onMounted(load);

function getLink(token) {
  return `${window.location.origin}/main/${token}`;
}

const showResetModal = ref(false);

async function confirmReset() {
  await store.resetAll();
  await load();
  showResetModal.value = false;
}

function logout() {
  store.logout();
  router.push("/admin");
}
</script>

<style scoped>
.stat-card {
  background: var(--bg-card);
  border: 1px solid rgba(124, 77, 255, 0.3);
  padding: 24px;
  border-radius: 16px;
  text-align: center;
}
.stat-card .val {
  font-size: 2rem;
  font-weight: 900;
  margin-bottom: 4px;
  color: #fff;
}
.stat-card .lbl {
  color: var(--text-muted);
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 1px;
}
.badge-green {
  background: rgba(0, 230, 118, 0.15);
  color: #00e676;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 700;
  border: 1px solid rgba(0, 230, 118, 0.3);
}
.badge-amber {
  background: rgba(255, 179, 0, 0.15);
  color: #ffb300;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 700;
  border: 1px solid rgba(255, 179, 0, 0.3);
}
</style>
