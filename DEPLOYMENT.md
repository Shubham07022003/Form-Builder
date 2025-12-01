# Deployment Guide

## Environment Setup

### Backend Environment Variables

Create `.env.production` file in the backend directory with:

```bash
# Production Environment Variables
PORT=5001
NODE_ENV=production

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/airtable-form-builder

# Airtable OAuth
AIRTABLE_CLIENT_ID=your_production_airtable_client_id
AIRTABLE_CLIENT_SECRET=your_production_airtable_client_secret
AIRTABLE_REDIRECT_URI=https://your-domain.com/api/auth/airtable/callback

# Security
JWT_SECRET=your_production_jwt_secret_key
SESSION_SECRET=your_production_session_secret_key

# Frontend URL
FRONTEND_URL=https://your-domain.com
```

### Frontend Environment Variables

Create `.env.production` file in the frontend directory with:

```bash
# Production Environment Variables
VITE_API_URL=https://your-backend-domain.com/api
VITE_APP_NAME=Airtable Form Builder
VITE_APP_DESCRIPTION=Create beautiful forms that sync with Airtable
NODE_ENV=production
```

## Platform-Specific Deployment

### Vercel (Frontend)

1. **Install Vercel CLI**
```bash
npm i -g vercel
```

2. **Deploy Frontend**
```bash
cd frontend
vercel --prod
```

3. **Environment Variables in Vercel Dashboard**
- Go to Vercel dashboard → Project Settings → Environment Variables
- Add: `VITE_API_URL` = `https://your-backend-domain.com/api`

### Heroku (Backend)

1. **Install Heroku CLI**
```bash
npm i -g heroku
```

2. **Create Heroku App**
```bash
heroku create your-app-name
```

3. **Set Environment Variables**
```bash
heroku config:set NODE_ENV=production
heroku config:set MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/airtable-form-builder
heroku config:set AIRTABLE_CLIENT_ID=your_production_airtable_client_id
heroku config:set AIRTABLE_CLIENT_SECRET=your_production_airtable_client_secret
heroku config:set AIRTABLE_REDIRECT_URI=https://your-app-name.herokuapp.com/api/auth/airtable/callback
heroku config:set JWT_SECRET=your_production_jwt_secret_key
heroku config:set SESSION_SECRET=your_production_session_secret_key
heroku config:set FRONTEND_URL=https://your-frontend-domain.com
```

4. **Deploy Backend**
```bash
git add .
git commit -m "Deploy to Heroku"
git push heroku main
```

### Railway (Backend Alternative)

1. **Install Railway CLI**
```bash
npm i -g @railway/cli
```

2. **Login and Deploy**
```bash
railway login
railway init
railway up
```

3. **Set Environment Variables in Railway Dashboard**
- Go to Railway dashboard → Your Project → Variables
- Add all the required environment variables

### MongoDB Atlas Setup

1. **Create MongoDB Atlas Account**
2. **Create Cluster**
3. **Get Connection String**
4. **Add IP Whitelist** (0.0.0.0/0 for cloud deployment)
5. **Create Database User**

### Airtable OAuth Setup

1. **Go to Airtable Developers**
2. **Create OAuth Integration**
3. **Set Production Redirect URI**: `https://your-backend-domain.com/api/auth/airtable/callback`
4. **Update Environment Variables** with new Client ID and Secret

## Post-Deployment Checklist

- [ ] Backend is running and accessible
- [ ] Frontend is deployed and accessible
- [ ] Environment variables are set correctly
- [ ] MongoDB connection is working
- [ ] Airtable OAuth is configured with production URLs
- [ ] CORS is configured for production domains
- [ ] SSL certificates are installed
- [ ] Session cookies are working in production
- [ ] OAuth flow works end-to-end

## Troubleshooting

### Common Issues

1. **CORS Errors**: Update backend CORS configuration to include production domain
2. **Session Issues**: Ensure secure cookies are properly configured for production
3. **OAuth Redirects**: Verify redirect URIs match exactly in Airtable settings
4. **Database Connection**: Check MongoDB IP whitelist and connection string

### Debug Commands

```bash
# Check backend logs
heroku logs --tail

# Check environment variables
heroku config

# Test API endpoints
curl https://your-backend-domain.com/api/health
```

## Security Considerations

- Use strong, randomly generated secrets
- Enable HTTPS in production
- Configure proper CORS origins
- Use environment-specific database credentials
- Regularly update dependencies
- Monitor logs for suspicious activity
