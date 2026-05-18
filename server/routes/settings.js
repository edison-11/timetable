const express = require('express');
const { body, validationResult } = require('express-validator');
const SystemSetting = require('../models/SystemSetting');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Institution Settings
router.get('/institution', auth, async (req, res) => {
  try {
    const school_name = await SystemSetting.get('school_name', 'My School');
    const principal_name = await SystemSetting.get('principal_name', '');
    const director_studies_name = await SystemSetting.get('director_studies_name', '');
    const school_code = await SystemSetting.get('school_code', '');

    res.json({
      settings: {
        school_name,
        principal_name,
        director_studies_name,
        school_code
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/institution', auth, [
  body('school_name').trim().notEmpty().withMessage('School name is required'),
  body('principal_name').trim().optional(),
  body('director_studies_name').trim().optional(),
  body('school_code').trim().optional()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { school_name, principal_name, director_studies_name, school_code } = req.body;

    if (school_name) {
      await SystemSetting.set('school_name', school_name);
    }
    if (principal_name !== undefined) {
      await SystemSetting.set('principal_name', principal_name);
    }
    if (director_studies_name !== undefined) {
      await SystemSetting.set('director_studies_name', director_studies_name);
    }
    if (school_code !== undefined) {
      await SystemSetting.set('school_code', school_code);
    }

    res.json({
      message: 'Institution settings updated successfully',
      settings: {
        school_name,
        principal_name,
        director_studies_name,
        school_code
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/admin', auth, async (req, res) => {
  try {
    const default_landing_page = await SystemSetting.get('admin_default_landing_page', '/dashboard');
    const dashboard_density = await SystemSetting.get('admin_dashboard_density', 'comfortable');
    const auto_refresh_minutes = Number(await SystemSetting.get('admin_auto_refresh_minutes', '5'));
    const notification_retention_days = Number(await SystemSetting.get('admin_notification_retention_days', '30'));
    const export_filename_prefix = await SystemSetting.get('admin_export_filename_prefix', 'timetable');
    const show_empty_slots = await SystemSetting.get('admin_show_empty_slots', 'true');

    res.json({
      settings: {
        default_landing_page,
        dashboard_density,
        auto_refresh_minutes: Number.isFinite(auto_refresh_minutes) ? auto_refresh_minutes : 5,
        notification_retention_days: Number.isFinite(notification_retention_days) ? notification_retention_days : 30,
        export_filename_prefix,
        show_empty_slots: show_empty_slots === 'true'
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/admin', auth, [
  body('default_landing_page').optional().isIn(['/dashboard', '/timetable', '/teachers', '/settings']),
  body('dashboard_density').optional().isIn(['comfortable', 'compact']),
  body('auto_refresh_minutes').optional().isInt({ min: 1, max: 60 }),
  body('notification_retention_days').optional().isInt({ min: 1, max: 365 }),
  body('export_filename_prefix').optional().trim().isLength({ min: 1, max: 40 }),
  body('show_empty_slots').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      default_landing_page,
      dashboard_density,
      auto_refresh_minutes,
      notification_retention_days,
      export_filename_prefix,
      show_empty_slots
    } = req.body;

    if (default_landing_page !== undefined) await SystemSetting.set('admin_default_landing_page', default_landing_page);
    if (dashboard_density !== undefined) await SystemSetting.set('admin_dashboard_density', dashboard_density);
    if (auto_refresh_minutes !== undefined) await SystemSetting.set('admin_auto_refresh_minutes', Number(auto_refresh_minutes));
    if (notification_retention_days !== undefined) await SystemSetting.set('admin_notification_retention_days', Number(notification_retention_days));
    if (export_filename_prefix !== undefined) await SystemSetting.set('admin_export_filename_prefix', export_filename_prefix.trim());
    if (show_empty_slots !== undefined) await SystemSetting.set('admin_show_empty_slots', Boolean(show_empty_slots));

    res.json({
      message: 'Admin settings updated successfully',
      settings: {
        default_landing_page,
        dashboard_density,
        auto_refresh_minutes: Number(auto_refresh_minutes),
        notification_retention_days: Number(notification_retention_days),
        export_filename_prefix,
        show_empty_slots: Boolean(show_empty_slots)
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/timetable', auth, async (req, res) => {
  try {
    const settings = await SystemSetting.getTimetableSettings();
    res.json({ settings });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/timetable', auth, [
  body('teacher_changeover_minutes')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Teacher changeover time must be 0 or more minutes'),
  body('break_start_time')
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Invalid break start time format (HH:MM)'),
  body('break_end_time')
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Invalid break end time format (HH:MM)'),
  body('timetable_breaks')
    .optional()
    .isArray()
    .withMessage('Break times must be a list')
    .custom((breakTimes) => {
      const timePattern = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;

      for (const breakTime of breakTimes) {
        if (!breakTime.break_name || !breakTime.break_name.trim()) {
          throw new Error('Break name is required');
        }

        if (!timePattern.test(breakTime.start_time || '')) {
          throw new Error('Invalid break start time format (HH:MM)');
        }

        if (!timePattern.test(breakTime.end_time || '')) {
          throw new Error('Invalid break end time format (HH:MM)');
        }
      }

      return true;
    }),
  body('break_period_rules')
    .optional()
    .isObject()
    .withMessage('Break period rules must be an object')
    .custom((rules) => {
      // Only validate period values if the feature is enabled
      if (!rules.enabled) {
        return true;
      }

      const integerFields = [
        'periods_before_morning_break',
        'periods_before_lunch',
        'periods_before_afternoon_break',
        'morning_break_minutes',
        'lunch_break_minutes',
        'afternoon_break_minutes'
      ];

      for (const field of integerFields) {
        if (rules[field] !== undefined) {
          const value = Number(rules[field]);
          if (!Number.isInteger(value) || value < 1) {
            throw new Error('Break period values must be whole numbers of at least 1');
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
    })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const settings = await SystemSetting.updateTimetableSettings({
      teacher_changeover_minutes: req.body.teacher_changeover_minutes !== undefined
        ? Number(req.body.teacher_changeover_minutes)
        : undefined,
      break_start_time: req.body.break_start_time,
      break_end_time: req.body.break_end_time,
      timetable_breaks: Array.isArray(req.body.timetable_breaks)
        ? req.body.timetable_breaks.map((breakTime) => ({
            break_name: breakTime.break_name.trim(),
            start_time: breakTime.start_time,
            end_time: breakTime.end_time
          }))
        : undefined,
      break_period_rules: req.body.break_period_rules
        ? {
            enabled: Boolean(req.body.break_period_rules.enabled),
            periods_before_morning_break: Number(req.body.break_period_rules.periods_before_morning_break || 3),
            periods_before_lunch: Number(req.body.break_period_rules.periods_before_lunch || 2),
            periods_before_afternoon_break: Number(req.body.break_period_rules.periods_before_afternoon_break || 3),
            periods_after_afternoon_break: Number(req.body.break_period_rules.periods_after_afternoon_break ?? 2),
            morning_break_minutes: Number(req.body.break_period_rules.morning_break_minutes || 30),
            lunch_break_minutes: Number(req.body.break_period_rules.lunch_break_minutes || 45),
            afternoon_break_minutes: Number(req.body.break_period_rules.afternoon_break_minutes || 30)
          }
        : undefined
    });

    res.json({
      message: 'Timetable settings updated successfully',
      settings
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
