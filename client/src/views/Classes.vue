 <template>
  <AppLayout>
    <div class="classes-container">
      <div class="page-header">
        <div>
          <h1>Classes Management</h1>
          <p>Manage all classes, assign teachers and sections</p>
        </div>
        <button class="btn-primary" @click="openAddForm">+ Add New Class</button>
      </div>

      <div v-if="message" class="alert" :class="messageType === 'success' ? 'alert-success' : 'alert-danger'">
        {{ message }}
      </div>

      <div v-if="showForm" class="form-card">
        <div class="form-header">
          <h2>{{ isEditing ? 'Edit Class' : 'Add New Class' }}</h2>
          <button class="btn-secondary" type="button" @click="closeForm">Cancel</button>
        </div>

        <form class="class-form" @submit.prevent="saveClass">
          <div>
            <label class="form-label">Class Name *</label>
            <input v-model="classForm.class_name" class="form-control" required placeholder="Example: SODA">
          </div>
          <div>
            <label class="form-label">Level *</label>
            <input v-model="classForm.level" class="form-control" required placeholder="Example: L3">
          </div>
          <div>
            <label class="form-label">Academic Year *</label>
            <input v-model="classForm.academic_year" class="form-control" required placeholder="Example: 2025/2026">
          </div>
          <div>
            <label class="form-label">Section *</label>
            <select v-model="classForm.section_id" class="form-control" required>
              <option value="">Select section</option>
              <option v-for="section in sections" :key="section.section_id" :value="section.section_id">
                {{ section.section_name }} ({{ section.level }})
              </option>
            </select>
          </div>
          <div>
            <label class="form-label">Room *</label>
            <select v-model="classForm.room_id" class="form-control" required>
              <option value="">Select room</option>
              <option v-for="room in rooms" :key="room.room_id" :value="room.room_id">
                {{ room.room_name }} ({{ room.capacity }})
              </option>
            </select>
          </div>
          <div>
            <label class="form-label">Full Name (Class Teacher)</label>
            <select v-model="classForm.class_teacher_id" class="form-control">
              <option value="">Not assigned</option>
              <option v-for="teacher in teachers" :key="teacher.teacher_id" :value="teacher.teacher_id">
                {{ teacher.name }}
              </option>
            </select>
          </div>
          <div class="form-actions">
            <button class="btn-primary" type="submit" :disabled="saving">
              {{ saving ? 'Saving...' : (isEditing ? 'Update Class' : 'Add Class') }}
            </button>
          </div>
        </form>
      </div>

      <div class="filters-bar">
        <input v-model="searchQuery" type="text" placeholder="Search classes..." class="search-input">
        <select v-model="levelFilter" class="filter-select">
          <option value="">All Levels</option>
          <option v-for="level in levelOptions" :key="level" :value="level">{{ level }}</option>
        </select>
        <button class="btn-secondary" :disabled="loading" @click="loadClasses">
          {{ loading ? 'Refreshing...' : 'Refresh' }}
        </button>
      </div>

      <div class="table-wrapper">
        <table class="classes-table">
          <thead>
            <tr>
              <th>Class</th>
              <th>Level</th>
              <th>Academic Year</th>
              <th>Section</th>
              <th>Room</th>
              <th>Full Name</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="cls in filteredClasses" :key="cls.class_id">
              <td><strong>{{ cls.class_name }}</strong></td>
              <td>{{ cls.level }}</td>
              <td>{{ cls.academic_year || '—' }}</td>
              <td>{{ cls.section_name || 'No section' }}</td>
              <td>{{ cls.room_name || 'No room' }}</td>
              <td>{{ cls.class_teacher_name || 'Not assigned' }}</td>
              <td class="actions-cell">
                <button class="btn-edit" @click="openEditForm(cls)">Edit</button>
                <button class="btn-delete" @click="deleteClass(cls)" :disabled="deletingId === cls.class_id">
                  {{ deletingId === cls.class_id ? 'Deleting...' : 'Delete' }}
                </button>
              </td>
            </tr>
            <tr v-if="!filteredClasses.length">
              <td colspan="7" class="empty-row">
                {{ loading ? 'Loading classes...' : 'No classes found' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="!classesList.length && !loading" class="empty-state">
        <span>📚</span>
        <p>No classes created yet</p>
        <button class="btn-primary" @click="openAddForm">Add your first class</button>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import api from '@/stores/api'
import AppLayout from '@/components/AppLayout.vue'

const classesList = ref([])
const teachers = ref([])
const sections = ref([])
const rooms = ref([])
const searchQuery = ref('')
const levelFilter = ref('')
const showForm = ref(false)
const isEditing = ref(false)
const saving = ref(false)
const loading = ref(false)
const deletingId = ref(null)
const message = ref('')
const messageType = ref('success')

const emptyClassForm = () => ({
  class_id: null,
  class_name: '',
  level: '',
  academic_year: '',
  section_id: '',
  room_id: '',
  class_teacher_id: ''
})

const classForm = ref(emptyClassForm())

const uniqueSorted = (items) => [...new Set(items.filter(Boolean))].sort((a, b) => String(a).localeCompare(String(b)))

const levelOptions = computed(() => uniqueSorted(classesList.value.map(cls => cls.level)))

const filteredClasses = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  return classesList.value.filter((cls) => {
    const matchesSearch = !query ||
      cls.class_name?.toLowerCase().includes(query) ||
      cls.level?.toLowerCase().includes(query) ||
      cls.class_teacher_name?.toLowerCase().includes(query) ||
      cls.section_name?.toLowerCase().includes(query)
    const matchesLevel = !levelFilter.value || cls.level === levelFilter.value
    return matchesSearch && matchesLevel
  })
})

const showMessage = (text, type = 'success') => {
  message.value = text
  messageType.value = type
  setTimeout(() => {
    if (message.value === text) message.value = ''
  }, 3500)
}

const nullableId = (value) => value === '' || value === null || value === undefined ? null : Number(value)

const buildPayload = () => ({
  class_name: classForm.value.class_name.trim(),
  level: classForm.value.level.trim(),
  academic_year: classForm.value.academic_year.trim(),
  section_id: nullableId(classForm.value.section_id),
  room_id: nullableId(classForm.value.room_id),
  class_teacher_id: nullableId(classForm.value.class_teacher_id)
})

const openAddForm = () => {
  isEditing.value = false
  classForm.value = emptyClassForm()
  showForm.value = true
}

const openEditForm = (cls) => {
  isEditing.value = true
  classForm.value = {
    class_id: cls.class_id,
    class_name: cls.class_name || '',
    level: cls.level || '',
    academic_year: cls.academic_year || '',
    section_id: cls.section_id || '',
    room_id: cls.room_id || '',
    class_teacher_id: cls.class_teacher_id || ''
  }
  showForm.value = true
}

const closeForm = () => {
  showForm.value = false
  isEditing.value = false
  classForm.value = emptyClassForm()
}

const saveClass = async () => {
  if (!classForm.value.section_id) {
    showMessage('Please assign a section to this class.', 'danger')
    return
  }

  // Check if teacher is already head teacher for another class
  if (classForm.value.class_teacher_id) {
    const existingClass = classesList.value.find(cls =>
      cls.class_teacher_id === Number(classForm.value.class_teacher_id) &&
      cls.class_id !== classForm.value.class_id
    )
    if (existingClass) {
      showMessage('This teacher is already a head teacher for another class. A teacher can only be head teacher for one class.', 'danger')
      return
    }
  }

  saving.value = true
  try {
    const payload = buildPayload()
    const response = isEditing.value
      ? await api.put(`/classes/${classForm.value.class_id}`, payload)
      : await api.post('/classes', payload)
    const savedClass = response.data.class

    if (isEditing.value) {
      const index = classesList.value.findIndex(cls => cls.class_id === savedClass.class_id)
      if (index !== -1) classesList.value.splice(index, 1, savedClass)
    } else {
      classesList.value.unshift(savedClass)
    }

    window.dispatchEvent(new CustomEvent('classes-updated'))
    showMessage(isEditing.value ? 'Class updated successfully.' : 'Class added successfully.')
    closeForm()
  } catch (error) {
    const validationMessage = error.response?.data?.errors?.[0]?.msg
    showMessage(validationMessage || error.response?.data?.message || 'Failed to save class.', 'danger')
  } finally {
    saving.value = false
  }
}

const deleteClass = async (cls) => {
  if (!confirm(`Delete class "${cls.class_name}"? This action cannot be undone.`)) return

  deletingId.value = cls.class_id
  try {
    await api.delete(`/classes/${cls.class_id}`)
    await loadClasses()
    window.dispatchEvent(new CustomEvent('classes-updated'))
    showMessage('Class deleted successfully.')
  } catch (error) {
    showMessage(error.response?.data?.message || 'Failed to delete class.', 'danger')
  } finally {
    deletingId.value = null
  }
}

const loadClasses = async () => {
  loading.value = true
  try {
    const response = await api.get('/classes')
    classesList.value = response.data.classes || []
  } catch (error) {
    showMessage(error.response?.data?.message || 'Failed to load classes.', 'danger')
  } finally {
    loading.value = false
  }
}

const loadOptions = async () => {
  const [teacherRes, sectionRes, roomRes] = await Promise.allSettled([
    api.get('/teachers'),
    api.get('/sections'),
    api.get('/rooms')
  ])

  if (teacherRes.status === 'fulfilled') teachers.value = teacherRes.value.data.teachers || []
  if (sectionRes.status === 'fulfilled') sections.value = sectionRes.value.data.sections || []
  if (roomRes.status === 'fulfilled') rooms.value = roomRes.value.data.rooms || []
}

onMounted(async () => {
  await Promise.all([loadClasses(), loadOptions()])
})
</script>

<style scoped>
.classes-container {
  max-width: 1400px;
  margin: 0 auto;
}

.page-header,
.form-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.page-header h1,
.form-header h2 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 0.25rem;
}

.page-header p {
  color: #64748b;
  font-size: 0.8rem;
}

.form-card,
.table-wrapper {
  background: white;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  margin-bottom: 1.5rem;
}

.form-card {
  padding: 1.25rem;
}

.class-form {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}

.form-actions {
  display: flex;
  align-items: flex-end;
}

.btn-primary,
.btn-secondary {
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
}

.btn-primary {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: white;
}

.btn-secondary {
  background: #f1f5f9;
  color: #334155;
  border: 1px solid #cbd5e1;
}

.btn-primary:disabled,
.btn-secondary:disabled,
.btn-delete:disabled {
  cursor: not-allowed;
  opacity: 0.65;
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
}

.search-input,
.filter-select,
.form-control {
  padding: 0.5rem 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: white;
  color: #0f172a;
}

.form-control {
  width: 100%;
}

.form-label {
  display: block;
  margin-bottom: 0.35rem;
  color: #475569;
  font-size: 0.8rem;
  font-weight: 600;
}

.table-wrapper {
  overflow-x: auto;
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

.actions-cell {
  white-space: nowrap;
}

.group-list,
.class-actions {
  display: grid;
  gap: 0.35rem;
}

.group-list span,
.group-list strong,
.class-action-row strong {
  font-size: 0.78rem;
}

.class-action-row {
  display: grid;
  grid-template-columns: minmax(4rem, 1fr) auto auto;
  gap: 0.35rem;
  align-items: center;
}

.badge {
  background: #e2e8f0;
  padding: 0.2rem 0.5rem;
  border-radius: 20px;
  font-size: 0.7rem;
  color: #475569;
}

.btn-edit,
.btn-delete {
  color: white;
  border: none;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  cursor: pointer;
  margin-right: 0.25rem;
  font-size: 0.7rem;
}

.btn-edit {
  background: #f59e0b;
}

.btn-delete {
  background: #ef4444;
}

.empty-row {
  color: #64748b;
  padding: 1rem;
  text-align: center;
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

.alert {
  padding: 0.75rem;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.alert-success {
  background: #dcfce7;
  color: #166534;
}

.alert-danger {
  background: #fee2e2;
  color: #dc2626;
}

@media (max-width: 900px) {
  .class-form {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .page-header,
  .form-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .filters-bar,
  .class-form {
    grid-template-columns: 1fr;
    flex-direction: column;
  }

  .search-input {
    max-width: 100%;
  }
}
</style>
