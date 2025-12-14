# Manual Form Testing Guide

This guide explains how to manually test form submissions from the browser console.

## 🧪 Available Test Functions

All form test functions are available in the browser console (F12) after the app loads.

### 1. Test Contact Form
```javascript
// Basic test with default values
window.testContactForm()

// Custom test with specific data
window.testContactForm({
  email: 'test@example.com',
  firstName: 'John',
  lastName: 'Doe',
  country: 'US',
  company: 'Test Company',
  message: 'This is a test message'
})
```

**API Endpoint**: `POST /api/forms/contact/submissions`

**Required Fields**:
- `email`
- `firstName`
- `lastName`
- `country`
- `company`
- `message`

### 2. Test Demo Form
```javascript
// Basic test with default values
window.testDemoForm()

// Custom test with specific data
window.testDemoForm({
  email: 'demo@example.com',
  name: 'Jane',
  surname: 'Smith',
  village: 'New York',
  company_name: 'Demo Company',
  website_url: 'https://example.com',
  number_of_frames: '100-500',
  message: 'Interested in demo'
})
```

**API Endpoint**: `POST /api/forms/demo/submissions`

**Required Fields**:
- `email`
- `name`
- `surname`
- `village`
- `company_name`

**Optional Fields**:
- `website_url`
- `number_of_frames`
- `message`

### 3. Test Pricing Form
```javascript
// Basic test with default values
window.testPricingForm()

// Custom test with specific data
window.testPricingForm({
  email: 'pricing@example.com',
  company: 'Pricing Test Company',
  monthlyTraffic: '10000+',
  skuCount: '100-500',
  priority: 'high'
})
```

**API Endpoint**: `POST /api/forms/pricing/submissions`

**Required Fields**:
- `email`
- `company`
- `monthlyTraffic`
- `skuCount`
- `priority`

### 4. Test Job Application Form
```javascript
// Basic test with default values
window.testJobApplicationForm()

// Custom test with specific data
window.testJobApplicationForm({
  firstName: 'Test',
  lastName: 'Applicant',
  email: 'applicant@example.com',
  phoneNumber: '+1234567890',
  jobId: 1
})
```

**API Endpoint**: `POST /api/forms/job-application/submissions`

**Required Fields**:
- `firstName`
- `lastName`
- `email`
- `phoneNumber`
- `jobId`

## 📋 How to Use

1. **Open Browser Console**:
   - Press `F12` or `Ctrl+Shift+I` (Windows/Linux)
   - Press `Cmd+Option+I` (Mac)

2. **Run Test Function**:
   ```javascript
   // Example: Test contact form
   window.testContactForm()
   ```

3. **Check Results**:
   - ✅ Success: Green checkmark with response data
   - ❌ Error: Red X with error message

## 🔍 Example Console Output

### Success Response:
```
📝 Testing Contact Form Submission...
Payload: { email: "test@example.com", firstName: "John", ... }
✅ Contact form submitted successfully! { success: true, data: {...} }
```

### Error Response:
```
📝 Testing Contact Form Submission...
Payload: { email: "test@example.com", firstName: "John", ... }
❌ Contact form submission failed: { success: false, message: "Validation error" }
```

## 🎯 Testing Different Scenarios

### Test with Validation Errors:
```javascript
// Missing required field
window.testContactForm({
  email: 'test@example.com'
  // Missing other required fields
})
```

### Test with Custom Data:
```javascript
// Full custom submission
window.testContactForm({
  email: 'custom@example.com',
  firstName: 'Custom',
  lastName: 'User',
  country: 'FR',
  company: 'Custom Company',
  message: 'Custom message for testing'
})
```

## 📝 Notes

- All test functions use default values if fields are not provided
- Functions return a promise, so you can use `.then()` or `await`
- All submissions are sent to the actual backend API
- Check browser Network tab to see the actual HTTP requests
- In development mode, API calls are logged to console

## 🚀 Quick Test Commands

Copy and paste these into your browser console:

```javascript
// Test all forms quickly
Promise.all([
  window.testContactForm(),
  window.testDemoForm(),
  window.testPricingForm()
]).then(results => {
  console.log('All form tests completed:', results)
})
```

## ⚠️ Important

- These functions submit real data to your backend
- Use test data or ensure your backend can handle test submissions
- Check your backend logs to verify submissions are received
- Some forms may send email notifications - be aware of this in production

## 🔧 Troubleshooting

If functions are not available:
1. Refresh the page
2. Check browser console for errors
3. Ensure `formTestUtils.ts` is imported in `main.tsx`
4. Check that the app has fully loaded

If submissions fail:
1. Check backend is running on `http://localhost:5000`
2. Check CORS settings in backend
3. Check Network tab for actual HTTP errors
4. Verify API endpoint URLs in `src/config/apiRoutes.ts`

