// Test script to verify brands API integration
const testBrandsAPI = async () => {
  try {
    console.log('Testing brands API integration...')
    
    // Test the API endpoint directly - using the production API
    const response = await fetch('https://optyshop-frontend.hmstech.org/api/brands?activeOnly=true')
    const data = await response.json()
    
    console.log('API Response:', data)
    
    if (data.success && data.data && data.data.brands) {
      console.log(`✅ Found ${data.data.brands.length} brands`)
      
      data.data.brands.forEach((brand, index) => {
        console.log(`Brand ${index + 1}:`, {
          id: brand.id,
          name: brand.name,
          hasLogoImage: !!brand.logo_image,
          logoImageUrl: brand.logo_image,
          hasWebsite: !!brand.website_url
        })
      })
    } else {
      console.log('❌ No brands found or invalid response structure')
    }
  } catch (error) {
    console.error('❌ Error testing brands API:', error)
  }
}

// Run the test
testBrandsAPI()
