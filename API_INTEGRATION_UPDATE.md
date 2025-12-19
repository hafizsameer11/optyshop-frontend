# API Integration Update

## Base URL Configuration

The API base URL has been updated to match the Postman collection configuration.

### Postman Collection Configuration
- **base_url**: `http://localhost:5000`
- **Full API URL Pattern**: `{{base_url}}/api/...`
- **Example**: `http://localhost:5000/api/auth/login`

### Frontend Configuration

#### Development (Default)
- **Base URL**: `http://localhost:5000/api`
- Automatically used when `import.meta.env.DEV === true`

#### Production
- **Base URL**: `https://optyshop-frontend.hmstech.org/api`
- Used when `import.meta.env.DEV === false`

#### Custom Configuration
You can override the base URL by setting the environment variable:

```env
# .env file
VITE_API_BASE_URL=http://localhost:5000/api
# or for production
VITE_API_BASE_URL=https://optyshop-frontend.hmstech.org/api
```

## API Routes Structure

All API routes in `src/config/apiRoutes.ts` are relative paths that will be appended to the base URL:

```typescript
// Example route definition
AUTH: {
  LOGIN: `/auth/login`,  // Becomes: http://localhost:5000/api/auth/login
  REGISTER: `/auth/register`,  // Becomes: http://localhost:5000/api/auth/register
}
```

## Verification

### ✅ All Endpoints Match Postman Collection

All endpoints from the Postman collection are integrated:

1. **Authentication** (`/api/auth/*`)
   - ✅ Register, Login, Refresh Token
   - ✅ Get Current User, Update Profile, Change Password, Logout

2. **Products** (`/api/products/*`)
   - ✅ List, Featured, Options
   - ✅ By ID, By Slug, Related
   - ✅ Configuration, Lens Types

3. **Categories** (`/api/categories/*`)
   - ✅ List (with includeProducts, includeSubcategories)
   - ✅ By ID, By Slug, Related

4. **Subcategories** (`/api/subcategories/*`)
   - ✅ List, By Category, By ID, By Slug
   - ✅ By Parent, Nested, Products

5. **Cart** (`/api/cart/*`)
   - ✅ Get, Add Item, Update Item, Remove Item, Clear

6. **Orders** (`/api/orders/*`)
   - ✅ Create, List, By ID, Cancel

7. **Transactions** (`/api/transactions/*`)
   - ✅ List, By ID

8. **Prescriptions** (`/api/prescriptions/*`)
   - ✅ List, Create, Update, Delete, Validate, Verify

9. **Simulations** (`/api/simulations/*`)
   - ✅ PD, Pupillary Height, Lens Thickness
   - ✅ Kids Recommendation, Lifestyle Recommendation
   - ✅ Base Curve, Photochromic, AR Coating

10. **Coupons** (`/api/coupons/*`)
    - ✅ Apply

11. **Content** (`/api/*`)
    - ✅ Case Studies, Blog, Jobs
    - ✅ Forms (Contact, Demo, Pricing, Job Application, Support, Credentials)
    - ✅ Banners, Campaigns, FAQs, Pages
    - ✅ CMS Testimonials

12. **Lens Options** (`/api/lens/*`)
    - ✅ Options, Treatments
    - ✅ Prescription Lens Types, Variants
    - ✅ Thickness Materials, Thickness Options

13. **Shipping** (`/api/shipping-methods/*`)
    - ✅ List, By ID

14. **Payments** (`/api/payments/*`)
    - ✅ Create Intent, Confirm, Intent Status

15. **Customization** (`/api/customization/*`)
    - ✅ Options, Product Customization
    - ✅ Calculate Price, Calculate With Prescription
    - ✅ Prescription Lens Types

16. **Health** (`/health`, `/api`)
    - ✅ Health Check, API Info

## Testing

### Local Development
1. Start your backend server on `http://localhost:5000`
2. The frontend will automatically use `http://localhost:5000/api`
3. No environment variable needed for local development

### Production
1. Set `VITE_API_BASE_URL=https://optyshop-frontend.hmstech.org/api` in your production environment
2. Or rely on the default production URL

### Custom Backend URL
Create a `.env` file in the project root:
```env
VITE_API_BASE_URL=http://your-backend-url:port/api
```

## Notes

- All routes are relative paths (start with `/`)
- The API client automatically prepends the base URL
- Authentication tokens are handled automatically via `Authorization: Bearer {{access_token}}`
- The base URL configuration matches the Postman collection structure

