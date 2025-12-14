# CORS Troubleshooting Guide

## Your Backend is Running ✅

Your backend server is running on `http://localhost:5000/api` as shown in the logs.

## The Issue: CORS (Cross-Origin Resource Sharing)

The "Failed to fetch" error is most likely a **CORS issue**. This happens when:
- Frontend runs on `http://localhost:5173` (Vite default)
- Backend runs on `http://localhost:5000`
- Browser blocks the request because they're different origins

## How to Check for CORS Errors

1. Open your browser's **Developer Tools** (F12)
2. Go to the **Console** tab
3. Look for errors like:
   ```
   Access to fetch at 'http://localhost:5000/api/auth/me' from origin 'http://localhost:5173' 
   has been blocked by CORS policy
   ```
4. Go to the **Network** tab
5. Try to login or make an API call
6. Check the failed request - it should show a CORS error

## Solution: Configure CORS on Backend

Your backend needs to allow requests from your frontend origin. Here's how to fix it:

### For Express.js Backend:

```javascript
const cors = require('cors');

// Allow requests from frontend
app.use(cors({
  origin: [
    'http://localhost:5173',  // Vite default port
    'http://localhost:3000',  // Alternative port
    'http://127.0.0.1:5173'   // Sometimes needed
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

### Check Your Backend CORS Configuration

Look in your backend code for CORS configuration. Common locations:
- `server.js` or `app.js`
- Middleware configuration
- Routes setup

Make sure it includes:
- Your frontend URL (`http://localhost:5173`)
- `credentials: true` if using cookies/auth tokens
- All necessary HTTP methods

## Quick Test

Open your browser console and run:

```javascript
fetch('http://localhost:5000/api/auth/me', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
})
.then(res => res.json())
.then(data => console.log('✅ Success:', data))
.catch(err => console.error('❌ Error:', err));
```

If you see a CORS error, that confirms the issue.

## Alternative: Use a Proxy (Development Only)

If you can't modify the backend CORS settings immediately, you can add a proxy in `vite.config.ts`:

```typescript
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      }
    }
  }
})
```

Then update `API_BASE_URL` to use relative paths:
```typescript
const API_BASE_URL = '/api';  // Instead of 'http://localhost:5000/api'
```

## Check Your Backend Logs

When you make a request from the frontend, check your backend console. You should see:
- The request being received
- Any CORS-related errors
- The response being sent

If you don't see the request in backend logs at all, it's definitely a CORS issue blocking the request before it reaches the server.

