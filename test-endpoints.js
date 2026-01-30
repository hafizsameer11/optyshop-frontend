// Simple test to verify the new endpoints are working
const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000'; // Adjust if your backend runs on different port

async function testEndpoints() {
    console.log('Testing new API endpoints...\n');

    // Test 1: GET /api/eye-hygiene-forms/options
    try {
        console.log('1. Testing GET /api/eye-hygiene-forms/options');
        const response1 = await fetch(`${BASE_URL}/api/eye-hygiene-forms/options`);
        const data1 = await response1.json();
        console.log(`Status: ${response1.status}`);
        console.log('Response:', JSON.stringify(data1, null, 2));
        console.log('✅ Endpoint exists and responds\n');
    } catch (error) {
        console.log('❌ Error testing eye-hygiene-forms/options:', error.message);
        console.log('💡 Make sure backend is running on port 3000\n');
    }

    // Test 2: GET /api/products/103/size-volume-variants (using product ID 103 as example)
    try {
        console.log('2. Testing GET /api/products/103/size-volume-variants');
        const response2 = await fetch(`${BASE_URL}/api/products/103/size-volume-variants`);
        const data2 = await response2.json();
        console.log(`Status: ${response2.status}`);
        console.log('Response:', JSON.stringify(data2, null, 2));
        console.log('✅ Endpoint exists and responds\n');
    } catch (error) {
        console.log('❌ Error testing products/103/size-volume-variants:', error.message);
        console.log('💡 Make sure product ID 103 exists in your database\n');
    }

    console.log('Endpoint testing complete!');
}

testEndpoints().catch(console.error);
