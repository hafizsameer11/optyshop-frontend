// Test script to verify the eye hygiene variants API endpoint
// This tests the fix for the Prisma vs Sequelize issue

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

async function testEyeHygieneVariants() {
  const productId = 116; // Product ID mentioned in the error
  const endpoint = `${API_BASE_URL}/products/${productId}/size-volume-variants`;
  
  console.log(`Testing endpoint: ${endpoint}`);
  
  try {
    const response = await fetch(endpoint);
    
    console.log(`Response status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error response:`, errorText);
      return false;
    }
    
    const data = await response.json();
    console.log(`Success! Response data:`, data);
    
    // Check if we got valid data
    if (Array.isArray(data)) {
      console.log(`✅ Endpoint returned ${data.length} variants`);
      return true;
    } else if (data && typeof data === 'object') {
      console.log(`✅ Endpoint returned valid data:`, Object.keys(data));
      return true;
    } else {
      console.log(`⚠️ Unexpected response format:`, typeof data);
      return false;
    }
    
  } catch (error) {
    console.error(`❌ Network error:`, error.message);
    return false;
  }
}

// Test the endpoint
testEyeHygieneVariants().then(success => {
  if (success) {
    console.log(`\n✅ The eye hygiene variants endpoint is working correctly!`);
    console.log(`The Prisma -> Sequelize fix has resolved the 500 error.`);
  } else {
    console.log(`\n❌ The endpoint is still having issues.`);
    console.log(`Check the backend logs for any remaining errors.`);
  }
});
