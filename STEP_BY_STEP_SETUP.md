# Step-by-Step Setup Guide: Lens Options

## Overview
This guide will help you set up the lens options (Photochromic, Prescription Lenses Sun, and Block Blue) that appear in the product checkout modal.

---

## Prerequisites

1. **Admin Access Token**
   - Login to admin panel or use Postman to get admin token
   - Endpoint: `POST /api/auth/login` with admin credentials
   - Save the `access_token` from response

2. **Postman Collection**
   - Import `OptyShop_API.postman_collection.json`
   - Set `base_url` variable (e.g., `http://localhost:3000` or your API URL)
   - Set `admin_token` variable with your admin access token

---

## Step 1: Create Photochromic Lens Option

### API Request
```bash
POST /api/admin/lens-options
Authorization: Bearer {admin_token}
Content-Type: application/json
```

### Request Body
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

### Expected Response
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Photochromic",
    "slug": "photochromic",
    "type": "photochromic",
    "base_price": 50.00,
    "is_active": true,
    ...
  }
}
```

**⚠️ IMPORTANT:** Save the `id` from the response (e.g., `1`) - you'll need it for Step 2.

---

## Step 2: Add Colors to Photochromic Option

Use the `id` from Step 1 (let's assume it's `1`).

### API Request
```bash
POST /api/admin/lens-colors
Authorization: Bearer {admin_token}
Content-Type: application/json
```

### ⚠️ IMPORTANT: Required Fields
**Both `name` AND `color_code` are REQUIRED!** The API will return an error if either is missing.

### Request Body Examples

#### Gray Color
```json
{
  "lens_option_id": 1,
  "lens_finish_id": null,
  "prescription_lens_type_id": null,
  "name": "Gray",
  "color_code": "GRAY",
  "hex_code": "#808080",
  "price_adjustment": 0.00,
  "is_active": true,
  "sort_order": 1
}
```

**✅ Required Fields:**
- `name`: "Gray" (display name)
- `color_code`: "GRAY" (internal code - must be unique)
- `lens_option_id`: 1 (the ID from Step 1)

**Optional but Recommended:**
- `hex_code`: "#808080" (used to display the color)
- `price_adjustment`: 0.00 (additional price for this color)
- `is_active`: true (must be true to show)
- `sort_order`: 1 (display order)

#### Brown Color
```json
{
  "lens_option_id": 1,
  "lens_finish_id": null,
  "prescription_lens_type_id": null,
  "name": "Brown",
  "color_code": "BROWN",
  "hex_code": "#8B4513",
  "price_adjustment": 0.00,
  "is_active": true,
  "sort_order": 2
}
```

#### Green Color
```json
{
  "lens_option_id": 1,
  "lens_finish_id": null,
  "prescription_lens_type_id": null,
  "name": "Green",
  "color_code": "GREEN",
  "hex_code": "#228B22",
  "price_adjustment": 0.00,
  "is_active": true,
  "sort_order": 3
}
```

**Repeat this step for each color you want to add.**

---

## Step 3: Create Prescription Lenses Sun Option

### API Request
```bash
POST /api/admin/lens-options
Authorization: Bearer {admin_token}
Content-Type: application/json
```

### Request Body
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

### Expected Response
```json
{
  "success": true,
  "data": {
    "id": 2,
    "name": "Prescription Lenses Sun",
    "slug": "prescription-lenses-sun",
    "type": "prescription_sun",
    "base_price": 35.00,
    "is_active": true,
    ...
  }
}
```

**⚠️ IMPORTANT:** Save the `id` from the response (e.g., `2`) - you'll need it for Step 4.

**Note:** You can also use `"type": "prescription-sun"` (with hyphen). The frontend checks both.

---

## Step 4: Add Colors to Prescription Sun Option

Use the `id` from Step 3 (let's assume it's `2`).

### API Request
```bash
POST /api/admin/lens-colors
Authorization: Bearer {admin_token}
Content-Type: application/json
```

### ⚠️ IMPORTANT: Required Fields
**Both `name` AND `color_code` are REQUIRED!** The API will return an error if either is missing.

### Request Body Examples

#### Block Blue Color
```json
{
  "lens_option_id": 2,
  "lens_finish_id": null,
  "prescription_lens_type_id": null,
  "name": "Block Blue",
  "color_code": "BLOCK_BLUE",
  "hex_code": "#0066CC",
  "price_adjustment": 0.00,
  "is_active": true,
  "sort_order": 1
}
```

**✅ Required Fields:**
- `name`: "Block Blue" (display name)
- `color_code`: "BLOCK_BLUE" (internal code - must be unique)
- `lens_option_id`: 2 (the ID from Step 3)

#### Blue Classic
```json
{
  "lens_option_id": 2,
  "lens_finish_id": null,
  "prescription_lens_type_id": null,
  "name": "Blue",
  "color_code": "BLUE",
  "hex_code": "#0000FF",
  "price_adjustment": 0.00,
  "is_active": true,
  "sort_order": 2
}
```

#### Silver Mirror
```json
{
  "lens_option_id": 2,
  "lens_finish_id": null,
  "prescription_lens_type_id": null,
  "name": "Silver Mirror",
  "color_code": "SILVER_MIRROR",
  "hex_code": "#C0C0C0",
  "price_adjustment": 5.00,
  "is_active": true,
  "sort_order": 3
}
```

#### Brown Gradient
```json
{
  "lens_option_id": 2,
  "lens_finish_id": null,
  "prescription_lens_type_id": null,
  "name": "Brown Gradient",
  "color_code": "BROWN_GRADIENT",
  "hex_code": "#8B4513",
  "price_adjustment": 0.00,
  "is_active": true,
  "sort_order": 4
}
```

**Repeat this step for each color you want to add.**

---

## Step 5: Verify Setup

### 5.1 Test Photochromic Options (Public API)
```bash
GET /api/lens/options?type=photochromic&isActive=true
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Photochromic",
      "type": "photochromic",
      "base_price": 50.00,
      "is_active": true,
      "colors": [
        {
          "id": 1,
          "name": "Gray",
          "hex_code": "#808080",
          "is_active": true
        },
        {
          "id": 2,
          "name": "Brown",
          "hex_code": "#8B4513",
          "is_active": true
        }
      ]
    }
  ]
}
```

### 5.2 Test Prescription Sun Options (Public API)
```bash
GET /api/lens/options?type=prescription_sun&isActive=true
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 2,
      "name": "Prescription Lenses Sun",
      "type": "prescription_sun",
      "base_price": 35.00,
      "is_active": true,
      "colors": [
        {
          "id": 3,
          "name": "Block Blue",
          "hex_code": "#0066CC",
          "is_active": true
        },
        {
          "id": 4,
          "name": "Blue",
          "hex_code": "#0000FF",
          "is_active": true
        }
      ]
    }
  ]
}
```

### 5.3 Test in Frontend

1. Open your application
2. Navigate to a product detail page (frame product)
3. Click "Add to Cart" or "Customize"
4. Go through the checkout steps until you reach "Treatment" step
5. Expand "Photochromic" section
   - ✅ Should show photochromic options with color swatches
   - ❌ If empty: Check console for errors, verify API returns data
6. Expand "Prescription Lenses Sun" section
   - ✅ Should show prescription sun options with colors
   - ❌ If empty: Check console for errors, verify API returns data

---

## Troubleshooting

### Problem: "No photochromic options available"

**Check:**
1. Verify option exists: `GET /api/admin/lens-options?type=photochromic`
2. Check `is_active` is `true`
3. Verify `type` is exactly `"photochromic"` (case-sensitive)
4. Test public endpoint: `GET /api/lens/options?type=photochromic`
5. Check browser console for API errors

**Fix:**
- If option doesn't exist: Create it (Step 1)
- If `is_active` is `false`: Update it to `true`
- If type is wrong: Update the option with correct type

### Problem: "No prescription sun options available"

**Check:**
1. Verify option exists: `GET /api/admin/lens-options?type=prescription_sun`
2. Try alternative: `GET /api/admin/lens-options?type=prescription-sun`
3. Check `is_active` is `true`
4. Test public endpoint: `GET /api/lens/options?type=prescription_sun`
5. Check browser console for API errors

**Fix:**
- If option doesn't exist: Create it (Step 3)
- If type mismatch: Update type to `prescription_sun` or `prescription-sun`

### Problem: Colors not showing

**Check:**
1. Verify colors exist: `GET /api/admin/lens-colors?lensOptionId={id}`
2. Check `is_active` is `true` for colors
3. Verify `lens_option_id` matches the option ID
4. Check `hex_code` is set (used for color display)
5. Test public endpoint: `GET /api/lens/options/{id}` (should include colors)

**Fix:**
- If colors don't exist: Create them (Step 2 or Step 4)
- If `is_active` is `false`: Update colors to `is_active: true`
- If `lens_option_id` is wrong: Update color with correct option ID

### Problem: Block Blue not appearing

**Options:**
1. **If Block Blue should be under Prescription Sun:**
   - Add it as a color to the prescription_sun option (Step 4)
   - Name it "Block Blue" with appropriate hex code

2. **If Block Blue should be a separate option:**
   - Create new lens option with `type: "blokz"`
   - Add colors to it

---

## Quick Checklist

- [ ] Admin token obtained and set in Postman
- [ ] Photochromic lens option created (Step 1)
- [ ] Photochromic colors added (Step 2)
- [ ] Prescription Sun lens option created (Step 3)
- [ ] Prescription Sun colors added (Step 4)
- [ ] All options have `is_active: true`
- [ ] All colors have `is_active: true`
- [ ] Public APIs return data (Step 5.1 & 5.2)
- [ ] Frontend modal shows options (Step 5.3)

---

## API Endpoints Summary

| Action | Method | Endpoint | Auth |
|--------|--------|----------|------|
| Create Lens Option | POST | `/api/admin/lens-options` | Admin |
| Create Lens Color | POST | `/api/admin/lens-colors` | Admin |
| Get Photochromic (Public) | GET | `/api/lens/options?type=photochromic` | None |
| Get Prescription Sun (Public) | GET | `/api/lens/options?type=prescription_sun` | None |
| List All Options (Admin) | GET | `/api/admin/lens-options` | Admin |
| List All Colors (Admin) | GET | `/api/admin/lens-colors` | Admin |

---

## Additional Resources

- **Detailed Guide:** `LENS_OPTIONS_SETUP_GUIDE.md`
- **Quick Reference:** `QUICK_REFERENCE_LENS_APIS.md`
- **Postman Collection:** `OptyShop_API.postman_collection.json`
- **Frontend Code:** `src/components/shop/ProductCheckout.tsx`

---

## Notes

1. **Type Values:** The `type` field must match exactly:
   - `photochromic` (for photochromic lenses)
   - `prescription_sun` or `prescription-sun` (for prescription sunglasses)
   - `blokz` (for blue light blocking)

2. **Active Status:** Both options AND colors must be active (`is_active: true`) to appear in the frontend.

3. **Price Display:** 
   - Option `base_price` + Color `price_adjustment` = Total price
   - If `price_adjustment` is 0, only `base_price` is shown

4. **Color Display:** The frontend uses `hex_code` to display colors. If missing, it falls back to `color_code`.

5. **Sort Order:** Use `sort_order` to control display order (lower numbers appear first).

---

**Need Help?** Check the browser console for API errors and verify all data is active in the admin panel.

