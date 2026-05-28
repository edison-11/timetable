<template>
  <main class="status-page">
    <section class="status-card">
      <div class="status-mark"></div>
      <h1>Account Access Disabled</h1>
      <p>{{ message }}</p>
      <small>{{ detail }}</small>
      <router-link to="/login">Return to Login</router-link>
    </section>
  </main>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const messages = {
  suspended: 'Your school account has been suspended.',
  deactivated: 'School access disabled by Super Admin.',
  pending_approval: 'Your school account is waiting for system administrator approval.',
  subscription: 'Subscription inactive.',
  account: 'Your account is not active.'
}

const message = computed(() => messages[route.query.reason] || 'Your account cannot access the system right now.')
const detail = computed(() => route.query.message || 'Please contact system administration for support.')
</script>

<style scoped>
.status-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 1.5rem;
  background: linear-gradient(135deg, #f8fafc, #eaf2ff);
}

.status-card {
  width: min(520px, 100%);
  text-align: center;
  background: #fff;
  border: 1px solid #dbeafe;
  border-radius: 8px;
  box-shadow: 0 24px 70px rgba(15, 23, 42, 0.14);
  padding: 2rem;
}

.status-mark {
  width: 64px;
  height: 64px;
  margin: 0 auto 1rem;
  border-radius: 50%;
  background: #fee2e2;
  border: 10px solid #fff1f2;
  box-shadow: inset 0 0 0 3px #ef4444;
}

h1 {
  margin: 0;
  color: #172033;
  font-size: 1.5rem;
}

p {
  margin: 0.75rem 0 0;
  color: #334155;
  font-size: 1rem;
  font-weight: 800;
}

small {
  display: block;
  margin: 0.5rem auto 1.25rem;
  color: #64748b;
}

a {
  display: inline-flex;
  border-radius: 8px;
  background: #2563eb;
  color: #fff;
  padding: 0.75rem 1rem;
  text-decoration: none;
  font-weight: 850;
}
</style>
