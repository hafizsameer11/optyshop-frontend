# Lens Options Setup Guide

## Overview
This guide explains how to configure lens options (Block Blue, Photochromic, and Prescription Lenses Sun) that appear in the product checkout modal.

## APIs Used in the Frontend

### 1. Get Lens Options (Public)
**Endpoint:** `GET /api/lens/options`

**Query Parameters:**
- `type` - Filter by type (e.g., `photochromic`, `prescription_sun`)
- `isActive` - Filter by active status (default: true)

**Examples:**
```bash
# Get all photochromic options
GET {{base_url}}/api/lens/options?type=photochromic&isActive=true

# Get all prescription sun options
GET {{base_url}}/api/lens/options?type=prescription_sun&isActive=true
```

**Response Format:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Photochromic Lenses",
      "slug": "photochromic-lenses",
      "type": "photochromic",
      "description": "Lenses that darken in sunlight",
      "base_price": 50.00,
      "is_active": true,
      "sort_order": 0,
      "colors": [
        {
          "id": 1,
          "name": "Gray",
          "color_code": "GRAY",
          "hex_code": "#808080",
          "price_adjustment": 0.00,
          "is_active": true,
          "sort_order": 0
        }
      ]
    }
  ]
}
```

### 2. Get Lens Option by ID (Public)
**Endpoint:** `GET /api/lens/options/{id}`

**Example:**
```bash
GET {{base_url}}/api/lens/options/1
```

---

## Admin APIs - How to Insert Data

### Step 1: Create Lens Options

#### Create Photochromic Lens Option
**Endpoint:** `POST /api/admin/lens-options`

**Headers:**
```
Authorization: Bearer {{admin_token}}
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Photochromic",
  "slug": "photochromic",
  "type": "photochromic",
  "description": "Lenses that automatically darken in sunlight and lighten indoors",
  "base_price": 50.00,
  "is_active": true,
  "sort_order": 1
}
```

#### Create Prescription Sun Lens Option
**Endpoint:** `POST /api/admin/lens-options`

**Request Body:**
```json
{
  "name": "Prescription Lenses Sun",
  "slug": "prescription-lenses-sun",
  "type": "prescription_sun",
  "description": "Prescription sunglasses with UV protection",
  "base_price": 35.00,
  "is_active": true,
  "sort_order": 2
}
```

**Note:** You can also use `prescription-sun` (with hyphen) as the type. The frontend checks both variations.

### Step 2: Create Lens Colors for Each Option

After creating a lens option, you'll get an `id` in the response. Use this ID to create colors.

#### Create Colors for Photochromic
**Endpoint:** `POST /api/admin/lens-colors`

**Headers:**
```
Authorization: Bearer {{admin_token}}
Content-Type: application/json
```

**Request Body:**
```json
{
  "lens_option_id": 1,
  "lens_finish_id": null,
  "prescription_lens_type_id": null,
  "name": "Gray",
  "color_code": "GRAY",
  "hex_code": "#808080",
  "image_url": "https://example.com/images/photochromic-gray.png",
  "price_adjustment": 0.00,
  "is_active": true,
  "sort_order": 1
}
```

**Create Multiple Colors:**
```json
// Brown Photochromic
{
  "lens_option_id": 1,
  "name": "Brown",
  "color_code": "BROWN",
  "hex_code": "#8B4513",
  "price_adjustment": 0.00,
  "is_active": true,
  "sort_order": 2
}

// Green Photochromic
{
  "lens_option_id": 1,
  "name": "Green",
  "color_code": "GREEN",
  "hex_code": "#228B22",
  "price_adjustment": 0.00,
  "is_active": true,
  "sort_order": 3
}
```

#### Create Colors for Prescription Sun
**Endpoint:** `POST /api/admin/lens-colors`

**Request Body Examples:**

```json
// Block Blue (Blokz) - Main Option
{
  "lens_option_id": 2,
  "name": "Block Blue",
  "color_code": "BLOCK_BLUE",
  "hex_code": "#0066CC",
  "price_adjustment": 0.00,
  "is_active": true,
  "sort_order": 1
}

// Polarized Classic - Blue
{
  "lens_option_id": 2,
  "name": "Blue",
  "color_code": "BLUE",
  "hex_code": "#0000FF",
  "price_adjustment": 0.00,
  "is_active": true,
  "sort_order": 2
}

// Polarized Mirror - Silver
{
  "lens_option_id": 2,
  "name": "Silver Mirror",
  "color_code": "SILVER_MIRROR",
  "hex_code": "#C0C0C0",
  "price_adjustment": 5.00,
  "is_active": true,
  "sort_order": 3
}

// Gradient - Brown
{
  "lens_option_id": 2,
  "name": "Brown Gradient",
  "color_code": "BROWN_GRADIENT",
  "hex_code": "#8B4513",
  "price_adjustment": 0.00,
  "is_active": true,
  "sort_order": 4
}
```

**Important Notes:**
- `lens_option_id` - Required if creating color for a lens option
- `lens_finish_id` - Use if color belongs to a lens finish (set to null for lens options)
- `prescription_lens_type_id` - Use if color belongs to prescription lens type (set to null for lens options)
- Only ONE of the three IDs should be set (not multiple)

### Step 3: Create Block Blue as a Separate Lens Option (Optional)

If "Block Blue" should appear as a separate option (not under Prescription Sun), create it separately:

**Endpoint:** `POST /api/admin/lens-options`

```json
{
  "name": "Block Blue",
  "slug": "block-blue",
  "type": "blokz",
  "description": "Blue light blocking lenses",
  "base_price": 35.00,
  "is_active": true,
  "sort_order": 0
}
```

Then add colors to it:
```json
{
  "lens_option_id": 3,
  "name": "Block Blue",
  "color_code": "BLOCK_BLUE",
  "hex_code": "#0066CC",
  "price_adjustment": 0.00,
  "is_active": true,
  "sort_order": 1
}
```

---

## Complete Setup Example

### 1. Create Photochromic Option
```bash
POST /api/admin/lens-options
{
  "name": "Photochromic",
  "slug": "photochromic",
  "type": "photochromic",
  "description": "Lenses that automatically darken in sunlight",
  "base_price": 50.00,
  "is_active": true,
  "sort_order": 1
}
```
**Response:** `{ "id": 1, ... }` ← Save this ID

### 2. Add Photochromic Colors
```bash
POST /api/admin/lens-colors
# Gray
{
  "lens_option_id": 1,
  "name": "Gray",
  "hex_code": "#808080",
  "is_active": true,
  "sort_order": 1
}

# Brown
{
  "lens_option_id": 1,
  "name": "Brown",
  "hex_code": "#8B4513",
  "is_active": true,
  "sort_order": 2
}
```

### 3. Create Prescription Sun Option
```bash
POST /api/admin/lens-options
{
  "name": "Prescription Lenses Sun",
  "slug": "prescription-lenses-sun",
  "type": "prescription_sun",
  "description": "Prescription sunglasses",
  "base_price": 35.00,
  "is_active": true,
  "sort_order": 2
}
```
**Response:** `{ "id": 2, ... }` ← Save this ID

### 4. Add Prescription Sun Colors
```bash
POST /api/admin/lens-colors
# Block Blue
{
  "lens_option_id": 2,
  "name": "Block Blue",
  "hex_code": "#0066CC",
  "is_active": true,
  "sort_order": 1
}

# Blue Classic
{
  "lens_option_id": 2,
  "name": "Blue",
  "hex_code": "#0000FF",
  "is_active": true,
  "sort_order": 2
}

# Silver Mirror
{
  "lens_option_id": 2,
  "name": "Silver Mirror",
  "hex_code": "#C0C0C0",
  "is_active": true,
  "sort_order": 3
}
```

---

## How Data is Displayed in Frontend

### Treatment Step Component Flow:

1. **Standard Treatments** - Fetched from `/api/lens/treatments`
   - Displayed as radio buttons with prices
   - Example: Anti-glare, Blue light filter, etc.

2. **Photochromic Options** - Fetched from `/api/lens/options?type=photochromic`
   - Expandable section with sun icon
   - Shows all photochromic lens options with their colors
   - Colors displayed as circular swatches
   - If no options: Shows "No photochromic options available. Please configure them in the admin panel."

3. **Prescription Lenses Sun** - Fetched from `/api/lens/options?type=prescription_sun`
   - Expandable section with sun icon
   - Groups options by main type (polarized, blokz, classic)
   - Shows sub-options (Classic, Mirror, Gradient) with colors
   - If no options: Shows "No prescription sun options available. Please configure them in the admin panel."

### Frontend Code Location:
- **Component:** `src/components/shop/ProductCheckout.tsx`
- **Functions:**
  - `fetchPhotochromicOptions()` - Line ~872
  - `fetchPrescriptionSunOptions()` - Line ~891
  - `TreatmentStep` component - Line ~2713

---

## Verification Steps

### 1. Check if Options Exist
```bash
# Check photochromic
GET /api/lens/options?type=photochromic&isActive=true

# Check prescription sun
GET /api/lens/options?type=prescription_sun&isActive=true
```

### 2. Verify Colors are Attached
```bash
# Get specific option with colors
GET /api/lens/options/1
```

### 3. Test in Frontend
1. Open product detail page
2. Click "Add to Cart" or "Customize"
3. Navigate to "Treatment" step
4. Expand "Photochromic" and "Prescription Lenses Sun"
5. Verify options and colors appear

---

## Troubleshooting

### Issue: "No photochromic options available"
**Solution:**
1. Verify lens option exists: `GET /api/admin/lens-options?type=photochromic`
2. Check `is_active` is `true`
3. Verify `type` field is exactly `"photochromic"` (case-sensitive)
4. Check browser console for API errors

### Issue: "No prescription sun options available"
**Solution:**
1. Verify lens option exists: `GET /api/admin/lens-options?type=prescription_sun`
2. Try alternative type: `prescription-sun` (with hyphen)
3. Check `is_active` is `true`
4. Verify colors are attached and active

### Issue: Colors not showing
**Solution:**
1. Verify colors exist: `GET /api/admin/lens-colors?lensOptionId={id}`
2. Check `is_active` is `true` for colors
3. Verify `lens_option_id` matches the option ID
4. Check `hex_code` or `color_code` is set

### Issue: Block Blue not appearing
**Solution:**
1. If it should be a separate option, create it with `type: "blokz"`
2. If it should be under Prescription Sun, add it as a color to the prescription_sun option
3. Verify the option/color is active

---

## Admin Panel API Endpoints Summary

| Action | Method | Endpoint | Auth Required |
|--------|--------|----------|---------------|
| List Lens Options | GET | `/api/admin/lens-options` | Yes (Admin) |
| Create Lens Option | POST | `/api/admin/lens-options` | Yes (Admin) |
| Update Lens Option | PUT | `/api/admin/lens-options/{id}` | Yes (Admin) |
| Delete Lens Option | DELETE | `/api/admin/lens-options/{id}` | Yes (Admin) |
| List Lens Colors | GET | `/api/admin/lens-colors` | Yes (Admin) |
| Create Lens Color | POST | `/api/admin/lens-colors` | Yes (Admin) |
| Update Lens Color | PUT | `/api/admin/lens-colors/{id}` | Yes (Admin) |
| Delete Lens Color | DELETE | `/api/admin/lens-colors/{id}` | Yes (Admin) |

---

## Quick Reference: Type Values

Valid `type` values for lens options:
- `photochromic` - For photochromic lenses
- `prescription_sun` or `prescription-sun` - For prescription sunglasses
- `blokz` - For blue light blocking lenses
- `mirror` - For mirror lenses
- `polarized` - For polarized lenses
- `classic` - For classic lens options
- `gradient` - For gradient lenses

---

## Notes

1. **Type Matching:** The frontend searches for `type=photochromic` and `type=prescription_sun` (or `prescription-sun`). Make sure the type matches exactly.

2. **Active Status:** Both the lens option AND its colors must have `is_active: true` to appear in the frontend.

3. **Sort Order:** Use `sort_order` to control the display order (lower numbers appear first).

4. **Price Display:** The frontend shows `base_price` from the option and `price_adjustment` from colors. Total = base_price + price_adjustment.

5. **Color Codes:** Use `hex_code` for color display. `color_code` is for internal reference.

---

## Example Postman Collection Usage

Import the Postman collection and use these requests in order:

1. **Admin Login** → Get `admin_token`
2. **Create Photochromic Option** → Save option ID
3. **Create Photochromic Colors** → Use saved option ID
4. **Create Prescription Sun Option** → Save option ID
5. **Create Prescription Sun Colors** → Use saved option ID
6. **Verify Public Endpoints** → Test without auth

---

For more details, see the Postman collection: `OptyShop_API.postman_collection.json`

