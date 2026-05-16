<template>
  <AppLayout>
    <div class="rooms-container">
      <div class="card-custom">
        <div class="page-header">
          <div>
            <h1>Rooms Management</h1>
            <p>Create, update, and remove classroom spaces.</p>
          </div>
          <button class="btn-secondary" :disabled="loading" @click="loadRooms">
            {{ loading ? 'Refreshing...' : 'Refresh' }}
          </button>
        </div>

        <div v-if="message" class="alert" :class="messageType === 'success' ? 'alert-success' : 'alert-danger'">
          {{ message }}
        </div>

        <form class="room-form" @submit.prevent="saveRoom">
          <div>
            <label class="form-label">Room Name *</label>
            <input v-model="roomForm.room_name" class="form-control" required placeholder="Example: Room 101">
          </div>
          <div>
            <label class="form-label">Room Type *</label>
            <input v-model="roomForm.room_type" class="form-control" required placeholder="Classroom, Lab, Hall">
          </div>
          <div>
            <label class="form-label">Capacity *</label>
            <input v-model.number="roomForm.capacity" type="number" min="1" class="form-control" required>
          </div>
          <div class="form-actions">
            <button class="btn-primary" type="submit" :disabled="saving">
              {{ saving ? 'Saving...' : (isEditing ? 'Update Room' : 'Add Room') }}
            </button>
            <button v-if="isEditing" class="btn-secondary" type="button" @click="resetForm">Cancel</button>
          </div>
        </form>
      </div>

      <div class="card-custom">
        <div class="table-header">
          <h2>Saved Rooms</h2>
          <span class="badge">{{ rooms.length }} rooms</span>
        </div>

        <div class="table-responsive">
          <table class="table-custom">
            <thead>
              <tr>
                <th>Room</th>
                <th>Type</th>
                <th>Capacity</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="room in rooms" :key="room.room_id">
                <td>{{ room.room_name }}</td>
                <td>{{ room.room_type }}</td>
                <td>{{ room.capacity }}</td>
                <td>
                  <button class="btn-edit" @click="editRoom(room)">Edit</button>
                  <button class="btn-delete" :disabled="deletingId === room.room_id" @click="deleteRoom(room)">
                    {{ deletingId === room.room_id ? 'Deleting...' : 'Delete' }}
                  </button>
                </td>
              </tr>
              <tr v-if="!rooms.length">
                <td colspan="4" class="empty-row">{{ loading ? 'Loading rooms...' : 'No rooms found' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import api from '@/stores/api'
import AppLayout from '@/components/AppLayout.vue'

const rooms = ref([])
const loading = ref(false)
const saving = ref(false)
const deletingId = ref(null)
const isEditing = ref(false)
const message = ref('')
const messageType = ref('success')

const emptyRoomForm = () => ({
  room_id: null,
  room_name: '',
  room_type: '',
  capacity: 30
})

const roomForm = ref(emptyRoomForm())

const showMessage = (text, type = 'success') => {
  message.value = text
  messageType.value = type
  setTimeout(() => {
    if (message.value === text) message.value = ''
  }, 3500)
}

const resetForm = () => {
  isEditing.value = false
  roomForm.value = emptyRoomForm()
}

const loadRooms = async () => {
  loading.value = true
  try {
    const response = await api.get('/rooms')
    rooms.value = response.data.rooms || []
  } catch (error) {
    showMessage(error.response?.data?.message || 'Failed to load rooms.', 'danger')
  } finally {
    loading.value = false
  }
}

const saveRoom = async () => {
  saving.value = true
  try {
    const payload = {
      room_name: roomForm.value.room_name.trim(),
      room_type: roomForm.value.room_type.trim(),
      capacity: Number(roomForm.value.capacity)
    }
    const response = isEditing.value
      ? await api.put(`/rooms/${roomForm.value.room_id}`, payload)
      : await api.post('/rooms', payload)
    const savedRoom = response.data.room

    if (isEditing.value) {
      const index = rooms.value.findIndex(room => room.room_id === savedRoom.room_id)
      if (index !== -1) rooms.value.splice(index, 1, savedRoom)
    } else {
      rooms.value.push(savedRoom)
    }

    showMessage(isEditing.value ? 'Room updated successfully.' : 'Room added successfully.')
    resetForm()
  } catch (error) {
    const validationMessage = error.response?.data?.errors?.[0]?.msg
    showMessage(validationMessage || error.response?.data?.message || 'Failed to save room.', 'danger')
  } finally {
    saving.value = false
  }
}

const editRoom = (room) => {
  isEditing.value = true
  roomForm.value = { ...room }
}

const deleteRoom = async (room) => {
  if (!confirm(`Delete room "${room.room_name}"?`)) return

  deletingId.value = room.room_id
  try {
    await api.delete(`/rooms/${room.room_id}`)
    rooms.value = rooms.value.filter(item => item.room_id !== room.room_id)
    showMessage('Room deleted successfully.')
  } catch (error) {
    showMessage(error.response?.data?.message || 'Failed to delete room.', 'danger')
  } finally {
    deletingId.value = null
  }
}

onMounted(loadRooms)
</script>

<style scoped>
.rooms-container {
  max-width: 1200px;
  margin: 0 auto;
}

.card-custom {
  background: white;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  padding: 1.25rem;
  margin-bottom: 1.5rem;
}

.page-header,
.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.page-header h1,
.table-header h2 {
  font-size: 1.5rem;
  color: #0f172a;
  margin: 0 0 0.25rem;
}

.page-header p {
  margin: 0;
  color: #64748b;
}

.room-form {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1rem;
  align-items: end;
}

.form-actions {
  display: flex;
  gap: 0.5rem;
}

.form-label {
  display: block;
  margin-bottom: 0.35rem;
  color: #475569;
  font-size: 0.8rem;
  font-weight: 600;
}

.form-control {
  width: 100%;
  padding: 0.5rem 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.btn-primary,
.btn-secondary,
.btn-edit,
.btn-delete {
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
}

.btn-primary,
.btn-secondary {
  padding: 0.5rem 1rem;
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

.btn-edit,
.btn-delete {
  color: white;
  padding: 0.25rem 0.75rem;
  margin-right: 0.5rem;
}

.btn-edit {
  background: #f59e0b;
}

.btn-delete {
  background: #ef4444;
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.65;
}

.badge {
  background: #3b82f6;
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
}

.table-responsive {
  overflow-x: auto;
}

.table-custom {
  width: 100%;
  border-collapse: collapse;
}

.table-custom th,
.table-custom td {
  padding: 0.75rem;
  border-bottom: 1px solid #e2e8f0;
  text-align: left;
}

.table-custom th {
  background: #f8fafc;
}

.empty-row {
  color: #64748b;
  text-align: center;
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
  .room-form {
    grid-template-columns: 1fr;
  }
}
</style>
