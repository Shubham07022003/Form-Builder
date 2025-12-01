# Airtable Form Builder

A full-stack application that allows users to create custom forms using Airtable fields, with conditional logic and webhook synchronization.

## Features

- ✅ Airtable OAuth authentication
- ✅ Form builder with Airtable base/table/field selection
- ✅ Conditional logic for form questions
- ✅ Form viewer with real-time conditional logic
- ✅ Response submission to both Airtable and MongoDB
- ✅ Response listing from database
- ✅ Webhook sync with Airtable

## Prerequisites

- Node.js (v18 or higher)
- MongoDB (local or cloud instance)
- Airtable account with OAuth app credentials

## Setup

### Backend Setup

1. Navigate to the backend directory:
```bash
cd airtable-form-builder/backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file (copy from `.env.example`):
```bash
PORT=5000
MONGODB_URI=mongodb://localhost:27017/airtable-form-builder
AIRTABLE_CLIENT_ID=your_airtable_client_id
AIRTABLE_CLIENT_SECRET=your_airtable_client_secret
AIRTABLE_REDIRECT_URI=http://localhost:5000/api/auth/airtable/callback
JWT_SECRET=your_jwt_secret_key
SESSION_SECRET=your_session_secret
FRONTEND_URL=http://localhost:5173
```

4. Start the backend server:
```bash
npm run dev
```

### Frontend Setup

1. Navigate to the frontend directory:
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

## Airtable OAuth Setup

1. Go to [Airtable Developers](https://airtable.com/developers/web/guides/oauth-integrations)
2. Create a new OAuth integration
3. Set the redirect URI to: `http://localhost:5000/api/auth/airtable/callback`
4. Copy the Client ID and Client Secret to your `.env` file
5. Required scopes:
   - `data.records:read`
   - `data.records:write`
   - `schema.bases:read`

## Webhook Setup

To enable webhook synchronization:

1. In your Airtable base, go to Extensions → Automations
2. Create a webhook that triggers on record changes
3. Set the webhook URL to: `http://your-domain.com/api/webhooks/airtable`
4. The webhook will automatically sync record updates and deletions to your database

## Supported Field Types

- Short text (singleLineText)
- Long text (multilineText)
- Single select
- Multi select
- Attachments

## Project Structure

```
airtable-form-builder/
├── backend/
│   ├── models/          # MongoDB models (User, Form, Response)
│   ├── routes/          # API routes (auth, forms, responses, webhooks)
│   ├── utils/           # Utility functions (Airtable client, conditional logic)
│   ├── middleware/      # Authentication middleware
│   └── server.js        # Express server
├── frontend/
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── utils/       # Client-side utilities
│   │   └── App.jsx      # Main app component
│   └── package.json
└── README.md
```

## API Endpoints

### Authentication
- `GET /api/auth/airtable` - Initiate OAuth flow
- `GET /api/auth/airtable/callback` - OAuth callback
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout

### Forms
- `GET /api/forms` - Get all forms
- `GET /api/forms/:formId` - Get single form
- `POST /api/forms` - Create form
- `PUT /api/forms/:formId` - Update form
- `DELETE /api/forms/:formId` - Delete form
- `GET /api/forms/bases` - Get Airtable bases
- `GET /api/forms/bases/:baseId/tables` - Get tables
- `GET /api/forms/bases/:baseId/tables/:tableId/fields` - Get fields

### Responses
- `POST /api/responses/forms/:formId/submit` - Submit form response
- `GET /api/responses/forms/:formId/responses` - Get all responses
- `GET /api/responses/:responseId` - Get single response

### Webhooks
- `POST /api/webhooks/airtable` - Airtable webhook handler

## License

MIT

