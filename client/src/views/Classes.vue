<template>
  <AppLayout>
    <div class="classes-container">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1>Classes Management</h1>
          <p>Manage all classes, assign teachers and sections</p>
        </div>
        <button class="btn-primary" @click="openAddModal">+ Add New Class</button>
      </div>

      <!-- Filters -->
      <div class="filters-bar">
        <input type="text" placeholder="Search classes..." class="search-input">
        <select class="filter-select">
          <option>All Levels</option>
          <option>Level 1</option>
          <option>Level 2</option>
        </select>
        <select class="filter-select">
          <option>All Academic Years</option>
          <option>2024-2025</option>
        </select>
      </div>

      <!-- Classes Table -->
      <div class="table-wrapper">
        <table class="classes-table">
          <thead>
            <tr>
              <th>Class</th>
              <th>Level</th>
              <th>Academic Year</th>
              <th>Class Teacher</th>
              <th>Teacher Dept.</th>
              <th>Shift</th>
              <th>Section</th>
              <th>DOS</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="cls in classesList" :key="cls.id">
              <td><strong>{{ cls.name }}</strong></td>
              <td>{{ cls.level }}</td>
              <td>{{ cls.academicYear }}</td>
              <td>{{ cls.teacher || 'Not assigned' }}</td>
              <td><span class="badge">{{ cls.department || 'N/A' }}</span></td>
              <td>{{ cls.shift || 'No shift' }}</td>
              <td>{{ cls.section || 'No section' }}</td>
              <td>{{ cls.dos || 'No DOS' }}</td>
              <td>
                <button class="btn-edit">Edit</button>
                <button class="btn-delete">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Empty State -->
      <div v-if="!classesList.length" class="empty-state">
        <span>📚</span>
        <p>No classes found</p>
        <button class="btn-primary" @click="openAddModal">Add your first class</button>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref } from 'vue'
import AppLayout from '@/components/AppLayout.vue'

const classesList = ref([
  {
    id: 1,
    name: 'SODA',
    level: 'L3',
    academicYear: '2024-2025',
    teacher: 'Not assigned',
    department: 'N/A',
    shift: 'No shift',
    section: 'SDA',
    dos: 'Dr. Smith'
  }
])

const openAddModal = () => {
  alert('Add Class Modal - Implement your logic here')
}
</script>

<style scoped>
.classes-container {
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.page-header h1 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 0.25rem;
}

.page-header p {
  color: #64748b;
  font-size: 0.8rem;
}

.btn-primary {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
}

.filters-bar {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.search-input {
  flex: 1;
  max-width: 300px;
  padding: 0.5rem 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: white;
}

.filter-select {
  padding: 0.5rem 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: white;
}

.table-wrapper {
  overflow-x: auto;
  background: white;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}

.classes-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8rem;
}

.classes-table th,
.classes-table td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid #e2e8f0;
}

.classes-table th {
  background: #f8fafc;
  font-weight: 600;
  color: #0f172a;
}

.classes-table tr:hover {
  background: #f8fafc;
}

.badge {
  background: #e2e8f0;
  padding: 0.2rem 0.5rem;
  border-radius: 20px;
  font-size: 0.7rem;
  color: #475569;
}

.btn-edit {
  background: #f59e0b;
  color: white;
  border: none;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  cursor: pointer;
  margin-right: 0.25rem;
  font-size: 0.7rem;
}

.btn-delete {
  background: #ef4444;
  color: white;
  border: none;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.7rem;
}

.empty-state {
  text-align: center;
  padding: 3rem;
  background: white;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}

.empty-state span {
  font-size: 3rem;
}

.empty-state p {
  color: #64748b;
  margin: 0.5rem 0;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .filters-bar {
    flex-direction: column;
  }
  
  .search-input {
    max-width: 100%;
  }
}
</style>