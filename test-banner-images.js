/**
 * Test script to verify banner API and image loading
 * Run this with: node test-banner-images.js
 */

import http from 'http';
import https from 'https';

// Test the banner API endpoint
function testBannerAPI() {
    console.log('🔍 Testing banner API endpoint...');
    
    const options = {
        hostname: 'optyshop-frontend.hmstech.org',
        port: 443,
        path: '/api/banners?page_type=category',
        method: 'GET',
        headers: {
            'User-Agent': 'OptyShop-Test/1.0'
        }
    };

    const req = https.request(options, (res) => {
        console.log(`📡 API Response Status: ${res.statusCode}`);
        
        let data = '';
        res.on('data', (chunk) => {
            data += chunk;
        });
        
        res.on('end', () => {
            try {
                const response = JSON.parse(data);
                console.log('📋 API Response Structure:', {
                    success: response.success,
                    hasData: !!response.data,
                    dataType: Array.isArray(response.data) ? 'array' : typeof response.data,
                    dataLength: Array.isArray(response.data) ? response.data.length : 'N/A'
                });
                
                if (response.success && response.data) {
                    const banners = Array.isArray(response.data) ? response.data : response.data.banners || [];
                    console.log(`🎯 Found ${banners.length} banners`);
                    
                    // Test image URLs
                    banners.forEach((banner, index) => {
                        if (banner.image_url) {
                            console.log(`🖼️ Banner ${index + 1}:`, {
                                id: banner.id,
                                title: banner.title,
                                imageUrl: banner.image_url,
                                pageType: banner.page_type,
                                categoryId: banner.category_id
                            });
                            
                            // Test if image URL is accessible
                            testImageURL(banner.image_url);
                        }
                    });
                } else {
                    console.log('⚠️ No banners found or API response unsuccessful');
                }
            } catch (error) {
                console.error('❌ Error parsing API response:', error.message);
                console.log('Raw response:', data.substring(0, 500));
            }
        });
    });

    req.on('error', (error) => {
        console.error('❌ API request failed:', error.message);
    });

    req.end();
}

// Test individual image URL accessibility
function testImageURL(imageUrl) {
    if (!imageUrl) return;
    
    // Handle different URL formats
    let testUrl;
    if (imageUrl.startsWith('/external-images/')) {
        testUrl = `https://optyshop-frontend.hmstech.org${imageUrl}`;
    } else if (imageUrl.startsWith('http')) {
        testUrl = imageUrl;
    } else if (imageUrl.startsWith('/')) {
        testUrl = `https://optyshop-frontend.hmstech.org${imageUrl}`;
    } else {
        testUrl = `https://optyshop-frontend.hmstech.org/${imageUrl}`;
    }
    
    console.log(`🔍 Testing image: ${testUrl}`);
    
    const protocol = testUrl.startsWith('https:') ? https : http;
    const url = new URL(testUrl);
    
    const options = {
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: url.pathname + url.search,
        method: 'HEAD', // Use HEAD to check if resource exists
        headers: {
            'User-Agent': 'OptyShop-Test/1.0'
        }
    };

    const req = protocol.request(options, (res) => {
        console.log(`📡 Image ${testUrl}: ${res.statusCode} ${res.statusMessage}`);
        
        if (res.statusCode === 200) {
            console.log(`✅ Image accessible: ${testUrl}`);
        } else if (res.statusCode === 404) {
            console.log(`❌ Image not found (404): ${testUrl}`);
        } else {
            console.log(`⚠️ Image returned ${res.statusCode}: ${testUrl}`);
        }
    });

    req.on('error', (error) => {
        console.error(`❌ Image request failed for ${testUrl}:`, error.message);
    });

    req.setTimeout(5000, () => {
        req.destroy();
        console.log(`⏰ Image request timeout: ${testUrl}`);
    });

    req.end();
}

// Run the tests
console.log('🚀 Starting banner image tests...\n');
testBannerAPI();
