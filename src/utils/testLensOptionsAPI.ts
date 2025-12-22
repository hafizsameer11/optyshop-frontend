/**
 * Test Lens Options API Integration
 * Call this from browser console to verify API is working
 * 
 * Usage in browser console:
 *   import { testLensOptionsAPI } from './utils/testLensOptionsAPI'
 *   testLensOptionsAPI()
 * 
 * Or add to window for easy access:
 *   window.testLensAPI = testLensOptionsAPI
 */

import { getLensOptions } from '../services/lensOptionsService';
import { apiClient } from './api';
import { API_ROUTES } from '../config/apiRoutes';

export const testLensOptionsAPI = async () => {
  console.log('🧪 Testing Lens Options API Integration...\n');
  
  // Test 1: Check API base URL
  console.log('1️⃣ Checking API Configuration...');
  const baseURL = (apiClient as any).baseURL;
  console.log('   Base URL:', baseURL);
  console.log('   Lens Options Endpoint:', API_ROUTES.LENS.OPTIONS.LIST);
  console.log('   Full URL:', `${baseURL}${API_ROUTES.LENS.OPTIONS.LIST}`);
  
  // Test 2: Test photochromic endpoint
  console.log('\n2️⃣ Testing Photochromic Options...');
  try {
    const photochromic = await getLensOptions({ type: 'photochromic' });
    if (photochromic && photochromic.length > 0) {
      console.log('   ✅ Found', photochromic.length, 'photochromic options');
      photochromic.forEach((opt, idx) => {
        console.log(`   [${idx + 1}] ${opt.name} (id: ${opt.id}, active: ${opt.is_active}, colors: ${opt.colors?.length || 0})`);
      });
    } else {
      console.log('   ⚠️ No photochromic options found');
      console.log('   → This is normal if data hasn\'t been created yet');
      console.log('   → Create via: POST /api/admin/lens-options with type="photochromic"');
    }
  } catch (error: any) {
    console.error('   ❌ Error:', error.message);
  }
  
  // Test 3: Test prescription sun endpoint
  console.log('\n3️⃣ Testing Prescription Sun Options...');
  try {
    const prescriptionSun = await getLensOptions({ type: 'prescription_sun' });
    if (prescriptionSun && prescriptionSun.length > 0) {
      console.log('   ✅ Found', prescriptionSun.length, 'prescription sun options');
      prescriptionSun.forEach((opt, idx) => {
        console.log(`   [${idx + 1}] ${opt.name} (id: ${opt.id}, active: ${opt.is_active}, colors: ${opt.colors?.length || 0})`);
      });
    } else {
      console.log('   ⚠️ No prescription sun options found');
      console.log('   → Trying alternative type "prescription-sun"...');
      const altPrescriptionSun = await getLensOptions({ type: 'prescription-sun' });
      if (altPrescriptionSun && altPrescriptionSun.length > 0) {
        console.log('   ✅ Found', altPrescriptionSun.length, 'options with type "prescription-sun"');
      } else {
        console.log('   → This is normal if data hasn\'t been created yet');
        console.log('   → Create via: POST /api/admin/lens-options with type="prescription_sun"');
      }
    }
  } catch (error: any) {
    console.error('   ❌ Error:', error.message);
  }
  
  // Test 4: Test raw API call
  console.log('\n4️⃣ Testing Raw API Call...');
  try {
    const url = `${API_ROUTES.LENS.OPTIONS.LIST}?type=photochromic`;
    const response = await apiClient.get(url, false);
    console.log('   Response structure:', {
      success: response.success,
      hasData: !!response.data,
      dataType: typeof response.data,
      isArray: Array.isArray(response.data),
      message: response.message
    });
    if (response.data) {
      console.log('   Data sample:', JSON.stringify(response.data).substring(0, 200));
    }
  } catch (error: any) {
    console.error('   ❌ Error:', error.message);
  }
  
  // Test 5: Check all lens options (no filter)
  console.log('\n5️⃣ Testing All Lens Options (no filter)...');
  try {
    const allOptions = await getLensOptions();
    if (allOptions && allOptions.length > 0) {
      console.log('   ✅ Found', allOptions.length, 'total lens options');
      const types = [...new Set(allOptions.map(opt => opt.type))];
      console.log('   Available types:', types.join(', '));
    } else {
      console.log('   ⚠️ No lens options found in database');
      console.log('   → This means no lens options have been created yet');
    }
  } catch (error: any) {
    console.error('   ❌ Error:', error.message);
  }
  
  console.log('\n✅ API Integration Test Complete!');
  console.log('\n📋 Next Steps:');
  console.log('   1. If no data found: Create lens options via admin API');
  console.log('   2. See STEP_BY_STEP_SETUP.md for instructions');
  console.log('   3. Verify options have type="photochromic" or type="prescription_sun"');
  console.log('   4. Make sure is_active=true');
};

// Make available globally in dev mode
if (import.meta.env.DEV && typeof window !== 'undefined') {
  (window as any).testLensOptionsAPI = testLensOptionsAPI;
  console.log('💡 Tip: Run testLensOptionsAPI() in console to test API integration');
}

export default testLensOptionsAPI;

