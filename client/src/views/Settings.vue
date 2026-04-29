<template>
  <div class="min-vh-100">
    <!-- Header -->
    <header class="header-custom">
      <div class="container-fluid px-4 py-3 d-flex justify-content-between align-items-center">
        <div class="d-flex align-items-center gap-3">
          <div class="d-flex align-items-center justify-center bg-primary rounded" style="width: 40px; height: 40px; font-size: 20px;">
            ⚙️
          </div>
          <h1 class="h2 mb-0">Settings</h1>
        </div>
        <div class="d-flex align-items-center gap-3">
          <router-link to="/dashboard" class="text-light opacity-75 text-decoration-none">Dashboard</router-link>
          <div class="d-flex align-items-center justify-center bg-primary rounded-circle" style="width: 40px; height: 40px;">
            A
          </div>
        </div>
      </div>
    </header>

    <div class="d-flex">
      <!-- Sidebar -->
      <nav class="sidebar-custom" style="width: 250px;">
        <div class="p-3">
          <router-link 
            v-for="item in navigation" 
            :key="item.name"
            :to="item.path"
            class="nav-item-custom d-block mb-2"
            :class="{ 'active': $route.path === item.path }"
          >
            <span class="fs-5">{{ item.icon }}</span>
            <span>{{ item.name }}</span>
          </router-link>
        </div>
      </nav>

      <!-- Main Content -->
      <main class="flex-grow-1 p-4">
        <div class="card-custom">
          <div class="d-flex justify-content-between align-items-center mb-4">
            <h2 class="h3 fw-semibold text-dark">System Settings</h2>
          </div>

          <div class="row g-4">
            <div class="col-12 col-md-6">
              <div class="card border-0 shadow-sm">
                <div class="card-body">
                  <h5 class="card-title">🏫 School Information</h5>
                  <div class="mt-3">
                    <label class="form-label">School Name</label>
                    <input type="text" class="form-control" placeholder="Enter school name">
                  </div>
                  <div class="mt-3">
                    <label class="form-label">Academic Year</label>
                    <input type="text" class="form-control" placeholder="2023-2024">
                  </div>
                  <div class="mt-3">
                    <label class="form-label">Semester</label>
                    <select class="form-select">
                      <option>Fall 2023</option>
                      <option>Spring 2024</option>
                      <option>Fall 2024</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
            <div class="col-12 col-md-6">
              <div class="card border-0 shadow-sm">
                <div class="card-body">
                  <h5 class="card-title">👤 User Settings</h5>
                  <div class="mt-3">
                    <label class="form-label">Admin Email</label>
                    <input type="email" class="form-control" placeholder="admin@school.com">
                  </div>
                  <div class="mt-3">
                    <label class="form-label">Notification Preferences</label>
                    <div class="form-check">
                      <input class="form-check-input" type="checkbox" id="emailNotif">
                      <label class="form-check-label" for="emailNotif">
                        Email notifications
                      </label>
                    </div>
                  </div>
                  <div class="mt-3">
                    <label class="form-label">Theme</label>
                    <select class="form-select">
                      <option>Light</option>
                      <option>Dark</option>
                      <option>Auto</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="row g-4 mt-4">
            <div class="col-12">
              <div class="card border-0 shadow-sm">
                <div class="card-body">
                  <h5 class="card-title">🔒 Security Settings</h5>
                  <div class="mt-3">
                    <label class="form-label">Session Timeout (minutes)</label>
                    <input type="number" class="form-control" placeholder="30" value="30">
                  </div>
                  <div class="mt-3">
                    <label class="form-label">Password Policy</label>
                    <div class="form-check">
                      <input class="form-check-input" type="checkbox" id="strongPassword">
                      <label class="form-check-label" for="strongPassword">
                        Require strong passwords
                      </label>
                    </div>
                  </div>
                  <div class="mt-3">
                    <label class="form-label">Two-Factor Authentication</label>
                    <div class="form-check">
                      <input class="form-check-input" type="checkbox" id="twoFactor">
                      <label class="form-check-label" for="twoFactor">
                        Enable 2FA
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="row g-4 mt-4">
            <div class="col-12">
              <button class="btn btn-primary-custom btn-lg">
                💾 Save Settings
              </button>
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
  { name: 'Timetable', path: '/timetable', icon: '📅' },
  { name: 'Settings', path: '/settings', icon: '⚙️' }
]
</script>
