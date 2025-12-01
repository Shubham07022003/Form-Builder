const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const session = require('express-session');
const RedisStore = require('connect-redis').default;
const { createClient } = require('redis');

dotenv.config();

const app = express();

// Trust first proxy (important if behind a proxy like nginx)
app.set('trust proxy', 1);

// CORS Configuration
const corsOptions = {
  origin: ['http://localhost:5173', 'https://your-vercel-app-name.vercel.app'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  exposedHeaders: ['set-cookie']
};
app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session middleware with enhanced configuration
const sessionConfig = {
  secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  name: 'airtable-form-builder.sid',
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    domain: process.env.NODE_ENV === 'production' ? '.yourdomain.com' : undefined
  }
};

// Add Redis store for production (optional - comment out to use MemoryStore)
// if (process.env.NODE_ENV === 'production' && process.env.REDIS_URL) {
//   // Clean up Redis URL if it has redis-cli prefix
//   let redisUrl = process.env.REDIS_URL;
//   if (redisUrl.includes('redis-cli -u ')) {
//     redisUrl = redisUrl.replace('redis-cli -u ', '');
//   }
//   
//   const redisClient = createClient({
//     url: redisUrl
//   });
//   
//   redisClient.connect().catch(console.error);
//   
//   sessionConfig.store = new RedisStore({ client: redisClient });
//   console.log('Using Redis session store for production');
// } else {
  console.log('Using MemoryStore (development and production)');
// }

// In production, require HTTPS for secure cookies
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
  sessionConfig.cookie.secure = true;
}

app.use(session(sessionConfig));

// Routes
app.use('/api/auth', require('./routes/auth-token'));
app.use('/api/forms', require('./routes/forms'));
app.use('/api/responses', require('./routes/responses'));
app.use('/api/webhooks', require('./routes/webhooks'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/airtable-form-builder')
  .then(() => {
    console.log('Connected to MongoDB');
    const PORT = process.env.PORT || 5001;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  });

module.exports = app;

