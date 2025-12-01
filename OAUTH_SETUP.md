# Airtable OAuth Setup - Step by Step

## The Error You're Seeing

If you see: **"This third-party integration failed to properly construct a request to Airtable"**

This means Airtable is rejecting your OAuth request. Common causes:
1. **Redirect URI mismatch** (most common)
2. **Invalid Client ID**
3. **Missing or incorrect scopes**

## Step-by-Step Fix

### Step 1: Verify Your Airtable OAuth App

1. Go to: https://airtable.com/developers/web/guides/oauth-integrations
2. Click on your OAuth integration (or create a new one)
3. **Copy these values exactly:**
   - Client ID
   - Client Secret

### Step 2: Check Redirect URI in Airtable

In your Airtable OAuth app settings, the Redirect URI should be:
```
http://localhost:5000/api/auth/airtable/callback
```

**Important:**
- Must be **exactly** this (no trailing slash)
- Must use `http://` (not `https://`)
- Must include the port `:5000`
- Must include the full path `/api/auth/airtable/callback`

### Step 3: Update Your .env File

In `airtable-form-builder/backend/.env`, set:

```env
AIRTABLE_CLIENT_ID=paste_your_client_id_here
AIRTABLE_CLIENT_SECRET=paste_your_client_secret_here
AIRTABLE_REDIRECT_URI=http://localhost:5000/api/auth/airtable/callback
```

**Critical:**
- No quotes around values
- No spaces before/after values
- Redirect URI must match Airtable exactly

### Step 4: Verify Configuration

1. Start your backend server:
   ```bash
   cd backend
   npm run dev
   ```

2. Visit this URL in your browser:
   ```
   http://localhost:5000/api/auth/debug
   ```

3. Check the output:
   - `hasClientId` should be `true`
   - `hasClientSecret` should be `true`
   - `redirectUri` should be `http://localhost:5000/api/auth/airtable/callback`
   - `redirectUriMatches` should be `true`

### Step 5: Verify Scopes in Airtable

In your Airtable OAuth app, make sure these scopes are enabled:
- ✅ `data.records:read`
- ✅ `data.records:write`
- ✅ `schema.bases:read`

### Step 6: Test the OAuth Flow

1. Make sure backend is running on port 5000
2. Make sure frontend is running on port 5173
3. Go to: http://localhost:5173
4. Click "Login with Airtable"
5. You should be redirected to Airtable's authorization page
6. After authorizing, you should be redirected back to your app

## Common Mistakes

### ❌ Wrong Redirect URI Format
```
❌ http://localhost:5000/api/auth/airtable/callback/  (trailing slash)
❌ http://localhost:5000/callback  (wrong path)
❌ https://localhost:5000/api/auth/airtable/callback  (https instead of http)
❌ http://127.0.0.1:5000/api/auth/airtable/callback  (IP instead of localhost)
```

### ✅ Correct Redirect URI
```
✅ http://localhost:5000/api/auth/airtable/callback
```

### ❌ Environment Variable Issues
```
❌ AIRTABLE_CLIENT_ID="your_id"  (quotes not needed)
❌ AIRTABLE_CLIENT_ID = your_id  (spaces around =)
❌ AIRTABLE_CLIENT_ID=your_id   (trailing space)
```

### ✅ Correct Format
```
✅ AIRTABLE_CLIENT_ID=your_id
```

## Still Not Working?

### Check Backend Logs

When you click "Login with Airtable", check your backend console. You should see:
```
OAuth Configuration:
- Client ID: appXXXXXXXX...
- Redirect URI: http://localhost:5000/api/auth/airtable/callback
- Authorization URL: https://airtable.com/oauth2/v1/authorize?...
```

### Check Browser Network Tab

1. Open DevTools (F12)
2. Go to Network tab
3. Click "Login with Airtable"
4. Look for the redirect to `airtable.com/oauth2/v1/authorize`
5. Check if there are any error responses

### Recreate OAuth App

If nothing works, try creating a fresh OAuth app:
1. Delete the old one in Airtable
2. Create a new OAuth integration
3. Set redirect URI: `http://localhost:5000/api/auth/airtable/callback`
4. Enable the three required scopes
5. Copy new Client ID and Secret
6. Update your `.env` file
7. Restart your backend server

## Quick Checklist

Before trying to login, verify:

- [ ] Backend `.env` file exists in `backend/` directory
- [ ] `AIRTABLE_CLIENT_ID` is set (no quotes, no spaces)
- [ ] `AIRTABLE_CLIENT_SECRET` is set (no quotes, no spaces)
- [ ] `AIRTABLE_REDIRECT_URI` is exactly: `http://localhost:5000/api/auth/airtable/callback`
- [ ] Redirect URI in Airtable matches `.env` exactly
- [ ] All three scopes are enabled in Airtable
- [ ] Backend server is running on port 5000
- [ ] MongoDB is running and connected
- [ ] You've restarted the backend after changing `.env`

## Need More Help?

1. Visit `/api/auth/debug` to see your configuration
2. Check backend console logs for detailed errors
3. Check browser console for frontend errors
4. Verify Airtable OAuth app settings match exactly

