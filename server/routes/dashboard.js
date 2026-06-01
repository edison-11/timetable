const express = require('express');
const TimetableEntry = require('../models/TimetableEntry');
const Room = require('../models/Room');
const { getRequestSchoolId } = require('../utils/tenant');

const router = express.Router();

const normalizeLabel = (value) => {
  const v = String(value || '').trim();
  return v || null;
};

const isBreakModule = (moduleName) => {
  const m = String(moduleName || '').toLowerCase();
  return m.includes('break');
};

router.get('/stats', async (req, res) => {
  try {
    const school_id = getRequestSchoolId(req);

    const [timetables, rooms] = await Promise.all([
      TimetableEntry.getAll({ school_id }),
      Room.getAll({ school_id })
    ]);

    // 1) Timetable Distribution (by module_name)
    const moduleCounts = new Map();
    for (const entry of timetables) {
      const moduleName = normalizeLabel(entry.module_name);
      if (!moduleName) continue;
      if (isBreakModule(moduleName)) continue;

      moduleCounts.set(moduleName, (moduleCounts.get(moduleName) || 0) + 1);
    }

    const totalModules = Array.from(moduleCounts.values()).reduce((a, b) => a + b, 0);
    const distribution = Array.from(moduleCounts.entries())
      .map(([module_name, count]) => ({
        module_name,
        count,
        percent: totalModules ? Math.round((count / totalModules) * 100) : 0
      }))
      .sort((a, b) => b.count - a.count);

    // Keep it readable: top 4
    const distributionTop = distribution.slice(0, 4);

    // 2) Room Utilization
    const roomsTotal = Array.isArray(rooms) ? rooms.length : 0;
    const usedRoomIds = new Set(
      timetables
        .map((e) => e.room_id)
        .filter((id) => id !== null && id !== undefined)
    );
    const usedRooms = usedRoomIds.size;
    const availableRooms = Math.max(roomsTotal - usedRooms, 0);
    const roomUtilization = roomsTotal ? Math.round((usedRooms / roomsTotal) * 100) : 0;

    // 3) Teacher Workload (bucket by entry count per teacher)
    const teacherCounts = new Map();
    for (const entry of timetables) {
      const teacherName = normalizeLabel(entry.teacher_name);
      if (!teacherName) continue;
      if (entry.entry_type === 'break') continue;
      if (isBreakModule(entry.module_name)) continue;

      teacherCounts.set(teacherName, (teacherCounts.get(teacherName) || 0) + 1);
    }

    const workloadBuckets = [
      { label: '0-10', min: 0, max: 10 },
      { label: '10-20', min: 10, max: 20 },
      { label: '20-30', min: 20, max: 30 },
      { label: '30-40', min: 30, max: 40 },
      { label: '40+', min: 40, max: Infinity }
    ];

    const bucketCounts = new Array(workloadBuckets.length).fill(0);
    for (const count of teacherCounts.values()) {
      const idx = workloadBuckets.findIndex((b) => count >= b.min && count < b.max);
      if (idx >= 0) bucketCounts[idx] += 1;
    }

    // For display as bar heights: normalize to max bucket count (avoid all-zero)
    const bucketMax = Math.max(...bucketCounts, 1);
    const workloadBars = bucketCounts.map((count) => Math.round((count / bucketMax) * 100));

    res.json({
      distribution: distributionTop,
      roomUtilization,
      usedRooms,
      availableRooms,
      workload: {
        bars: workloadBars,
        buckets: workloadBuckets.map((bucket, index) => ({
          label: bucket.label,
          count: bucketCounts[index],
          percent: workloadBars[index]
        }))
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
