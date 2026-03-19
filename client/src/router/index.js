import { createRouter, createWebHistory } from 'vue-router'
import { useGameStore } from '@/store/game'
import AdminLogin from '@/views/AdminLogin.vue'
import DashboardView from '@/views/DashboardView.vue'
import SettingsView from '@/views/SettingsView.vue'
import RegisterView from '@/views/RegisterView.vue'
import GameView from '@/views/GameView.vue'
import ResultView from '@/views/ResultView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/daftar' },
    { path: '/daftar', component: RegisterView },
    { path: '/main/:token', component: GameView },
    { path: '/selamat/:token', component: ResultView },
    { path: '/admin', component: AdminLogin },
    { path: '/admin/dashboard', component: DashboardView, meta: { requiresAuth: true } },
    { path: '/admin/settings', component: SettingsView, meta: { requiresAuth: true } }
  ]
})

router.beforeEach(async (to, from, next) => {
  if (to.meta.requiresAuth) {
    const store = useGameStore()
    const isValid = await store.checkAuth()
    if (!isValid) return next('/admin')
  }
  next()
})

export default router
