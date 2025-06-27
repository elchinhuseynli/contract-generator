# Google API Setup Instructions

The API key you provided is for general Google services, but Google Docs requires OAuth2 authentication. Here's how to set it up:

## Step 1: Go to Google Cloud Console
1. Visit https://console.cloud.google.com/
2. Create a new project or select existing one

## Step 2: Enable APIs
1. Go to "APIs & Services" > "Library"
2. Search and enable:
   - Google Docs API
   - Google Drive API

## Step 3: Create OAuth2 Credentials
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. Choose "Web application"
4. Add authorized redirect URI: `http://localhost:3000/auth/callback`
5. Download the JSON file

## Step 4: Save Credentials
1. Rename the downloaded file to `credentials.json`
2. Place it in your project folder: `/Users/elchinhuseynli/claude-projects/contract-generator/credentials.json`

## Step 5: Authorize the App
1. Start your server: `npm start`
2. Visit: `http://localhost:3000/auth`
3. Complete Google OAuth flow
4. You're ready to generate contracts!

## Alternative: Use Google Apps Script
If OAuth setup is too complex, I can create a simpler version using Google Apps Script that works with your existing API key.