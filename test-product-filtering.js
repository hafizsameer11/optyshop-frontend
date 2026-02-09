// Test script to verify product filtering by category and subcategory
// This simulates the API calls made by the CategoryPage component

const API_BASE_URL = 'http://localhost:3001/api'; // Adjust if your backend runs on different port

async function testProductFiltering() {
    console.log('🧪 Testing Product Filtering API Calls\n');

    // Test 1: Get all contact lenses products
    console.log('1️⃣ Testing category filter: contact-lenses');
    try {
        const response = await fetch(`${API_BASE_URL}/products?category=contact-lenses&limit=5`);
        const data = await response.json();
        console.log('✅ Response:', {
            success: data.success,
            productCount: data.data?.products?.length || 0,
            products: data.data?.products?.map(p => ({
                name: p.name,
                category: p.category?.slug,
                subcategory: p.subCategory?.slug
            }))
        });
    } catch (error) {
        console.error('❌ Error:', error.message);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 2: Get contact lenses with spherical subcategory
    console.log('2️⃣ Testing category + subcategory filter: contact-lenses + spherical');
    try {
        const response = await fetch(`${API_BASE_URL}/products?category=contact-lenses&subCategory=spherical&limit=5`);
        const data = await response.json();
        console.log('✅ Response:', {
            success: data.success,
            productCount: data.data?.products?.length || 0,
            products: data.data?.products?.map(p => ({
                name: p.name,
                category: p.category?.slug,
                subcategory: p.subCategory?.slug
            }))
        });
    } catch (error) {
        console.error('❌ Error:', error.message);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 3: Get contact lenses with astigmatism subcategory
    console.log('3️⃣ Testing category + subcategory filter: contact-lenses + astigmatism');
    try {
        const response = await fetch(`${API_BASE_URL}/products?category=contact-lenses&subCategory=astigmatism&limit=5`);
        const data = await response.json();
        console.log('✅ Response:', {
            success: data.success,
            productCount: data.data?.products?.length || 0,
            products: data.data?.products?.map(p => ({
                name: p.name,
                category: p.category?.slug,
                subcategory: p.subCategory?.slug
            }))
        });
    } catch (error) {
        console.error('❌ Error:', error.message);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 4: Get eye hygiene products
    console.log('4️⃣ Testing category filter: eye-hygiene');
    try {
        const response = await fetch(`${API_BASE_URL}/products?category=eye-hygiene&limit=5`);
        const data = await response.json();
        console.log('✅ Response:', {
            success: data.success,
            productCount: data.data?.products?.length || 0,
            products: data.data?.products?.map(p => ({
                name: p.name,
                category: p.category?.slug,
                subcategory: p.subCategory?.slug
            }))
        });
    } catch (error) {
        console.error('❌ Error:', error.message);
    }

    console.log('\n🎯 Testing complete!');
}

// Run the test
testProductFiltering().catch(console.error);
