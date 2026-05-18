const express = require('express');
const Notification = require('../models/Notification');
const Teacher = require('../models/Teacher');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
<<<<<<< HEAD
    const limit = Math.min(Math.max(Number(req.query.limit) || 12, 1), 50);
    const [notifications, pendingTeachers] = await Promise.all([
      Notification.getRecent(limit),
      Teacher.getByStatus('pending')
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

    const savedNotifications = notifications.map((notification) => ({
      id: notification.notification_id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      path: notification.path,
      tone: notification.tone,
      created_at: notification.created_at,
      action_required: false
    }));

    const combinedNotifications = [...pendingNotifications, ...savedNotifications]
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
      .slice(0, limit);

    res.json({
      notifications: combinedNotifications
=======
    const notifications = await Notification.getRecent(req.query.limit);
    const total = await Notification.count();
    res.json({
      total,
      notifications: notifications.map((notification) => ({
        id: notification.notification_id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        path: notification.path,
        tone: notification.tone,
        created_at: notification.created_at
      }))
>>>>>>> 4d46d2d4 (all changes made on the teacher's pages)
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
