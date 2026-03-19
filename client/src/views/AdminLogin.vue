<template>
  <div class="page" id="admin-login-screen">
    <div class="card" style="max-width:380px">
      <div class="logo-header">
        <span class="emoji" style="font-size:3rem">🔐</span>
        <h1 style="font-size:1.6rem">Admin Login</h1>
      </div>

      <div v-if="error" class="alert alert-error">{{ error }}</div>

      <form @submit.prevent="login">
        <div class="field">
          <label>Password Admin</label>
          <input v-model="password" type="password" placeholder="••••••••" required autofocus />
        </div>
        <button type="submit" class="btn btn-primary" :disabled="loading" style="margin-top:12px">
          {{ loading ? 'Masuk...' : 'Masuk Dashboard →' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '@/store/game'

const password = ref('')
const loading = ref(false)
const error = ref('')
const router = useRouter()
const store = useGameStore()

async function login() {
  loading.value = true
  error.value = ''
  try {
    await store.login(password.value)
    router.push('/admin/dashboard')
  } catch (e) {
    error.value = e.response?.data?.error || 'Password salah'
  } finally {
    loading.value = false
  }
}
</script>
