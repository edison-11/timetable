const express = require('express');
const { body, validationResult } = require('express-validator');
const TimetableEntry = require('../models/TimetableEntry');
const Assignment = require('../models/Assignment');
const Class = require('../models/Class');
const SystemSetting = require('../models/SystemSetting');
const { auth } = require('../middleware/auth');

const router = express.Router();

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const DAY_ORDER = new Map(DAYS.map((day, index) => [day, index]));

const normalizeTime = (time) => String(time || '').slice(0, 5);

const timeToMinutes = (time) => {
  const [hours, minutes] = normalizeTime(time).split(':').map(Number);
  return hours * 60 + minutes;
};

const minutesToTime = (minutes) => {
  const normalized = ((minutes % 1440) + 1440) % 1440;
  const hours = String(Math.floor(normalized / 60)).padStart(2, '0');
  const mins = String(normalized % 60).padStart(2, '0');
  return `${hours}:${mins}`;
};

const overlaps = (startA, endA, startB, endB) => {
  return startA < endB && endA > startB;
};

const normalizeSharedActivities = (activities) => {
  if (!Array.isArray(activities)) {
    return [];
  }

  return activities
    .map((activity) => ({
      activity_name: String(activity.activity_name || '').trim(),
      day_of_week: activity.day_of_week,
      start_time: normalizeTime(activity.start_time),
      end_time: normalizeTime(activity.end_time)
    }))
    .filter((activity) => {
      return activity.activity_name
        && DAYS.includes(activity.day_of_week)
        && activity.start_time
        && activity.end_time
        && timeToMinutes(activity.end_time) > timeToMinutes(activity.start_time);
    });
};

const buildGenerationItems = (slots, sharedActivities) => {
  const lessonItems = slots
    .filter((slot) => {
      return !sharedActivities.some((activity) => {
        return activity.day_of_week === slot.day_of_week
          && overlaps(
            timeToMinutes(slot.start_time),
            timeToMinutes(slot.end_time),
            timeToMinutes(activity.start_time),
            timeToMinutes(activity.end_time)
          );
      });
    })
    .map((slot) => ({
      type: 'lesson',
      day_of_week: slot.day_of_week,
      start_time: slot.start_time,
      end_time: slot.end_time
    }));

  const activityItems = sharedActivities.map((activity) => ({
    type: 'activity',
    day_of_week: activity.day_of_week,
    start_time: activity.start_time,
    end_time: activity.end_time,
    activity_name: activity.activity_name
  }));

  return [...lessonItems, ...activityItems].sort((a, b) => {
    const dayDiff = (DAY_ORDER.get(a.day_of_week) ?? 99) - (DAY_ORDER.get(b.day_of_week) ?? 99);
    if (dayDiff !== 0) return dayDiff;

    return timeToMinutes(a.start_time) - timeToMinutes(b.start_time);
  });
};

const getTeacherConflictsWithChangeover = async (teacherId, dayOfWeek, startTime, endTime, changeoverMinutes, excludeId = null) => {
  const buffer = Math.max(Number(changeoverMinutes || 0), 0);
  const bufferedStart = minutesToTime(timeToMinutes(startTime) - buffer);
  const bufferedEnd = minutesToTime(timeToMinutes(endTime) + buffer);

  return TimetableEntry.getTeacherConflicts(
    teacherId,
    dayOfWeek,
    bufferedStart,
    bufferedEnd,
    excludeId
  );
};

const buildSlots = ({ days, startTime, endTime, periodMinutes, changeoverMinutes, breaks }) => {
  const dayStart = timeToMinutes(startTime);
  const dayEnd = timeToMinutes(endTime);
  const slots = [];

  days.forEach((day) => {
    let cursor = dayStart;
    let teachingSinceLastChangeover = 0;

    while (cursor + periodMinutes <= dayEnd) {
      const slotStart = cursor;
      const slotEnd = cursor + periodMinutes;
      const hitsBreak = breaks.some((breakTime) => {
        return overlaps(
          slotStart,
          slotEnd,
          timeToMinutes(breakTime.start_time),
          timeToMinutes(breakTime.end_time)
        );
      });

      if (!hitsBreak) {
        slots.push({
          day_of_week: day,
          start_time: minutesToTime(slotStart),
          end_time: minutesToTime(slotEnd)
        });
        teachingSinceLastChangeover += periodMinutes;
        cursor = slotEnd;

        if (changeoverMinutes > 0 && teachingSinceLastChangeover >= 60) {
          cursor += changeoverMinutes;
          teachingSinceLastChangeover = 0;
        }
      } else {
        const nextBreakEnd = Math.max(
          ...breaks
            .filter((breakTime) => overlaps(
              slotStart,
              slotEnd,
              timeToMinutes(breakTime.start_time),
              timeToMinutes(breakTime.end_time)
            ))
            .map((breakTime) => timeToMinutes(breakTime.end_time))
        );
        cursor = nextBreakEnd;
        teachingSinceLastChangeover = 0;
      }
    }
  });

  return slots;
};

const toPositiveInteger = (value, fallback) => {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : fallback;
};

const addPeriods = (startMinutes, periodCount, periodMinutes, changeoverMinutes) => {
  const totalTeachingMinutes = periodCount * periodMinutes;
  const changeoverCount = changeoverMinutes > 0 ? Math.floor(totalTeachingMinutes / 60) : 0;
  return startMinutes + totalTeachingMinutes + (changeoverCount * changeoverMinutes);
};

const buildBreaksFromPeriodRules = ({ startTime, endTime, periodMinutes, changeoverMinutes, rules }) => {
  const dayStart = timeToMinutes(startTime);
  const dayEnd = timeToMinutes(endTime);
  const calculatedBreaks = [];
  let cursor = dayStart;

  const segments = [
    {
      break_name: 'Morning Break',
      periods: toPositiveInteger(rules.periods_before_morning_break, 3),
      duration: toPositiveInteger(rules.morning_break_minutes, 30)
    },
    {
      break_name: 'Lunch Break',
      periods: toPositiveInteger(rules.periods_before_lunch, 2),
      duration: toPositiveInteger(rules.lunch_break_minutes, 45)
    },
    {
      break_name: 'Evening Break',
      periods: toPositiveInteger(rules.periods_before_afternoon_break, 3),
      duration: toPositiveInteger(rules.afternoon_break_minutes, 30)
    }
  ];

  for (const segment of segments) {
    const breakStart = addPeriods(cursor, segment.periods, periodMinutes, changeoverMinutes);
    const breakEnd = breakStart + segment.duration;

    if (breakStart >= dayEnd || breakEnd >= dayEnd) break;

    calculatedBreaks.push({
      break_name: segment.break_name,
      start_time: minutesToTime(breakStart),
      end_time: minutesToTime(breakEnd)
    });

    cursor = breakEnd;
  }

  return calculatedBreaks;
};

const rankAssignments = (assignments, scheduledCounts) => {
  const totalHours = assignments.reduce((sum, assignment) => {
    return sum + Math.max(Number(assignment.hours_per_year || 1), 1);
  }, 0);
  const totalScheduled = assignments.reduce((sum, assignment) => {
    return sum + (scheduledCounts.get(assignment.assignment_id) || 0);
  }, 0);

  return assignments
    .map((assignment) => {
      const weight = Math.max(Number(assignment.hours_per_year || 1), 1);
      const expectedShare = weight / totalHours;
      const actualShare = totalScheduled
        ? (scheduledCounts.get(assignment.assignment_id) || 0) / totalScheduled
        : 0;

      return {
        assignment,
        score: expectedShare - actualShare
      };
    })
    .sort((a, b) => b.score - a.score)
    .map((item) => item.assignment);
};

// Create timetable entry
router.post('/', auth, [
  body('class_id').isInt().withMessage('Valid class ID is required'),
  body('assignment_id').isInt().withMessage('Valid assignment ID is required'),
  body('day_of_week').isIn(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']).withMessage('Invalid day of week'),
  body('start_time').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid start time format (HH:MM)'),
  body('end_time').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid end time format (HH:MM)'),
  body('room_id').optional().isInt()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { class_id, assignment_id, day_of_week, start_time, end_time, room_id } = req.body;

    // Check for class conflicts
    const classConflicts = await TimetableEntry.getConflicts(class_id, day_of_week, start_time, end_time);
    if (classConflicts.length > 0) {
      return res.status(400).json({ message: 'Class time conflict detected', conflicts: classConflicts });
    }

    const settings = await SystemSetting.getTimetableSettings();
    const changeoverMinutes = Number(settings.teacher_changeover_minutes ?? 5);

    // Check teacher conflicts, including the configured changeover buffer.
    const assignment = await require('../models/Assignment').findById(assignment_id);
    const module_name = assignment ? assignment.module_name : null;

    if (assignment) {
      const teacherConflicts = await getTeacherConflictsWithChangeover(
        assignment.teacher_id,
        day_of_week,
        start_time,
        end_time,
        changeoverMinutes
      );
      if (teacherConflicts.length > 0) {
        return res.status(400).json({ message: 'Teacher time conflict or changeover conflict detected', conflicts: teacherConflicts });
      }
    }

    // Check room conflicts if room is specified
    if (room_id) {
      const roomConflicts = await TimetableEntry.getRoomConflicts(room_id, day_of_week, start_time, end_time);
      if (roomConflicts.length > 0) {
        return res.status(400).json({ message: 'Room time conflict detected', conflicts: roomConflicts });
      }
    }

    const timetableId = await TimetableEntry.create({ class_id, assignment_id, day_of_week, start_time, end_time, room_id, module_name });
    const timetable = await TimetableEntry.findById(timetableId);

    res.status(201).json({
      message: 'Timetable entry created successfully',
      timetable
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Generate timetable entries per class. Classes with the same level remain separate by class_id.
router.post('/generate', auth, [
  body('class_id').optional({ nullable: true, checkFalsy: true }).isInt(),
  body('level').optional({ nullable: true, checkFalsy: true }).isInt(),
  body('days').optional().isArray(),
  body('start_time').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid start time format (HH:MM)'),
  body('end_time').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid end time format (HH:MM)'),
  body('period_minutes').isInt({ min: 1 }).withMessage('Period minutes must be at least 1'),
  body('replace_existing').optional().isBoolean(),
  body('shared_activities')
    .optional()
    .isArray()
    .withMessage('Shared activities must be a list')
    .custom((activities) => {
      const timePattern = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;

      for (const activity of activities) {
        if (!activity.activity_name || !String(activity.activity_name).trim()) {
          throw new Error('Activity name is required');
        }

        if (!DAYS.includes(activity.day_of_week)) {
          throw new Error('Activity day must be a valid weekday');
        }

        if (!timePattern.test(activity.start_time || '') || !timePattern.test(activity.end_time || '')) {
          throw new Error('Activity times must use HH:MM format');
        }

        if (timeToMinutes(activity.end_time) <= timeToMinutes(activity.start_time)) {
          throw new Error('Activity end time must be after start time');
        }
      }

      return true;
    })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      class_id,
      level,
      start_time,
      end_time,
      period_minutes,
      replace_existing = true
    } = req.body;

    const days = Array.isArray(req.body.days) && req.body.days.length
      ? req.body.days.filter((day) => DAYS.includes(day))
      : DAYS;
    const sharedActivities = normalizeSharedActivities(req.body.shared_activities);

    if (!days.length) {
      return res.status(400).json({ message: 'At least one valid day is required' });
    }

    const activitiesOutsideGeneratedDays = sharedActivities.filter((activity) => !days.includes(activity.day_of_week));
    if (activitiesOutsideGeneratedDays.length) {
      return res.status(400).json({ message: 'Shared activity day must be one of the selected generation days' });
    }

    if (timeToMinutes(end_time) <= timeToMinutes(start_time)) {
      return res.status(400).json({ message: 'End time must be after start time' });
    }

    const activitiesOutsideGeneratedTime = sharedActivities.filter((activity) => {
      return timeToMinutes(activity.start_time) < timeToMinutes(start_time)
        || timeToMinutes(activity.end_time) > timeToMinutes(end_time);
    });
    if (activitiesOutsideGeneratedTime.length) {
      return res.status(400).json({ message: 'Shared activity time must be inside the generated timetable hours' });
    }

    const settings = await SystemSetting.getTimetableSettings();
    const breakPeriodRules = settings.break_period_rules || {};
    const sharedChangeoverMinutes = Number(settings.teacher_changeover_minutes ?? 5);
    const allClasses = class_id ? [await Class.findById(class_id)] : await Class.getAll();
    const selectedClasses = allClasses
      .filter(Boolean)
      .filter((classItem) => !level || Number(classItem.level) === Number(level));
    const generated = [];
    const skipped = [];
    const classEntryCounts = [];

    for (const classItem of selectedClasses) {
      const assignments = await Assignment.getByClass(classItem.class_id);

      if (!assignments.length) {
        skipped.push({
          class_id: classItem.class_id,
          class_name: classItem.class_name,
          reason: 'No module assignments for this class'
        });
        continue;
      }

      if (replace_existing) {
        await TimetableEntry.deleteByClass(classItem.class_id);
      }

      // Use one shared changeover rule for every class so generation stays consistent across all timetables.
      const changeoverMinutes = sharedChangeoverMinutes;

      const breaks = breakPeriodRules.enabled
        ? buildBreaksFromPeriodRules({
            startTime: start_time,
            endTime: end_time,
            periodMinutes: Number(period_minutes),
            changeoverMinutes,
            rules: breakPeriodRules
          })
        : (Array.isArray(settings.timetable_breaks) ? settings.timetable_breaks : []);

      const slots = buildSlots({
        days,
        startTime: start_time,
        endTime: end_time,
        periodMinutes: Number(period_minutes),
        changeoverMinutes,
        breaks
      });
      const generationItems = buildGenerationItems(slots, sharedActivities);

      const scheduledCounts = new Map();
      let classCount = 0;

      for (const item of generationItems) {
        if (item.type === 'activity') {
          const timetableId = await TimetableEntry.create({
            class_id: classItem.class_id,
            assignment_id: null,
            day_of_week: item.day_of_week,
            start_time: item.start_time,
            end_time: item.end_time,
            room_id: null,
            module_name: item.activity_name,
            entry_type: 'activity'
          });
          const timetable = await TimetableEntry.findById(timetableId);
          generated.push(timetable);
          classCount += 1;
          continue;
        }

        let scheduledAssignment = null;
        let hasConflict = false;

        for (const assignment of rankAssignments(assignments, scheduledCounts)) {
          const teacherConflicts = await getTeacherConflictsWithChangeover(
            assignment.teacher_id,
            item.day_of_week,
            item.start_time,
            item.end_time,
            changeoverMinutes
          );

          if (!teacherConflicts.length) {
            scheduledAssignment = assignment;
            hasConflict = false;
            break;
          }
        }

        if (!scheduledAssignment) {
          scheduledAssignment = rankAssignments(assignments, scheduledCounts)[0];
          hasConflict = true;

          if (!scheduledAssignment) {
            continue;
          }
        }

        const timetableId = await TimetableEntry.create({
          class_id: classItem.class_id,
          assignment_id: scheduledAssignment.assignment_id,
          day_of_week: item.day_of_week,
          start_time: item.start_time,
          end_time: item.end_time,
          room_id: null,
          module_name: scheduledAssignment.module_name,
          entry_type: 'lesson'
        });
        const timetable = await TimetableEntry.findById(timetableId);
        timetable.has_conflict = hasConflict;
        generated.push(timetable);
        scheduledCounts.set(
          scheduledAssignment.assignment_id,
          (scheduledCounts.get(scheduledAssignment.assignment_id) || 0) + 1
        );
        classCount += 1;
      }

      classEntryCounts.push({
        class_id: classItem.class_id,
        class_name: classItem.class_name,
        entries: classCount,
        expected_entries: generationItems.length
      });

      if (!classCount) {
        skipped.push({
          class_id: classItem.class_id,
          class_name: classItem.class_name,
          reason: 'No available slots generated for this class'
        });
      }
    }

    res.status(201).json({
      message: 'Timetable generated successfully',
      generated_count: generated.length,
      generated,
      class_entry_counts: classEntryCounts,
      skipped
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all timetable entries
router.get('/', auth, async (req, res) => {
  try {
    const timetables = await TimetableEntry.getAll();
    res.json({ timetables });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get timetable entry by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const timetable = await TimetableEntry.findById(req.params.id);
    if (!timetable) {
      return res.status(404).json({ message: 'Timetable entry not found' });
    }
    res.json({ timetable });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get timetable by class
router.get('/class/:class_id', auth, async (req, res) => {
  try {
    const timetables = await TimetableEntry.getByClass(req.params.class_id);
    res.json({ timetables });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get weekly schedule for class
router.get('/class/:class_id/weekly', auth, async (req, res) => {
  try {
    const schedule = await TimetableEntry.getWeeklySchedule(req.params.class_id);
    res.json({ schedule });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get timetable by teacher
router.get('/teacher/:teacher_id', auth, async (req, res) => {
  try {
    const timetables = await TimetableEntry.getByTeacher(req.params.teacher_id);
    res.json({ timetables });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get timetable by room
router.get('/room/:room_id', auth, async (req, res) => {
  try {
    const timetables = await TimetableEntry.getByRoom(req.params.room_id);
    res.json({ timetables });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get timetable by day
router.get('/day/:day_of_week', auth, async (req, res) => {
  try {
    const timetables = await TimetableEntry.getByDay(req.params.day_of_week);
    res.json({ timetables });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update timetable entry
router.put('/:id', auth, [
  body('class_id').optional().isInt(),
  body('assignment_id').optional().isInt(),
  body('day_of_week').optional().isIn(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']),
  body('start_time').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  body('end_time').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  body('room_id').optional().isInt()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { class_id, assignment_id, day_of_week, start_time, end_time, room_id } = req.body;

    // Check for conflicts if updating time-related fields
    if (class_id && day_of_week && start_time && end_time) {
      const classConflicts = await TimetableEntry.getConflicts(class_id, day_of_week, start_time, end_time, req.params.id);
      if (classConflicts.length > 0) {
        return res.status(400).json({ message: 'Class time conflict detected', conflicts: classConflicts });
      }

      if (assignment_id) {
        const assignment = await require('../models/Assignment').findById(assignment_id);
        if (assignment) {
          const settings = await SystemSetting.getTimetableSettings();
          const changeoverMinutes = Number(settings.teacher_changeover_minutes ?? 5);
          const teacherConflicts = await getTeacherConflictsWithChangeover(
            assignment.teacher_id,
            day_of_week,
            start_time,
            end_time,
            changeoverMinutes,
            req.params.id
          );
          if (teacherConflicts.length > 0) {
            return res.status(400).json({ message: 'Teacher time conflict or changeover conflict detected', conflicts: teacherConflicts });
          }
        }
      }

      if (room_id) {
        const roomConflicts = await TimetableEntry.getRoomConflicts(room_id, day_of_week, start_time, end_time, req.params.id);
        if (roomConflicts.length > 0) {
          return res.status(400).json({ message: 'Room time conflict detected', conflicts: roomConflicts });
        }
      }
    }

    const updateData = {};
    if (class_id) updateData.class_id = class_id;
    if (assignment_id) updateData.assignment_id = assignment_id;
    if (day_of_week) updateData.day_of_week = day_of_week;
    if (start_time) updateData.start_time = start_time;
    if (end_time) updateData.end_time = end_time;
    if (room_id !== undefined) updateData.room_id = room_id;

    await TimetableEntry.update(req.params.id, updateData);
    const updatedTimetable = await TimetableEntry.findById(req.params.id);

    res.json({
      message: 'Timetable entry updated successfully',
      timetable: updatedTimetable
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete timetable entry
router.delete('/:id', auth, async (req, res) => {
  try {
    const timetable = await TimetableEntry.findById(req.params.id);
    if (!timetable) {
      return res.status(404).json({ message: 'Timetable entry not found' });
    }

    await TimetableEntry.delete(req.params.id);
    res.json({ message: 'Timetable entry deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
