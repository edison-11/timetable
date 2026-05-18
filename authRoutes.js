const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./db');
const crypto = require('crypto');

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
router.post('/login', async (req, res) => {
    const { email, password, rememberMe } = req.body;

    try {
        // Check for user email (case-insensitive)
        const [rows] = await db.execute('SELECT * FROM users WHERE LOWER(email) = LOWER(?)', [email]);
        
        if (rows.length === 0) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const user = rows[0];

        // Check if account is locked
        if (user.lock_until && new Date(user.lock_until) > new Date()) {
            const minutesLeft = Math.ceil((new Date(user.lock_until) - new Date()) / 60000);
            return res.status(403).json({ 
                message: `Account is temporarily locked due to multiple failed attempts. Please try again in ${minutesLeft} minutes.` 
            });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            // Increment login attempts and lock if threshold reached
            const newAttempts = (user.login_attempts || 0) + 1;
            let lockUntil = user.lock_until;
            
            if (newAttempts >= 5) {
                lockUntil = new Date(Date.now() + 15 * 60000); // Lock for 15 minutes
            }

            await db.execute(
                'UPDATE users SET login_attempts = ?, lock_until = ? WHERE id = ?',
                [newAttempts, lockUntil, user.id]
            );

            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Successful login - Reset attempts and locking
        await db.execute(
            'UPDATE users SET login_attempts = 0, lock_until = NULL WHERE id = ?',
            [user.id]
        );

        // MFA Check: Signal the frontend if MFA is required
        if (user.mfa_enabled) {
            // Generate a temporary 'mfa' token or just signal the need
            return res.json({ 
                requiresMfa: true, 
                mfaToken: jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '5m' }),
                email: user.email 
            });
        }

        // Create token
        const expiresIn = rememberMe ? '30d' : '2h';
        let cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
        };
        // If rememberMe is true, the cookie survives browser restart
        // If false, maxAge is omitted, making it a "Session Cookie"

        if (rememberMe) {
            cookieOptions.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
        }

        const token = jwt.sign(
            { id: user.id, role: user.role, name: user.name },
            process.env.JWT_SECRET,
            { expiresIn }
        );

        // Issue HTTP-only cookie for session management
        res.cookie('refreshToken', token, cookieOptions);

        res.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   POST /api/auth/verify-mfa
// @desc    Verify MFA code and issue final session tokens
router.post('/verify-mfa', async (req, res) => {
    const { mfaToken, code, rememberMe } = req.body;

    try {
        const decoded = jwt.verify(mfaToken, process.env.JWT_SECRET);
        
        // In a real app, verify 'code' against a TOTP secret or SMS record here.
        // For now, we simulate success if the token is valid.
        const [rows] = await db.execute('SELECT * FROM users WHERE id = ?', [decoded.id]);
        const user = rows[0];

        const expiresIn = rememberMe ? '30d' : '2h';
        let cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
        };
        if (rememberMe) {
            cookieOptions.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
        }

        const token = jwt.sign(
            { id: user.id, role: user.role, name: user.name },
            process.env.JWT_SECRET,
            { expiresIn }
        );

        res.cookie('refreshToken', token, cookieOptions);

        res.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        res.status(401).json({ message: 'Invalid or expired MFA session' });
    }
});

// @route   POST /api/auth/refresh-token
// @desc    Refresh access token using HTTP-only cookie
router.post('/refresh-token', async (req, res) => {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
        return res.status(401).json({ message: 'No refresh token provided' });
    }

    try {
        const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
        
        // Verify user still exists and is active
        const [rows] = await db.execute('SELECT id, role, name, status FROM users WHERE id = ?', [decoded.id]);
        if (rows.length === 0 || rows[0].status !== 'active') {
            return res.status(401).json({ message: 'User no longer active' });
        }
        const user = rows[0];
        
        // Issue a new access token
        const newToken = jwt.sign(
            { id: user.id, role: user.role, name: user.name },
            process.env.JWT_SECRET,
            { expiresIn: '2h' }
        );

        res.json({ token: newToken });
    } catch (error) {
        res.status(401).json({ message: 'Invalid or expired refresh token' });
    }
});

// @route   POST /api/auth/logout
// @desc    Clear the refresh token cookie
router.post('/logout', (req, res) => {
    res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production'
    });
    res.json({ message: 'Logged out successfully' });
});

// @route   POST /api/auth/forgot-password
// @desc    Generate reset token and log it (simulating email send)
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;

    try {
        const [rows] = await db.execute('SELECT id FROM users WHERE email = ?', [email]);
        if (rows.length === 0) return res.status(404).json({ message: 'User not found' });

        const token = crypto.randomBytes(32).toString('hex');
        const expiry = new Date(Date.now() + 3600000); // 1 hour

        await db.execute(
            'UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE email = ?',
            [token, expiry, email]
        );

        // In production, integrate with Nodemailer here.
        console.log(`Password reset token for ${email}: ${token}`);
        res.json({ message: 'If an account exists with this email, a reset link has been sent.' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   POST /api/auth/reset-password
// @desc    Reset password using token
router.post('/reset-password', async (req, res) => {
    const { token, newPassword } = req.body;

    try {
        const [rows] = await db.execute(
            'SELECT id FROM users WHERE reset_token = ? AND reset_token_expiry > NOW()',
            [token]
        );

        if (rows.length === 0) return res.status(400).json({ message: 'Invalid or expired token' });

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await db.execute(
            'UPDATE users SET password = ?, reset_token = NULL, reset_token_expiry = NULL WHERE id = ?',
            [hashedPassword, rows[0].id]
        );

        res.json({ message: 'Password has been reset successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   POST /api/auth/google-login
// @desc    Backend support for Google SSO registration/login
router.post('/google-login', async (req, res) => {
    const { googleId, email, name, rememberMe } = req.body;

    try {
        let [rows] = await db.execute('SELECT * FROM users WHERE google_id = ? OR email = ?', [googleId, email]);
        let user;

        if (rows.length === 0) {
            // Auto-register via Google
            const dummyPass = await bcrypt.hash(crypto.randomBytes(16).toString('hex'), 10);
            const [result] = await db.execute(
                'INSERT INTO users (name, email, password, google_id, role, status) VALUES (?, ?, ?, ?, "teacher", "active")',
                [name, email, dummyPass, googleId]
            );
            user = { id: result.insertId, name, email, role: 'teacher' };
        } else {
            user = rows[0];
            if (!user.google_id) {
                await db.execute('UPDATE users SET google_id = ? WHERE id = ?', [googleId, user.id]);
            }
        }

        const expiresIn = rememberMe ? '30d' : '2h';
        const cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
        };

        if (rememberMe) {
            cookieOptions.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
        }

        const token = jwt.sign(
            { id: user.id, role: user.role, name: user.name },
            process.env.JWT_SECRET,
            { expiresIn }
        );

        res.cookie('refreshToken', token, cookieOptions);

        res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    } catch (error) {
        res.status(500).json({ message: 'SSO Error', error: error.message });
    }
});

module.exports = router;