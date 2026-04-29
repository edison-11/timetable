<template>
  <div class="min-vh-100">
    <header class="header-custom">
      <div class="container-fluid px-4 py-3 d-flex justify-content-between align-items-center">
        <div class="d-flex align-items-center gap-3">
          <div class="d-flex align-items-center justify-center bg-primary rounded" style="width: 40px; height: 40px; font-size: 20px;">📅</div>
          <h1 class="h2 mb-0">Shifts Management</h1>
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
            <h2 class="h3 fw-semibold text-dark">All Shifts</h2>
            <button class="btn btn-primary-custom">Add New Shift</button>
          </div>
          <div class="text-center py-5 text-muted">
            <div class="display-1 mb-4">⏰</div>
            <p class="lead">Shifts management interface will be implemented here</p>
            <div class="mt-4">
              <div class="row g-3">
                <div class="col-md-6">
                  <div class="alert alert-info" role="alert">
                    <div class="d-flex align-items-center">
                      <div class="fs-3 me-3">🌅</div>
                      <div>
                        <h5 class="alert-heading">Morning Shift</h5>
                        <p class="mb-0">8:00 AM - 12:00 PM</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="alert alert-warning" role="alert">
                    <div class="d-flex align-items-center">
                      <div class="fs-3 me-3">🌞</div>
                      <div>
                        <h5 class="alert-heading">Afternoon Shift</h5>
                        <p class="mb-0">1:00 PM - 5:00 PM</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="alert alert-primary" role="alert">
                    <div class="d-flex align-items-center">
                      <div class="fs-3 me-3">🌆</div>
                      <div>
                        <h5 class="alert-heading">Evening Shift</h5>
                        <p class="mb-0">6:00 PM - 10:00 PM</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="alert alert-secondary" role="alert">
                    <div class="d-flex align-items-center">
                      <div class="fs-3 me-3">🌙</div>
                      <div>
                        <h5 class="alert-heading">Night Shift</h5>
                        <p class="mb-0">11:00 PM - 3:00 AM</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const navigation = [
  { name: 'Dashboard', path: '/dashboard', icon: '📊' },
  { name: 'Teachers', path: '/teachers', icon: '👥' },
  { name: 'Modules', path: '/modules', icon: '📚' },
  { name: 'Classes', path: '/classes', icon: '🏫' },
  { name: 'Sections', path: '/sections', icon: '🏛️' },
  { name: 'Rooms', path: '/rooms', icon: '🏠' },
  { name: 'Shifts', path: '/shifts', icon: '⏰' },
  { name: 'Assignments', path: '/assignments', icon: '📋' },
  { name: 'Bus Routes', path: '/bus-routes', icon: '🚌' },
  { name: 'Timetable', path: '/timetable', icon: '📅' }
]
</script>
