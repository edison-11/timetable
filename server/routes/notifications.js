const express = require('express');
const Notification = require('../models/Notification');
const Teacher = require('../models/Teacher');
const School = require('../models/School');
const { auth } = require('../middleware/auth');
const { getRequestSchoolId } = require('../utils/tenant');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 12, 1), 50);
    const school_id = getRequestSchoolId(req) || req.user?.school_id || null;
    const isSuperAdmin = req.user?.role === 'super_admin';
    const [notifications, pendingTeachers, pendingSchools] = await Promise.all([
      Notification.getRecent(limit, { school_id, recipient_role: req.user?.role }),
      isSuperAdmin ? [] : Teacher.getByStatus('pending', { school_id }),
      isSuperAdmin ? School.getAll({ status: 'pending_approval' }) : []
    ]);

    const pendingNotifications = pendingTeachers.map((teacher) => ({
      id: `pending-teacher-${teacher.teacher_id}`,
      type: 'teacher_pending',
      title: `Teacher pending approval: ${teacher.name}`,
      message: `${teacher.name} (${teacher.email}) is waiting for approval.`,
      path: '/teachers',
      tone: 'amber',
      created_at: teacher.created_at,
      action_required: true,
      entity_type: 'teacher',
      entity_id: teacher.teacher_id
    }));

    const pendingSchoolNotifications = pendingSchools.map((school) => ({
      id: `pending-school-${school.school_id}`,
      type: 'school_pending',
      title: `School pending approval: ${school.school_name}`,
      message: `${school.dos_name || school.school_email} submitted ${school.school_name} for review.`,
      path: '/super-admin/dashboard#schools',
      tone: 'amber',
      created_at: school.created_at,
      action_required: true,
      entity_type: 'school',
      entity_id: school.school_id
    }));

    const visibleNotifications = isSuperAdmin
      ? notifications.filter((notification) => !String(notification.type || '').startsWith('teacher_'))
      : notifications;

    const savedNotifications = visibleNotifications.map((notification) => ({
      id: notification.notification_id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      path: notification.path,
      tone: notification.tone,
      created_at: notification.created_at,
      action_required: false
    }));

    const combinedNotifications = [...pendingSchoolNotifications, ...pendingNotifications, ...savedNotifications]
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
      .slice(0, limit);

    res.json({
      total: await Notification.count({ school_id }),
      notifications: combinedNotifications
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const deleted = await Notification.delete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:id/read', auth, async (req, res) => {
  try {
    await Notification.markRead(req.params.id, { recipient_role: req.user?.role });
    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/read/all', auth, async (req, res) => {
  try {
    await Notification.markRead(null, { recipient_role: req.user?.role });
    res.json({ message: 'Notifications marked as read' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:id/archive', auth, async (req, res) => {
  try {
    await Notification.archive(req.params.id, { recipient_role: req.user?.role });
    res.json({ message: 'Notification archived' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/archive/all', auth, async (req, res) => {
  try {
    await Notification.archive(null, { recipient_role: req.user?.role });
    res.json({ message: 'Notifications archived' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/', auth, async (req, res) => {
  try {
    await Notification.clearAll();
    res.json({ message: 'Notifications cleared successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
