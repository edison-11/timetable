<template>
  <div class="min-vh-100">
    <header class="header-custom">
      <div class="container-fluid px-4 py-3 d-flex justify-content-between align-items-center">
        <div class="d-flex align-items-center gap-3">
          <div class="d-flex align-items-center justify-center bg-primary rounded" style="width: 40px; height: 40px; font-size: 20px;">BR</div>
          <h1 class="h2 mb-0">Bus Routes Management</h1>
        </div>
        <div class="d-flex align-items-center gap-3">
          <router-link to="/dashboard" class="text-light opacity-75 text-decoration-none">Dashboard</router-link>
          <div class="d-flex align-items-center justify-center bg-primary rounded-circle" style="width: 40px; height: 40px;">A</div>
        </div>
      </div>
    </header>

    <div class="d-flex">
      <nav class="sidebar-custom" style="width: 250px;">
        <div class="p-3">
          <router-link v-for="item in navigation" :key="item.name" :to="item.path" class="nav-item-custom d-block mb-2" :class="{ 'active': $route.path === item.path }">
            <span class="fs-5">{{ item.icon }}</span>
            <span>{{ item.name }}</span>
          </router-link>
        </div>
      </nav>

      <main class="flex-grow-1 p-4">
        <div class="card-custom">
          <div class="d-flex justify-content-between align-items-center mb-4">
            <h2 class="h3 fw-semibold text-dark">All Bus Routes</h2>
            <button class="btn btn-primary-custom">Add New Bus Route</button>
          </div>

          <div class="text-center py-5">
            <div class="mb-3">
              <i class="fas fa-bus fa-3x text-muted"></i>
            </div>
            <h4 class="text-muted">Bus Routes Management</h4>
            <p class="text-muted">This feature is under development.</p>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const navigation = [
  { name: 'Dashboard', path: '/dashboard', icon: 'D' },
  { name: 'Teachers', path: '/teachers', icon: 'T' },
  { name: 'Modules', path: '/modules', icon: 'M' },
  { name: 'Classes', path: '/classes', icon: 'C' },
  { name: 'Sections', path: '/sections', icon: 'S' },
  { name: 'Rooms', path: '/rooms', icon: 'R' },
  { name: 'Shifts', path: '/shifts', icon: 'H' },
  { name: 'Assignments', path: '/assignments', icon: 'A' },
  { name: 'Bus Routes', path: '/bus-routes', icon: 'BR' },
  { name: 'Timetable', path: '/timetable', icon: 'TT' }
]
</script>