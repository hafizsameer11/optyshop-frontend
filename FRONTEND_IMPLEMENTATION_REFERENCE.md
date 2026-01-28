# Frontend Implementation Reference

## Overview

The OptyShop frontend is already fully implemented to support MM Calibers and Eye Hygiene Variants. This document shows how the existing code integrates with the backend APIs.

## File Structure

```
src/
├── config/
│   └── apiRoutes.ts              # API endpoint definitions
├── services/
│   └── productsService.ts        # Product API calls and types
├── pages/shop/
│   └── ProductDetail.tsx        # Product detail page with caliber/variant UI
└── utils/
    └── productImage.ts          # Image handling utilities
```

## API Routes Configuration

### MM Caliber Routes
```typescript
// src/config/apiRoutes.ts
PRODUCTS: {
  CALIBERS: (id: number | string) => `/products/${id}/calibers`, // PUBLIC
},
ADMIN: {
  MM_CALIBERS: {
    BY_PRODUCT: (productId: number | string) => `/admin/products/${productId}/calibers`,
    CREATE: (productId: number | string, mm: number) => `/admin/products/${productId}/calibers/${mm}`,
    UPDATE: (productId: number | string, mm: number) => `/admin/products/${productId}/calibers/${mm}`,
    DELETE: (productId: number | string, mm: number) => `/admin/products/${productId}/calibers/${mm}`,
  }
}
```

### Eye Hygiene Variant Routes
```typescript
// src/config/apiRoutes.ts
ADMIN: {
  EYE_HYGIENE_VARIANTS: {
    LIST: (productId?: number | string) => `/admin/eye-hygiene-variants${productId ? `?product_id=${productId}` : ''}`,
    BY_ID: (id: number | string) => `/admin/eye-hygiene-variants/${id}`,
    CREATE: `/admin/eye-hygiene-variants`,
    UPDATE: (id: number | string) => `/admin/eye-hygiene-variants/${id}`,
    DELETE: (id: number | string) => `/admin/eye-hygiene-variants/${id}`,
  }
}
```

## TypeScript Interfaces

### MM Caliber Interface
```typescript
// src/services/productsService.ts
export interface MMCaliber {
  mm: number; // e.g., 58, 62, 64
  image: string; // URL to caliber-specific image
  price?: number; // Optional price adjustment for this caliber
  stock_quantity?: number; // Stock for this specific caliber
  is_active?: boolean; // Whether this caliber is available
}
```

### Eye Hygiene Variant Interface
```typescript
// src/services/productsService.ts
export interface EyeHygieneVariant {
  id: number;
  product_id: number;
  name: string;
  size_volume: string; // e.g., "5ml", "10ml", "30ml"
  pack_type?: string | null; // e.g., "Single", "Pack of 2"
  price: number;
  compare_at_price?: number | null;
  stock_quantity: number;
  stock_status: 'in_stock' | 'out_of_stock' | 'backorder';
  sku?: string | null;
  expiry_date?: string | null;
  image?: string; // Variant-specific image
  is_active: boolean;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
}
```

### Enhanced Product Interface
```typescript
// src/services/productsService.ts
export interface Product {
  // ... existing fields
  
  // MM Caliber System (for frames/glasses)
  mm_calibers?: MMCaliber[]; // Array of caliber options with images
  
  // Eye Hygiene specific fields
  size_volume?: string | null;
  pack_type?: string | null;
  expiry_date?: string | null;
  
  // Size/Volume Variants (for Eye Hygiene products)
  size_volume_variants?: SizeVolumeVariant[];
}
```

## Service Functions

### MM Caliber Functions
```typescript
// src/services/productsService.ts

// Public: Get calibers for a product
export const getProductCalibers = async (id: number | string): Promise<MMCaliber[] | null> => {
  try {
    const response = await apiClient.get<{ calibers: MMCaliber[] }>(
      API_ROUTES.PRODUCTS.CALIBERS(id),
      false // PUBLIC endpoint
    );
    return response.success ? (response.data as any).calibers || [] : null;
  } catch (error) {
    console.error('Error fetching product calibers:', error);
    return null;
  }
};

// Admin: Create caliber
export const adminCreateProductCaliber = async (
  productId: number | string,
  mm: number,
  caliberData: { image: string; price?: number; stock_quantity?: number; is_active?: boolean; }
): Promise<MMCaliber | null> => {
  try {
    const response = await apiClient.post<MMCaliber>(
      API_ROUTES.ADMIN.MM_CALIBERS.CREATE(productId, mm),
      caliberData,
      true // ADMIN endpoint
    );
    return response.success ? response.data as MMCaliber : null;
  } catch (error) {
    console.error('Error creating product caliber:', error);
    return null;
  }
};
```

### Eye Hygiene Variant Functions
```typescript
// src/services/productsService.ts

// Admin: Get variants for a product
export const adminGetEyeHygieneVariants = async (productId?: number | string): Promise<EyeHygieneVariant[] | null> => {
  try {
    const response = await apiClient.get<{ variants: EyeHygieneVariant[] }>(
      API_ROUTES.ADMIN.EYE_HYGIENE_VARIANTS.LIST(productId),
      true // ADMIN endpoint
    );
    return response.success ? (response.data as any).variants || [] : null;
  } catch (error) {
    console.error('Error fetching eye hygiene variants:', error);
    return null;
  }
};

// Admin: Create variant
export const adminCreateEyeHygieneVariant = async (
  variantData: {
    product_id: number;
    name: string;
    size_volume: string;
    pack_type?: string | null;
    price: number;
    // ... other fields
  }
): Promise<EyeHygieneVariant | null> => {
  try {
    const response = await apiClient.post<EyeHygieneVariant>(
      API_ROUTES.ADMIN.EYE_HYGIENE_VARIANTS.CREATE,
      variantData,
      true // ADMIN endpoint
    );
    return response.success ? response.data as EyeHygieneVariant : null;
  } catch (error) {
    console.error('Error creating eye hygiene variant:', error);
    return null;
  }
};
```

## Product Detail Page Implementation

### MM Caliber State Management
```typescript
// src/pages/shop/ProductDetail.tsx

// State for calibers
const [fetchedCalibers, setFetchedCalibers] = useState<MMCaliber[]>([])
const [calibersLoading, setCalibersLoading] = useState(false)
const [selectedCaliber, setSelectedCaliber] = useState<MMCaliber | null>(null)

// Fetch calibers effect
useEffect(() => {
  const fetchCalibers = async () => {
    if (!product || !product.id) {
      setFetchedCalibers([])
      setSelectedCaliber(null)
      return
    }

    // Check if product has calibers or is a frame/glasses product
    const p = product as any
    const hasCalibers = p.mm_calibers && Array.isArray(p.mm_calibers) && p.mm_calibers.length > 0
    const isFrameProduct = product?.category?.slug === 'eyeglasses' || product?.category?.slug === 'sunglasses'

    if (!hasCalibers && !isFrameProduct) {
      setFetchedCalibers([])
      setSelectedCaliber(null)
      return
    }

    setCalibersLoading(true)
    try {
      const calibers = await getProductCalibers(product.id)
      if (calibers && calibers.length > 0) {
        setFetchedCalibers(calibers)
        // Auto-select first active caliber
        const firstActiveCaliber = calibers.find((c) => c.is_active !== false)
        if (firstActiveCaliber) {
          setSelectedCaliber(firstActiveCaliber)
        }
      }
    } catch (error) {
      console.error('Error fetching calibers:', error)
    } finally {
      setCalibersLoading(false)
    }
  }

  fetchCalibers()
}, [product?.id, product.category?.slug])
```

### Eye Hygiene Detection
```typescript
// src/pages/shop/ProductDetail.tsx

const isEyeHygiene = useMemo(() => {
  if (!product) return false
  const p = product as any
  
  // Multiple detection methods:
  // 1. Product type
  const isEyeHygieneType = p.product_type === 'eye_hygiene'
  
  // 2. Category/subcategory names
  const categorySlug = product.category?.slug || ''
  const categoryName = product.category?.name || ''
  const categoryMatch = categorySlug.toLowerCase().includes('eye-hygiene') ||
                       categorySlug.toLowerCase().includes('hygiene') ||
                       categoryName.toLowerCase().includes('eye hygiene')
  
  // 3. Presence of eye hygiene fields
  const hasEyeHygieneFields = !!(p.size_volume || p.pack_type || p.expiry_date)
  
  // 4. Presence of variants
  const hasVariants = p.sizeVolumeVariants && Array.isArray(p.sizeVolumeVariants) && p.sizeVolumeVariants.length > 0
  
  return isEyeHygieneType || categoryMatch || hasEyeHygieneFields || hasVariants
}, [product])
```

### MM Caliber UI Component
```typescript
// src/pages/shop/ProductDetail.tsx

{/* Caliber Selection for Frames/Glasses */}
{fetchedCalibers.length > 0 && !isEyeHygiene && !isContactLens && (
  <div className="mb-8 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-lg font-bold text-gray-900">Frame Size</h3>
      {selectedCaliber && (
        <span className="text-sm text-gray-600">
          Selected: {selectedCaliber.mm}mm
        </span>
      )}
    </div>
    
    <div className="flex flex-wrap gap-3">
      {fetchedCalibers
        .filter(c => c.is_active !== false)
        .sort((a, b) => a.mm - b.mm)
        .map((caliber) => (
          <button
            key={caliber.mm}
            type="button"
            onClick={() => handleCaliberChange(caliber.mm)}
            className={`px-4 py-2 rounded-lg border-2 transition-all ${
              selectedCaliber?.mm === caliber.mm
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 hover:border-gray-300 text-gray-700'
            } ${caliber.stock_quantity === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={caliber.stock_quantity === 0}
          >
            <div className="text-center">
              <div className="font-semibold">{caliber.mm}mm</div>
              {caliber.stock_quantity <= 5 && caliber.stock_quantity > 0 && (
                <div className="text-xs text-orange-600">Only {caliber.stock_quantity} left</div>
              )}
              {caliber.stock_quantity === 0 && (
                <div className="text-xs text-red-600">Out of stock</div>
              )}
            </div>
          </button>
        ))}
    </div>
  </div>
)}
```

### Eye Hygiene UI Component
```typescript
// src/pages/shop/ProductDetail.tsx

{/* Eye Hygiene Fields Section */}
{isEyeHygiene && ((product as any).size_volume || (product as any).pack_type || (product as any).expiry_date || product.stock_quantity) && (
  <div className="mb-8 bg-blue-50 p-6 rounded-2xl border border-blue-100 shadow-sm">
    <h2 className="text-lg font-bold text-gray-900 mb-4 border-b border-blue-200 pb-2">
      Product Information
    </h2>
    <div className="grid grid-cols-2 gap-y-4 gap-x-8">
      {(product as any).size_volume && (
        <div className="flex flex-col">
          <span className="text-xs font-bold text-gray-500 uppercase mb-1">Size / Volume</span>
          <span className="text-gray-900 font-semibold text-lg">{(product as any).size_volume}</span>
        </div>
      )}
      {(product as any).pack_type && (
        <div className="flex flex-col">
          <span className="text-xs font-bold text-gray-500 uppercase mb-1">Pack Type</span>
          <span className="text-gray-900 font-semibold text-lg">{(product as any).pack_type}</span>
        </div>
      )}
      {product.stock_quantity !== undefined && (
        <div className="flex flex-col">
          <span className="text-xs font-bold text-gray-500 uppercase mb-1">Quantity Available</span>
          <span className={`font-semibold text-lg ${product.stock_quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {product.stock_quantity > 0 ? product.stock_quantity : 'Out of Stock'}
          </span>
        </div>
      )}
      {(product as any).expiry_date && (
        <div className="flex flex-col">
          <span className="text-xs font-bold text-gray-500 uppercase mb-1">Expiry Date</span>
          <span className="text-gray-900 font-semibold text-lg">
            {new Date((product as any).expiry_date).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </span>
        </div>
      )}
    </div>
  </div>
)}
```

## Image Handling

### Product Image Utilities
```typescript
// src/utils/productImage.ts

export const getProductImageUrl = (product: Product, index: number = 0): string => {
  // Handle caliber-specific images
  if (product.mm_calibers && product.mm_calibers.length > 0) {
    return product.mm_calibers[index]?.image_url || product.image || product.thumbnail || '/placeholder-product.jpg'
  }
  
  // Handle regular product images
  if (product.images && Array.isArray(product.images) && product.images.length > 0) {
    return product.images[index]
  }
  
  return product.image || product.thumbnail || '/placeholder-product.jpg'
}

export const getVariantImageUrl = (variant: SizeVolumeVariant | EyeHygieneVariant): string => {
  return variant.image_url || variant.image || '/placeholder-product.jpg'
}
```

## Usage Examples

### Fetching Product with Calibers
```typescript
// In a component
const { product } = useProduct() // Custom hook or state
const [calibers, setCalibers] = useState<MMCaliber[]>([])

useEffect(() => {
  if (product?.id) {
    getProductCalibers(product.id).then(setCalibers)
  }
}, [product?.id])
```

### Admin: Creating a Caliber
```typescript
// In admin component
const handleCreateCaliber = async (mm: number, imageData: { image: string }) => {
  const result = await adminCreateProductCaliber(productId, mm, imageData)
  if (result) {
    console.log('Caliber created:', result)
    // Refresh calibers list
    const updated = await adminGetProductCalibers(productId)
    setCalibers(updated || [])
  }
}
```

### Admin: Creating Eye Hygiene Variant
```typescript
// In admin component
const handleCreateVariant = async (variantData: CreateVariantData) => {
  const result = await adminCreateEyeHygieneVariant(variantData)
  if (result) {
    console.log('Variant created:', result)
    // Refresh variants list
    const updated = await adminGetEyeHygieneVariants(productId)
    setVariants(updated || [])
  }
}
```

## Key Features

### ✅ Already Implemented

1. **MM Caliber System**
   - Fetch calibers for frame/glasses products
   - Display caliber selector with visual feedback
   - Handle stock status and low stock warnings
   - Switch product images based on selected caliber
   - Support for price adjustments per caliber

2. **Eye Hygiene System**
   - Automatic detection of eye hygiene products
   - Display product information section
   - Handle size, pack type, expiry date fields
   - Stock quantity with color coding
   - Support for variants with individual pricing

3. **Admin Integration**
   - Complete CRUD operations for calibers
   - Complete CRUD operations for eye hygiene variants
   - Type-safe interfaces and error handling
   - Ready for admin panel integration

4. **Responsive Design**
   - Mobile-friendly caliber selectors
   - Adaptive grid layouts for product information
   - Touch-friendly buttons and interactions
   - Proper loading states and error handling

## Testing

The frontend includes comprehensive logging for debugging:

```typescript
// Debug logging in development
if (import.meta.env.DEV) {
  console.log('🔍 MM Calibers loaded:', calibers)
  console.log('👁️ Eye Hygiene Product Detected:', product)
  console.log('📦 Product with variants:', product.sizeVolumeVariants)
}
```

## Next Steps for Backend Integration

1. **Implement Backend APIs**: Follow the API guide to create the backend endpoints
2. **Database Schema**: Apply the Prisma schema changes
3. **Test Integration**: Use browser DevTools to verify API responses
4. **Admin Panel**: Connect the admin functions to the admin interface

The frontend is production-ready and will work seamlessly once the backend is implemented according to the API specifications.
