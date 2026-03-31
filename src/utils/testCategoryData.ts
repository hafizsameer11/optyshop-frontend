/**
 * Test Category Data Retrieval
 * Run this in browser console to test category/subcategory data retrieval
 */

import { API_BASE_URL } from './api'

declare global {
  interface Window {
    testCategoryData?: () => Promise<void>;
    testSpecificCategory?: (categorySlug?: string) => Promise<any>;
  }
}

// Test function to verify category data retrieval
window.testCategoryData = async function() {
    console.log('🔍 Testing Category Data Retrieval...');
    
    try {
        // Test 1: Get all categories
        console.log('\n📂 Test 1: Getting all categories...');
        const categoriesResponse = await fetch(`${API_BASE_URL}/categories`);
        const categoriesData = await categoriesResponse.json();
        console.log('Categories response:', categoriesData);
        
        if (categoriesData.success && categoriesData.data?.categories) {
            console.log(`✅ Found ${categoriesData.data.categories.length} categories`);
            
            // Test 2: Get first category by slug
            if (categoriesData.data.categories.length > 0) {
                const firstCategory = categoriesData.data.categories[0];
                console.log('\n📂 Test 2: Getting category by slug:', firstCategory.slug);
                
                const categoryResponse = await fetch(`${API_BASE_URL}/categories/slug/${firstCategory.slug}`);
                const categoryData = await categoryResponse.json();
                console.log('Category by slug response:', categoryData);
                
                // Test 3: Get subcategories for this category
                if (categoryData.data?.category) {
                    console.log('\n📂 Test 3: Getting subcategories for category...');
                    const subcategoriesResponse = await fetch(`${API_BASE_URL}/subcategories/by-category/${categoryData.data.category.id}`);
                    const subcategoriesData = await subcategoriesResponse.json();
                    console.log('Subcategories response:', subcategoriesData);
                    
                    // Test 4: Get products for category
                    console.log('\n📂 Test 4: Getting products for category...');
                    const productsResponse = await fetch(`${API_BASE_URL}/products?category=${firstCategory.slug}&limit=5`);
                    const productsData = await productsResponse.json();
                    console.log('Products response:', productsData);
                    
                    if (productsData.success && productsData.data?.products) {
                        console.log(`✅ Found ${productsData.data.products.length} products`);
                    }
                }
            }
        }
        
        console.log('\n✅ Category data retrieval test completed');
        
    } catch (error) {
        console.error('❌ Error testing category data:', error);
    }
};

// Test specific category slugs
window.testSpecificCategory = async function(categorySlug = 'contact-lenses') {
    console.log(`🔍 Testing specific category: ${categorySlug}`);
    
    try {
        // Test category page data
        const categoryResponse = await fetch(`${API_BASE_URL}/categories/slug/${categorySlug}`);
        const categoryData = await categoryResponse.json();
        console.log('Category data:', categoryData);
        
        // Test products for this category
        const productsResponse = await fetch(`${API_BASE_URL}/products?category=${categorySlug}&limit=12`);
        const productsData = await productsResponse.json();
        console.log('Products data:', productsData);
        
        return { categoryData, productsData };
        
    } catch (error) {
        console.error('❌ Error testing specific category:', error);
        return null;
    }
};

console.log('🧪 Category test functions loaded!');
console.log('Run testCategoryData() to test all category data retrieval');
console.log('Run testSpecificCategory("contact-lenses") to test specific category');
