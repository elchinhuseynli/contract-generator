# Contract Generator

A web application that generates Czech work contracts (Smlouva o dílo) with Google Docs integration.

## Features

- **Dynamic Form**: Fill in contract details with a user-friendly web interface
- **Live Preview**: See how your contract will look before generating
- **Google Docs Integration**: Automatically create a Google Docs document with the contract
- **Variable Fields**: All key contract information is customizable:
  - Contract number and year
  - Client information (company, address, IČO, DIČ, representative)
  - Project details and description
  - Pricing and payment terms
  - Timeline with multiple phases
  - Warranty period
  - Contract location and date

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Set up Google Docs API

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Docs API and Google Drive API
4. Create credentials (OAuth 2.0 Client ID) for a web application
5. Download the credentials as `credentials.json` and place it in the project root
6. Add `http://localhost:3000/auth/callback` to your authorized redirect URIs

### 3. Run the Application

```bash
npm start
```

### 4. Authorize Google Docs Access

1. Visit `http://localhost:3000/auth`
2. Complete the Google OAuth flow
3. You're now ready to generate contracts!

## Usage

1. Open `http://localhost:3000` in your browser
2. Fill in the contract details:
   - Contract information
   - Client details
   - Project description and pricing
   - Timeline phases
   - Contract location and date
3. Click "Preview Contract" to see how it will look
4. Click "Generate Google Doc" to create the document in Google Docs

## Default Template

The application comes pre-configured with your Flex Digital Agency template, including:
- Your company information (name, address, IČO, bank account)
- Standard contract clauses in Czech
- Professional formatting
- All legal sections from your original contract

## Customization

- Modify the HTML form in `index.html` to add/remove fields
- Update the contract template in `script.js` and `server.js`
- Change styling in the CSS section of `index.html`

## File Structure

- `index.html` - Main web interface
- `script.js` - Frontend JavaScript for form handling and preview
- `server.js` - Backend server with Google Docs integration
- `package.json` - Node.js dependencies
- `credentials.json` - Google API credentials (you need to create this)
- `token.json` - OAuth token (automatically created after authorization)

## Security Notes

- Keep your `credentials.json` and `token.json` files secure
- Don't commit these files to version control
- The application runs locally and doesn't store data externally