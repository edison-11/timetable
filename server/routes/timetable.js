const express = require('express');
const { body, validationResult } = require('express-validator');
const TimetableEntry = require('../models/TimetableEntry');
const Assignment = require('../models/Assignment');
const Class = require('../models/Class');
const Room = require('../models/Room');
const SystemSetting = require('../models/SystemSetting');
const Notification = require('../models/Notification');
const { auth } = require('../middleware/auth');
const conflictDetectionService = require('../services/conflictDetection');
const {
  FIXED_DAYS,
  FIXED_TIMETABLE_ROWS,
  FIXED_PERIODS,
  FIXED_BREAKS,
  buildTimetableRowsFromSettings,
  findFixedPeriod
} = require('../services/fixedTimetableStructure');

const router = express.Router();

const DAYS = FIXED_DAYS;
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
  const items = [];

  for (const slot of slots) {
    // Check if this slot overlaps with any shared activity
    const overlappingActivity = sharedActivities.find((activity) => {
      return activity.day_of_week === slot.day_of_week
        && overlaps(
          timeToMinutes(slot.start_time),
          timeToMinutes(slot.end_time),
          timeToMinutes(activity.start_time),
          timeToMinutes(activity.end_time)
        );
    });

    if (overlappingActivity) {
      // Replace the slot with the activity, but keep the slot's time
      items.push({
        type: 'activity',
        day_of_week: slot.day_of_week,
        start_time: overlappingActivity.start_time,
        end_time: overlappingActivity.end_time,
        activity_name: overlappingActivity.activity_name,
        original_activity_time: {
          start: overlappingActivity.start_time,
          end: overlappingActivity.end_time
        }
      });
    } else {
      // Keep the slot as a lesson
      items.push({
        type: 'lesson',
        day_of_week: slot.day_of_week,
        start_time: slot.start_time,
        end_time: slot.end_time
      });
    }
  }

  return items.sort((a, b) => {
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

const toNonNegativeInteger = (value, fallback) => {
  const number = Number(value);
  return Number.isInteger(number) && number >= 0 ? number : fallback;
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

const buildScheduleFromPeriodRules = ({ days, startTime, endTime, periodMinutes, rules }) => {
  const dayEnd = timeToMinutes(endTime);
  const scheduleByDay = new Map();
  const periodBlocks = [
    {
      periods: toPositiveInteger(rules.periods_before_morning_break, 3),
      break_name: 'Morning Break',
      break_label: 'MORNING BREAK',
      break_duration: toPositiveInteger(rules.morning_break_minutes, 15)
    },
    {
      periods: toPositiveInteger(rules.periods_before_lunch, 2),
      break_name: 'Lunch Break',
      break_label: 'LUNCH BREAK',
      break_duration: toPositiveInteger(rules.lunch_break_minutes, 85)
    },
    {
      periods: toPositiveInteger(rules.periods_before_afternoon_break, 3),
      break_name: 'Evening Break',
      break_label: 'EVENING BREAK',
      break_duration: toPositiveInteger(rules.afternoon_break_minutes, 5)
    },
    {
      periods: toNonNegativeInteger(rules.periods_after_afternoon_break, 2)
    }
  ];

  days.forEach((day) => {
    const periods = [];
    const breaks = [];
    let cursor = timeToMinutes(startTime);
    let slotNumber = 1;

    periodBlocks.forEach((block) => {
      for (let index = 0; index < block.periods; index += 1) {
        const periodEnd = cursor + periodMinutes;
        if (periodEnd > dayEnd) return;

        periods.push({
          type: 'lesson',
          day_of_week: day,
          start_time: minutesToTime(cursor),
          end_time: minutesToTime(periodEnd),
          slot_number: slotNumber
        });
        cursor = periodEnd;
        slotNumber += 1;
      }

      if (block.break_name && cursor < dayEnd) {
        const breakEnd = Math.min(cursor + block.break_duration, dayEnd);
        breaks.push({
          day_of_week: day,
          start_time: minutesToTime(cursor),
          end_time: minutesToTime(breakEnd),
          break_name: block.break_name,
          break_label: block.break_label
        });
        cursor = breakEnd;
      }
    });

    scheduleByDay.set(day, { periods, breaks });
  });

  return {
    periods: days.flatMap((day) => scheduleByDay.get(day)?.periods || []),
    breaks: days.flatMap((day) => scheduleByDay.get(day)?.breaks || [])
  };
};

const buildWeeklyPeriodTargets = (assignments, totalPeriods) => {
  if (!assignments.length || totalPeriods <= 0) return new Map();

  const totalHours = assignments.reduce((sum, assignment) => {
    return sum + Math.max(Number(assignment.hours_per_year || 1), 1);
  }, 0);
  const targetItems = assignments.map((assignment) => {
    const weight = Math.max(Number(assignment.hours_per_year || 1), 1);
    const exactTarget = (weight / totalHours) * totalPeriods;

    return {
      assignment,
      target: Math.floor(exactTarget),
      remainder: exactTarget - Math.floor(exactTarget)
    };
  });
  let assignedPeriods = targetItems.reduce((sum, item) => sum + item.target, 0);

  targetItems
    .sort((a, b) => {
      if (b.remainder !== a.remainder) return b.remainder - a.remainder;
      return String(a.assignment.module_name || '').localeCompare(String(b.assignment.module_name || ''));
    })
    .forEach((item) => {
      if (assignedPeriods < totalPeriods) {
        item.target += 1;
        assignedPeriods += 1;
      }
    });

  return new Map(targetItems.map((item) => [item.assignment.assignment_id, item.target]));
};

const rankAssignmentsByWeeklyTarget = (assignments, scheduledCounts, weeklyTargets, preferredTeacherId = null) => {
  const underTarget = assignments.filter((assignment) => {
    const target = weeklyTargets.get(assignment.assignment_id) || 0;
    return (scheduledCounts.get(assignment.assignment_id) || 0) < target;
  });
  const candidates = underTarget.length ? underTarget : assignments;

  return candidates
    .map((assignment) => {
      const target = weeklyTargets.get(assignment.assignment_id) || 1;
      const scheduled = scheduledCounts.get(assignment.assignment_id) || 0;
      const remaining = Math.max(target - scheduled, 0);
      const teacherBonus = preferredTeacherId
        && Number(assignment.teacher_id) === Number(preferredTeacherId)
        ? 0.35
        : 0;

      return {
        assignment,
        score: remaining + teacherBonus
      };
    })
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return String(a.assignment.module_name || '').localeCompare(String(b.assignment.module_name || ''));
    })
    .map((item) => item.assignment);
};

const getDesiredBlockSize = (assignment) => {
  const periodsPerYear = Number(assignment.hours_per_year || 0);
  if (periodsPerYear > 100) return 3;
  if (periodsPerYear > 50) return 2;
  return 1;
};

const getConsecutiveSlots = (items, startIndex, desiredCount) => {
  const first = items[startIndex];
  if (!first) return [];

  const slots = [first];
  for (let offset = 1; offset < desiredCount; offset += 1) {
    const previous = slots[slots.length - 1];
    const next = items[startIndex + offset];

    if (!next
      || next.day_of_week !== first.day_of_week
      || normalizeTime(previous.end_time) !== normalizeTime(next.start_time)) {
      break;
    }

    slots.push(next);
  }

  return slots;
};

const isSameAssignmentSoftConflict = (conflict, assignment, classItem, slot) => {
  return Number(conflict.class_id) === Number(classItem.class_id)
    && Number(conflict.assignment_id) === Number(assignment.assignment_id)
    && !overlaps(
      timeToMinutes(conflict.start_time),
      timeToMinutes(conflict.end_time),
      timeToMinutes(slot.start_time),
      timeToMinutes(slot.end_time)
    );
};

const hasBlockingTeacherConflict = async (assignment, classItem, slot, changeoverMinutes) => {
  const conflicts = await getTeacherConflictsWithChangeover(
    assignment.teacher_id,
    slot.day_of_week,
    slot.start_time,
    slot.end_time,
    changeoverMinutes
  );

  return conflicts.some((conflict) => {
    return !isSameAssignmentSoftConflict(conflict, assignment, classItem, slot);
  });
};

const findAvailableRoomId = async (dayOfWeek, startTime, endTime) => {
  const rooms = await Room.getAvailableRooms(startTime, endTime, dayOfWeek);
  return rooms[0]?.room_id || null;
};

// Create timetable entry
router.post('/', auth, [
  body('class_id').isInt().withMessage('Valid class ID is required'),
  body('assignment_id').optional().isInt(),
  body('day_of_week').isIn(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']).withMessage('Invalid day of week'),
  body('start_time').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid start time format (HH:MM)'),
  body('end_time').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid end time format (HH:MM)'),
  body('room_id').optional().isInt(),
  body('status').optional().isIn(['draft', 'published']),
  body('academic_year').optional().isString(),
  body('term').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { class_id, assignment_id, day_of_week, start_time, end_time, room_id, status, academic_year, term, module_name } = req.body;
    const timetableSettings = await SystemSetting.getTimetableSettings();
    const fixedPeriod = findFixedPeriod(start_time, end_time, timetableSettings);

    if (!fixedPeriod) {
      return res.status(400).json({
        message: 'Timetable structure is fixed. Select one of the fixed period slots.'
      });
    }

    // Use comprehensive conflict detection service
    const conflicts = await conflictDetectionService.checkAllConflicts({
      class_id,
      assignment_id,
      day_of_week,
      start_time,
      end_time,
      room_id,
      timetable_id: null
    });

    if (conflicts.length > 0) {
      return res.status(400).json({ 
        message: 'Conflict detected', 
        conflicts 
      });
    }

    const timetableId = await TimetableEntry.create({ 
      class_id, 
      assignment_id, 
      day_of_week, 
      start_time, 
      end_time, 
      room_id, 
      module_name,
      slot_number: fixedPeriod.slot_number,
      status: status || 'draft',
      academic_year,
      term
    });
    const timetable = await TimetableEntry.findById(timetableId);

    if (status === 'published') {
      await Notification.create({
        type: 'timetable_published',
        title: `Timetable entry published for ${timetable.class_name || 'a class'}`,
        message: `${timetable.module_name || 'A timetable entry'} was scheduled on ${day_of_week} at ${start_time}.`,
        path: '/timetable',
        tone: 'blue'
      });
    }

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
  body('level').optional({ nullable: true, checkFalsy: true }).trim().notEmpty(),
  body('days').optional().isArray(),
  body('start_time').optional({ nullable: true, checkFalsy: true }).matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid start time format (HH:MM)'),
  body('end_time').optional({ nullable: true, checkFalsy: true }).matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid end time format (HH:MM)'),
  body('period_minutes').optional({ nullable: true, checkFalsy: true }).isInt({ min: 1 }).withMessage('Period minutes must be at least 1'),
  body('replace_existing').optional().isBoolean(),
  body('break_period_rules')
    .optional()
    .isObject()
    .withMessage('Break period rules must be an object')
    .custom((rules) => {
      const positiveFields = [
        'periods_before_morning_break',
        'periods_before_lunch',
        'periods_before_afternoon_break',
        'morning_break_minutes',
        'lunch_break_minutes',
        'afternoon_break_minutes'
      ];

      for (const field of positiveFields) {
        if (rules[field] !== undefined) {
          const value = Number(rules[field]);
          if (!Number.isInteger(value) || value < 1) {
            throw new Error('Break period rule values must be whole numbers of at least 1');
          }
        }
      }

      if (rules.periods_after_afternoon_break !== undefined) {
        const value = Number(rules.periods_after_afternoon_break);
        if (!Number.isInteger(value) || value < 0) {
          throw new Error('Periods after evening break must be a whole number of at least 0');
        }
      }

      return true;
    }),
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

    const { class_id, level } = req.body;
    const timetableStatus = req.body.status || 'draft';
    const shouldReplaceExisting = req.body.replace_existing !== false;

    const days = Array.isArray(req.body.days) && req.body.days.length
      ? req.body.days.filter((day) => DAYS.includes(day))
      : DAYS;

    if (!days.length) {
      return res.status(400).json({ message: 'At least one valid day is required' });
    }

    const periodMinutes = toPositiveInteger(req.body.period_minutes, 45);
    const changeoverMinutes = toNonNegativeInteger(req.body.teacher_changeover_minutes, 0);
    const breakRules = req.body.break_period_rules || {};
    const shouldUsePeriodRules = breakRules.enabled !== false;
    const ruleSchedule = shouldUsePeriodRules
      ? buildScheduleFromPeriodRules({
        days,
        startTime: req.body.start_time || '08:00',
        endTime: req.body.end_time || '17:15',
        periodMinutes,
        rules: breakRules
      })
      : null;
    const fixedBreaks = FIXED_BREAKS.map((item) => ({
      start_time: item.start_time,
      end_time: item.end_time
    }));
    const slotCountsByDay = new Map();
    const defaultGenerationItems = buildSlots({
      days,
      startTime: req.body.start_time || '08:00',
      endTime: req.body.end_time || '17:15',
      periodMinutes,
      changeoverMinutes,
      breaks: fixedBreaks
    }).map((item) => {
      const slotNumber = (slotCountsByDay.get(item.day_of_week) || 0) + 1;
      slotCountsByDay.set(item.day_of_week, slotNumber);
      return {
        ...item,
        type: 'lesson',
        slot_number: slotNumber
      };
    });
    const generationTemplate = ruleSchedule?.periods?.length ? ruleSchedule.periods : defaultGenerationItems;
    const breakTemplate = ruleSchedule?.breaks?.length
      ? ruleSchedule.breaks
      : days.flatMap((day) => FIXED_BREAKS.map((item) => ({
        day_of_week: day,
        start_time: item.start_time,
        end_time: item.end_time,
        break_name: item.break_name
      })));
    const totalRulePeriods = Math.max(
      ...days.map((day) => generationTemplate.filter((item) => item.day_of_week === day).length),
      0
    );
    const activeStructure = [...generationTemplate, ...breakTemplate]
      .sort((a, b) => {
        const dayDiff = (DAY_ORDER.get(a.day_of_week) ?? 99) - (DAY_ORDER.get(b.day_of_week) ?? 99);
        if (dayDiff !== 0) return dayDiff;
        return timeToMinutes(a.start_time) - timeToMinutes(b.start_time);
      });
    const allClasses = class_id ? [await Class.findById(class_id)] : await Class.getAll();
    const selectedLevel = level ? String(level).trim().toLowerCase() : '';
    const selectedClasses = allClasses
      .filter(Boolean)
      .filter((classItem) => !selectedLevel || String(classItem.level || '').trim().toLowerCase() === selectedLevel);
    const generated = [];
    const skipped = [];
    const classEntryCounts = [];

    if (shouldReplaceExisting) {
      for (const classItem of selectedClasses) {
        await TimetableEntry.deleteByClass(classItem.class_id);
      }
    }

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

      const scheduledCounts = new Map();
      const weeklyTargets = buildWeeklyPeriodTargets(assignments, generationTemplate.length);
      const dayBlockState = new Map();
      const dayTeacherCounts = new Map();
      let classCount = 0;

      for (const item of breakTemplate) {
          const timetableId = await TimetableEntry.create({
            class_id: classItem.class_id,
            assignment_id: null,
            day_of_week: item.day_of_week,
            start_time: item.start_time,
            end_time: item.end_time,
            room_id: null,
            module_name: item.break_name,
            entry_type: 'break',
            slot_number: null,
            status: timetableStatus
          });
          const timetable = await TimetableEntry.findById(timetableId);
          generated.push(timetable);
          classCount += 1;
      }

      const generationItems = generationTemplate;


      for (let itemIndex = 0; itemIndex < generationItems.length;) {
        const item = generationItems[itemIndex];
        let scheduledAssignment = null;
        let selectedSlots = [];
        let hasConflict = false;
        const currentBlock = dayBlockState.get(item.day_of_week);
        const rankedAssignments = rankAssignmentsByWeeklyTarget(
          assignments,
          scheduledCounts,
          weeklyTargets,
          currentBlock?.assignment?.teacher_id
        );
        const isAdjacentToCurrentBlock = currentBlock
          && normalizeTime(currentBlock.end_time) === normalizeTime(item.start_time);

        if (currentBlock?.assignment) {
          const desiredBlockSize = getDesiredBlockSize(currentBlock.assignment);
          const currentTarget = weeklyTargets.get(currentBlock.assignment.assignment_id) || 0;
          const currentScheduled = scheduledCounts.get(currentBlock.assignment.assignment_id) || 0;
          const remainingTarget = currentTarget - currentScheduled;
          const continuationSlots = getConsecutiveSlots(
            generationItems,
            itemIndex,
            Math.min(desiredBlockSize - currentBlock.count, Math.max(remainingTarget, 0))
          );

          if (currentBlock.count < desiredBlockSize
            && remainingTarget > 0
            && isAdjacentToCurrentBlock
            && continuationSlots.length
            && !(await hasBlockingTeacherConflict(currentBlock.assignment, classItem, item, changeoverMinutes))) {
            scheduledAssignment = currentBlock.assignment;
            selectedSlots = [item];
            hasConflict = false;
          }
        }

        if (!scheduledAssignment) {
          for (const assignment of rankedAssignments) {
            const wouldExceedCurrentBlock = currentBlock?.assignment?.assignment_id === assignment.assignment_id
              && currentBlock.count >= getDesiredBlockSize(assignment);
            const teacherCountsForDay = dayTeacherCounts.get(item.day_of_week) || new Map();
            const teacherAlreadyUsedToday = (teacherCountsForDay.get(assignment.teacher_id) || 0) > 0;
            const isContinuingSameTeacher = currentBlock?.assignment
              && isAdjacentToCurrentBlock
              && Number(currentBlock.assignment.teacher_id) === Number(assignment.teacher_id);
            const wouldSplitTeacherDay = teacherAlreadyUsedToday && !isContinuingSameTeacher;

            if (wouldExceedCurrentBlock && rankedAssignments.length > 1) {
              continue;
            }

            if (wouldSplitTeacherDay) {
              continue;
            }

            const desiredBlockSize = getDesiredBlockSize(assignment);
            const target = weeklyTargets.get(assignment.assignment_id) || 0;
            const scheduled = scheduledCounts.get(assignment.assignment_id) || 0;
            const remainingTarget = Math.max(target - scheduled, 0);
            const maxBlockSize = Math.max(Math.min(desiredBlockSize, remainingTarget), 1);
            let blockSlots = [];

            for (let blockSize = maxBlockSize; blockSize >= 1; blockSize -= 1) {
              const candidateSlots = getConsecutiveSlots(generationItems, itemIndex, blockSize);

              if (candidateSlots.length !== blockSize) {
                continue;
              }

              let hasBlockConflict = false;
              for (const blockSlot of candidateSlots) {
                if (await hasBlockingTeacherConflict(assignment, classItem, blockSlot, changeoverMinutes)) {
                  hasBlockConflict = true;
                  break;
                }
              }

              if (!hasBlockConflict) {
                blockSlots = candidateSlots;
                break;
              }
            }

            if (blockSlots.length) {
              scheduledAssignment = assignment;
              selectedSlots = blockSlots;
              hasConflict = false;
              break;
            }
          }
        }

        if (!scheduledAssignment) {
          scheduledAssignment = rankedAssignments[0];
          selectedSlots = scheduledAssignment ? [item] : [];
          hasConflict = Boolean(scheduledAssignment);

          if (!scheduledAssignment) {
            itemIndex += 1;
            continue;
          }
        }

        for (const slot of selectedSlots) {
          const slotCurrentBlock = dayBlockState.get(slot.day_of_week);
          const roomId = await findAvailableRoomId(slot.day_of_week, slot.start_time, slot.end_time);
          const timetableId = await TimetableEntry.create({
            class_id: classItem.class_id,
            assignment_id: scheduledAssignment.assignment_id,
            day_of_week: slot.day_of_week,
            start_time: slot.start_time,
            end_time: slot.end_time,
            room_id: roomId || classItem.room_id || null,
            module_name: scheduledAssignment.module_name,
            entry_type: 'lesson',
            slot_number: slot.slot_number,
            status: timetableStatus,
            academic_year: scheduledAssignment.academic_year || null,
            term: scheduledAssignment.term || null
          });
          const timetable = await TimetableEntry.findById(timetableId);
          timetable.has_conflict = hasConflict;
          generated.push(timetable);
          scheduledCounts.set(
            scheduledAssignment.assignment_id,
            (scheduledCounts.get(scheduledAssignment.assignment_id) || 0) + 1
          );
          const teacherCountsForDay = dayTeacherCounts.get(slot.day_of_week) || new Map();
          teacherCountsForDay.set(
            scheduledAssignment.teacher_id,
            (teacherCountsForDay.get(scheduledAssignment.teacher_id) || 0) + 1
          );
          dayTeacherCounts.set(slot.day_of_week, teacherCountsForDay);
          dayBlockState.set(slot.day_of_week, {
            assignment: scheduledAssignment,
            end_time: slot.end_time,
            count: slotCurrentBlock?.assignment?.assignment_id === scheduledAssignment.assignment_id
              ? slotCurrentBlock.count + 1
              : 1
          });
          classCount += 1;
        }

        itemIndex += Math.max(selectedSlots.length, 1);
      }

      classEntryCounts.push({
        class_id: classItem.class_id,
        class_name: classItem.class_name,
        entries: classCount,
        periods_per_day: totalRulePeriods,
        expected_entries: generationItems.length + breakTemplate.length
      });

      if (!classCount) {
        skipped.push({
          class_id: classItem.class_id,
          class_name: classItem.class_name,
          reason: 'No available slots generated for this class'
        });
      }
    }

    if (generated.length) {
      const classSummary = classEntryCounts.length === 1
        ? classEntryCounts[0].class_name
        : `${classEntryCounts.length} classes`;

      await Notification.create({
        type: 'timetable_published',
        title: `New timetable published for ${classSummary}`,
        message: `${generated.length} timetable entries were generated.`,
        path: '/timetable',
        tone: 'blue'
      });
    }

    res.status(201).json({
      message: 'Timetable generated successfully',
      generated_count: generated.length,
      generated,
      class_entry_counts: classEntryCounts,
      skipped,
      structure: activeStructure
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

// Get timetable by teacher
router.get('/teacher/:teacher_id', auth, async (req, res) => {
  try {
    const requestedTeacherId = String(req.params.teacher_id);

    if (req.user?.type === 'teacher' && String(req.user.teacherId) !== requestedTeacherId) {
      return res.status(403).json({ message: 'You can only view your own timetable' });
    }

    const timetables = await TimetableEntry.getByTeacher(requestedTeacherId);
    res.json({ timetables });
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
  body('room_id').optional().isInt(),
  body('status').optional().isIn(['draft', 'published']),
  body('academic_year').optional().isString(),
  body('term').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { class_id, assignment_id, day_of_week, start_time, end_time, room_id, status, academic_year, term, module_name } = req.body;

    // Get existing timetable entry
    const existing = await TimetableEntry.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ message: 'Timetable entry not found' });
    }

    const requestedStart = start_time || existing.start_time;
    const requestedEnd = end_time || existing.end_time;
    const fixedPeriod = findFixedPeriod(existing.start_time, existing.end_time);

    if (existing.entry_type !== 'break' && !fixedPeriod) {
      return res.status(400).json({
        message: 'This timetable entry is outside the fixed structure. Regenerate the timetable before updating it.'
      });
    }

    if (
      (day_of_week && day_of_week !== existing.day_of_week)
      || (start_time && normalizeTime(start_time) !== normalizeTime(existing.start_time))
      || (end_time && normalizeTime(end_time) !== normalizeTime(existing.end_time))
    ) {
      return res.status(400).json({
        message: 'Timetable structure is fixed. Update the subject, teacher, room, or status only.'
      });
    }

    if (!existing.entry_type || existing.entry_type === 'lesson') {
      const requestedPeriod = findFixedPeriod(requestedStart, requestedEnd);
      if (!requestedPeriod) {
        return res.status(400).json({
          message: 'Timetable structure is fixed. Select one of the fixed period slots.'
        });
      }
    }

    // Use existing structure values and only update timetable content.
    const updateData = {
      class_id: class_id || existing.class_id,
      assignment_id: assignment_id !== undefined ? assignment_id : existing.assignment_id,
      day_of_week: existing.day_of_week,
      start_time: existing.start_time,
      end_time: existing.end_time,
      room_id: room_id !== undefined ? room_id : existing.room_id,
      module_name: module_name !== undefined ? module_name : existing.module_name,
      entry_type: existing.entry_type || 'lesson',
      slot_number: existing.slot_number || fixedPeriod?.slot_number || null,
      status: status || existing.status,
      academic_year: academic_year || existing.academic_year,
      term: term || existing.term
    };

    // Use comprehensive conflict detection service for updates
    const conflicts = await conflictDetectionService.checkAllConflicts({
      ...updateData,
      timetable_id: req.params.id
    });

    if (conflicts.length > 0) {
      return res.status(400).json({ 
        message: 'Conflict detected', 
        conflicts 
      });
    }

    await TimetableEntry.update(req.params.id, updateData);
    const updatedTimetable = await TimetableEntry.findById(req.params.id);

    await Notification.create({
      type: 'timetable_updated',
      title: `Timetable entry updated for ${updatedTimetable.class_name || 'a class'}`,
      message: `${updatedTimetable.module_name || 'A timetable entry'} was updated on ${updatedTimetable.day_of_week}.`,
      path: '/timetable',
      tone: 'violet'
    });

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
    await Notification.create({
      type: 'timetable_deleted',
      title: `Timetable entry deleted for ${timetable.class_name || 'a class'}`,
      message: `${timetable.module_name || 'A timetable entry'} was removed from ${timetable.day_of_week}.`,
      path: '/timetable',
      tone: 'rose'
    });
    res.json({ message: 'Timetable entry deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

