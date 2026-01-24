# Eye Hygiene ML Variant Image Switching

## Overview
This feature automatically changes the product image when users select different ML (Material/Lens) variants for eye hygiene products. Each variant can have its own specific images that will be displayed when selected.

## How It Works

### 1. Image Priority System
The image display follows this priority order:
1. **Unit-specific images** (for contact lenses)
2. **ML Variant-specific images** (for eye hygiene products)
3. **Color-specific images** (for regular products)
4. **Default product images**

### 2. ML Variant Image Sources
The system checks for variant images in multiple ways:

#### Direct Variant Images
```typescript
// Variant has its own images array
selectedSizeVolumeVariant.images = ['image1.jpg', 'image2.jpg']
```

#### Product Variant Images Mapping
```typescript
// Product has variant_images mapping
product.variant_images = {
  "1": ['variant1_image1.jpg', 'variant1_image2.jpg'],
  "2": ['variant2_image1.jpg', 'variant2_image2.jpg']
}
```

#### Size Volume Images Mapping
```typescript
// Product has size_volume_images mapping
product.size_volume_images = {
  "100ml": ['100ml_image1.jpg', '100ml_image2.jpg'],
  "200ml": ['200ml_image1.jpg', '200ml_image2.jpg']
}
```

### 3. Automatic Image Switching
When a user changes the ML variant selection:
- The image index automatically resets to 0
- The new variant's first image is displayed
- If the variant has multiple images, users can navigate through them

### 4. Implementation Details

#### Frontend Changes
- Modified `getVariantSpecificImageUrl()` function in `ProductDetail.tsx`
- Added variant image handling in `handleSizeVolumeChange()`
- Added debug logging for development

#### Backend API Updates
- Updated `SizeVolumeVariant` interface to include `images` field
- API can now return variant-specific images

### 5. Usage Examples

#### For Admin/Product Managers
Add variant-specific images through the admin panel:
```json
{
  "id": 1,
  "size_volume": "100ml",
  "pack_type": "Bottle",
  "price": 29.99,
  "images": [
    "/uploads/eye-hygiene-100ml-1.jpg",
    "/uploads/eye-hygiene-100ml-2.jpg"
  ]
}
```

#### For Developers
The system automatically handles image switching:
```typescript
// When variant changes, image automatically updates
setSelectedSizeVolumeVariant(newVariant)
setSelectedImageIndex(0) // Reset to first image
```

### 6. Debug Logging
In development mode, the system logs:
- Variant changes with image availability
- Image source selection logic
- Image index changes

### 7. Fallback Behavior
If no variant-specific images are found:
- Falls back to color-specific images
- Finally falls back to default product images
- Ensures a valid image is always displayed

## Testing
To test the feature:
1. Navigate to an eye hygiene product page
2. Select different ML variants from the dropdown
3. Verify the image changes automatically
4. Check browser console for debug logs in development

## Future Enhancements
- Add image transitions/animations
- Support for variant-specific image galleries
- Lazy loading for variant images
