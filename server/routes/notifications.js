const express = require('express');
const Notification = require('../models/Notification');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const notifications = await Notification.getRecent(req.query.limit);
    res.json({
      notifications: notifications.map((notification) => ({
        id: notification.notification_id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        path: notification.path,
        tone: notification.tone,
        created_at: notification.created_at
      }))
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
