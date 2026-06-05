const express = require('express')
const router = express.Router()

// Simple external auth starter routes. These perform a redirect to the
// provider's authorization page when environment variables are configured.

const loginUrlWithError = (req, message) => {
  const frontendUrl = process.env.FRONTEND_URL
  const origin = frontendUrl || `${req.protocol}://${req.get('host')}`
  return `${origin}/#/login?auth_error=${encodeURIComponent(message)}`
}

const redirectNotConfigured = (req, res, provider) => {
  return res.redirect(loginUrlWithError(
    req,
    `${provider} OAuth is not configured. Add the provider client ID, secret, and redirect URI in .env, then restart the server.`
  ))
}

router.get('/google', (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const redirectUri = process.env.GOOGLE_REDIRECT_URI
  if (!clientId || !redirectUri) {
    return redirectNotConfigured(req, res, 'Google')
  }

  const scope = encodeURIComponent('openid email profile')
  const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&response_type=code&scope=${scope}&access_type=offline&prompt=select_account`
  return res.redirect(url)
})

router.get('/microsoft', (req, res) => {
  const clientId = process.env.MICROSOFT_CLIENT_ID
  const redirectUri = process.env.MICROSOFT_REDIRECT_URI
  if (!clientId || !redirectUri) {
    return redirectNotConfigured(req, res, 'Microsoft')
  }

  const scope = encodeURIComponent('openid profile email offline_access')
  const url = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&response_mode=query&scope=${scope}&prompt=select_account`
  return res.redirect(url)
})

const axios = require('axios')
const jwt = require('jsonwebtoken')

router.get('/google/callback', async (req, res) => {
  const code = req.query.code
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  const redirectUri = process.env.GOOGLE_REDIRECT_URI

  if (!code) return res.redirect(loginUrlWithError(req, 'Missing code from Google'))
  if (!clientId || !clientSecret || !redirectUri) return redirectNotConfigured(req, res, 'Google')

  try {
    const tokenRes = await axios.post('https://oauth2.googleapis.com/token', new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code'
    }).toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    })

    const accessToken = tokenRes.data.access_token
    const idToken = tokenRes.data.id_token

    let profile = null
    if (accessToken) {
      const me = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` }
      })
      profile = me.data
    } else if (idToken) {
      profile = jwt.decode(idToken)
    }

    if (!profile || (!profile.id && !profile.sub)) {
      return res.redirect(loginUrlWithError(req, 'Unable to retrieve Google profile'))
    }

    const googleId = profile.id || profile.sub
    const email = profile.email || ''
    const name = profile.name || profile.full_name || ''

    const frontendUrl = process.env.FRONTEND_URL || `${req.protocol}://${req.get('host')}`
    // Auto-submit a POST to the existing backend google-login endpoint so the
    // same server-side account linking/creation is reused.
    const html = `<!doctype html><html><body>
      <form id="f" method="post" action="/api/auth/google-login">
        <input type="hidden" name="googleId" value="${encodeURIComponent(googleId)}" />
        <input type="hidden" name="email" value="${encodeURIComponent(email)}" />
        <input type="hidden" name="name" value="${encodeURIComponent(name)}" />
        <input type="hidden" name="rememberMe" value="1" />
      </form>
      <script>document.getElementById('f').submit();</script>
    </body></html>`

    res.send(html)
  } catch (err) {
    console.error('Google callback error', err?.response?.data || err.message || err)
    return res.redirect(loginUrlWithError(req, 'Google OAuth exchange failed'))
  }
})

router.get('/microsoft/callback', (req, res) => {
  return res.redirect(loginUrlWithError(
    req,
    'Microsoft OAuth callback reached, but account linking is not configured yet.'
  ))
})

module.exports = router
