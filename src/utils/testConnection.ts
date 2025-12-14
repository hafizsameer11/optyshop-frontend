/**
 * Utility to test backend connection
 * Use this in browser console to diagnose connection issues
 */

import { apiClient } from './api';
import { API_ROUTES } from '../config/apiRoutes';

/**
 * Test if backend is accessible
 * Call this from browser console: window.testBackend()
 */
export const testBackendConnection = async () => {
  console.log('🔍 Testing backend connection...');
  console.log('📍 API Base URL:', import.meta.env.VITE_API_BASE_URL || 'https://piro-optyshopbackend-muhs96-c5eb95-72-61-22-134.traefik.me/api');
  
  // Test 1: Direct fetch to backend root
  console.log('\n1️⃣ Testing direct fetch to backend...');
  try {
    const response = await fetch('https://piro-optyshopbackend-muhs96-c5eb95-72-61-22-134.traefik.me/api');
    const data = await response.text();
    console.log('✅ Direct fetch successful:', response.status, data.substring(0, 100));
  } catch (error: any) {
    console.error('❌ Direct fetch failed:', error.message);
    if (error.message.includes('CORS')) {
      console.error('🚫 CORS ERROR DETECTED! Your backend needs to allow requests from:', window.location.origin);
    }
  }

  // Test 2: Test auth endpoint (public)
  console.log('\n2️⃣ Testing auth endpoint...');
  try {
    const response = await fetch(API_ROUTES.AUTH.LOGIN, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: 'test@test.com', password: 'test' }),
    });
    const data = await response.json();
    console.log('✅ Auth endpoint accessible:', response.status, data);
  } catch (error: any) {
    console.error('❌ Auth endpoint failed:', error.message);
    if (error.message.includes('CORS')) {
      console.error('🚫 CORS ERROR! Check backend CORS configuration.');
    }
  }

  // Test 3: Test using API client
  console.log('\n3️⃣ Testing with API client...');
  const result = await apiClient.get(API_ROUTES.PRODUCTS.LIST, false);
  if (result.success) {
    console.log('✅ API client works:', result);
  } else {
    console.error('❌ API client failed:', result.message);
  }

  console.log('\n📋 Summary:');
  console.log('- Frontend origin:', window.location.origin);
  console.log('- Backend URL:', import.meta.env.VITE_API_BASE_URL || 'https://piro-optyshopbackend-muhs96-c5eb95-72-61-22-134.traefik.me/api');
  console.log('- Check Network tab in DevTools for detailed request/response');
};

// Make it available globally for easy testing
if (typeof window !== 'undefined') {
  (window as any).testBackend = testBackendConnection;
}

