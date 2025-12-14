# Product Customization API Integration

## ✅ New Endpoints Added

The following Product Customization endpoints from the Postman collection have been integrated:

### 1. **GET /api/customization/options** (PUBLIC)
Get all available lens options, finishes, colors, and treatments for product customization.

**Service Function:**
```typescript
import { getCustomizationOptions } from '../services/customizationService'

const options = await getCustomizationOptions()
// Returns: { lensOptions, lensFinishes, lensColors, treatments }
```

**Response Structure:**
```typescript
{
  lensOptions: LensOption[]      // All available lens types
  lensFinishes: LensFinish[]      // All available finishes
  lensColors: LensColor[]         // All available colors
  treatments: Treatment[]         // All available treatments
}
```

---

### 2. **GET /api/customization/products/:id/customization** (PUBLIC)
Get customization options for a specific product.

**Service Function:**
```typescript
import { getProductCustomizationOptions } from '../services/customizationService'

const options = await getProductCustomizationOptions(productId)
// Returns product-specific customization options
```

**Response Structure:**
```typescript
{
  product_id: number
  available_lens_options: LensOption[]
  available_finishes: LensFinish[]
  available_colors: LensColor[]
  available_treatments: Treatment[]
}
```

---

### 3. **POST /api/customization/products/:id/customization/calculate** (PUBLIC)
Calculate the total price for a product with selected customizations.

**Service Function:**
```typescript
import { calculateCustomizationPrice } from '../services/customizationService'

const price = await calculateCustomizationPrice(productId, {
  lens_option_id: 1,
  lens_finish_id: 2,
  lens_color_id: 3,
  treatment_ids: [1, 2],
  quantity: 1
})
```

**Request Body:**
```typescript
{
  lens_option_id?: number        // Selected lens option ID
  lens_finish_id?: number         // Selected finish ID
  lens_color_id?: number          // Selected color ID
  treatment_ids?: number[]        // Array of treatment IDs
  quantity?: number               // Quantity (default: 1)
}
```

**Response Structure:**
```typescript
{
  base_price: number              // Base product price
  lens_option_price: number       // Lens option price adjustment
  finish_price: number            // Finish price adjustment
  color_price: number             // Color price adjustment
  treatments_price: number        // Total treatments price
  subtotal: number                 // Subtotal before quantity
  total: number                   // Final total (subtotal * quantity)
  currency: string                // Currency code (e.g., "USD")
  breakdown: Array<{               // Itemized breakdown
    item: string
    price: number
  }>
}
```

---

## 📁 Files Created/Updated

### 1. **API Routes** (`src/config/apiRoutes.ts`)
Added `CUSTOMIZATION` section:
```typescript
CUSTOMIZATION: {
  OPTIONS: `/customization/options`,
  PRODUCT_CUSTOMIZATION: (productId) => `/customization/products/${productId}/customization`,
  CALCULATE_PRICE: (productId) => `/customization/products/${productId}/customization/calculate`,
}
```

### 2. **Customization Service** (`src/services/customizationService.ts`)
New service file with:
- TypeScript interfaces for all request/response types
- Three API functions:
  - `getCustomizationOptions()`
  - `getProductCustomizationOptions(productId)`
  - `calculateCustomizationPrice(productId, customization)`

---

## 🔄 Integration Options

### Option 1: Use Unified Endpoint (Recommended for New Features)
Instead of fetching lens options, treatments, and shipping methods separately, use the unified endpoint:

```typescript
import { getProductCustomizationOptions } from '../services/customizationService'

// In ProductCheckout component:
useEffect(() => {
  const fetchOptions = async () => {
    try {
      const options = await getProductCustomizationOptions(product.id)
      // Use options.available_lens_options, options.available_treatments, etc.
    } catch (error) {
      console.error('Failed to fetch customization options:', error)
    }
  }
  fetchOptions()
}, [product.id])
```

### Option 2: Use Price Calculation API (Recommended for Accurate Pricing)
Replace manual price calculations with the backend calculation:

```typescript
import { calculateCustomizationPrice } from '../services/customizationService'

// In ProductCheckout component:
const calculateTotal = async () => {
  try {
    const result = await calculateCustomizationPrice(product.id, {
      lens_option_id: selectedLensTypeId,
      lens_color_id: selectedColorId,
      treatment_ids: selectedTreatmentIds,
      quantity: 1
    })
    
    // Use result.total for the final price
    // Use result.breakdown for itemized display
  } catch (error) {
    console.error('Failed to calculate price:', error)
  }
}
```

### Option 3: Keep Current Implementation (Backward Compatible)
The current implementation using `useLensCustomization` hook and manual calculations still works. The new endpoints are available as an enhancement.

---

## 🎯 Benefits of Using New Endpoints

1. **Unified Data Fetching**: Get all customization options in one API call
2. **Accurate Pricing**: Backend handles all price calculations and business logic
3. **Product-Specific Options**: Get only options available for a specific product
4. **Consistent Pricing**: Same calculation logic used across frontend and backend
5. **Better Performance**: Single API call instead of multiple parallel calls

---

## 📝 Example Usage in Component

```typescript
import { 
  getProductCustomizationOptions, 
  calculateCustomizationPrice 
} from '../services/customizationService'

function ProductCheckout({ product }) {
  const [customizationOptions, setCustomizationOptions] = useState(null)
  const [calculatedPrice, setCalculatedPrice] = useState(null)
  
  // Fetch options for this product
  useEffect(() => {
    getProductCustomizationOptions(product.id)
      .then(setCustomizationOptions)
      .catch(console.error)
  }, [product.id])
  
  // Calculate price when selections change
  const handleSelectionChange = async (selections) => {
    try {
      const price = await calculateCustomizationPrice(product.id, {
        lens_option_id: selections.lensOptionId,
        lens_color_id: selections.colorId,
        treatment_ids: selections.treatmentIds
      })
      setCalculatedPrice(price)
    } catch (error) {
      console.error('Price calculation failed:', error)
    }
  }
  
  return (
    <div>
      {/* Display customization options */}
      {customizationOptions?.available_lens_options.map(option => (
        <LensOptionCard key={option.id} option={option} />
      ))}
      
      {/* Display calculated price */}
      {calculatedPrice && (
        <PriceDisplay 
          total={calculatedPrice.total}
          breakdown={calculatedPrice.breakdown}
        />
      )}
    </div>
  )
}
```

---

## 🔗 Related Files

- `src/config/apiRoutes.ts` - API route definitions
- `src/services/customizationService.ts` - Service functions and types
- `src/components/shop/ProductCheckout.tsx` - Current implementation (can be enhanced)
- `src/hooks/useLensCustomization.tsx` - Current hook (can be updated to use new endpoints)

---

## ✅ Status

- [x] API routes added
- [x] Service functions created
- [x] TypeScript interfaces defined
- [ ] Component integration (optional - current implementation works)
- [ ] Price calculation integration (optional - manual calculation works)

The endpoints are ready to use. Integration into components is optional and can be done incrementally.

