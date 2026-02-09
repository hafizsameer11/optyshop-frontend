// Test script to verify subcategory filtering works correctly
// Run this in the browser console on the test page

console.log('🧪 Testing subcategory filtering...');

// Test 1: Check if categories are loaded
const checkCategories = async () => {
  try {
    const response = await fetch('/api/categories?includeSubcategories=true');
    const data = await response.json();
    console.log('✅ Categories API response:', data);
    
    if (data.success && data.data?.categories) {
      const contactLenses = data.data.categories.find(cat => cat.slug === 'contact-lenses');
      if (contactLenses) {
        console.log('✅ Found contact-lenses category:', contactLenses.name);
        console.log('📋 Subcategories:', contactLenses.subcategories?.map(sub => ({
          name: sub.name,
          slug: sub.slug,
          children: sub.children?.length || 0
        })));
      } else {
        console.log('❌ Contact-lenses category not found');
      }
    }
  } catch (error) {
    console.error('❌ Error fetching categories:', error);
  }
};

// Test 2: Check product filtering for different subcategories
const testProductFiltering = async () => {
  const testCases = [
    { category: 'contact-lenses', subcategory: null, description: 'All contact lenses' },
    { category: 'contact-lenses', subcategory: 'daily', description: 'Daily contact lenses' },
    { category: 'contact-lenses', subcategory: 'monthly', description: 'Monthly contact lenses' },
  ];

  for (const testCase of testCases) {
    try {
      const params = new URLSearchParams({
        category: testCase.category,
        page: '1',
        limit: '5'
      });
      
      if (testCase.subcategory) {
        params.append('subCategory', testCase.subcategory);
      }

      const response = await fetch(`/api/products?${params}`);
      const data = await response.json();
      
      console.log(`✅ Test: ${testCase.description}`);
      console.log(`   Products found: ${data.data?.products?.length || 0}`);
      
      if (data.data?.products) {
        data.data.products.forEach((product, index) => {
          console.log(`   ${index + 1}. ${product.name} - Subcategory: ${product.subCategory?.slug || product.sub_category?.slug || 'none'}`);
        });
      }
    } catch (error) {
      console.error(`❌ Error testing ${testCase.description}:`, error);
    }
  }
};

// Test 3: Check specific navigation URLs
const testNavigationUrls = () => {
  const testUrls = [
    '/category/contact-lenses',
    '/category/contact-lenses/daily',
    '/category/contact-lenses/monthly',
    '/category/contact-lenses/daily/spherical',
    '/category/contact-lenses/daily/astigmatism',
    '/category/contact-lenses/monthly/spherical',
    '/category/contact-lenses/monthly/astigmatism',
  ];

  console.log('🔗 Testing navigation URLs:');
  testUrls.forEach(url => {
    console.log(`   ${url}`);
  });
};

// Run all tests
const runAllTests = async () => {
  console.log('🚀 Starting comprehensive subcategory filtering tests...');
  await checkCategories();
  await testProductFiltering();
  testNavigationUrls();
  console.log('✅ All tests completed!');
};

// Export for manual testing
window.testSubcategories = {
  checkCategories,
  testProductFiltering,
  testNavigationUrls,
  runAllTests
};

console.log('📝 Test functions available. Run window.testSubcategories.runAllTests() to execute all tests.');
