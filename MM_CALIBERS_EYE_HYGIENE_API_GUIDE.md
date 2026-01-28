# MM Calibers and Eye Hygiene Variants API Guide

## Overview

This guide explains the backend implementation for managing glasses with mm calibers and eye hygiene variants with associated images. The system supports both admin panel management and website browsing.

## Database Schema Changes

### Product Model Updates
- **mm_calibers**: JSON field storing array of caliber objects
  ```json
  [
    {
      "mm": "58",
      "image_url": "https://example.com/image-58mm.jpg"
    },
    {
      "mm": "62", 
      "image_url": "https://example.com/image-62mm.jpg"
    }
  ]
  ```

### New EyeHygieneVariant Model
```sql
CREATE TABLE eye_hygiene_variants (
  id INT PRIMARY KEY AUTO_INCREMENT,
  product_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  image_url VARCHAR(500),
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INT DEFAULT 0,
  created_at DATETIME DEFAULT NOW(),
  updated_at DATETIME DEFAULT NOW(),
  FOREIGN KEY (product_id) REFERENCES products(id)
);
```

## API Endpoints

### Website (Public) APIs

#### Get Product with MM Calibers
```
GET /api/products/:id/calibers
```
**Response**: Product details including mm_calibers and eyeHygieneVariants arrays

#### Get Products by Category (with MM Calibers)
```
GET /api/categories/:id/products?page=1&limit=12&sortBy=created_at&sortOrder=desc
```
**Response**: Paginated products with full mm_calibers and eyeHygieneVariants

### Admin APIs

#### MM Caliber Management
```
POST   /api/admin/products/:productId/calibers     # Add caliber
PUT    /api/admin/products/:productId/calibers/:mm # Update caliber
DELETE /api/admin/products/:productId/calibers/:mm # Delete caliber
```

**Request Body (Add/Update)**:
```json
{
  "mm": "58",
  "image_url": "https://example.com/images/ray-ban-58mm.jpg"
}
```

#### Eye Hygiene Variant Management
```
POST   /api/admin/eye-hygiene-variants              # Create variant
PUT    /api/admin/eye-hygiene-variants/:id          # Update variant
DELETE /api/admin/eye-hygiene-variants/:id          # Delete variant
GET    /api/admin/products/:productId/eye-hygiene-variants # Get variants for product
```

**Request Body (Create/Update)**:
```json
{
  "product_id": 1,
  "name": "Premium Cleaning Solution",
  "description": "Advanced cleaning formula for all lens types",
  "price": 15.99,
  "image_url": "https://example.com/images/cleaner.jpg",
  "sort_order": 0
}
```

## How It Works

### 1. MM Caliber System
- **Storage**: Calibers are stored as JSON in the `mm_calibers` field of products table
- **Image Association**: Each caliber has its own image URL
- **Frontend Integration**: When users select a caliber (e.g., 58mm), the corresponding image is displayed
- **Admin Management**: Admins can add/update/delete calibers via admin panel

### 2. Eye Hygiene Variant System
- **Separate Table**: Variants stored in dedicated `eye_hygiene_variants` table
- **Product Association**: Each variant linked to a parent product via `product_id` 
- **Image Support**: Each variant can have its own image
- **Sorting**: Variants ordered by `sort_order` field
- **Active Status**: Can enable/disable variants without deleting

### 3. Response Format
Both website endpoints return products with enhanced data:

```json
{
  "id": 1,
  "name": "Ray Ban 3025",
  "price": 180.00,
  "frame_shape": "Aviator",
  "frame_material": "Metal",
  "gender": "Unisex",
  "mm_calibers": [
    {
      "mm": "58",
      "image_url": "https://example.com/ray-ban-58mm.jpg"
    },
    {
      "mm": "62",
      "image_url": "https://example.com/ray-ban-62mm.jpg"
    }
  ],
  "eyeHygieneVariants": [
    {
      "id": 1,
      "name": "Premium Cleaning Solution",
      "description": "Advanced cleaning formula",
      "price": 15.99,
      "image_url": "https://example.com/cleaner.jpg",
      "sort_order": 0
    }
  ]
}
```

## Frontend Integration Guide

### Displaying MM Calibers
```javascript
// Get product with calibers
const response = await fetch('/api/products/1/calibers');
const product = await response.json();

// Render caliber selector
product.mm_calibers.forEach(caliber => {
  const option = document.createElement('option');
  option.value = caliber.mm;
  option.textContent = `${caliber.mm}mm`;
  // Store image URL for display
  option.dataset.image = caliber.image_url;
  caliberSelector.appendChild(option);
});

// Change image when caliber selected
caliberSelector.addEventListener('change', (e) => {
  const selectedCaliber = product.mm_calibers.find(c => c.mm === e.target.value);
  if (selectedCaliber) {
    productImage.src = selectedCaliber.image_url;
  }
});
```

### Displaying Eye Hygiene Variants
```javascript
// Render eye hygiene variants
product.eyeHygieneVariants.forEach(variant => {
  const variantCard = document.createElement('div');
  variantCard.innerHTML = `
    <img src="${variant.image_url}" alt="${variant.name}">
    <h3>${variant.name}</h3>
    <p>${variant.description}</p>
    <p>$${variant.price}</p>
  `;
  variantsContainer.appendChild(variantCard);
});
```

## Postman Collection

The updated Postman collection includes:
- **Website APIs**: Public endpoints for browsing products with calibers
- **Admin APIs**: Full CRUD operations for calibers and variants
- **Authentication**: Uses `{{admin_token}}` for admin endpoints
- **Examples**: Sample request bodies and response formats

## Security Considerations

- **Admin Protection**: All admin endpoints require `Bearer {{admin_token}}` 
- **Input Validation**: MM values and image URLs are validated
- **File Upload**: Images should be uploaded via existing S3 upload system
- **Data Integrity**: Foreign key constraints ensure variant-product relationships

## Testing

Use the provided Postman collection to test:
1. Create a product
2. Add MM calibers with images
3. Create eye hygiene variants
4. Test website endpoints
5. Verify image display functionality

## Migration

Run the following to apply database changes:
```bash
npx prisma generate
npx prisma migrate dev --name add-mm-calibers-eye-hygiene-variants
```

## Support

For issues or questions:
1. Check the server logs for detailed error messages
2. Verify database schema is updated
3. Ensure Prisma client is regenerated
4. Test with Postman collection first

## Frontend Implementation Status

### ✅ Already Implemented

#### MM Caliber Support
- **API Routes**: `/api/products/:id/calibers` (public) and admin CRUD endpoints
- **Service Functions**: `getProductCalibers()`, `adminCreateProductCaliber()`, etc.
- **Type Definitions**: `MMCaliber` interface with mm, image, price, stock fields
- **UI Components**: Caliber selector in ProductDetail page with image switching
- **State Management**: Selected caliber tracking and image updates

#### Eye Hygiene Variant Support  
- **API Routes**: Admin CRUD endpoints for eye hygiene variants
- **Service Functions**: `adminGetEyeHygieneVariants()`, `adminCreateEyeHygieneVariant()`, etc.
- **Type Definitions**: `EyeHygieneVariant` interface with full variant fields
- **UI Components**: Eye hygiene detection and display in ProductDetail page
- **State Management**: Variant selection and form handling

#### Product Integration
- **Enhanced Product Interface**: Includes `mm_calibers` and `eyeHygieneVariants` arrays
- **Category Detection**: Automatic detection of eye hygiene products
- **Image Handling**: Support for caliber-specific and variant-specific images
- **Responsive Design**: Mobile-friendly caliber selectors and variant displays

### 🎯 Current Frontend Features

1. **MM Caliber System**:
   - Fetches calibers for frame/glasses products
   - Displays caliber selector with size options
   - Switches product image based on selected caliber
   - Shows stock status and pricing per caliber

2. **Eye Hygiene System**:
   - Detects eye hygiene products by category/subcategory
   - Displays product information section with size, pack type, expiry
   - Handles variant selection and pricing
   - Shows stock status with color coding

3. **Admin Integration Ready**:
   - All admin API functions implemented in services
   - Type-safe interfaces for all data structures
   - Error handling and validation support
   - Ready for admin panel integration

## Implementation Checklist

### Backend (To Be Implemented)
- [ ] Update Prisma schema with `mm_calibers` JSON field
- [ ] Create `eye_hygiene_variants` table
- [ ] Implement public API endpoints
- [ ] Implement admin API endpoints with authentication
- [ ] Add input validation and error handling
- [ ] Run database migrations

### Frontend (✅ Complete)
- [x] API routes configuration
- [x] Service layer functions
- [x] TypeScript interfaces
- [x] Product detail page integration
- [x] MM caliber selector UI
- [x] Eye hygiene variant display
- [x] Image switching functionality
- [x] Responsive design

### Testing
- [ ] Backend API testing with Postman
- [ ] Frontend-backend integration testing
- [ ] Image upload and display testing
- [ ] Admin panel functionality testing

## Next Steps

1. **Backend Implementation**: Follow this guide to implement the backend API endpoints
2. **Database Migration**: Apply the schema changes using Prisma
3. **Testing**: Use the Postman collection to verify all endpoints
4. **Admin Panel**: Integrate the admin APIs into the admin interface
5. **Production Deployment**: Deploy the updated backend and test with the existing frontend

The frontend is fully ready to work with the backend APIs described in this guide. Once the backend is implemented, the MM Calibers and Eye Hygiene Variants functionality will work seamlessly on the website.
