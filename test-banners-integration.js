/**
 * Banner System Integration Test
 * This script tests the banner API endpoints to ensure they work correctly
 * for all page types and category hierarchies.
 */

const API_BASE_URL = 'http://localhost:5000/api';

// Test functions for different banner endpoints
async function testBannerEndpoint(endpoint, description) {
    console.log(`\n🧪 Testing: ${description}`);
    console.log(`📡 Endpoint: ${endpoint}`);
    
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`);
        const data = await response.json();
        
        if (response.ok) {
            console.log(`✅ Success: ${data.banners?.length || data?.length || 0} banners found`);
            
            // Log banner details if any found
            const banners = data.banners || data || [];
            if (banners.length > 0) {
                banners.forEach((banner, index) => {
                    console.log(`   📋 Banner ${index + 1}: "${banner.title}" (${banner.page_type})`);
                    console.log(`      🔗 Image: ${banner.image_url}`);
                    console.log(`      📍 Category ID: ${banner.category_id}`);
                    console.log(`      📍 Sub-category ID: ${banner.sub_category_id}`);
                    console.log(`      ✅ Active: ${banner.is_active}`);
                });
            }
        } else {
            console.log(`❌ Error: ${response.status} - ${data.message || 'Unknown error'}`);
        }
    } catch (error) {
        console.log(`❌ Network Error: ${error.message}`);
    }
}

// Main test function
async function runBannerTests() {
    console.log('🚀 Starting Banner System Integration Tests');
    console.log('=' .repeat(60));
    
    // Test 1: Home page banners
    await testBannerEndpoint('/banners?page_type=home', 'Home Page Banners');
    
    // Test 2: Category page banners (assuming category ID 1 exists)
    await testBannerEndpoint('/banners?page_type=category&category_id=1', 'Category Page Banners (Category ID: 1)');
    
    // Test 3: Subcategory page banners (assuming category ID 1 and subcategory ID 2 exist)
    await testBannerEndpoint('/banners?page_type=subcategory&category_id=1&sub_category_id=2', 'Subcategory Page Banners (Category: 1, Subcategory: 2)');
    
    // Test 4: Sub-subcategory page banners (assuming category ID 1 and subcategory ID 2 exist)
    await testBannerEndpoint('/banners?page_type=sub_subcategory&category_id=1&sub_category_id=2', 'Sub-subcategory Page Banners (Category: 1, Subcategory: 2)');
    
    // Test 5: All banners (no filters)
    await testBannerEndpoint('/banners', 'All Active Banners');
    
    console.log('\n' + '=' .repeat(60));
    console.log('🏁 Banner System Integration Tests Complete');
    console.log('\n📝 Test Summary:');
    console.log('   • Home page banners should show banners assigned to "Home Page"');
    console.log('   • Category banners should show banners assigned to specific categories');
    console.log('   • Subcategory banners should show banners assigned to specific subcategories');
    console.log('   • Sub-subcategory banners should show banners assigned to specific sub-subcategories');
    console.log('   • Fallback logic should work when specific banners are not found');
    
    console.log('\n🔧 To test in the browser:');
    console.log('   1. Start the frontend: npm run dev');
    console.log('   2. Navigate to different pages:');
    console.log('      - Home page: /');
    console.log('      - Category page: /category/sunglasses');
    console.log('      - Subcategory page: /category/sunglasses/aviator');
    console.log('      - Sub-subcategory page: /category/sunglasses/aviator/pilot');
    console.log('   3. Check browser console for banner loading logs');
    console.log('   4. Verify banners appear correctly on each page type');
}

// Run tests if this script is executed directly
runBannerTests().catch(console.error);

export { testBannerEndpoint, runBannerTests };
