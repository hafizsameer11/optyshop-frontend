# Checkout System - API Usage Guide

## 📋 Currently Used APIs

### 1. **GET /api/products/options** (PUBLIC)
**Status:** ✅ Currently Used  
**Location:** `src/components/shop/ProductCheckout.tsx`  
**Purpose:** Fetches lens types and lens coatings for selection

**Usage:**
```typescript
const options = await getProductOptions()
// Returns: { lensTypes, lensCoatings, categories, frameShapes, etc. }
```

**Response includes:**
- `lensTypes[]` - Available lens types with index and price adjustments
- `lensCoatings[]` - Available coatings with price adjustments
- `categories[]` - Product categories
- `frameShapes[]` - Frame shape options
- `frameMaterials[]` - Frame material options

---

### 2. **POST /api/prescriptions** (USER - requires auth)
**Status:** ✅ Currently Used  
**Location:** `src/components/shop/ProductCheckout.tsx` (line 199)  
**Purpose:** Creates prescription when user is authenticated

**Usage:**
```typescript
const result = await createPrescription({
  prescription_type: 'progressive',
  od_sphere: -2.50,
  od_cylinder: -0.75,
  od_axis: 180,
  os_sphere: -2.25,
  os_cylinder: -0.50,
  os_axis: 5,
  pd_binocular: 64
})
```

**When called:** Only if user is authenticated before adding to cart

---

## 🔄 APIs Available But NOT Currently Used

### 3. **POST /api/cart/items** (USER - requires auth)
**Status:** ❌ Not Used (Cart stored in localStorage)  
**Available:** Yes  
**Should Use:** For authenticated users to sync cart with backend

**Current Behavior:**
- Cart items are stored in `localStorage` only
- When user adds to cart, it's stored locally
- Cart syncs to API only when creating an order

**Recommended Integration:**
```typescript
// In handleAddToCart function, after creating prescription:
if (isAuthenticated) {
  await addItemToCartAPI({
    product_id: product.id,
    quantity: 1,
    lens_index: lensSelection.lensIndex,
    lens_coatings: lensSelection.coatings,
    prescription_id: prescriptionId
  })
}
```

**Benefits:**
- Cart persists across devices
- Real-time cart sync
- Better inventory management

---

### 4. **POST /api/prescriptions/validate** (USER - requires auth)
**Status:** ❌ Not Used (Client-side validation only)  
**Available:** Yes  
**Should Use:** Before creating prescription to validate data

**Current Behavior:**
- Only client-side validation in `validatePrescription()` function
- No server-side validation before submission

**Recommended Integration:**
```typescript
// Before creating prescription:
const validation = await validatePrescription(prescriptionPayload)
if (!validation.valid) {
  setErrors({ general: validation.message })
  return
}
```

**Benefits:**
- Server-side validation ensures data integrity
- Catches edge cases client validation might miss
- Better error messages from backend

---

### 5. **POST /api/simulations/pd** (PUBLIC)
**Status:** ❌ Not Used  
**Available:** Yes  
**Should Use:** To calculate/validate PD automatically

**Current Behavior:**
- User manually enters PD
- No calculation or validation

**Recommended Integration:**
```typescript
// Add PD calculator helper:
const calculatePD = async (distancePD: number, type: 'binocular' | 'monocular') => {
  const result = await calculatePDAPI({ distancePD, type })
  setPrescriptionData(prev => ({
    ...prev,
    pd_binocular: result.pd.toString()
  }))
}
```

**Benefits:**
- Automatic PD calculation
- Validation of PD values
- Better user experience

---

### 6. **POST /api/simulations/lens-thickness** (PUBLIC)
**Status:** ❌ Not Used  
**Available:** Yes  
**Should Use:** Show estimated lens thickness based on selections

**Recommended Integration:**
```typescript
// After lens selection, calculate thickness:
const calculateThickness = async () => {
  if (lensSelection.lensIndex && product.frameDiameter) {
    const thickness = await calculateLensThickness({
      frameDiameter: product.frameDiameter,
      lensPower: parseFloat(prescriptionData.od_sphere),
      lensIndex: lensSelection.lensIndex
    })
    // Display thickness estimate to user
  }
}
```

**Benefits:**
- Shows lens thickness estimate
- Helps user make informed decisions
- Better product transparency

---

### 7. **POST /api/simulations/lifestyle-recommendation** (PUBLIC)
**Status:** ❌ Not Used  
**Available:** Yes  
**Should Use:** Recommend lens options based on lifestyle

**Recommended Integration:**
```typescript
// Add lifestyle questionnaire step:
const getRecommendation = async () => {
  const recommendation = await getLifestyleRecommendation({
    screenUsage: 'high',
    outdoorActivities: 'frequent',
    nightDriving: true,
    prescriptionStrength: parseFloat(prescriptionData.od_sphere)
  })
  // Auto-select recommended lens type/coating
}
```

**Benefits:**
- Personalized recommendations
- Better user experience
- Higher conversion rates

---

### 8. **GET /api/prescriptions** (USER - requires auth)
**Status:** ❌ Not Used  
**Available:** Yes  
**Should Use:** Load saved prescriptions for returning users

**Recommended Integration:**
```typescript
// On component mount, if authenticated:
useEffect(() => {
  if (isAuthenticated) {
    const savedPrescriptions = await getPrescriptions()
    if (savedPrescriptions.length > 0) {
      // Show "Use saved prescription" option
      setSavedPrescriptions(savedPrescriptions)
    }
  }
}, [isAuthenticated])
```

**Benefits:**
- Faster checkout for returning customers
- Better user experience
- Reduces data entry errors

---

### 9. **POST /api/coupons/apply** (PUBLIC)
**Status:** ❌ Not Used in Checkout  
**Available:** Yes  
**Should Use:** Apply coupon codes during checkout

**Current Behavior:**
- Coupon application happens in main Checkout page
- Not available in ProductCheckout modal

**Recommended Integration:**
```typescript
// Add coupon input in summary step:
const applyCoupon = async (code: string) => {
  const result = await applyCouponAPI({
    code,
    subtotal: calculatedTotal,
    cartItems: [{
      product_id: product.id,
      quantity: 1,
      unit_price: calculatedTotal
    }]
  })
  if (result.success) {
    setDiscount(result.discount_amount)
    setFinalPrice(calculatedTotal - result.discount_amount)
  }
}
```

**Benefits:**
- Apply discounts during product customization
- Better conversion rates
- Consistent discount experience

---

## 📊 API Usage Summary

| API Endpoint | Status | Auth Required | Priority | Use Case |
|-------------|--------|---------------|----------|----------|
| `GET /api/products/options` | ✅ Used | No | High | Get lens types & coatings |
| `POST /api/prescriptions` | ✅ Used | Yes | High | Save prescription |
| `POST /api/cart/items` | ❌ Not Used | Yes | **High** | Sync cart with backend |
| `POST /api/prescriptions/validate` | ❌ Not Used | Yes | **Medium** | Validate prescription |
| `POST /api/simulations/pd` | ❌ Not Used | No | Medium | Calculate PD |
| `POST /api/simulations/lens-thickness` | ❌ Not Used | No | Low | Show thickness estimate |
| `POST /api/simulations/lifestyle-recommendation` | ❌ Not Used | No | Low | Get recommendations |
| `GET /api/prescriptions` | ❌ Not Used | Yes | **Medium** | Load saved prescriptions |
| `POST /api/coupons/apply` | ❌ Not Used | No | Medium | Apply discount codes |

---

## 🚀 Recommended Next Steps

### Priority 1 (High Impact)
1. **Integrate `POST /api/cart/items`** - Sync cart with backend for authenticated users
2. **Integrate `POST /api/prescriptions/validate`** - Add server-side validation
3. **Integrate `GET /api/prescriptions`** - Load saved prescriptions

### Priority 2 (Medium Impact)
4. **Integrate `POST /api/simulations/pd`** - Add PD calculator
5. **Integrate `POST /api/coupons/apply`** - Add coupon support in checkout modal

### Priority 3 (Nice to Have)
6. **Integrate `POST /api/simulations/lens-thickness`** - Show thickness estimates
7. **Integrate `POST /api/simulations/lifestyle-recommendation`** - Add recommendations

---

## 💡 Implementation Notes

### Cart API Integration
Currently, the cart is stored in `localStorage`. To integrate with the backend:

1. **For Authenticated Users:**
   - Call `POST /api/cart/items` when adding to cart
   - Sync localStorage cart with backend on login
   - Use `GET /api/cart` to load cart from backend

2. **For Guest Users:**
   - Keep using localStorage
   - Sync to backend when they register/login

### Prescription Validation
Add validation before creating prescription:
```typescript
// Before createPrescription:
const validation = await validatePrescription(prescriptionPayload)
if (!validation.valid) {
  // Show validation errors
  return
}
```

### Saved Prescriptions
Add a dropdown to select from saved prescriptions:
```typescript
// In prescription step:
{savedPrescriptions.length > 0 && (
  <select onChange={(e) => loadPrescription(e.target.value)}>
    <option>Select saved prescription</option>
    {savedPrescriptions.map(p => (
      <option key={p.id} value={p.id}>
        Prescription from {formatDate(p.created_at)}
      </option>
    ))}
  </select>
)}
```

---

## 📝 Code Examples

### Example: Add Cart API Integration

```typescript
// In ProductCheckout.tsx, update handleAddToCart:
const handleAddToCart = async () => {
  setLoading(true)
  try {
    // ... existing prescription creation code ...
    
    // NEW: Add to cart via API if authenticated
    if (isAuthenticated) {
      await apiClient.post(
        API_ROUTES.CART.ADD_ITEM,
        {
          product_id: product.id,
          quantity: 1,
          lens_index: lensSelection.lensIndex,
          lens_coatings: lensSelection.coatings,
          prescription_id: prescriptionId
        },
        true // requires auth
      )
    }
    
    // Also add to local cart for immediate UI update
    addToCart(cartProduct)
    
    // ... rest of code ...
  } catch (error) {
    console.error('Error adding to cart:', error)
  }
}
```

### Example: Add Prescription Validation

```typescript
// In handleNext function, before creating prescription:
const handleNext = async () => {
  if (currentStep === 'prescription') {
    if (!validatePrescription()) return
    
    // NEW: Validate on server if authenticated
    if (isAuthenticated) {
      const validation = await validatePrescription({
        od_sphere: parseFloat(prescriptionData.od_sphere),
        os_sphere: parseFloat(prescriptionData.os_sphere),
        pd_binocular: parseFloat(prescriptionData.pd_binocular)
      })
      
      if (!validation.valid) {
        setErrors({ general: validation.message || 'Invalid prescription data' })
        return
      }
    }
    
    setCurrentStep('summary')
  }
}
```

---

## 🔗 Related Files

- **Checkout Component:** `src/components/shop/ProductCheckout.tsx`
- **Product Service:** `src/services/productsService.ts`
- **Prescription Service:** `src/services/prescriptionsService.ts`
- **Cart Service:** (Not yet created - currently using CartContext)
- **API Routes:** `src/config/apiRoutes.ts`
- **Simulations Service:** `src/services/simulationsService.ts`

---

## 📚 API Documentation

For full API documentation, see:
- Postman Collection: `docs/OptyShop-API.postman_collection.json`
- API Routes: `src/config/apiRoutes.ts`
- API Integration Guide: `docs/API-INTEGRATION.md`

