const User = require('../models/User');

/**
 * Middleware to authenticate requests using session or token
 */
async function authenticate(req, res, next) {
  try {
    // Check for user ID in session (set after OAuth)
    const userId = req.session?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Fetch user from database
    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
}

module.exports = { authenticate };

