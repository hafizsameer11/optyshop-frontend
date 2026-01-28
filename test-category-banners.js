// Test script to verify category banner filtering
console.log('Testing category banner filtering...');

// Simulate the banner data from the API
const mockBanners = [
  {
    id: 18,
    title: "Eye Glasses and Sun Glasses",
    page_type: "category",
    category_id: 23,
    is_active: true
  },
  {
    id: 11,
    title: "See Better. Look Better.",
    page_type: "category", 
    category_id: 24,
    is_active: true
  },
  {
    id: 17,
    title: "Eye Glasses",
    page_type: "category",
    category_id: 30,
    is_active: true
  },
  {
    id: 21,
    title: "nbnb",
    page_type: "category",
    category_id: 28,
    is_active: true
  },
  {
    id: 19,
    title: "Sun Glasses",
    page_type: "category",
    category_id: 23,
    is_active: true
  }
];

// Test filtering logic
function testFiltering(banners, filters) {
  console.log(`\nTesting filters:`, filters);
  
  // Filter active banners
  let filteredBanners = banners.filter((banner) => banner.is_active);
  console.log(`After active filter: ${filteredBanners.length} banners`);

  // Filter by page_type if specified
  if (filters.page_type) {
    const beforePageTypeFilter = filteredBanners.length;
    filteredBanners = filteredBanners.filter(
      (banner) => banner.page_type === filters.page_type
    );
    console.log(`Page type filter (${filters.page_type}): ${beforePageTypeFilter} -> ${filteredBanners.length}`);
  }

  // Filter by category_id if specified
  if (filters.category_id !== undefined && filters.category_id !== null) {
    const beforeCategoryFilter = filteredBanners.length;
    filteredBanners = filteredBanners.filter(
      (banner) => banner.category_id === filters.category_id || banner.category_id === null || banner.category_id === undefined
    );
    console.log(`Category ID filter (${filters.category_id}): ${beforeCategoryFilter} -> ${filteredBanners.length}`);
    console.log('Banner category_ids in filtered list:', filteredBanners.map(b => ({ id: b.id, title: b.title, category_id: b.category_id })));
  }

  return filteredBanners;
}

// Test different scenarios
console.log('\n=== Test 1: Eye Glasses Category (ID: 23) ===');
const eyeGlassesBanners = testFiltering(mockBanners, { page_type: 'category', category_id: 23 });
console.log('Result:', eyeGlassesBanners);

console.log('\n=== Test 2: Contact Lenses Category (ID: 24) ===');
const contactLensesBanners = testFiltering(mockBanners, { page_type: 'category', category_id: 24 });
console.log('Result:', contactLensesBanners);

console.log('\n=== Test 3: All Category Banners (no category filter) ===');
const allCategoryBanners = testFiltering(mockBanners, { page_type: 'category' });
console.log('Result:', allCategoryBanners);
