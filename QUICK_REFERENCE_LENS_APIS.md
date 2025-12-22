# Quick Reference: Lens Options APIs

## Frontend APIs (Public - No Auth Required)

### 1. Get Photochromic Options
```bash
GET /api/lens/options?type=photochromic&isActive=true
```

### 2. Get Prescription Sun Options
```bash
GET /api/lens/options?type=prescription_sun&isActive=true
```

### 3. Get All Lens Options
```bash
GET /api/lens/options
```

### 4. Get Specific Lens Option with Colors
```bash
GET /api/lens/options/{id}
```

---

## Admin APIs (Requires Admin Token)

### Create Lens Option
```bash
POST /api/admin/lens-options
Authorization: Bearer {admin_token}
Content-Type: application/json

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

### Create Lens Color
```bash
POST /api/admin/lens-colors
Authorization: Bearer {admin_token}
Content-Type: application/json

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

---

## What Shows in the Modal

The Treatment Step modal displays:

1. **Standard Treatments** (from `/api/lens/treatments`)
   - Radio button options
   - Example: Anti-glare, Blue light filter

2. **Photochromic** (from `/api/lens/options?type=photochromic`)
   - Expandable section
   - Shows lens options with color swatches
   - If empty: "No photochromic options available. Please configure them in the admin panel."

3. **Prescription Lenses Sun** (from `/api/lens/options?type=prescription_sun`)
   - Expandable section
   - Groups by type (polarized, blokz, classic)
   - Shows sub-options with colors
   - If empty: "No prescription sun options available. Please configure them in the admin panel."

---

## Setup Checklist

- [ ] Create Photochromic lens option via admin API
- [ ] Add colors to Photochromic option
- [ ] Create Prescription Sun lens option via admin API
- [ ] Add colors to Prescription Sun option (including Block Blue if needed)
- [ ] Verify all options have `is_active: true`
- [ ] Verify all colors have `is_active: true`
- [ ] Test public endpoints return data
- [ ] Test in frontend modal

---

## Type Values for Lens Options

| Type | Description | Use Case |
|------|-------------|----------|
| `photochromic` | Photochromic lenses | Auto-darkening lenses |
| `prescription_sun` | Prescription sunglasses | Sun lenses with prescription |
| `prescription-sun` | Alternative format | Same as above (with hyphen) |
| `blokz` | Blue light blocking | Block Blue option |
| `mirror` | Mirror coating | Reflective lenses |
| `polarized` | Polarized lenses | Sun glare reduction |
| `classic` | Classic style | Traditional lens style |
| `gradient` | Gradient lenses | Tinted gradient effect |

---

## Frontend Code Location

- **Component:** `src/components/shop/ProductCheckout.tsx`
- **Fetch Functions:**
  - `fetchPhotochromicOptions()` - Line ~872
  - `fetchPrescriptionSunOptions()` - Line ~891
- **Display Component:** `TreatmentStep` - Line ~2713
- **Service:** `src/services/lensOptionsService.ts`

---

For detailed setup instructions, see: `LENS_OPTIONS_SETUP_GUIDE.md`

