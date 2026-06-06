const express = require('express');

const router = express.Router();

router.get('/status', (req, res) => {
  res.json({
    configured: false,
    message: 'External authentication is not configured for this installation.'
  });
});

router.use((req, res) => {
  res.status(501).json({
    error: 'External authentication is not configured.'
  });
});

module.exports = router;
