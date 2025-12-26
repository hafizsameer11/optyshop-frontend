# Missing API Routes - Backend Implementation Required

## 🚨 Problem

The frontend is making API calls to routes that don't exist on the backend, resulting in **"Route not found"** errors. This document lists all missing routes and their expected behavior.

---

## 📋 Missing Routes Summary

Based on the network errors, the following routes are missing from the backend:

| Route | Method | Status | Priority |
|-------|--------|--------|----------|
| `/api/lens/prescription-lens-types` | GET | ❌ Missing | 🔴 High |
| `/api/lens/prescription-lens-types/:id` | GET | ❌ Missing | 🔴 High |
| `/api/lens/prescription-lens-types/:id/variants` | GET | ❌ Missing | 🔴 High |
| `/api/lens/prescription-sun-colors` | GET | ❌ Missing | 🟡 Medium |
| `/api/prescription-sun-lenses` | GET | ❌ Missing | 🟡 Medium |
| `/api/prescription-sun-lenses/:id` | GET | ❌ Missing | 🟡 Medium |
| `/api/photochromic-lenses` | GET | ❌ Missing | 🟡 Medium |
| `/api/photochromic-lenses/:id` | GET | ❌ Missing | 🟡 Medium |
| `/api/customization/options` | GET | ❌ Missing | 🔴 High |
| `/api/customization/products/:id/customization` | GET | ❌ Missing | 🔴 High |
| `/api/customization/prescription-lens-types` | GET | ❌ Missing | 🔴 High |
| `/api/lens/colors` | GET | ❌ Missing | 🟡 Medium |
| `/api/lens/options?type=prescription_*` | GET | ❌ Missing | 🟡 Medium |

---

## 🔴 High Priority Routes

### 1. Prescription Lens Types

#### `GET /api/lens/prescription-lens-types`

**Purpose:** Get all prescription lens types (Distance Vision, Near Vision, Progressive)

**Query Parameters:**
- `prescriptionType` (optional): Filter by type (`single_vision`, `bifocal`, `trifocal`, `progressive`)
- `isActive` (optional): Filter by active status (boolean)
- `page` (optional): Page number for pagination
- `limit` (optional): Items per page

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "prescriptionLensTypes": [
      {
        "id": 1,
        "name": "Distance Vision",
        "slug": "distance-vision",
        "description": "For distance vision",
        "prescriptionType": "single_vision",
        "basePrice": 60.00,
        "isActive": true,
        "sortOrder": 1,
        "colors": []
      },
      {
        "id": 2,
        "name": "Near Vision",
        "slug": "near-vision",
        "description": "For near/reading vision",
        "prescriptionType": "single_vision",
        "basePrice": 60.00,
        "isActive": true,
        "sortOrder": 2,
        "colors": []
      },
      {
        "id": 3,
        "name": "Progressive",
        "slug": "progressive",
        "description": "Progressives (For two powers in same lenses)",
        "prescriptionType": "progressive",
        "basePrice": 60.00,
        "isActive": true,
        "sortOrder": 3,
        "colors": [],
        "variants": []
      }
    ],
    "count": 3
  }
}
```

**Frontend Usage:**
- `src/services/prescriptionLensService.ts` - `getPrescriptionLensTypes()`
- `src/components/shop/ProductCheckout.tsx` - Used for lens type selection

---

#### `GET /api/lens/prescription-lens-types/:id`

**Purpose:** Get a single prescription lens type by ID

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "prescriptionLensType": {
      "id": 3,
      "name": "Progressive",
      "slug": "progressive",
      "description": "Progressives (For two powers in same lenses)",
      "prescriptionType": "progressive",
      "basePrice": 60.00,
      "isActive": true,
      "sortOrder": 3,
      "colors": [],
      "variants": []
    }
  }
}
```

---

#### `GET /api/lens/prescription-lens-types/:id/variants`

**Purpose:** Get all variants for a prescription lens type (e.g., Premium, Standard, Basic Progressive)

**Query Parameters:**
- `isActive` (optional): Filter by active status
- `isRecommended` (optional): Filter by recommended status
- `page` (optional): Page number
- `limit` (optional): Items per page (default: 100)

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "variants": [
      {
        "id": 1,
        "prescriptionLensTypeId": 3,
        "name": "Premium Progressive",
        "slug": "premium-progressive",
        "description": "High-quality progressive lenses",
        "price": 150.00,
        "isRecommended": true,
        "viewingRange": "Wide",
        "useCases": "Maximum comfort & balanced vision",
        "isActive": true,
        "sortOrder": 1,
        "colors": []
      },
      {
        "id": 2,
        "prescriptionLensTypeId": 3,
        "name": "Standard Progressive",
        "slug": "standard-progressive",
        "description": "Standard progressive lenses",
        "price": 100.00,
        "isRecommended": false,
        "viewingRange": "Standard",
        "useCases": "Perfect for everyday tasks",
        "isActive": true,
        "sortOrder": 2,
        "colors": []
      }
    ],
    "prescriptionLensType": {
      "id": 3,
      "name": "Progressive"
    },
    "count": 2
  }
}
```

**Frontend Usage:**
- `src/services/prescriptionLensService.ts` - `getPrescriptionLensVariantsByType()`
- Used for progressive lens variant selection

---

### 2. Customization Options

#### `GET /api/customization/options`

**Purpose:** Get all available customization options (lens options, finishes, colors, treatments)

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "lensOptions": [],
    "finishes": [],
    "colors": [],
    "treatments": []
  }
}
```

**Frontend Usage:**
- `src/services/customizationService.ts` - `getCustomizationOptions()`

---

#### `GET /api/customization/products/:id/customization`

**Purpose:** Get customization options for a specific product

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "lensOptions": [],
    "finishes": [],
    "colors": [],
    "treatments": [],
    "prescriptionLensTypes": []
  }
}
```

**Frontend Usage:**
- `src/services/customizationService.ts` - `getProductCustomizationOptions()`
- `src/components/shop/ProductCheckout.tsx` - Used for product customization

---

#### `GET /api/customization/prescription-lens-types`

**Purpose:** Get prescription lens types for customization

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "prescriptionLensTypes": [
      {
        "id": 1,
        "name": "Distance Vision",
        "prescriptionType": "single_vision"
      },
      {
        "id": 2,
        "name": "Near Vision",
        "prescriptionType": "single_vision"
      },
      {
        "id": 3,
        "name": "Progressive",
        "prescriptionType": "progressive"
      }
    ]
  }
}
```

**Frontend Usage:**
- `src/services/customizationService.ts` - Used in customization flow

---

## 🟡 Medium Priority Routes

### 3. Prescription Sun Lenses

#### `GET /api/prescription-sun-lenses`

**Purpose:** Get all prescription sun lenses organized by category

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "categories": [
      {
        "name": "Polarized",
        "lenses": [
          {
            "id": 1,
            "name": "Polarized Sun Lens",
            "slug": "polarized-sun-lens",
            "description": "Polarized prescription sun lens",
            "basePrice": 80.00,
            "finishes": [
              {
                "id": 1,
                "name": "Mirror Finish",
                "slug": "mirror-finish",
                "price": 20.00,
                "colors": []
              }
            ],
            "colors": []
          }
        ]
      }
    ]
  }
}
```

**Alternative Response (if not organized by category):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Polarized Sun Lens",
      "slug": "polarized-sun-lens",
      "description": "Polarized prescription sun lens",
      "basePrice": 80.00,
      "finishes": [],
      "colors": []
    }
  ]
}
```

**Frontend Usage:**
- `src/services/lensOptionsService.ts` - `getPrescriptionSunLenses()`
- `src/components/shop/ProductCheckout.tsx` - Used for prescription sun lens selection

---

#### `GET /api/prescription-sun-lenses/:id`

**Purpose:** Get a single prescription sun lens by ID

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Polarized Sun Lens",
    "slug": "polarized-sun-lens",
    "description": "Polarized prescription sun lens",
    "basePrice": 80.00,
    "finishes": [],
    "colors": []
  }
}
```

---

### 4. Prescription Sun Colors

#### `GET /api/lens/prescription-sun-colors`

**Purpose:** Get all prescription sun colors

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "colors": [
      {
        "id": 1,
        "name": "Brown",
        "colorCode": "brown",
        "hexCode": "#8B4513",
        "imageUrl": null,
        "priceAdjustment": 0,
        "isActive": true,
        "sortOrder": 1
      },
      {
        "id": 2,
        "name": "Gray",
        "colorCode": "gray",
        "hexCode": "#808080",
        "imageUrl": null,
        "priceAdjustment": 0,
        "isActive": true,
        "sortOrder": 2
      }
    ],
    "count": 2
  }
}
```

**Frontend Usage:**
- `src/services/lensOptionsService.ts` - `getPrescriptionSunColors()`
- `src/components/shop/ProductCheckout.tsx` - Used for color selection

---

### 5. Photochromic Lenses

#### `GET /api/photochromic-lenses`

**Purpose:** Get all photochromic lenses organized by type

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "types": [
      {
        "name": "Standard",
        "lenses": [
          {
            "id": 1,
            "name": "Photochromic Lens",
            "slug": "photochromic-lens",
            "description": "Adaptive lens that darkens in sunlight",
            "basePrice": 90.00,
            "colors": []
          }
        ]
      }
    ]
  }
}
```

**Alternative Response (if not organized by type):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Photochromic Lens",
      "slug": "photochromic-lens",
      "description": "Adaptive lens that darkens in sunlight",
      "basePrice": 90.00,
      "colors": []
    }
  ]
}
```

**Frontend Usage:**
- `src/services/lensOptionsService.ts` - `getPhotochromicLenses()`
- `src/components/shop/ProductCheckout.tsx` - Used for photochromic lens selection

---

#### `GET /api/photochromic-lenses/:id`

**Purpose:** Get a single photochromic lens by ID

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Photochromic Lens",
    "slug": "photochromic-lens",
    "description": "Adaptive lens that darkens in sunlight",
    "basePrice": 90.00,
    "colors": []
  }
}
```

---

### 6. Lens Colors

#### `GET /api/lens/colors`

**Purpose:** Get all lens colors

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "colors": [
      {
        "id": 1,
        "name": "Clear",
        "colorCode": "clear",
        "hexCode": "#FFFFFF",
        "imageUrl": null,
        "priceAdjustment": 0,
        "isActive": true,
        "sortOrder": 1,
        "lensOption": {
          "id": 1,
          "name": "Standard Lens",
          "type": "classic"
        }
      }
    ],
    "count": 1
  }
}
```

**Frontend Usage:**
- `src/services/lensOptionsService.ts` - `getLensColors()`
- Used throughout the application for color selection

---

### 7. Lens Options with Type Filter

#### `GET /api/lens/options?type=prescription_*`

**Purpose:** Get lens options filtered by type (used as fallback for prescription sun lenses)

**Query Parameters:**
- `type` (required): Lens option type (e.g., `prescription_sun`, `photochromic`)
- `isActive` (optional): Filter by active status

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Prescription Sun Lens",
      "slug": "prescription-sun-lens",
      "type": "prescription_sun",
      "description": "Prescription sun lens option",
      "basePrice": 80.00,
      "isActive": true,
      "colors": []
    }
  ]
}
```

**Note:** This is used as a fallback when dedicated endpoints (`/api/prescription-sun-lenses`, `/api/photochromic-lenses`) are not available.

---

## 🔧 Implementation Notes

### Response Format

All routes should follow this standard response format:

```json
{
  "success": true,
  "data": { ... },
  "message": "Optional success message"
}
```

For errors:
```json
{
  "success": false,
  "message": "Error message",
  "error": "Detailed error information"
}
```

### Status Codes

- `200 OK` - Success
- `404 Not Found` - Resource not found
- `400 Bad Request` - Invalid request parameters
- `500 Internal Server Error` - Server error

### Authentication

All listed routes are **PUBLIC** endpoints and should **NOT** require authentication.

### CORS

Ensure CORS is properly configured to allow requests from the frontend domain.

---

## 📝 Testing

After implementing these routes, test them using:

1. **Postman Collection:** `OptyShop_API.postman_collection.json`
2. **Browser Network Tab:** Check that requests return `200 OK` instead of `404`
3. **Frontend Console:** Verify no "Route not found" errors

---

## 🚀 Priority Order

1. **First:** Implement prescription lens types routes (required for checkout)
2. **Second:** Implement customization routes (required for product customization)
3. **Third:** Implement prescription sun lenses and colors (used in product selection)
4. **Fourth:** Implement photochromic lenses (used in product selection)
5. **Fifth:** Implement lens colors endpoint (used throughout the app)

---

## 📚 Related Documentation

- `PRESCRIPTION_LENS_TYPES_SETUP.md` - Setup guide for prescription lens types
- `src/config/apiRoutes.ts` - Frontend route definitions
- `src/services/prescriptionLensService.ts` - Frontend service implementation
- `src/services/customizationService.ts` - Frontend customization service
- `src/services/lensOptionsService.ts` - Frontend lens options service

---

**Last Updated:** 2025-01-26  
**Version:** 1.0.0

