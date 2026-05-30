# 🚀 Contract Generator - Deployment Guide

## Quick Deploy Options

### Option 1: Vercel (Recommended)
```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Login to Vercel
vercel login

# 3. Deploy
vercel

# 4. Follow prompts (use default settings)
```

### Option 2: Railway
1. Go to [railway.app](https://railway.app)
2. Connect your GitHub repository
3. Click "Deploy Now"
4. Railway will auto-detect Node.js and deploy

### Option 3: Render
1. Go to [render.com](https://render.com)
2. Connect your GitHub repository
3. Choose "Web Service"
4. Build Command: `npm install`
5. Start Command: `npm start`

## Environment Setup

### Required Node.js Version
- Node.js >= 18.0.0
- npm >= 8.0.0

### Environment Variables
No environment variables required for basic functionality.

## Features that will work in production:
✅ Contract generation
✅ Timeline management with EU date format
✅ Dark/Light theme
✅ ARES integration (Czech company data)
✅ PDF/HTML/Markdown export
✅ Responsive design

## Post-Deployment Testing
1. Test contract generation
2. Test ARES lookup with a valid Czech IČO
3. Test timeline date selection
4. Test dark/light mode
5. Test export functions

## Troubleshooting ARES API Issues

If you get 404 errors on `/api/ares/` endpoints after deployment:

### Check 1: Hosting Platform
Make sure your hosting platform supports Node.js backend:
- ✅ Vercel (with vercel.json)
- ✅ Railway 
- ✅ Render
- ❌ Netlify (static hosting only - needs functions)

### Check 2: Redeploy with Latest Config
```bash
# For Vercel
vercel --force

# For Railway/Render
# Push to Git to trigger redeploy
```

### Check 3: Environment Variables
No special environment variables needed for basic functionality.

### Check 4: Test API Directly
After deployment, test the API endpoint directly:
```
https://your-app.vercel.app/api/ares/27082440
```

Should return JSON, not HTML error page.

## Platform-Specific Instructions

### Vercel
- Uses `vercel.json` for routing
- Automatically detects Node.js
- Supports serverless functions

### Railway
- Auto-detects from package.json
- No config files needed
- Full Node.js server support

### Render
- Uses `render.yaml` (optional)
- Full Node.js server support
- Free tier available

## Support
- All date formats use EU standard (DD-MM-YYYY)
- ARES integration works with Czech company registry
- Mobile-friendly responsive design
- Professional Czech contract templates

## Debug Mode
Set NODE_ENV=development for detailed error messages.