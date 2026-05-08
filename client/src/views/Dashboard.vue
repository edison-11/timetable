<template>
  <AppLayout>
    <div class="dashboard-container">
    
      <!-- Title -->
      <div class="dashboard-title-row">
        <div>
          <h1>Timetable Dashboard</h1>
          <p>Overview of timetable statistics and management</p>
        </div>
        <div class="week-picker">
          <span class="calendar-mark"></span>
          <span>{{ weekRange }}</span>
          <span class="chevron">▼</span>
        </div>
      </div>

      <!-- 4 Metric Cards -->
      <div class="metric-grid">
        <div class="metric-card">
          <div class="metric-icon blue">📅</div>
          <div class="metric-copy">
            <span>Total Timetables</span>
            <strong>12</strong>
            <small>All departments</small>
          </div>
        </div>
        <div class="metric-card">
          <div class="metric-icon green">📚</div>
          <div class="metric-copy">
            <span>Total Subjects</span>
            <strong>48</strong>
            <small>Across all classes</small>
          </div>
        </div>
        <div class="metric-card">
          <div class="metric-icon violet">👨‍🏫</div>
          <div class="metric-copy">
            <span>Total Teachers</span>
            <strong>32</strong>
            <small>Active teachers</small>
          </div>
        </div>
        <div class="metric-card">
          <div class="metric-icon amber">🏢</div>
          <div class="metric-copy">
            <span>Total Rooms</span>
            <strong>18</strong>
            <small>Available rooms</small>
          </div>
        </div>
      </div>

      <!-- Weekly Timetable Overview - PANEL IMWE GUSA -->
      <div class="panel">
        <div class="panel-header">
          <h2>Weekly Timetable Overview</h2>
          <div>
            <select class="class-select">
              <option>All Classes</option>
              <option>B.Tech 1st Year</option>
            </select>
            <router-link to="/timetable" class="primary-link">View Full Timetable</router-link>
          </div>
        </div>

        <div class="timetable-wrap">
          <table class="overview-table">
            <thead>
              <tr>
                <th>Time / Day</th>
                <th>Monday</th>
                <th>Tuesday</th>
                <th>Wednesday</th>
                <th>Thursday</th>
                <th>Friday</th>
                <th>Saturday</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in timetableRows" :key="row.time">
                <td class="time-cell">{{ row.time }}</td>
                <td v-for="day in days" :key="day">
                  <div v-if="row[day]" class="class-block">
                    <strong>{{ row[day].subject }}</strong>
                    <span>{{ row[day].room }}</span>
                  </div>
                  <div v-else class="empty-block">—</div>
                </td>
              </tr>
              <tr class="lunch-row">
                <td colspan="7" class="lunch-cell">🍽️ LUNCH BREAK</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- 3 Bottom Cards -->
      <div class="three-cards">
        <div class="panel">
          <div class="panel-title">📊<h3>Timetable Distribution</h3></div>
          <div class="distribution-content">
            <div class="donut"></div>
            <div class="legend">
              <div><span style="background:#3b82f6"></span>Science <em>45% (5)</em></div>
              <div><span style="background:#22c55e"></span>Engineering <em>30% (3)</em></div>
              <div><span style="background:#f97316"></span>Commerce <em>15% (2)</em></div>
              <div><span style="background:#8b5cf6"></span>Arts <em>10% (2)</em></div>
            </div>
          </div>
        </div>
        <div class="panel">
          <div class="panel-title">🏢<h3>Room Utilization</h3></div>
          <div class="utilization-bar"><span style="width:72%"></span></div>
          <div class="utilization-value">72%</div>
          <p>Average Utilization</p>
          <div class="room-stats"><div><strong>13</strong> Used</div><div><strong>5</strong> Available</div></div>
        </div>
        <div class="panel">
          <div class="panel-title">👩‍🏫<h3>Teacher Workload</h3></div>
          <div class="workload-bars">
            <div><span style="height:45%"></span><small>0-10</small></div>
            <div><span style="height:72%"></span><small>10-20</small></div>
            <div><span style="height:88%"></span><small>20-30</small></div>
            <div><span style="height:64%"></span><small>30-40</small></div>
            <div><span style="height:28%"></span><small>40+</small></div>
          </div>
        </div>
      </div>
    </div>      <!-- Right Sidebar - Quick Actions & Notifications -->
      <div class="dashboard-sidebar">
        <!-- Quick Actions -->
        <div class="panel">
          <div class="panel-header">
            <h3>⚡ Quick Actions</h3>
          </div>
          <div class="actions-list">
            <router-link to="/timetable" class="action-item">
              <span class="action-icon blue">➕</span>
              <div>
                <strong>Create Timetable</strong>
                <small>Generate new timetable</small>
              </div>
            </router-link>
            <router-link to="/classes" class="action-item">
              <span class="action-icon green">📚</span>
              <div>
                <strong>Add Class</strong>
                <small>Create new class</small>
              </div>
            </router-link>
            <router-link to="/modules" class="action-item">
              <span class="action-icon violet">📖</span>
              <div>
                <strong>Add Subject</strong>
                <small>Create new subject</small>
              </div>
            </router-link>
            <router-link to="/teachers" class="action-item">
              <span class="action-icon amber">👨‍🏫</span>
              <div>
                <strong>Add Teacher</strong>
                <small>Register new teacher</small>
              </div>
            </router-link>
            <router-link to="/rooms" class="action-item">
              <span class="action-icon rose">🏠</span>
              <div>
                <strong>Add Room</strong>
                <small>Add new classroom</small>
              </div>
            </router-link>
          </div>
        </div>

        <!-- Notifications -->
        <div class="panel">
          <div class="panel-header">
            <h3>🔔 Notifications</h3>
            <button class="view-all">View All</button>
          </div>
          <div class="notifications-list">
            <div class="notification">
              <span class="dot blue"></span>
              <div class="notification-content">
                <strong>Timetable published for B.Tech 1st Year</strong>
                <small>2 hours ago</small>
              </div>
            </div>
            <div class="notification">
              <span class="dot amber"></span>
              <div class="notification-content">
                <strong>Room 101 is booked on Monday 10:00 AM</strong>
                <small>5 hours ago</small>
              </div>
            </div>
            <div class="notification">
              <span class="dot green"></span>
              <div class="notification-content">
                <strong>New teacher John Doe added successfully</strong>
                <small>1 day ago</small>
              </div>
            </div>
            <div class="notification">
              <span class="dot violet"></span>
              <div class="notification-content">
                <strong>Holiday added on May 25, 2024</strong>
                <small>2 days ago</small>
              </div>
            </div>
          </div>
        </div>

        <!-- Academic Year -->
        <div class="academic-card">
          <span>Academic Year</span>
          <strong>2023 - 2024</strong>
        </div>
      </div>
  </AppLayout>
</template>

<script setup>
import { ref } from 'vue'
import AppLayout from '@/components/AppLayout.vue'

const weekRange = ref('May 8 - May 14, 2024')
const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const timetableRows = ref([
  { time: '08:00-09:00', Monday: { subject: 'Mathematics', room: 'R101' }, Tuesday: { subject: 'Physics', room: 'R102' }, Wednesday: { subject: 'Chemistry', room: 'R103' }, Thursday: { subject: 'Mathematics', room: 'R101' }, Friday: { subject: 'English', room: 'R104' }, Saturday: { subject: 'CS', room: 'Lab1' } },
  { time: '09:00-10:00', Monday: { subject: 'Physics', room: 'R102' }, Tuesday: { subject: 'Mathematics', room: 'R101' }, Wednesday: { subject: 'English', room: 'R104' }, Thursday: { subject: 'Chemistry', room: 'R103' }, Friday: { subject: 'Physics', room: 'R102' }, Saturday: { subject: 'Mathematics', room: 'R101' } },
  { time: '10:00-11:00', Monday: { subject: 'Chemistry', room: 'R103' }, Tuesday: { subject: 'English', room: 'R104' }, Wednesday: { subject: 'Mathematics', room: 'R101' }, Thursday: { subject: 'Physics', room: 'R102' }, Friday: { subject: 'Chemistry', room: 'R103' }, Saturday: { subject: 'English', room: 'R104' } },
  { time: '11:00-12:00', Monday: { subject: 'English', room: 'R104' }, Tuesday: { subject: 'Chemistry', room: 'R103' }, Wednesday: { subject: 'Physics', room: 'R102' }, Thursday: { subject: 'English', room: 'R104' }, Friday: { subject: 'Mathematics', room: 'R101' }, Saturday: { subject: 'Physics', room: 'R102' } },
  { time: '13:00-14:00', Monday: { subject: 'CS', room: 'Lab1' }, Tuesday: { subject: 'Mathematics', room: 'R101' }, Wednesday: { subject: 'CS', room: 'Lab1' }, Thursday: { subject: 'CS', room: 'Lab1' }, Friday: { subject: 'English', room: 'R104' }, Saturday: { subject: 'Chemistry', room: 'R103' } },
  { time: '14:00-15:00', Monday: { subject: 'Physics', room: 'R102' }, Tuesday: { subject: 'CS', room: 'Lab1' }, Wednesday: { subject: 'English', room: 'R104' }, Thursday: { subject: 'Mathematics', room: 'R101' }, Friday: { subject: 'CS', room: 'Lab1' }, Saturday: { subject: 'English', room: 'R104' } },
  { time: '15:00-16:00', Monday: { subject: 'Extra', room: 'R105' }, Tuesday: { subject: 'Library', room: 'Library' }, Wednesday: { subject: 'Seminar', room: 'HallA' }, Thursday: { subject: 'Extra', room: 'R105' }, Friday: { subject: 'Library', room: 'Library' }, Saturday: { subject: 'Seminar', room: 'HallA' } }
])
</script>

<style scoped>
/* Dashboard Right Sidebar */
.dashboard-sidebar {
  margin-top: 1.5rem;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.actions-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.action-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.6rem;
  background: #f8fafc;
  border-radius: 8px;
  text-decoration: none;
  color: #0f172a;
  transition: all 0.2s;
  border: 1px solid #e2e8f0;
}

.action-item:hover {
  background: #f1f5f9;
  transform: translateX(4px);
  border-color: #3b82f6;
}

.action-item strong {
  display: block;
  font-size: 0.8rem;
}

.action-item small {
  font-size: 0.6rem;
  color: #64748b;
}

.action-icon {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  font-size: 1.1rem;
}

.notifications-list {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.notification {
  display: flex;
  gap: 0.6rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #e2e8f0;
}

.notification:last-child {
  border-bottom: none;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-top: 0.3rem;
  flex-shrink: 0;
}

.notification-content strong {
  display: block;
  font-size: 0.75rem;
}

.notification-content small {
  font-size: 0.6rem;
  color: #94a3b8;
}

.view-all {
  background: none;
  border: none;
  color: #3b82f6;
  font-size: 0.7rem;
  cursor: pointer;
}

.view-all:hover {
  text-decoration: underline;
}

.academic-card {
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 12px;
  padding: 0.8rem;
  color: white;
  text-align: center;
}

.academic-card span {
  display: block;
  font-size: 0.65rem;
  opacity: 0.9;
}

.academic-card strong {
  display: block;
  font-size: 0.9rem;
  margin-top: 0.2rem;
}

@media (max-width: 900px) {
  .dashboard-sidebar {
    grid-template-columns: 1fr;
  }
}
.dashboard-container {
  max-width: 1400px;
  margin: 0 auto;
}

.dashboard-title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.dashboard-title-row h1 {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 0.25rem;
}

.dashboard-title-row p {
  color: #64748b;
  font-size: 0.8rem;
}

.week-picker {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: white;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.metric-card {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  background: white;
  padding: 1rem;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}

.metric-icon {
  width: 45px;
  height: 45px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  font-size: 1.2rem;
}

.metric-copy span {
  font-size: 0.65rem;
  text-transform: uppercase;
  color: #64748b;
}

.metric-copy strong {
  display: block;
  font-size: 1.3rem;
}

.blue { background: #dbeafe; }
.green { background: #dcfce7; }
.violet { background: #e9d5ff; }
.amber { background: #fed7aa; }

.panel {
  background: white;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  padding: 1rem;
  margin-bottom: 1.5rem;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.panel-header h2 {
  font-size: 1rem;
  font-weight: 600;
}

.class-select, .primary-link {
  padding: 0.4rem 0.8rem;
  border-radius: 6px;
  font-size: 0.75rem;
}

.primary-link {
  background: #3b82f6;
  color: white;
  text-decoration: none;
  margin-left: 0.5rem;
}

.timetable-wrap {
  overflow-x: auto;
}

.overview-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.7rem;
}

.overview-table th, .overview-table td {
  border: 1px solid #e2e8f0;
  padding: 0.5rem;
  text-align: left;
}

.time-cell {
  background: #f8fafc;
  font-weight: 600;
}

.class-block {
  background: #eff6ff;
  padding: 0.2rem;
  border-radius: 4px;
  border-left: 3px solid #3b82f6;
}

.class-block strong {
  display: block;
  font-size: 0.7rem;
}

.class-block span {
  font-size: 0.6rem;
  color: #64748b;
}

.empty-block {
  text-align: center;
  color: #cbd5e1;
}

.lunch-row td {
  background: #fef3c7;
  text-align: center;
}

.three-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.panel-title {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  margin-bottom: 0.5rem;
}

.panel-title h3 {
  font-size: 0.9rem;
  margin: 0;
}

.distribution-content {
  display: flex;
  gap: 0.8rem;
  align-items: center;
}

.donut {
  width: 70px;
  height: 70px;
  border-radius: 50%;
  background: conic-gradient(#3b82f6 0% 45%, #22c55e 45% 75%, #f97316 75% 90%, #8b5cf6 90% 100%);
}

.legend div {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.65rem;
  margin-bottom: 0.2rem;
}

.legend span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.utilization-bar {
  height: 6px;
  background: #e2e8f0;
  border-radius: 3px;
  margin: 0.5rem 0;
}

.utilization-bar span {
  display: block;
  height: 100%;
  background: #3b82f6;
  border-radius: 3px;
}

.utilization-value {
  font-size: 1.2rem;
  font-weight: 700;
}

.room-stats {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.workload-bars {
  display: flex;
  justify-content: space-around;
  align-items: flex-end;
  height: 80px;
}

.workload-bars div {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2rem;
  flex: 1;
}

.workload-bars span {
  width: 25px;
  background: #3b82f6;
  border-radius: 3px 3px 0 0;
}

@media (max-width: 900px) {
  .metric-grid { grid-template-columns: repeat(2, 1fr); }
  .three-cards { grid-template-columns: 1fr; }
}
</style>