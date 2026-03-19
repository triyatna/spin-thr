import { createRouter, createWebHistory } from 'vue-router'
import { useGameStore } from '@/store/game'
import AdminLogin from '@/views/AdminLogin.vue'
import DashboardView from '@/views/DashboardView.vue'
import SettingsView from '@/views/SettingsView.vue'
import RegisterView from '@/views/RegisterView.vue'
import GameView from '@/views/GameView.vue'
import ResultView from '@/views/ResultView.vue'
import SiteDisabledView from '@/views/SiteDisabledView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/daftar' },
    { path: '/daftar', component: RegisterView, meta: { publicPage: true } },
    { path: '/main/:token', component: GameView, meta: { publicPage: true } },
    { path: '/selamat/:token', component: ResultView, meta: { publicPage: true } },
    { path: '/nonaktif', component: SiteDisabledView },
    { path: '/admin', component: AdminLogin },
    { path: '/admin/dashboard', component: DashboardView, meta: { requiresAuth: true } },
    { path: '/admin/settings', component: SettingsView, meta: { requiresAuth: true } }
  ]
})

router.beforeEach(async (to, from, next) => {
  const store = useGameStore()

  if (to.meta.requiresAuth) {
    const isValid = await store.checkAuth()
    if (!isValid) return next('/admin')
  }

  if (to.meta.publicPage || to.path === '/nonaktif') {
    await store.loadSettings()

    let adminAccess = false
    if (store.token) {
      adminAccess = await store.checkAuth()
    }

    if (to.path === '/nonaktif' && (store.isSiteEnabled || adminAccess)) {
      return next('/daftar')
    }

    if (to.meta.publicPage && !store.isSiteEnabled && !adminAccess) {
      return next('/nonaktif')
    }
  }

  next()
})

export default router
