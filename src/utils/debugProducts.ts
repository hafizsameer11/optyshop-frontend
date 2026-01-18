/**
 * Debug utility to check product API responses
 */
import { getProducts } from '../services/productsService';

export const debugProducts = async () => {
  console.log('🔍 Debugging Products API...\n');
  
  try {
    // Test 1: Get all products without filters
    console.log('1️⃣ Testing getProducts() without filters...');
    const result1 = await getProducts();
    console.log('Response:', result1);
    
    if (result1) {
      console.log('✅ Products found:', result1.products.length);
      console.log('Pagination:', result1.pagination);
      
      if (result1.products.length > 0) {
        console.log('\n📋 Sample product structure:');
        const sampleProduct = result1.products[0];
        console.log('ID:', sampleProduct.id);
        console.log('Name:', sampleProduct.name);
        console.log('Price:', sampleProduct.price);
        console.log('in_stock:', sampleProduct.in_stock);
        console.log('stock_quantity:', sampleProduct.stock_quantity);
        console.log('stock_status:', (sampleProduct as any).stock_status);
        console.log('Full product:', sampleProduct);
      }
    } else {
      console.log('❌ No response from API');
    }
    
    // Test 2: Get products with category filter
    console.log('\n2️⃣ Testing with category filter...');
    const result2 = await getProducts({ category: 'sunglasses' });
    console.log('Category filter response:', result2);
    
  } catch (error: any) {
    console.error('❌ Error debugging products:', error);
  }
};

// Make available globally in dev mode
if (import.meta.env.DEV && typeof window !== 'undefined') {
  (window as any).debugProducts = debugProducts;
  console.log('💡 Tip: Run debugProducts() in console to debug product API');
}

export default debugProducts;
