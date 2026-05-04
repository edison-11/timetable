<template>
  <div class="min-vh-100 bg-light">
    <!-- Header -->
    <nav class="navbar navbar-expand-lg navbar-dark bg-primary shadow-sm">
      <div class="container-fluid">
        <a class="navbar-brand d-flex align-items-center" href="#">
          <span class="me-2">📋</span>
          Under Timetable
        </a>
        
        <div class="navbar-nav ms-auto">
          <button 
            @click="handleLogout"
            class="btn btn-outline-light btn-sm"
          >
            <i class="bi bi-box-arrow-right me-1"></i>
            Logout
          </button>
        </div>
      </div>
    </nav>

    <!-- Main Content -->
    <div class="container-fluid py-4">
      <div class="row">
        <div class="col-12">
          <div class="card">
            <div class="card-header bg-white">
              <h2 class="h4 mb-0">Under Timetable Management</h2>
              <p class="text-muted mb-0">Manage and view timetable information</p>
            </div>
            <div class="card-body">
              <!-- Content Placeholder -->
              <div class="text-center py-5">
                <i class="bi bi-calendar-week display-1 text-muted"></i>
                <h4 class="mt-3 text-muted">Under Timetable Section</h4>
                <p class="text-muted">This section is ready for timetable management features.</p>
                
                <div class="row mt-4">
                  <div class="col-md-4 mb-3">
                    <div class="card h-100">
                      <div class="card-body text-center">
                        <i class="bi bi-plus-circle display-4 text-primary mb-3"></i>
                        <h5>Create Timetable</h5>
                        <p class="text-muted">Generate new timetable schedules</p>
                        <button class="btn btn-primary">Create</button>
                      </div>
                    </div>
                  </div>
                  
                  <div class="col-md-4 mb-3">
                    <div class="card h-100">
                      <div class="card-body text-center">
                        <i class="bi bi-eye display-4 text-info mb-3"></i>
                        <h5>View Timetables</h5>
                        <p class="text-muted">Browse existing timetables</p>
                        <button class="btn btn-info">View</button>
                      </div>
                    </div>
                  </div>
                  
                  <div class="col-md-4 mb-3">
                    <div class="card h-100">
                      <div class="card-body text-center">
                        <i class="bi bi-pencil-square display-4 text-warning mb-3"></i>
                        <h5>Edit Timetables</h5>
                        <p class="text-muted">Modify existing schedules</p>
                        <button class="btn btn-warning">Edit</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const handleLogout = () => {
  authStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.display-1 {
  font-size: 4rem;
}

.display-4 {
  font-size: 2.5rem;
}

.card {
  border: none;
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
  transition: transform 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
}

.card-header {
  border-bottom: 1px solid #dee2e6;
}

.navbar-brand {
  font-size: 1.5rem;
  font-weight: 600;
}
</style>
