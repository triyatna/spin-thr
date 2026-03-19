<template>
  <div class="game-bg" id="game-screen">
    <canvas id="confetti-canvas"></canvas>

    <div class="game-topbar">
      <div class="player-badge" v-if="player">
        <span>👤</span>
        <div>
          <div class="name">{{ player.name }}</div>
          <div class="ewallet">
            {{ ewalletIcon }} {{ player.ewallet_number }}
          </div>
        </div>
      </div>

      <div style="display: flex; gap: 8px">
        <button class="info-btn" @click="toggleAudio" title="Musik Latar">
          {{ isMuted ? "🔇" : "🔊" }}
        </button>
        <button
          class="info-btn"
          @click="showInfoModal = true"
          id="btn-info"
          title="Info"
        >
          ℹ️
        </button>
      </div>
    </div>

    <div class="game-title-bar">
      <img
        src="/logo-hariraya.png"
        alt="Logo"
        class="main-logo"
        style="
          max-height: 55px;
          margin-bottom: 4px;
          border-radius: 10px;
          filter: drop-shadow(0 0 12px rgba(240, 192, 64, 0.6));
          animation: float 3s ease-in-out infinite;
        "
      />
      <div
        class="game-title"
        style="font-size: clamp(1.1rem, 3.5vw, 1.6rem); padding-bottom: 2px"
      >
        SPIN THR LEBARAN
      </div>
      <div
        class="game-title-deco"
        style="font-size: 0.75rem; letter-spacing: 2px; margin-top: 0"
      >
        ✦ PUTAR &amp; MENANGKAN THR ✦
      </div>
    </div>

    <div
      class="total-reward-container"
      style="
        display: flex;
        justify-content: center;
        width: 100%;
        margin-bottom: 8px;
        z-index: 1;
      "
    >
      <div class="total-reward-badge center-badge">
        <div class="label">Total Reward</div>
        <div class="amount">Rp {{ displayPrize.toLocaleString("id") }}</div>
      </div>
    </div>

    <div class="slot-wrapper" ref="slotWrapper">
      <div class="slot-grid" ref="gridEl">
        <div
          v-for="(cell, idx) in flatGrid"
          :key="idx"
          class="slot-cell"
          :class="cellClass(idx)"
          :style="cellStyle(idx)"
          :id="`cell-${idx}`"
        >
          {{ cell }}
        </div>
      </div>

      <transition name="fade">
        <div class="gimmick-banner" v-if="gimmick.show">
          <div class="gimmick-text" :class="`gimmick-${gimmick.type}`">
            {{ gimmick.text }}
          </div>
          <div
            v-if="gimmick.sub"
            style="
              color: #fff;
              margin-top: 8px;
              font-size: 0.92rem;
              font-weight: 600;
            "
          >
            {{ gimmick.sub }}
          </div>
        </div>
      </transition>

      <div
        v-for="bt in burstTexts"
        :key="bt.id"
        class="burst-text"
        :style="{ left: bt.x + 'px', top: bt.y + 'px' }"
      >
        {{ bt.text }}
      </div>
    </div>

    <div class="controls-panel">
      <div class="stats-row">
        <div class="stat-box">
          <div class="stat-label">🎁 Reward Spin</div>
          <div class="stat-value">
            <span v-if="lastSpinPrize !== null"
              >Rp {{ lastSpinPrize.toLocaleString("id") }}</span
            >
            <span v-else style="font-size: 0.9rem; color: var(--text-muted)"
              >—</span
            >
          </div>
        </div>
        <div class="stat-box spins">
          <div class="stat-label">🎰 Sisa Spin</div>
          <div class="stat-value">{{ spinsLeft }}</div>
        </div>
        <div class="stat-box multi">
          <div class="stat-label">✖ Multiplier</div>
          <div class="stat-value">
            <span v-if="multiplier > 1">{{ multiplier }}×</span>
            <span v-else style="font-size: 0.9rem; color: var(--text-muted)"
              >1×</span
            >
          </div>
        </div>
      </div>

      <div class="pip-row">
        <div
          v-for="(pip, i) in pips"
          :key="i"
          class="pip"
          :class="{ used: i < spinsUsed, free: pip === 'free' }"
        ></div>
      </div>

      <button
        class="spin-btn"
        :class="{ ready: !spinning && !finished }"
        :disabled="spinning || finished"
        @click="doSpin"
        id="btn-spin"
      >
        {{ spinning ? "⏳ Memutar..." : finished ? "✅ SELESAI" : "🎰 SPIN!" }}
      </button>
    </div>
    <br />
    <div class="spin-log" v-if="spinHistory.length > 0">
      <div
        v-for="s in spinHistory"
        :key="s.spinNumber"
        class="log-item"
        :class="{ zonk: s.isZonk, settled: s.settled }"
      >
        <div class="spin-no">Spin #{{ s.spinNumber }}</div>
        <div class="spin-prize">
          <span v-if="s.settled">Rp {{ s.prize.toLocaleString("id") }}</span>
          <span v-else class="spinning-dots">🎰</span>
        </div>
        <div class="spin-tag" v-if="s.isFreeSpin">🎁 Free</div>
        <div
          class="spin-tag"
          v-else-if="s.isRare"
          style="color: var(--accent-gold)"
        >
          ⭐ Rare
        </div>
        <div
          class="spin-tag"
          v-else-if="s.isZonk"
          style="color: var(--accent-red)"
        >
          💀 Zonk
        </div>
      </div>
    </div>

    <transition name="fade">
      <div
        class="overlay"
        v-if="showInfoModal"
        @click.self="showInfoModal = false"
      >
        <div class="info-modal">
          <button
            class="info-close-btn"
            @click="showInfoModal = false"
            id="btn-info-close"
          >
            ✕
          </button>
          <div class="info-modal-title">🌙 Info Permainan</div>

          <div class="info-section">
            <div class="info-section-title">⚙️ Cara Bermain</div>
            <div class="info-rule">
              <span class="rule-icon">1️⃣</span
              ><span>Klik tombol <b>SPIN</b> untuk memutar grid 5×6.</span>
            </div>
            <div class="info-rule">
              <span class="rule-icon">2️⃣</span
              ><span
                >Simbol yang <b>terhubung ≥ 4</b> secara horizontal/vertikal
                membentuk <b>cluster</b> dan menghasilkan reward.</span
              >
            </div>
            <div class="info-rule">
              <span class="rule-icon">3️⃣</span
              ><span
                >Cluster meledak → <b>Tumble</b>: simbol baru jatuh → bisa
                memicu cluster baru secara berantai.</span
              >
            </div>
            <div class="info-rule">
              <span class="rule-icon">4️⃣</span
              ><span
                >Setiap cascade berikutnya <b>multiplier naik</b> otomatis,
                melipatgandakan reward!</span
              >
            </div>
            <div class="info-rule">
              <span class="rule-icon">🎁</span
              ><span><b>Free Spin</b> menambah 1 putaran gratis.</span>
            </div>
          </div>

          <div class="info-section">
            <div class="info-section-title">💎 Tabel Reward Simbol</div>
            <table class="sym-table">
              <thead>
                <tr>
                  <th>Simbol</th>
                  <th>4+</th>
                  <th>5+</th>
                  <th>6+</th>
                  <th>8+</th>
                  <th>10+</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="sym in symbolTable" :key="sym.icon">
                  <td>{{ sym.icon }}</td>
                  <td>{{ sym.v4 }}</td>
                  <td>{{ sym.v5 }}</td>
                  <td>{{ sym.v6 }}</td>
                  <td>{{ sym.v8 }}</td>
                  <td>{{ sym.v10 }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="info-section">
            <div class="info-section-title">ℹ️ Keterangan</div>
            <div class="info-rule">
              <span class="rule-icon">✖️</span
              ><span
                >Multiplier berlaku per spin —
                <b>makin banyak cascade makin besar multiplier</b>.</span
              >
            </div>
            <div class="info-rule">
              <span class="rule-icon">💀</span
              ><span
                ><b>Zonk</b>: tidak ada cluster → reward 0 untuk spin
                tersebut.</span
              >
            </div>
            <div class="info-rule">
              <span class="rule-icon">⭐</span
              ><span
                ><b>Simbol Langka</b>: simbol khusus dengan peluang cluster
                lebih besar.</span
              >
            </div>
            <div class="info-rule">
              <span class="rule-icon">🎰</span
              ><span
                >Jumlah default <b>6 spin</b> + bonus free spin jika
                beruntung.</span
              >
            </div>
          </div>

          <button
            class="btn btn-gold"
            @click="showInfoModal = false"
            style="margin-top: 4px"
          >
            Mengerti! 🎉
          </button>
        </div>
      </div>
    </transition>

    <transition name="fade">
      <div class="overlay" v-if="winModal.show" @click.self="closeWinModal">
        <div class="win-modal">
          <span
            class="win-label"
            :class="{ 'zonk-text': winModal.amount === 0 }"
            >{{ winModal.label }}</span
          >
          <div
            class="win-amount"
            :style="
              winModal.amount === 0
                ? 'color: var(--accent-red); margin-top: 10px;'
                : ''
            "
          >
            <span v-if="winModal.amount > 0"
              >🎉 Rp {{ winModal.amount.toLocaleString("id") }}</span
            >
            <span v-else>Rp 0</span>
          </div>
          <div class="win-sub">pada Spin #{{ winModal.spinNo }}</div>
          <button
            class="btn btn-gold"
            @click="closeWinModal"
            id="btn-modal-close"
          >
            Lanjutkan
          </button>
        </div>
      </div>
    </transition>

    <transition name="fade">
      <div class="overlay" v-if="finished && showEndModal">
        <div class="win-modal" style="max-width: 460px">
          <span class="win-label" style="font-size: 1.8rem">🎊 Selamat!</span>
          <div
            style="
              font-size: 1rem;
              color: var(--text-muted);
              margin-bottom: 8px;
            "
          >
            Total Hadiah THR Kamu
          </div>
          <div
            style="
              font-size: 3rem;
              font-weight: 900;
              color: var(--accent-gold);
              margin: 8px 0;
              text-shadow: 0 0 24px rgba(240, 192, 64, 0.6);
            "
          >
            Rp {{ displayPrize.toLocaleString("id") }}
          </div>
          <div
            style="
              color: var(--text-muted);
              margin-bottom: 24px;
              font-size: 0.88rem;
            "
          >
            {{ player?.name }} – {{ ewalletIcon }} {{ player?.ewallet_number }}
          </div>
          <button class="btn btn-gold" @click="goResult" id="btn-go-result">
            📸 Lihat Hasil & Tangkap Layar
          </button>
        </div>
      </div>
    </transition>

    <transition name="fade">
      <div class="overlay" v-if="showWelcomeModal" style="z-index: 200">
        <div class="info-modal welcome-modal">
          <div
            class="info-modal-title"
            style="font-size: 1.6rem; margin-bottom: 12px"
          >
            🎉 Halo, {{ player?.name }}!
          </div>
          <p
            style="
              text-align: center;
              color: var(--text-muted);
              margin-bottom: 24px;
              font-size: 0.95rem;
            "
          >
            Selamat datang di <b>SPIN THR Lebaran</b>. Ini panduan cara
            bermainnya:
          </p>

          <div
            class="welcome-steps"
            style="position: relative; overflow: hidden; text-align: center"
          >
            <div v-show="welcomeStep === 1" class="step-slide">
              <div class="step-icon">🎰</div>
              <div class="step-title">1. Putar Mesinnya</div>
              <p class="step-desc">
                Klik tombol <b>SPIN!</b> untuk mengacak simbol pada grid 5x6.
                Kamu punya <b>{{ spinsTotal }} putaran awal</b> (bisa bertambah
                jika dapat Free Spin!).
              </p>
            </div>
            <div v-show="welcomeStep === 2" class="step-slide">
              <div class="step-icon">💥</div>
              <div class="step-title">2. Kumpulkan Cluster</div>
              <p class="step-desc">
                Cocokkan minimal <b>4 simbol yang sama</b> secara horizontal
                atau vertikal untuk memenangkan hadiah. Makin besar cluster,
                makin besar THR!
              </p>
            </div>
            <div v-show="welcomeStep === 3" class="step-slide">
              <div class="step-icon">✖️</div>
              <div class="step-title">3. Tumble & Multiplier</div>
              <p class="step-desc">
                Simbol kemenangan akan pecah & simbol baru akan jatuh. Setiap
                jatuhan beruntun akan
                <b>meningkatkan multiplier x2, x3, dst!</b>
              </p>
            </div>
          </div>

          <div style="display: flex; gap: 10px; margin-top: 24px">
            <button
              class="btn btn-sm"
              style="
                background: var(--bg-cell);
                border: 1px solid rgba(46, 204, 113, 0.3);
                color: var(--text-main);
                flex: 0.6;
              "
              @click="welcomeStep--"
              :disabled="welcomeStep === 1"
            >
              Sebelumnya
            </button>
            <button
              class="btn btn-gold"
              @click="welcomeStep < 3 ? welcomeStep++ : closeWelcomeModal()"
              style="flex: 1"
            >
              {{ welcomeStep < 3 ? "Selanjutnya" : "Mulai Permainan! 🚀" }}
            </button>
          </div>

          <div class="welcome-dots">
            <span :class="{ active: welcomeStep === 1 }"></span>
            <span :class="{ active: welcomeStep === 2 }"></span>
            <span :class="{ active: welcomeStep === 3 }"></span>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useGameStore } from "@/store/game";

const ROWS = 5;
const COLS = 6;
const SYMBOLS = ["🧧", "☪️", "🌙", "💫", "💠", "🙏"];
const EMPTY_GRID = Array(ROWS)
  .fill(null)
  .map(() => Array(COLS).fill("❓"));

const route = useRoute();
const router = useRouter();
const store = useGameStore();

const player = computed(() => store.player);
const totalPrize = computed(() => store.totalPrize);

const rawGrid = ref(EMPTY_GRID);
const flatGrid = computed(() => rawGrid.value.flat());
const spinHistory = ref([]);
const spinsTotal = ref(6);
const spinsUsed = ref(0);
const spinsLeft = computed(() =>
  Math.max(0, spinsTotal.value - spinsUsed.value),
);
const finished = ref(false);
const showEndModal = ref(false);
const multiplier = ref(1);
const spinning = ref(false);
const displayPrize = ref(0);
const lastSpinPrize = ref(null);
const showInfoModal = ref(false);
const showWelcomeModal = ref(false);
const welcomeStep = ref(1);

const audio = new window.Audio("/audio/lebaran.mp3");
audio.loop = true;
const isMuted = ref(false);

function toggleAudio() {
  isMuted.value = !isMuted.value;
  if (isMuted.value) audio.pause();
  else
    audio.play().catch((e) => console.log("Autoplay di-block oleh browser", e));
}

function closeWelcomeModal() {
  showWelcomeModal.value = false;
  if (!isMuted.value) {
    audio.play().catch(() => console.log("Autoplay ditunda sampai interaksi."));
  }
}

onBeforeUnmount(() => {
  audio.pause();
  audio.currentTime = 0;
});

const landingCells = ref(new Set());
const winningCells = ref(new Set());
const explodingCells = ref(new Set());
const tumbleCells = ref(new Set());
const burstTexts = ref([]);
let burstId = 0;

const gimmick = ref({ show: false, type: "normal", text: "", sub: "" });
const winModal = ref({ show: false, label: "", amount: 0, spinNo: 0 });

const symbolTable = [
  { icon: "🧧", v4: "2.5k", v5: "5k", v6: "7.5k", v8: "15k", v10: "25k" },
  { icon: "☪️", v4: "1.5k", v5: "3k", v6: "5k", v8: "10k", v10: "15k" },
  { icon: "🌙", v4: "1k", v5: "2k", v6: "3k", v8: "7.5k", v10: "10k" },
  { icon: "💫", v4: "800", v5: "1.5k", v6: "2.5k", v8: "5k", v10: "7.5k" },
  { icon: "💠", v4: "500", v5: "1k", v6: "1.5k", v8: "3k", v10: "5k" },
  { icon: "🙏", v4: "250", v5: "500", v6: "1k", v8: "1.5k", v10: "2.5k" },
];

const pips = computed(() => {
  const arr = [];
  for (let i = 0; i < spinsTotal.value; i++) {
    const rec = spinHistory.value[i];
    arr.push(rec?.isFreeSpin ? "free" : "normal");
  }
  return arr;
});

const ewalletIcon = computed(() => {
  const icons = { dana: "💙", gopay: "🟢", shopeepay: "🟠" };
  return icons[player.value?.ewallet_type] || "💳";
});

function cellClass(idx) {
  const cls = {};
  if (landingCells.value.has(idx)) cls.landing = true;
  if (winningCells.value.has(idx)) cls.winning = true;
  if (explodingCells.value.has(idx)) cls.exploding = true;
  if (tumbleCells.value.has(idx)) cls.tumble = true;
  if (spinning.value && !landingCells.value.size && !winningCells.value.size)
    cls["blur-spin"] = true;
  return cls;
}

function cellStyle(idx) {
  if (!landingCells.value.has(idx)) return {};
  const col = idx % COLS;
  const row = Math.floor(idx / COLS);
  const delay = col * 70 + row * 50;
  const dur = 480 + Math.random() * 150;
  return { "--land-delay": delay + "ms", "--land-dur": dur + "ms" };
}

async function doSpin() {
  if (finished.value || spinning.value) return;

  if (audio.paused && !isMuted.value) {
    audio.play().catch(() => {});
  }

  spinning.value = true;
  lastSpinPrize.value = null;

  landingCells.value = new Set();
  winningCells.value = new Set();
  explodingCells.value = new Set();
  tumbleCells.value = new Set();
  gimmick.value.show = false;
  burstTexts.value = [];
  multiplier.value = 1;

  const allIdx = new Set(Array.from({ length: ROWS * COLS }, (_, i) => i));

  let fakeTimer = setInterval(() => {
    const fakeGrid = [];
    for (let r = 0; r < ROWS; r++) {
      const row = [];
      for (let c = 0; c < COLS; c++)
        row.push(SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]);
      fakeGrid.push(row);
    }
    rawGrid.value = fakeGrid;
  }, 70);

  const spinStart = Date.now();
  let result;

  try {
    result = await store.doSpin(route.params.token);
    const cascades = result.cascades;
    if (!cascades || cascades.length === 0) {
      clearInterval(fakeTimer);
      spinning.value = false;
      return;
    }

    const elapsed = Date.now() - spinStart;
    if (elapsed < 800) await sleep(800 - elapsed);

    clearInterval(fakeTimer);
    fakeTimer = null;

    rawGrid.value = cascades[0].grid;
    landingCells.value = allIdx;

    spinsUsed.value = result.player.spins_done;
    spinsTotal.value = result.spinNumber + result.spinsRemaining;

    spinHistory.value.push({
      spinNumber: result.spinNumber,
      prize: result.prize,
      isZonk: !!result.isZonk,
      isFreeSpin: !!result.isFreeSpin,
      isRare: !!result.isRare,
      settled: false,
    });

    await nextTick();

    const animDuration = COLS * 70 + ROWS * 50 + 600;
    await sleep(animDuration);

    landingCells.value = new Set();

    if (result.isZonk) {
      showGimmick("zonk", "💀 ZONK!", "Wah sial, coba lagi!");
      shakeGrid();
      await sleep(1800);
    } else {
      if (result.isFreeSpin) {
        showGimmick("free", "🎁 FREE SPIN!", "+1 Putaran Gratis!");
        await sleep(1800);
      } else if (result.isRare) {
        showGimmick(
          "rare",
          "⭐ SIMBOL LANGKA!",
          "Peluang jackpot lebih besar!",
        );
        await sleep(1800);
      }

      for (let i = 0; i < cascades.length; i++) {
        const cascade = cascades[i];

        if (cascade.multiplier > multiplier.value) {
          await animateMultiplier(cascade.multiplier);
        } else {
          multiplier.value = cascade.multiplier || 1;
        }

        if (cascade.clusters && cascade.clusters.length > 0) {
          await animateClusters(cascade.clusters, cascade.grid, cascade.prize);
          await animatePrizeIncrement(cascade.prize);

          if (i < cascades.length - 1) {
            const nextGrid = cascades[i + 1].grid;
            rawGrid.value = nextGrid;
            tumbleCells.value = allIdx;
            await nextTick();
            await sleep(350);
            tumbleCells.value = new Set();
            await sleep(150);
          }
        }
      }
    }

    const lastEntry = spinHistory.value.find(
      (s) => s.spinNumber === result.spinNumber,
    );
    if (lastEntry) lastEntry.settled = true;
    lastSpinPrize.value = result.prize;
    displayPrize.value = result.player.total_prize;

    gimmick.value.show = false;
    finished.value = result.finished;

    await sleep(400);

    if (!result.finished) {
      if (result.prize >= parseInt(store.settings.max_prize || 25000)) {
        launchConfetti(200);
        await showWinModal("MEGA WIN! 🔥", result.prize, result.spinNumber);
      } else if (result.prize >= 15000) {
        launchConfetti(150);
        await showWinModal("BIG WIN! 🚀", result.prize, result.spinNumber);
      } else if (result.prize > 0) {
        if (result.prize >= 5000) launchConfetti(80);
        await showWinModal("NICE SPIN! 🎉", result.prize, result.spinNumber);
      } else {
        await showWinModal("YAH ZONK! 💀", 0, result.spinNumber);
      }
    }

    if (result.finished) {
      await sleep(400);
      await checkEndWin({ spinNumber: result.spinNumber });
      await sleep(400);
      showEndModal.value = true;
    }
  } catch (e) {
    console.error(e);
    if (fakeTimer) clearInterval(fakeTimer);
  } finally {
    spinning.value = false;
  }
}

async function animatePrizeIncrement(amount) {
  if (!amount || amount <= 0) return;
  const steps = 20;
  const stepAmount = Math.ceil(amount / steps);
  let added = 0;
  for (let i = 0; i < steps; i++) {
    const toAdd = Math.min(stepAmount, amount - added);
    displayPrize.value += toAdd;
    added += toAdd;
    await sleep(40);
  }
}

async function animateMultiplier(target) {
  if (multiplier.value >= target) return;
  while (multiplier.value < target) {
    multiplier.value++;
    const badge = document.querySelector(".multi-badge");
    if (badge) {
      badge.style.animation = "none";
      void badge.offsetWidth;
      badge.style.animation =
        "pop-in 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards";
    }
    await sleep(250);
  }
}

async function animateClusters(clusters, grid) {
  const winIdx = new Set();
  for (const cl of clusters) {
    for (const [r, c] of cl.cells) winIdx.add(r * COLS + c);
  }
  winningCells.value = winIdx;
  await sleep(800);
  winningCells.value = new Set();
  explodingCells.value = winIdx;
  showBurstTexts(clusters, grid);
  await sleep(500);
  explodingCells.value = new Set();
}

function showBurstTexts(clusters) {
  const el = document.querySelector(".slot-grid");
  if (!el) return;
  const rect = el.getBoundingClientRect();
  const wrapRect = document
    .querySelector(".slot-wrapper")
    .getBoundingClientRect();

  for (const cl of clusters) {
    const avgR = cl.cells.reduce((s, [r]) => s + r, 0) / cl.cells.length;
    const avgC = cl.cells.reduce((s, [, c]) => s + c, 0) / cl.cells.length;
    const cellW = rect.width / COLS;
    const cellH = rect.height / ROWS;
    const x = rect.left - wrapRect.left + avgC * cellW + cellW / 2;
    const y = rect.top - wrapRect.top + avgR * cellH + cellH / 2;
    const prize = getClusterPrize(cl);

    if (prize > 0) {
      const padX = 85;
      const padYTop = 75;
      const padYBottom = 30;
      const textX = Math.max(padX, Math.min(x, wrapRect.width - padX));
      const textY = Math.max(
        padYTop,
        Math.min(y, wrapRect.height - padYBottom),
      );

      burstTexts.value.push({
        id: burstId++,
        x: textX,
        y: textY,
        text: "+Rp " + prize.toLocaleString("id"),
      });
      createExplosionParticles(x, y);
    }
  }
  setTimeout(() => {
    burstTexts.value = [];
  }, 1200);
}

function createExplosionParticles(x, y) {
  const container = document.querySelector(".slot-wrapper");
  if (!container) return;
  for (let i = 0; i < 10; i++) {
    const el = document.createElement("div");
    el.className = "explode-particle";
    el.style.left = x + "px";
    el.style.top = y + "px";
    const angle = (Math.PI * 2 * i) / 10;
    const distance = 40 + Math.random() * 50;
    el.style.setProperty("--tx", Math.cos(angle) * distance + "px");
    el.style.setProperty("--ty", Math.sin(angle) * distance + "px");
    container.appendChild(el);
    setTimeout(() => {
      if (el.parentNode) el.remove();
    }, 600);
  }
}

function getClusterPrize(cl) {
  const TABLE = {
    "🧧": { 4: 2500, 5: 5000, 6: 7500, 7: 10000, 8: 15000, 10: 25000 },
    "☪️": { 4: 1500, 5: 3000, 6: 5000, 7: 7500, 8: 10000, 10: 15000 },
    "🌙": { 4: 1000, 5: 2000, 6: 3000, 7: 5000, 8: 7500, 10: 10000 },
    "💫": { 4: 800, 5: 1500, 6: 2500, 7: 4000, 8: 5000, 10: 7500 },
    "💠": { 4: 500, 5: 1000, 6: 1500, 7: 2000, 8: 3000, 10: 5000 },
    "🙏": { 4: 250, 5: 500, 6: 1000, 7: 1250, 8: 1500, 10: 2500 },
  };
  const info = TABLE[cl.symbol];
  if (!info) return 0;
  let amt = 0;
  if (cl.size >= 10) amt = info[10];
  else if (cl.size >= 8) amt = info[8];
  else if (cl.size >= 7) amt = info[7];
  else if (cl.size >= 6) amt = info[6];
  else if (cl.size >= 5) amt = info[5];
  else if (cl.size >= 4) amt = info[4];
  return amt * multiplier.value;
}

function showGimmick(type, text, sub = "") {
  gimmick.value = { show: true, type, text, sub };
  setTimeout(() => {
    gimmick.value.show = false;
  }, 2200);
}

let modalResolve = null;

function showWinModal(label, amount, spinNo) {
  winModal.value = { show: true, label, amount, spinNo };
  return new Promise((resolve) => {
    modalResolve = resolve;
  });
}

function closeWinModal() {
  winModal.value.show = false;
  if (modalResolve) {
    modalResolve();
    modalResolve = null;
  }
}

function checkEndWin(lastResult) {
  if (totalPrize.value >= parseInt(store.settings.max_prize || 20000)) {
    launchConfetti(150);
  } else if (totalPrize.value >= 10000) {
    launchConfetti(80);
  }
  return Promise.resolve();
}

function shakeGrid() {
  const el = document.querySelector(".slot-wrapper");
  if (!el) return;
  el.style.animation = "shake .5s ease";
  setTimeout(() => {
    el.style.animation = "";
  }, 600);
}

function launchConfetti(count = 100) {
  const canvas = document.getElementById("confetti-canvas");
  if (!canvas) return;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const ctx = canvas.getContext("2d");
  const colors = [
    "#f0c040",
    "#2ecc71",
    "#1a8c4e",
    "#ffffff",
    "#e8950a",
    "#7ee8a2",
  ];
  const particles = Array.from({ length: count }, () => ({
    x: Math.random() * canvas.width,
    y: -20 - Math.random() * 80,
    vx: (Math.random() - 0.5) * 6,
    vy: 3 + Math.random() * 5,
    color: colors[Math.floor(Math.random() * colors.length)],
    w: 10 + Math.random() * 10,
    h: 16 + Math.random() * 10,
    rot: Math.random() * 360,
    rspeed: (Math.random() - 0.5) * 10,
    life: 1,
  }));
  let frame;
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let alive = false;
    for (const p of particles) {
      if (p.life <= 0) continue;
      alive = true;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.rspeed;
      p.life -= 0.008;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rot * Math.PI) / 180);
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    }
    if (alive) frame = requestAnimationFrame(draw);
    else ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
  draw();
  setTimeout(() => {
    cancelAnimationFrame(frame);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }, 5000);
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function goResult() {
  router.push(`/selamat/${route.params.token}`);
}

onMounted(async () => {
  await store.loadSettings();
  spinsTotal.value = parseInt(store.settings.spin_count) || 6;
  try {
    const data = await store.loadPlayerByToken(route.params.token);
    spinsUsed.value = data.player.spins_done;
    displayPrize.value = data.player.total_prize || 0;

    const baseSpinCount = parseInt(store.settings.spin_count) || 6;
    const freeSpinsGained = data.spins.filter((s) => s.is_free_spin).length;
    spinsTotal.value = baseSpinCount + freeSpinsGained;

    spinHistory.value = data.spins.map((s) => ({
      spinNumber: s.spin_number,
      prize: s.prize,
      isZonk: !!s.is_zonk,
      isFreeSpin: !!s.is_free_spin,
      isRare: !!s.is_rare,
      settled: true,
    }));
    finished.value = !!data.player.finished;
    if (data.player.finished) showEndModal.value = true;
    else if (spinsUsed.value === 0) showWelcomeModal.value = true;

    if (data.spins.length > 0) {
      try {
        const lastSpin = data.spins[data.spins.length - 1];
        const parsed = JSON.parse(lastSpin.grid);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].grid) {
          rawGrid.value = parsed[parsed.length - 1].grid;
        } else {
          rawGrid.value = parsed;
        }
      } catch (err) {
        console.error("Error parsing grid fallback", err);
      }
    }
  } catch (e) {
    if (e.response?.status === 404) router.push("/daftar");
  }
});
</script>

<style scoped>
.welcome-modal {
  max-width: 440px !important;
  text-align: center;
}
.step-slide {
  animation: slide-up 0.4s ease forwards;
  padding: 10px 0;
}
.step-icon {
  font-size: 4.5rem;
  margin-bottom: 16px;
  filter: drop-shadow(0 0 16px rgba(240, 192, 64, 0.4));
}
.step-title {
  font-size: 1.3rem;
  font-weight: 800;
  color: var(--accent-gold);
  margin-bottom: 12px;
}
.step-desc {
  font-size: 1rem;
  color: var(--text-main);
  line-height: 1.6;
}
.welcome-dots {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-top: 20px;
}
.welcome-dots span {
  width: 8px;
  height: 8px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  transition: all 0.3s;
}
.welcome-dots span.active {
  background: var(--accent-gold);
  width: 20px;
  border-radius: 4px;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slot-cell.landing {
  animation: slot-drop var(--land-dur, 0.5s) cubic-bezier(0.22, 1, 0.36, 1)
    var(--land-delay, 0s) both;
}

@keyframes slot-drop {
  0% {
    transform: translateY(-80px) scaleY(0.8);
    opacity: 0.3;
  }
  60% {
    transform: translateY(6px) scaleY(1.04);
    opacity: 1;
  }
  80% {
    transform: translateY(-3px) scaleY(0.97);
  }
  100% {
    transform: translateY(0) scaleY(1);
    opacity: 1;
  }
}

.slot-cell.tumble {
  animation: tumble-drop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

@keyframes tumble-drop {
  0% {
    transform: translateY(-80px);
    opacity: 0;
  }
  100% {
    transform: translateY(0);
    opacity: 1;
  }
}

.spinning-dots {
  display: inline-block;
  animation: spin-pulse 0.8s ease-in-out infinite;
}

@keyframes spin-pulse {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.4;
    transform: scale(0.85);
  }
}
</style>
