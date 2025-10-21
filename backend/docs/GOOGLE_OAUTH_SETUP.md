# Google OAuth Setup Guide

This guide explains how to set up Google OAuth authentication for the ChillNet application.

## Prerequisites

1. A Google Cloud Console account
2. Access to the project's environment variables

## Step 1: Create Google OAuth Credentials

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API:
   - Go to "APIs & Services" > "Library"
   - Search for "Google+ API" and enable it
4. Create OAuth 2.0 credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"
   - Choose "Web application"
   - Add authorized redirect URIs:
     - For development: `http://localhost:3001/api/auth/google/callback`
     - For development (vendor): `http://localhost:3001/api/vendor/auth/google/callback`
     - For production: `https://your-backend-domain.com/api/auth/google/callback`
     - For production (vendor): `https://your-backend-domain.com/api/vendor/auth/google/callback`

## Step 2: Environment Variables

Add the following environment variables to your `.env` file:

```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_CALLBACK_URL=http://localhost:3001/api/auth/google/callback
GOOGLE_VENDOR_CALLBACK_URL=http://localhost:3001/api/vendor/auth/google/callback

# Session Configuration (for Passport)
SESSION_SECRET=your_very_secure_session_secret_here
```

## Step 3: Database Migration

Run the database migration to add Google OAuth support:

```sql
-- Run the migration file: backend/migrations/add_google_oauth_support.sql
```

## Step 4: Frontend Integration

The frontend components have been updated to include Google sign-in buttons. The Google OAuth flow works as follows:

1. User clicks "Sign in with Google" button
2. Frontend redirects to `/api/auth/google`
3. User authenticates with Google
4. Google redirects back to `/api/auth/google/callback`
5. Backend processes the authentication and returns user data with JWT token
6. Frontend receives the response and logs the user in

## API Endpoints

### Regular User OAuth
- `GET /api/auth/google` - Initiates Google OAuth flow
- `GET /api/auth/google/callback` - Google OAuth callback
- `GET /api/auth/google/failure` - OAuth failure handler
- `POST /api/auth/google/logout` - Logout endpoint

### Vendor OAuth
- `GET /api/vendor/auth/google` - Initiates vendor Google OAuth flow
- `GET /api/vendor/auth/google/callback` - Vendor Google OAuth callback
- `GET /api/vendor/auth/google/failure` - Vendor OAuth failure handler
- `POST /api/vendor/auth/complete-registration` - Complete vendor registration with documents

## Vendor Google OAuth Flow

The vendor Google OAuth flow is specifically designed for vendor registration:

1. User clicks "Sign up with Google" on the vendor registration page
2. Frontend redirects to `/api/vendor/auth/google`
3. User authenticates with Google
4. Google redirects back to `/api/vendor/auth/google/callback`
5. Backend processes the authentication:
   - If user exists: Updates their role to vendor and creates vendor record
   - If new user: Creates user with vendor role and vendor record
6. User is redirected to document completion page
7. User uploads required documents (valid ID, business permit, proof image)
8. Registration is completed and user is redirected to pending approval page

## Testing

### Regular User OAuth
1. Start the backend server
2. Navigate to the login page
3. Click "Sign in with Google"
4. Complete the Google authentication flow
5. Verify that the user is logged in and redirected appropriately

### Vendor OAuth
1. Start the backend server
2. Navigate to the vendor registration page
3. Click "Sign up with Google"
4. Complete the Google authentication flow
5. Complete the document upload form
6. Verify that the vendor registration is completed and user is redirected to pending page

## Production Deployment

For production deployment:

1. Update the `GOOGLE_CALLBACK_URL` to your production backend URL
2. Update the authorized redirect URIs in Google Cloud Console
3. Ensure `SESSION_SECRET` is set to a secure random string
4. Set `NODE_ENV=production` for secure cookies

## Troubleshooting

### Common Issues

1. **"redirect_uri_mismatch" error**: Ensure the callback URL in your environment variables matches exactly what's configured in Google Cloud Console
2. **"invalid_client" error**: Check that your `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are correct
3. **Session issues**: Ensure `SESSION_SECRET` is set and consistent across deployments

### Debug Mode

To enable debug logging, set:
```env
DEBUG=passport:*
```

## Security Considerations

1. Never commit OAuth credentials to version control
2. Use environment variables for all sensitive configuration
3. Use HTTPS in production
4. Regularly rotate your OAuth credentials
5. Monitor OAuth usage in Google Cloud Console

## User Experience

- Google OAuth users are automatically created in the database
- Username is generated from email + Google ID suffix for uniqueness
- Profile image from Google is automatically saved
- Users can still use traditional login if they prefer
