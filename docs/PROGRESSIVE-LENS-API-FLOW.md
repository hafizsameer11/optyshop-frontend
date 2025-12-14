# Progressive Lens Selection API Flow

This document describes the API flow when a user selects "Progressive" as their prescription lens type in the frontend.

## Overview

When "Progressive" is selected, the frontend makes two API calls to fetch:
1. The Progressive prescription lens type ID (if not already known)
2. The active variants for the Progressive lens type (e.g., Premium, Standard, Mid-Range, Near-Range)

## API Flow

### Step 1: Get Prescription Lens Types (if needed)

**Endpoint:**
```
GET {{base_url}}/api/lens/prescription-lens-types
```

**Description:**
Returns all prescription lens types, including Progressive. Use this to get the Progressive `id` if not already known.

**Response:**
Returns an array of prescription lens types:
- Distance Vision
- Near Vision
- Progressive

**Example Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Distance Vision",
      "prescription_type": "single_vision",
      "is_active": true
    },
    {
      "id": 2,
      "name": "Near Vision",
      "prescription_type": "single_vision",
      "is_active": true
    },
    {
      "id": 3,
      "name": "Progressive",
      "prescription_type": "progressive",
      "is_active": true
    }
  ]
}
```

**Service Function:**
```typescript
import { getPrescriptionLensTypes } from '@/services/prescriptionLensService';

const types = await getPrescriptionLensTypes({});
const progressiveType = types?.find(t => 
  t.prescription_type === 'progressive' || 
  t.name?.toLowerCase().includes('progressive')
);
```

**Alternative Endpoint:**
```
GET {{base_url}}/api/customization/prescription-lens-types
```
This endpoint returns the same data and can be used as an alternative.

---

### Step 2: Get Variants for Progressive (Main Call)

**Endpoint:**
```
GET {{base_url}}/api/lens/prescription-lens-types/{progressive_id}/variants
```

**Description:**
Returns all active variants for the Progressive lens type (e.g., Premium, Standard, Mid-Range, Near-Range).

**Path Parameters:**
- `{progressive_id}` - The ID of the Progressive prescription lens type (obtained from Step 1)

**Query Parameters (Optional):**
- `isActive` (boolean) - Filter by active status (default: returns all)
- `isRecommended` (boolean) - Filter by recommended status
- `page` (number) - Page number for pagination
- `limit` (number) - Number of results per page (default: 100)

**Example Request:**
```
GET {{base_url}}/api/lens/prescription-lens-types/3/variants?isActive=true&limit=100
```

**Example Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "prescription_lens_type_id": 3,
      "name": "Premium",
      "slug": "premium",
      "description": "Premium progressive lenses with wide viewing range",
      "price": 150.00,
      "is_recommended": true,
      "viewing_range": "Wide",
      "is_active": true,
      "sort_order": 1
    },
    {
      "id": 2,
      "prescription_lens_type_id": 3,
      "name": "Standard",
      "slug": "standard",
      "description": "Standard progressive lenses",
      "price": 100.00,
      "is_recommended": false,
      "viewing_range": "Standard",
      "is_active": true,
      "sort_order": 2
    },
    {
      "id": 3,
      "prescription_lens_type_id": 3,
      "name": "Mid-Range",
      "slug": "mid-range",
      "description": "Mid-range progressive lenses",
      "price": 80.00,
      "is_recommended": false,
      "viewing_range": "Mid",
      "is_active": true,
      "sort_order": 3
    },
    {
      "id": 4,
      "prescription_lens_type_id": 3,
      "name": "Near-Range",
      "slug": "near-range",
      "description": "Near-range progressive lenses",
      "price": 60.00,
      "is_recommended": false,
      "viewing_range": "Near",
      "is_active": true,
      "sort_order": 4
    }
  ]
}
```

**Service Function:**
```typescript
import { getPrescriptionLensVariantsByType } from '@/services/prescriptionLensService';

// Fetch all variants (then filter client-side)
const variants = await getPrescriptionLensVariantsByType(progressiveTypeId, {});

// Or fetch only active variants
const activeVariants = await getPrescriptionLensVariantsByType(progressiveTypeId, { 
  isActive: true 
});

// Filter to only active variants on client side
const filteredVariants = variants?.filter(v => v.is_active !== false) || [];
```

---

## UI Behavior

### When Variants Are Found

If the API returns one or more active variants:
- Display the variants as selectable options (e.g., Premium, Standard, Mid-Range, Near-Range)
- Show pricing information for each variant
- Allow the user to select a variant
- Sort variants by:
  1. `sort_order` (if available)
  2. `is_recommended` (recommended first)
  3. `name` (alphabetical)

### When No Variants Are Found

If the API returns an empty array or `null`:
- Display the message: **"No progressive options available. Please check the admin panel to ensure variants are added and active."**
- Prevent the user from proceeding until variants are available

---

## Implementation Details

### Frontend Implementation

The Progressive selection flow is implemented in:
- **Component:** `src/components/shop/ProductCheckout.tsx`
- **Service:** `src/services/prescriptionLensService.ts`
- **API Routes:** `src/config/apiRoutes.ts`

### Key Functions

1. **`getPrescriptionLensTypes()`** - Fetches all prescription lens types
2. **`getPrescriptionLensVariantsByType(typeId, params)`** - Fetches variants for a specific type

### Current Implementation Flow

```typescript
// 1. Fetch all prescription lens types
const apiTypes = await getPrescriptionLensTypes({});

// 2. Find the Progressive type
const progressiveType = apiTypes?.find(t => 
  t.prescription_type === 'progressive' || 
  t.name?.toLowerCase().includes('progressive')
);

// 3. Fetch variants for Progressive
if (progressiveType) {
  const variants = await getPrescriptionLensVariantsByType(progressiveType.id, {});
  
  // 4. Filter to active variants
  const activeVariants = variants?.filter(v => v.is_active !== false) || [];
  
  // 5. Handle empty result
  if (activeVariants.length === 0) {
    // Show "No progressive options available" message
  }
}
```

---

## Admin Panel

To add or manage Progressive variants, use the admin endpoint:

**Endpoint:**
```
POST {{base_url}}/api/admin/prescription-lens-variants
```

**Note:** This endpoint requires admin authentication. Use it to:
- Create new Progressive variants
- Update existing variants
- Activate/deactivate variants

---

## Postman Collection

All endpoints are documented in the Postman collection:
- `OptyShop_API.postman_collection.json`

**Relevant Requests:**
1. **Get Prescription Lens Types** - `GET /api/lens/prescription-lens-types`
2. **Get Prescription Lens Variants by Type** - `GET /api/lens/prescription-lens-types/{id}/variants`
3. **Get Prescription Lens Types (Alternative)** - `GET /api/customization/prescription-lens-types`

---

## Summary

**Primary API Flow:**
1. `GET /api/lens/prescription-lens-types` → Get Progressive ID
2. `GET /api/lens/prescription-lens-types/{id}/variants` → Get Progressive variants

**If variants are empty:**
- Show: "No progressive options available. Please check the admin panel to ensure variants are added and active."

**To fix empty variants:**
- Use admin endpoint: `POST /api/admin/prescription-lens-variants` to create/activate variants

