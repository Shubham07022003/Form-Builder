# Vercel + Render Deployment Guide

## Overview
- **Frontend**: Vercel (static React app)
- **Backend**: Render (Node.js server)

## Step 1: Deploy Backend on Render

### 1. Create Render Account
1. Go to [render.com](https://render.com)
2. Sign up with GitHub

### 2. Create Web Service
1. Click "New" → "Web Service"
2. Connect your GitHub repository
3. Configure:
   - **Name**: `airtable-form-builder-api`
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

### 3. Set Environment Variables
In your Render dashboard, add these environment variables:

```bash
NODE_ENV=production
PORT=5001
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/airtable-form-builder
AIRTABLE_CLIENT_ID=your_production_airtable_client_id
AIRTABLE_CLIENT_SECRET=your_production_airtable_client_secret
AIRTABLE_REDIRECT_URI=https://your-app-name.onrender.com/api/auth/airtable/callback
JWT_SECRET=your_production_jwt_secret_key
SESSION_SECRET=your_production_session_secret_key
FRONTEND_URL=https://your-vercel-app-name.vercel.app
```

### 4. Deploy
- Click "Create Web Service"
- Wait for deployment to complete
- Note your backend URL: `https://your-app-name.onrender.com`

## Step 2: Deploy Frontend on Vercel

### 1. Create Vercel Account
1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub

### 2. Import Project
1. Click "New Project"
2. Select your GitHub repository
3. Configure:
   - **Framework Preset**: React
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### 3. Set Environment Variables
In Vercel dashboard → Project Settings → Environment Variables:

```bash
VITE_API_URL=https://your-app-name.onrender.com/api
VITE_APP_NAME=Airtable Form Builder
VITE_APP_DESCRIPTION=Create beautiful forms that sync with Airtable
```

### 4. Deploy
- Click "Deploy"
- Wait for deployment to complete
- Note your frontend URL: `https://your-vercel-app-name.vercel.app`

## Step 3: Update CORS Configuration

### Backend CORS Update
Make sure your backend CORS includes your Vercel URL:

```javascript
const corsOptions = {
  origin: [
    'http://localhost:5173',
    'https://your-vercel-app-name.vercel.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  exposedHeaders: ['set-cookie']
};
```

## Step 4: Update Airtable OAuth

1. Go to [Airtable Developers](https://airtable.com/developers/web/guides/oauth-integrations)
2. Update your OAuth integration:
   - **Redirect URI**: `https://your-app-name.onrender.com/api/auth/airtable/callback`
   - Make sure it matches exactly

## Step 5: Test the Connection

### 1. Health Check
```bash
curl https://your-app-name.onrender.com/api/health
```

### 2. CORS Test
```bash
curl -H "Origin: https://your-vercel-app-name.vercel.app" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: X-Requested-With" \
     -X OPTIONS \
     https://your-app-name.onrender.com/api/health
```

### 3. Frontend Test
1. Open your Vercel frontend URL
2. Try to login/authenticate
3. Check browser console for errors

## Common Issues & Solutions

### CORS Errors
**Problem**: `Access-Control-Allow-Origin` error
**Solution**: 
- Make sure Vercel URL is in backend CORS origins
- Check for typos in URLs
- Ensure `credentials: true` is set

### Session/Cookie Issues
**Problem**: Login doesn't persist
**Solution**:
- Check that `FRONTEND_URL` matches exactly
- Ensure `sameSite` and `secure` cookie settings are correct
- Verify environment variables are set

### OAuth Redirect Issues
**Problem**: OAuth callback fails
**Solution**:
- Ensure redirect URI matches backend URL exactly
- Check Airtable OAuth configuration
- Verify environment variables

### API Connection Issues
**Problem**: Frontend can't reach backend
**Solution**:
- Check `VITE_API_URL` in Vercel environment variables
- Verify backend is deployed and running
- Test API endpoints directly

## Environment Variable Checklist

### Backend (Render)
- [ ] `NODE_ENV=production`
- [ ] `MONGODB_URI` (MongoDB Atlas connection string)
- [ ] `AIRTABLE_CLIENT_ID`
- [ ] `AIRTABLE_CLIENT_SECRET`
- [ ] `AIRTABLE_REDIRECT_URI` (Render backend URL)
- [ ] `JWT_SECRET`
- [ ] `SESSION_SECRET`
- [ ] `FRONTEND_URL` (Vercel frontend URL)

### Frontend (Vercel)
- [ ] `VITE_API_URL` (Render backend URL + /api)
- [ ] `VITE_APP_NAME`
- [ ] `VITE_APP_DESCRIPTION`

## Post-Deployment Checklist

- [ ] Backend health endpoint responds
- [ ] Frontend loads without errors
- [ ] CORS preflight requests work
- [ ] OAuth login flow works end-to-end
- [ ] Session persistence works
- [ ] Form creation and submission works
- [ ] Environment variables are correctly loaded

## Debug Commands

### Check Backend Logs
```bash
# In Render dashboard
View Logs → Your Service

# Or check health endpoint
curl https://your-app-name.onrender.com/api/health
```

### Check Frontend Build
```bash
# In Vercel dashboard
View Logs → Build Logs

# Check environment variables
echo $VITE_API_URL
```

### Network Debugging
```bash
# Test API from browser console
fetch('https://your-app-name.onrender.com/api/health')
  .then(r => r.json())
  .then(console.log)

# Check CORS headers
curl -I https://your-app-name.onrender.com/api/health
```
