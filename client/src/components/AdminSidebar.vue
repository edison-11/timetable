<template>
  <nav class="sidebar-custom admin-sidebar" style="position: fixed; top: 80px; left: 0; width: 250px; bottom: 0; overflow-y: auto; background: #f8f9fa; border-right: 1px solid #dee2e6;">
    <div class="p-3">
      <router-link
        v-for="item in adminSidebarItems"
        :key="item.name"
        :to="item.path"
        class="nav-item-custom d-block mb-2"
        :class="{ active: route.path === item.path }"
      >
        <span class="fs-5">{{ item.icon }}</span>
        <span>{{ item.name }}</span>
      </router-link>
    </div>
  </nav>
</template>

<script setup>
import { useRoute } from 'vue-router'

const route = useRoute()

const adminSidebarItems = [
  { name: 'Dashboard', path: '/dashboard', icon: 'D' },
  { name: 'Teachers', path: '/teachers', icon: 'T' },
  { name: 'Modules', path: '/modules', icon: 'M' },
  { name: 'Classes', path: '/classes', icon: 'C' },
  { name: 'Sections', path: '/sections', icon: 'S' },
  { name: 'Shifts', path: '/shifts', icon: 'H' },
  { name: 'Assignments', path: '/assignments', icon: 'A' },
  { name: 'Timetable', path: '/timetable', icon: 'TT' }
]
</script>
