const express = require('express');
const axios = require('axios');
const crypto = require('crypto'); // Built-in Node module for PKCE
const User = require('../models/User');

const router = express.Router();

// --- CONFIGURATION ---
const AIRTABLE_CLIENT_ID = process.env.AIRTABLE_CLIENT_ID;
const AIRTABLE_CLIENT_SECRET = process.env.AIRTABLE_CLIENT_SECRET;

// Must match your Airtable settings EXACTLY
const AIRTABLE_REDIRECT_URI = 'http://localhost:5001/api/auth/airtable/callback'; 
const FRONTEND_URL = 'http://localhost:5173'; // Ensure this matches your React port

// Helper: Base64URL encoding for PKCE
const base64URLEncode = (str) => {
  return str.toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
};

/**
 * MIDDLEWARE: Verify Session
 * Checks if the user has a valid session cookie
 */
const requireAuth = (req, res, next) => {
  console.log(`[Auth Middleware] Checking session for: ${req.sessionID}`);
  if (req.session && req.session.userId) {
    return next();
  }
  console.log('[Auth Middleware] No userId in session');
  return res.status(401).json({ error: 'Not authenticated' });
};

/**
 * Step 1 — Redirect user to Airtable OAuth (With PKCE)
 * GET /api/auth/airtable
 */
router.get('/airtable', (req, res) => {
  if (!AIRTABLE_CLIENT_ID || !AIRTABLE_CLIENT_SECRET) {
    return res.status(500).json({ error: 'Server configuration error: Missing Client ID/Secret' });
  }

  // 1. Generate State (Security)
  const state = crypto.randomBytes(16).toString('hex');

  // 2. Generate PKCE Verifier
  const verifier = base64URLEncode(crypto.randomBytes(32));

  // 3. Generate PKCE Challenge (SHA256 hash of verifier)
  const challenge = base64URLEncode(
    crypto.createHash('sha256').update(verifier).digest()
  );

  // 4. Store State and Verifier in Session
  req.session.oauthState = state;
  req.session.codeVerifier = verifier;
  
  // Force save before redirecting to ensure session is stored
  req.session.save((err) => {
    if (err) {
      console.error('Session save error:', err);
      return res.redirect(`${FRONTEND_URL}/login?error=session_error`);
    }

    // 5. Build URL
    const params = new URLSearchParams({
      client_id: AIRTABLE_CLIENT_ID,
      redirect_uri: AIRTABLE_REDIRECT_URI,
      response_type: 'code',
      scope: 'data.records:read data.records:write schema.bases:read',
      state: state,
      code_challenge: challenge,     // <--- PKCE REQUIRED
      code_challenge_method: 'S256', // <--- PKCE REQUIRED
    });

    res.redirect(`https://airtable.com/oauth2/v1/authorize?${params.toString()}`);
  });
});

/**
 * Step 2 — Handle Airtable OAuth callback
 * GET /api/auth/airtable/callback
 */
router.get('/airtable/callback', async (req, res) => {
  const { code, state, error } = req.query;

  // Debug logging
  console.log('[Auth Callback] Query params:', { code: code ? 'present' : 'missing', state: state ? 'present' : 'missing', error });
  console.log('[Auth Callback] Session data:', { 
    hasOAuthState: !!req.session.oauthState, 
    hasCodeVerifier: !!req.session.codeVerifier,
    sessionId: req.sessionID 
  });

  // 1. Error Handling
  if (error) return res.redirect(`${FRONTEND_URL}/login?error=${error}`);
  if (!code) return res.redirect(`${FRONTEND_URL}/login?error=no_code`);
  
  // 2. Validate State
  if (!req.session.oauthState || state !== req.session.oauthState) {
    console.error('State mismatch. Session:', req.session.oauthState, 'Received:', state);
    return res.redirect(`${FRONTEND_URL}/login?error=invalid_state`);
  }

  // 3. Retrieve PKCE Verifier
  const codeVerifier = req.session.codeVerifier;
  if (!codeVerifier) {
    return res.redirect(`${FRONTEND_URL}/login?error=no_verifier`);
  }

  try {
    // 4. Exchange Code for Token
    const credentials = Buffer.from(`${AIRTABLE_CLIENT_ID}:${AIRTABLE_CLIENT_SECRET}`).toString('base64');
    
    const params = new URLSearchParams();
    params.append('code', code);
    params.append('grant_type', 'authorization_code');
    params.append('redirect_uri', AIRTABLE_REDIRECT_URI);
    params.append('code_verifier', codeVerifier); // <--- PKCE Verifier sent here

    const tokenRes = await axios.post('https://airtable.com/oauth2/v1/token', params, {
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    const { access_token, refresh_token, expires_in } = tokenRes.data;

    // 5. Get User Info
    const userRes = await axios.get('https://api.airtable.com/v0/meta/whoami', {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    const airtableUser = userRes.data;
    console.log('Airtable user data:', airtableUser);

    // 6. Update/Create User in DB
    let user = await User.findOne({ airtableUserId: airtableUser.id });
    
    if (!user) {
        console.log('Creating new user for:', airtableUser.id);
        user = new User({ 
          airtableUserId: airtableUser.id, 
          email: airtableUser.email || `${airtableUser.id}@airtable.user`
        });
    }
    
    // Update tokens
    user.accessToken = access_token;
    user.refreshToken = refresh_token; 
    user.tokenExpiresAt = new Date(Date.now() + (expires_in * 1000));
    
    try {
      await user.save();
      console.log('User saved successfully:', user._id);
    } catch (saveError) {
      console.error('Error saving user:', saveError);
      throw saveError;
    }

    // 7. Clean up Session and Log User In
    delete req.session.oauthState;
    delete req.session.codeVerifier;
    req.session.userId = user._id.toString();

    // 8. Save Session and Redirect
    req.session.save((err) => {
      if (err) console.error('Session save error:', err);
      // Redirect to Dashboard (Cookie travels automatically)
      res.redirect(`${FRONTEND_URL}/dashboard`);
    });

  } catch (err) {
    console.error('Auth Error:', err.response?.data || err.message);
    console.error('Full error details:', err);
    if (err.response) {
      console.error('Response status:', err.response.status);
      console.error('Response data:', err.response.data);
    }
    res.redirect(`${FRONTEND_URL}/login?error=auth_failed`);
  }
});

/**
 * Step 3 - Login with Personal Access Token (Token Form)
 * POST /api/auth/login-token
 */
router.post('/login-token', async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: 'Token is required' });

    // Validate token with Airtable
    const userRes = await axios.get('https://api.airtable.com/v0/meta/whoami', {
      headers: { Authorization: `Bearer ${token}` },
    });
    
    const airtableUser = userRes.data;
    
    // Find or Create User
    let user = await User.findOne({ airtableUserId: airtableUser.id });
    if (!user) {
       user = new User({ airtableUserId: airtableUser.id, email: airtableUser.email || `${airtableUser.id}@airtable.user` });
    }
    user.accessToken = token;
    user.loginTimestamp = new Date();
    await user.save();

    // Set Session
    req.session.userId = user._id.toString();
    
    // Save session explicitly before responding
    req.session.save((err) => {
       if (err) return res.status(500).json({ error: 'Session save failed' });
       // Return success - Frontend will handle the redirect
       res.json({ message: 'Login successful', user: { id: user._id, email: user.email } });
    });

  } catch (error) {
     console.error('Token Login Error:', error.message);
     res.status(401).json({ error: 'Invalid token or failed to authenticate' });
  }
});

/**
 * Return logged-in user
 * GET /api/auth/me
 */
router.get('/me', requireAuth, async (req, res) => {
  console.log('[API] /me endpoint hit');
  try {
    const user = await User.findById(req.session.userId).select('-accessToken -refreshToken');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

/**
 * Logout user
 * POST /api/auth/logout
 */
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ error: 'Logout failed' });
    res.clearCookie('connect.sid'); // Clear the cookie
    res.json({ message: 'Logged out successfully' });
  });
});

module.exports = router;