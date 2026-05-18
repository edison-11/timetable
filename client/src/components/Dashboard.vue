<template>
  <div class="p-6 bg-secondary-50 min-h-screen">
    <h1 class="text-2xl font-bold text-secondary-800 mb-6">Dashboard Overview</h1>
    
    <!-- Stats Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <div v-for="(val, key) in stats" :key="key" class="bg-white p-6 rounded-xl shadow-sm border border-secondary-200">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-secondary-500 uppercase tracking-wider">{{ formatLabel(key) }}</p>
            <h3 class="text-3xl font-bold text-primary-600 mt-1">{{ val }}</h3>
          </div>
          <div class="p-3 bg-primary-50 rounded-lg">
            <component :is="getIcon(key)" class="w-6 h-6 text-primary-500" />
          </div>
        </div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="bg-white p-6 rounded-xl shadow-sm border border-secondary-200">
      <h2 class="text-lg font-semibold text-secondary-700 mb-4">Quick Management</h2>
      <div class="flex flex-wrap gap-3">
        <router-link to="/rooms" class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition">Manage Rooms</router-link>
        <router-link to="/teachers" class="px-4 py-2 bg-secondary-600 text-white rounded-lg hover:bg-secondary-700 transition">Review Teachers</router-link>
        <router-link to="/schedules" class="px-4 py-2 border border-primary-600 text-primary-600 rounded-lg hover:bg-primary-50 transition">Build Timetable</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { dashboardService } from '@/api';

const stats = ref({
  modules: 0,
  teachers: 0,
  classes: 0,
  pendingUsers: 0
});

const formatLabel = (key) => {
  return key.replace(/([A-Z])/g, ' $1').trim();
};

const fetchStats = async () => {
  try {
    const { data } = await dashboardService.getStats();
    stats.value = data;
  } catch (err) {
    console.error('Failed to load dashboard stats', err);
  }
};

onMounted(fetchStats);

// Simple mapping for icons if using a library like Lucide or Heroicons
const getIcon = (key) => {
  // Return icon names or components here
  return 'div'; 
};
</script>

<style scoped>
.router-link-active {
  @apply ring-2 ring-primary-500 ring-offset-2;
}
</style>