# Troubleshooting OAuth Authentication

## Common OAuth Errors and Solutions

### 1. "OAuth authentication failed" - Generic Error

This error can occur at different stages. Check your backend console logs for detailed error messages.

#### Check Environment Variables

Make sure your `.env` file in the `backend` directory has all required variables:

```env
AIRTABLE_CLIENT_ID=your_client_id_here
AIRTABLE_CLIENT_SECRET=your_client_secret_here
AIRTABLE_REDIRECT_URI=http://localhost:5000/api/auth/airtable/callback
```

**Important**: 
- No quotes around values
- No trailing spaces
- Exact match with Airtable OAuth app settings

#### Verify Airtable OAuth App Settings

1. Go to https://airtable.com/developers/web/guides/oauth-integrations
2. Open your OAuth integration
3. Verify:
   - **Redirect URI** matches exactly: `http://localhost:5000/api/auth/airtable/callback`
   - **Scopes** include:
     - `data.records:read`
     - `data.records:write`
     - `schema.bases:read`

### 2. "Invalid state parameter"

**Cause**: Session expired or CSRF protection triggered

**Solution**: 
- Clear browser cookies for localhost
- Try logging in again
- Make sure you're not using multiple browser tabs

### 3. "Failed to exchange authorization code for token"

**Common causes**:

1. **Redirect URI mismatch**
   - The redirect URI in your `.env` must EXACTLY match the one in Airtable
   - Check for:
     - `http://` vs `https://`
     - Trailing slashes
     - Port numbers
     - Case sensitivity

2. **Invalid Client ID or Secret**
   - Double-check you copied the correct values
   - Make sure there are no extra spaces or characters

3. **Code already used**
   - Authorization codes can only be used once
   - Try the login flow again from the beginning

### 4. "Session expired"

**Solution**: 
- Make sure `SESSION_SECRET` is set in your `.env` file
- Restart your backend server after changing `.env`
- Clear browser cookies

### 5. "Failed to fetch user information from Airtable"

**Cause**: Access token is invalid or expired

**Solution**:
- Check that the token exchange succeeded
- Verify your Airtable account has proper permissions

### 6. "Failed to save user to database"

**Cause**: MongoDB connection issue

**Solution**:
- Make sure MongoDB is running
- Check `MONGODB_URI` in `.env`
- Verify MongoDB connection in backend logs

## Debugging Steps

### Step 1: Check Backend Logs

Look at your backend console output. The improved error handling will show:
- Exact error messages
- HTTP status codes
- Response data from Airtable

### Step 2: Test Environment Variables

Add this temporary route to check if env vars are loaded:

```javascript
// In backend/routes/auth.js (temporary for debugging)
router.get('/debug', (req, res) => {
  res.json({
    hasClientId: !!AIRTABLE_CLIENT_ID,
    hasClientSecret: !!AIRTABLE_CLIENT_SECRET,
    redirectUri: AIRTABLE_REDIRECT_URI,
    // Don't expose actual secrets in production!
  });
});
```

Then visit: `http://localhost:5000/api/auth/debug`

### Step 3: Verify OAuth Flow

1. Click "Login with Airtable"
2. You should be redirected to Airtable's authorization page
3. After authorizing, check the callback URL in your browser
4. Look for error parameters in the URL (e.g., `?error=access_denied`)

### Step 4: Check Network Tab

1. Open browser DevTools (F12)
2. Go to Network tab
3. Try logging in
4. Look for the `/api/auth/airtable/callback` request
5. Check the response for error details

## Quick Checklist

- [ ] MongoDB is running
- [ ] Backend server is running on port 5000
- [ ] `.env` file exists in `backend/` directory
- [ ] All environment variables are set (no undefined values)
- [ ] Airtable OAuth app is created
- [ ] Redirect URI matches exactly in Airtable and `.env`
- [ ] Client ID and Secret are correct
- [ ] Required scopes are enabled
- [ ] Browser cookies are enabled
- [ ] No firewall blocking localhost:5000

## Still Having Issues?

1. **Check backend console** - Look for detailed error messages
2. **Check browser console** - Look for JavaScript errors
3. **Verify Airtable OAuth app** - Recreate it if needed
4. **Restart servers** - Sometimes a fresh start helps
5. **Clear browser data** - Cookies and cache

## Testing OAuth Manually

You can test the OAuth flow manually by visiting:

```
http://localhost:5000/api/auth/airtable
```

This should redirect you to Airtable. After authorization, you'll be redirected back to the callback URL.

