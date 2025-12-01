const express = require('express');
const axios = require('axios');
const User = require('../models/User');

const router = express.Router();

const AIRTABLE_CLIENT_ID = process.env.AIRTABLE_CLIENT_ID;
const AIRTABLE_CLIENT_SECRET = process.env.AIRTABLE_CLIENT_SECRET;
const AIRTABLE_REDIRECT_URI =
  process.env.AIRTABLE_REDIRECT_URI ||
  'http://localhost:5001/api/auth/airtable/callback';

router.get('/debug', (req, res) => {
  res.json({
    hasClientId: !!AIRTABLE_CLIENT_ID,
    clientIdLength: AIRTABLE_CLIENT_ID?.length || 0,
    hasClientSecret: !!AIRTABLE_CLIENT_SECRET,
    clientSecretLength: AIRTABLE_CLIENT_SECRET?.length || 0,
    redirectUri: AIRTABLE_REDIRECT_URI,
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
    environment: process.env.NODE_ENV,
  });
});

router.get('/airtable', (req, res) => {
  if (!AIRTABLE_CLIENT_ID || !AIRTABLE_CLIENT_SECRET) {
    return res.status(500).json({
      error:
        'OAuth not configured. Please set AIRTABLE_CLIENT_ID and AIRTABLE_CLIENT_SECRET in .env file',
    });
  }

  if (!AIRTABLE_REDIRECT_URI) {
    return res.status(500).json({
      error: 'Redirect URI missing. Please set AIRTABLE_REDIRECT_URI',
    });
  }

  const state = Math.random().toString(36).substring(7);
  req.session.oauthState = state;

  const params = new URLSearchParams({
    client_id: AIRTABLE_CLIENT_ID,
    redirect_uri: AIRTABLE_REDIRECT_URI,
    response_type: 'code',
    scope: 'data.records:read data.records:write schema.bases:read',
    state,
  });

  const authUrl = `https://airtable.com/oauth2/v1/authorize?${params.toString()}`;

  res.redirect(authUrl);
});

router.get('/airtable/callback', async (req, res) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  try {
    const { code, state, error: oauthError } = req.query;

    if (oauthError) {
      return res.redirect(
        `${frontendUrl}/login?error=${encodeURIComponent(oauthError)}`
      );
    }

    if (!code) return res.status(400).json({ error: 'Authorization code missing' });
    if (!state) return res.status(400).json({ error: 'State missing' });

    if (!req.session.oauthState) {
      return res.redirect(`${frontendUrl}/login?error=session_expired`);
    }

    if (state !== req.session.oauthState) {
      return res.redirect(`${frontendUrl}/login?error=invalid_state`);
    }

    const params = new URLSearchParams();
    params.append('client_id', AIRTABLE_CLIENT_ID);
    params.append('client_secret', AIRTABLE_CLIENT_SECRET);
    params.append('code', code);
    params.append('grant_type', 'authorization_code');
    params.append('redirect_uri', AIRTABLE_REDIRECT_URI);

    let tokenResponse;
    try {
      tokenResponse = await axios.post(
        'https://airtable.com/oauth2/v1/token',
        params.toString(),
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        }
      );
    } catch (tokenError) {
      return res.status(400).json({
        error: 'Failed to exchange authorization code for token',
        details:
          tokenError.response?.data?.error_description ||
          tokenError.response?.data?.error ||
          tokenError.message,
      });
    }

    const { access_token, refresh_token, expires_in } = tokenResponse.data;

    if (!access_token) {
      return res.status(500).json({ error: 'No access token returned' });
    }

    let userInfoResponse;
    try {
      userInfoResponse = await axios.get('https://api.airtable.com/v0/meta/whoami', {
        headers: { Authorization: `Bearer ${access_token}` },
      });
    } catch (userError) {
      return res.status(500).json({
        error: 'Failed to fetch user info',
        details: userError.response?.data || userError.message,
      });
    }

    const airtableUser = userInfoResponse.data;
    if (!airtableUser.id) {
      return res.status(500).json({ error: 'Invalid user data from Airtable' });
    }

    let user = await User.findOne({ airtableUserId: airtableUser.id });

    const userData = {
      airtableUserId: airtableUser.id,
      airtableProfile: airtableUser,
      accessToken: access_token,
      refreshToken: refresh_token,
      tokenExpiresAt: new Date(Date.now() + (expires_in || 3600) * 1000),
      loginTimestamp: new Date(),
    };

    if (user) {
      Object.assign(user, userData);
      await user.save();
    } else {
      user = await User.create(userData);
    }

    console.log('User saved successfully:', user._id);
    
    req.session.userId = user._id.toString();
    console.log('Session userId set to:', req.session.userId);
    console.log('Session data after setting:', req.session);
    req.session.save((err) => {
      if (err) {
        console.error('Error saving session:', err);
        return res.redirect(`${frontendUrl}/login?error=session_save_failed`);
      }
      console.log('Session saved successfully, redirecting to dashboard');
      return res.redirect(`${frontendUrl}/dashboard`);
    });
  } catch (error) {
    const msg =
      error.response?.data?.error_description ||
      error.response?.data?.error ||
      error.message;

    return res.redirect(
      `${frontendUrl}/login?error=${encodeURIComponent('OAuth failed: ' + msg)}`
    );
  }
});

router.get('/me', async (req, res) => {
  try {
    console.log('Auth /me endpoint called');
    console.log('Cookies received:', req.headers.cookie);
    console.log('Session ID:', req.sessionID);
    
    const userId = req.session?.userId;

    if (!userId) {
      console.log('No userId found in session');
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = await User.findById(userId).select('-accessToken -refreshToken');

    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json(user);
  } catch (error) {
    console.error('Error in /auth/me:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ error: 'Logout failed' });
    res.json({ message: 'Logged out successfully' });
  });
});

module.exports = router;
