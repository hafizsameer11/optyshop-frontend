# Product Filtering System Guide

## Overview

OptyShop has a robust 3-level hierarchical product filtering system that ensures products are displayed on their correct relative pages. The system supports:

- **Categories** (Level 1): e.g., "contact-lenses", "eye-glasses", "sun-glasses"
- **Subcategories** (Level 2): e.g., "Daily", "Monthly", "Weekly" (under contact-lenses)
- **Sub-subcategories** (Level 3): e.g., "Spherical", "Astigmatism" (under Daily/Monthly)

## URL Structure

### Two Routing Approaches

1. **Direct Shop Routes** (using `Products` component):
   ```
   /shop/contact-lenses     → All contact lenses products
   /shop/eye-hygiene        → All eye hygiene products
   /shop/sunglasses         → All sunglasses products
   /shop/eyeglasses         → All eyeglasses products
   ```

2. **Category Routes** (using `CategoryPage` component):
   ```
   /category/contact-lenses                    → All contact lenses
   /category/contact-lenses/daily              → Daily contact lenses
   /category/contact-lenses/daily/spherical    → Daily spherical contact lenses
   /category/eye-hygiene/saline                → Saline products
   /category/eye-hygiene/saline/550-ml         → 550ml saline products
   ```

## API Integration

### Product Data Structure

Each product from the API contains:
```json
{
  "id": 77,
  "name": "PRECISION1™",
  "category": {
    "id": 24,
    "name": "contact-lenses",
    "slug": "contact-lenses"
  },
  "subCategory": {
    "id": 96,
    "name": "Spherical",
    "slug": "spherical"
  }
}
```

### API Parameters

The products API accepts these filtering parameters:
- `category` - Category slug (e.g., "contact-lenses")
- `subCategory` - Subcategory slug (e.g., "daily", "spherical") ⚠️ **Note: Capital C**
- `page`, `limit` - Pagination
- Additional filters: `minPrice`, `maxPrice`, `gender`, etc.

## Frontend Implementation

### CategoryPage Component

The `CategoryPage` component handles the 3-level hierarchy:

1. **Route Parameter Extraction**:
   ```typescript
   const { categorySlug, subcategorySlug, subSubcategorySlug } = useParams()
   ```

2. **Category Information Fetching**:
   ```typescript
   // Fetches category, subcategory, and sub-subcategory info
   category = await getCategoryBySlug(categorySlug)
   subcategory = await getSubcategoryBySlug(subcategorySlug, category.id)
   subSubcategory = await getNestedSubcategoriesByParentId(subcategory.id)
   ```

3. **Filter Application**:
   ```typescript
   // Always apply category filter
   if (categoryInfo.category?.slug) {
       filters.category = categoryInfo.category.slug
   }

   // Apply most specific subcategory filter available
   if (categoryInfo.subSubcategory?.slug) {
       filters.subcategory = categoryInfo.subSubcategory.slug
   } else if (categoryInfo.subcategory?.slug) {
       filters.subcategory = categoryInfo.subcategory.slug
   }
   ```

4. **API Parameter Mapping**:
   ```typescript
   // Map subcategory to subCategory (API expects capital C)
   if (apiFilters.subcategory !== undefined) {
       apiFilters.subCategory = apiFilters.subcategory
       delete apiFilters.subcategory
   }
   ```

### Products Component

The `Products` component handles direct shop routes:

1. **Section Detection**:
   ```typescript
   const getCurrentSection = (): ProductSection | null => {
       if (path.includes('/shop/contact-lenses')) return 'contact-lenses'
       if (path.includes('/shop/eye-hygiene')) return 'eye-hygiene'
       // ... other sections
   }
   ```

2. **Section-based Filtering**:
   ```typescript
   const sectionFilters = { ...filters }
   switch (section) {
       case 'contact-lenses':
           sectionFilters.category = 'contact-lenses'
           break
       // ... other sections
   }
   ```

## Validation & Debugging

### Product Filtering Validation

The system includes validation to ensure products match expected filters:

```typescript
const validateProductFiltering = (products, categoryInfo) => {
    // Validates each product against expected category/subcategory
    // Reports mismatches for debugging
    // Returns validation statistics
}
```

### Development Logging

Enhanced logging in development mode:
- Category filter application details
- Subcategory hierarchy information
- API request parameters
- Product filtering validation results
- Mismatch reports

## Example URL Mappings

### Contact Lenses Hierarchy

```
/category/contact-lenses
├── /category/contact-lenses/daily
│   ├── /category/contact-lenses/daily/spherical
│   └── /category/contact-lenses/daily/astigmatism
├── /category/contact-lenses/weekly
│   ├── /category/contact-lenses/weekly/spherical
│   └── /category/contact-lenses/weekly/astigmatism
├── /category/contact-lenses/monthly
│   ├── /category/contact-lenses/monthly/spherical
│   └── /category/contact-lenses/monthly/astigmatism
└── /category/contact-lenses/coloured-lenses
```

### Eye Hygiene Hierarchy

```
/category/eye-hygiene
├── /category/eye-hygiene/peroxide
├── /category/eye-hygiene/saline
│   ├── /category/eye-hygiene/saline/550-ml
│   ├── /category/eye-hygiene/saline/10-ml20-fiale
│   └── /category/eye-hygiene/saline/ml-200
├── /category/eye-hygiene/detergents
│   ├── /category/eye-hygiene/detergents/detergente-lac-morbide
│   └── /category/eye-hygiene/detergents/detergente-rgp
└── /category/eye-hygiene/humectants
```

## Testing

### Manual Testing Checklist

1. **Category Level**: Visit `/category/contact-lenses` - should show all contact lenses
2. **Subcategory Level**: Visit `/category/contact-lenses/daily` - should show only daily lenses
3. **Sub-subcategory Level**: Visit `/category/contact-lenses/daily/spherical` - should show only daily spherical lenses
4. **Direct Routes**: Visit `/shop/contact-lenses` - should show all contact lenses
5. **Filter Validation**: Check console logs for validation results in development

### API Testing

Use the provided test script `test-product-filtering.js`:

```bash
node test-product-filtering.js
```

This tests:
- Category filtering
- Category + subcategory filtering
- API response structure
- Product data validation

## Troubleshooting

### Common Issues

1. **Products not showing**:
   - Check if product `is_active` is true
   - Verify category and subcategory slugs match
   - Check API response structure

2. **Wrong products showing**:
   - Verify subcategory mapping (subcategory → subCategory)
   - Check category hierarchy in database
   - Review validation logs

3. **Navigation issues**:
   - Ensure category slugs match route parameters
   - Check if subcategories have correct parent_id
   - Verify route configuration in App.tsx

### Debug Information

Enable development mode to see:
- Detailed filter application logs
- Product validation results
- API request parameters
- Hierarchy structure information

## Best Practices

1. **Always use slugs** for routing, not IDs
2. **Validate API responses** match expected structure
3. **Handle missing subcategories** gracefully
4. **Provide fallback navigation** when filters return no results
5. **Log detailed information** in development mode
6. **Test all hierarchy levels** after changes

This system ensures products are correctly displayed on their relative pages with proper filtering and validation throughout the 3-level hierarchy.
