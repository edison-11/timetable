<template>
  <div class="p-6">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold text-secondary-800">Weekly Timetable</h1>
      <button @click="$emit('open-modal')" class="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition">
        Add Entry
      </button>
    </div>

    <div class="overflow-x-auto bg-white rounded-xl shadow-sm border border-secondary-200">
      <table class="w-full border-collapse">
        <thead>
          <tr class="bg-secondary-50">
            <th class="p-4 border-b border-secondary-200 text-left text-xs font-semibold text-secondary-500 uppercase">Time</th>
            <th v-for="day in days" :key="day" class="p-4 border-b border-secondary-200 text-left text-xs font-semibold text-secondary-500 uppercase">
              {{ day }}
            </th>
          </tr>
        </thead>
        <tbody>
          <!-- Simplified view: This logic usually requires slot-based sorting for a real grid -->
          <tr v-if="loading">
            <td :colspan="days.length + 1" class="p-8 text-center text-secondary-500">Loading schedules...</td>
          </tr>
          <tr v-else-if="Object.keys(groupedSchedules).length === 0">
            <td :colspan="days.length + 1" class="p-8 text-center text-secondary-500">No schedules found.</td>
          </tr>
          <template v-else>
             <!-- In a production app, you'd map standard time slots (8:00, 9:00, etc) here -->
             <tr v-for="schedule in schedules" :key="schedule.id" class="hover:bg-secondary-50 transition">
                <td class="p-4 border-b border-secondary-100 font-medium text-secondary-700">
                  {{ schedule.start_time.substring(0, 5) }} - {{ schedule.end_time.substring(0, 5) }}
                </td>
                <td v-for="day in days" :key="day" class="p-4 border-b border-secondary-100">
                  <div v-if="schedule.day_of_week === day" class="p-3 bg-primary-50 border-l-4 border-primary-500 rounded text-sm">
                    <p class="font-bold text-primary-900">{{ schedule.module_name }}</p>
                    <p class="text-primary-700 text-xs">{{ schedule.class_name }}</p>
                    <p class="text-secondary-500 text-xs mt-1">{{ schedule.teacher_name }} | {{ schedule.room_name }}</p>
                  </div>
                </td>
             </tr>
          </template>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { scheduleService } from '@/api';

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const schedules = ref([]);
const loading = ref(true);

const fetchSchedules = async () => {
  try {
    const { data } = await scheduleService.getAll();
    schedules.value = data.schedules;
  } catch (err) {
    console.error('Error fetching schedules:', err);
  } finally {
    loading.value = false;
  }
};

// Helper to group schedules for a cleaner grid view if needed
const groupedSchedules = computed(() => {
  return schedules.value.reduce((acc, curr) => {
    if (!acc[curr.day_of_week]) acc[curr.day_of_week] = [];
    acc[curr.day_of_week].push(curr);
    return acc;
  }, {});
});

onMounted(fetchSchedules);

defineEmits(['open-modal']);
</script>

<style scoped>
th {
  min-width: 150px;
}
td {
  vertical-align: top;
}
</style>