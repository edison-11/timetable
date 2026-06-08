const express = require('express')
const router = express.Router()

// Simple external auth starter routes. These perform a redirect to the
// provider's authorization page when environment variables are configured.

router.get('/google', (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const redirectUri = process.env.GOOGLE_REDIRECT_URI
  if (!clientId || !redirectUri) {
    return res.status(501).json({ message: 'Google OAuth not configured on server.' })
  }

  const scope = encodeURIComponent('openid email profile')
  const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&response_type=code&scope=${scope}&access_type=offline&prompt=consent`
  return res.redirect(url)
})

router.get('/microsoft', (req, res) => {
  const clientId = process.env.MICROSOFT_CLIENT_ID
  const redirectUri = process.env.MICROSOFT_REDIRECT_URI
  if (!clientId || !redirectUri) {
    return res.status(501).json({ message: 'Microsoft OAuth not configured on server.' })
  }

  const scope = encodeURIComponent('openid profile email offline_access')
  const url = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&response_mode=query&scope=${scope}`
  return res.redirect(url)
})

module.exports = router;
