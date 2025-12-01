# Quick Start Guide

## Prerequisites

1. **MongoDB**: Install MongoDB locally or use MongoDB Atlas (cloud)
   - Local: Download from https://www.mongodb.com/try/download/community
   - Cloud: Sign up at https://www.mongodb.com/cloud/atlas

2. **Airtable Account**: Sign up at https://airtable.com

3. **Node.js**: Version 18 or higher

## Step 1: Set Up Airtable OAuth

1. Go to https://airtable.com/developers/web/guides/oauth-integrations
2. Click "Create a new OAuth integration"
3. Fill in the details:
   - **Name**: Airtable Form Builder
   - **Redirect URI**: `http://localhost:5000/api/auth/airtable/callback`
   - **Scopes**: 
     - `data.records:read`
     - `data.records:write`
     - `schema.bases:read`
4. Copy the **Client ID** and **Client Secret**

## Step 2: Backend Setup

1. Navigate to backend directory:
```bash
cd airtable-form-builder/backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```bash
# Copy the example and fill in your values
cp .env.example .env
```

4. Edit `.env` with your values:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/airtable-form-builder
AIRTABLE_CLIENT_ID=your_client_id_here
AIRTABLE_CLIENT_SECRET=your_client_secret_here
AIRTABLE_REDIRECT_URI=http://localhost:5000/api/auth/airtable/callback
JWT_SECRET=any_random_string_here
SESSION_SECRET=any_random_string_here
FRONTEND_URL=http://localhost:5173
```

5. Start MongoDB (if running locally):
```bash
# Windows
net start MongoDB

# Mac/Linux
mongod
```

6. Start the backend server:
```bash
npm run dev
```

The backend should now be running on http://localhost:5000

## Step 3: Frontend Setup

1. Open a new terminal and navigate to frontend directory:
```bash
cd airtable-form-builder/frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend should now be running on http://localhost:5173

## Step 4: Test the Application

1. Open http://localhost:5173 in your browser
2. Click "Login with Airtable"
3. Authorize the application
4. You should be redirected to the dashboard
5. Create a new form:
   - Click "Create New Form"
   - Select a base and table
   - Choose fields to include
   - Configure questions and conditional logic
   - Submit the form

## Testing Form Submission

1. After creating a form, copy the form URL (e.g., `/forms/1234567890abcdef`)
2. Open the form URL in an incognito/private window (to test as a non-authenticated user)
3. Fill out and submit the form
4. Check your Airtable base - the record should appear there
5. Go back to your dashboard and view responses

## Troubleshooting

### MongoDB Connection Error
- Make sure MongoDB is running
- Check your `MONGODB_URI` in `.env`
- For MongoDB Atlas, use the connection string from your cluster

### Airtable OAuth Error
- Verify your Client ID and Secret are correct
- Check that the redirect URI matches exactly (including http://)
- Make sure you've granted the required scopes

### CORS Errors
- Ensure `FRONTEND_URL` in backend `.env` matches your frontend URL
- Check that both servers are running

### Form Not Loading
- Check browser console for errors
- Verify the form ID in the URL is correct
- Check backend logs for errors

## Next Steps

- Set up webhooks in Airtable to sync changes
- Customize the form styling
- Add more field types
- Implement form analytics

