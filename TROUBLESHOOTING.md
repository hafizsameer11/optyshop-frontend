# Troubleshooting Guide

## "Failed to fetch" Error

### Problem
You're seeing a "Failed to fetch" error when trying to:
- Login or Register
- Access authenticated pages
- Make API calls

### Common Causes

1. **Backend Server Not Running**
   - The frontend is trying to connect to `http://localhost:5000/api`
   - The backend server is not running or not accessible

2. **Wrong API URL**
   - The API base URL might be incorrect
   - Check your environment variables

3. **CORS Issues**
   - Backend might not be configured to allow requests from the frontend
   - Check backend CORS settings

4. **Network/Firewall Issues**
   - Firewall blocking the connection
   - Network connectivity issues

### Solutions

#### Solution 1: Start the Backend Server

Make sure your backend server is running on port 5000:

```bash
# Navigate to your backend directory
cd path/to/backend

# Start the server (example commands, adjust for your setup)
npm start
# or
python app.py
# or
node server.js
```

Verify the server is running by visiting: `http://localhost:5000/api/health` (or your health check endpoint)

#### Solution 2: Configure API URL

Create a `.env` file in the root of your project:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

Or if your backend is on a different port/host:

```env
VITE_API_BASE_URL=http://localhost:3000/api
```

Then restart your Vite dev server:

```bash
npm run dev
```

#### Solution 3: Check Backend CORS Configuration

Ensure your backend allows requests from your frontend origin. For example, in Express.js:

```javascript
const cors = require('cors');
app.use(cors({
  origin: 'http://localhost:5173', // Vite default port
  credentials: true
}));
```

#### Solution 4: Use Mock Data (Development Only)

If you don't have a backend yet, you can modify the code to use mock data temporarily. However, this is not recommended for production.

### Testing the Connection

You can test if the backend is accessible by opening your browser's developer console and running:

```javascript
fetch('http://localhost:5000/api/health')
  .then(res => res.json())
  .then(data => console.log('Backend is running:', data))
  .catch(err => console.error('Backend is not accessible:', err));
```

### Current API Configuration

The API base URL is configured in:
- `src/config/apiRoutes.ts` - Hardcoded to `http://localhost:5000/api`
- `src/utils/api.ts` - Uses `VITE_API_BASE_URL` environment variable or defaults to `http://localhost:5000/api`

### Error Messages

The improved error handling will now show:
- **"Unable to connect to server. Please ensure the backend server is running on http://localhost:5000"** - When the backend is not accessible
- **Specific API error messages** - When the backend responds but returns an error

### Next Steps

1. Check if backend server is running
2. Verify the API URL matches your backend configuration
3. Check browser console for detailed error messages
4. Verify CORS settings on backend
5. Check network tab in browser DevTools for request details


