// Test banner API directly
async function testBannerAPI() {
    try {
        console.log('Testing banner API...');
        
        // Test the banners API endpoint
        const response = await fetch('https://optyshop-frontend.hmstech.org/api/banners');
        console.log('Response status:', response.status);
        
        const data = await response.json();
        console.log('Response data:', data);
        
        if (data.success && data.data && data.data.banners) {
            console.log(`Found ${data.data.banners.length} banners`);
            
            // Filter home page banners
            const homeBanners = data.data.banners.filter(b => b.page_type === 'home' && b.is_active);
            console.log(`Home page banners: ${homeBanners.length}`, homeBanners);
            
            // Filter category banners
            const categoryBanners = data.data.banners.filter(b => b.page_type === 'category' && b.is_active);
            console.log(`Category banners: ${categoryBanners.length}`, categoryBanners);
            
            // Test specific category
            const eyeGlassesBanners = data.data.banners.filter(b => 
                b.page_type === 'category' && 
                b.category_id === 23 && 
                b.is_active
            );
            console.log(`Eye glasses banners: ${eyeGlassesBanners.length}`, eyeGlassesBanners);
            
        } else {
            console.log('No banners found or invalid response structure');
        }
        
    } catch (error) {
        console.error('Error testing banner API:', error);
    }
}

// Run the test
testBannerAPI();
