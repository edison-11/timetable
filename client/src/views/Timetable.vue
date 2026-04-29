<template>
  <div class="min-vh-100">
    <header class="header-custom">
      <div class="container-fluid px-4 py-3 d-flex justify-content-between align-items-center">
        <div class="d-flex align-items-center gap-3">
          <div class="d-flex align-items-center justify-center bg-primary rounded" style="width: 40px; height: 40px; font-size: 20px;">📅</div>
          <h1 class="h2 mb-0">Timetable Management</h1>
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
            <h2 class="h3 fw-semibold text-dark">Timetable Schedule</h2>
            <button class="btn btn-primary-custom">Generate Timetable</button>
          </div>
          <div class="text-center py-5 text-muted">
            <div class="display-1 mb-4">📅</div>
            <p class="lead">Timetable management interface will be implemented here</p>
            <div class="mt-4">
              <div class="table-responsive">
                <table class="table table-bordered">
                  <thead class="table-light">
                    <tr>
                      <th scope="col">Time</th>
                      <th scope="col">Monday</th>
                      <th scope="col">Tuesday</th>
                      <th scope="col">Wednesday</th>
                      <th scope="col">Thursday</th>
                      <th scope="col">Friday</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <th scope="row">8:00-9:00</th>
                      <td class="table-primary">Math</td>
                      <td>English</td>
                      <td class="table-success">Science</td>
                      <td>History</td>
                      <td class="table-warning">Art</td>
                    </tr>
                    <tr>
                      <th scope="row">9:00-10:00</th>
                      <td>English</td>
                      <td class="table-info">Computer</td>
                      <td>Math</td>
                      <td class="table-danger">Physics</td>
                      <td>Music</td>
                    </tr>
                    <tr>
                      <th scope="row">10:00-11:00</th>
                      <td class="table-secondary">Break</td>
                      <td class="table-secondary">Break</td>
                      <td class="table-secondary">Break</td>
                      <td class="table-secondary">Break</td>
                      <td class="table-secondary">Break</td>
                    </tr>
                    <tr>
                      <th scope="row">11:00-12:00</th>
                      <td>Science</td>
                      <td class="table-primary">Math</td>
                      <td>English</td>
                      <td>Geography</td>
                      <td class="table-success">Chemistry</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div class="mt-4">
                <div class="btn-group" role="group">
                  <button type="button" class="btn btn-outline-primary">Week View</button>
                  <button type="button" class="btn btn-outline-secondary">Month View</button>
                  <button type="button" class="btn btn-outline-success">Export</button>
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
