# API Routes Verification

This document verifies that all frontend API routes match the Postman collection.

## ✅ Verified Routes

### Authentication (Public)
- ✅ `POST /api/auth/register` - Customer registration
- ✅ `POST /api/auth/login` - Login (customer/admin)
- ✅ `POST /api/auth/refresh` - Refresh token

### Authentication (Customer - Authenticated)
- ✅ `GET /api/auth/me` - Get current user
- ✅ `PUT /api/auth/profile` - Update profile
- ✅ `PUT /api/auth/change-password` - Change password
- ✅ `POST /api/auth/logout` - Logout

### Products (Public)
- ✅ `GET /api/products` - List products
- ✅ `GET /api/products/featured` - Featured products
- ✅ `GET /api/products/options` - Product options
- ✅ `GET /api/products/:id` - Get product by ID
- ✅ `GET /api/products/slug/:slug` - Get product by slug
- ✅ `GET /api/products/:id/related` - Related products

### Categories (Public)
- ✅ `GET /api/categories` - List categories
- ✅ `GET /api/categories/:id` - Get category by ID
- ✅ `GET /api/categories/slug/:slug` - Get category by slug

### Cart (Customer - Authenticated)
- ✅ `GET /api/cart` - Get cart
- ✅ `POST /api/cart/items` - Add item to cart
- ✅ `PUT /api/cart/items/:id` - Update cart item
- ✅ `DELETE /api/cart/items/:id` - Remove cart item
- ✅ `DELETE /api/cart` - Clear cart

### Orders (Customer - Authenticated)
- ✅ `POST /api/orders` - Create order
- ✅ `GET /api/orders` - List user orders
- ✅ `GET /api/orders/:id` - Get order by ID
- ✅ `PUT /api/orders/:id/cancel` - Cancel order

### Transactions (Customer - Authenticated)
- ✅ `GET /api/transactions` - List user transactions
- ✅ `GET /api/transactions/:id` - Get transaction by ID

### Prescriptions (Customer - Authenticated)
- ✅ `GET /api/prescriptions` - List user prescriptions
- ✅ `POST /api/prescriptions` - Create prescription
- ✅ `GET /api/prescriptions/:id` - Get prescription by ID
- ✅ `PUT /api/prescriptions/:id` - Update prescription
- ✅ `DELETE /api/prescriptions/:id` - Delete prescription
- ✅ `POST /api/prescriptions/validate` - Validate prescription
- ✅ `PUT /api/prescriptions/:id/verify` - Verify prescription

### Simulations (Public)
- ✅ `POST /api/simulations/pd` - Calculate PD
- ✅ `POST /api/simulations/pupillary-height` - Calculate pupillary height
- ✅ `POST /api/simulations/lens-thickness` - Calculate lens thickness
- ✅ `POST /api/simulations/kids-lens-recommendation` - Kids lens recommendation
- ✅ `POST /api/simulations/lifestyle-recommendation` - Lifestyle recommendation
- ✅ `POST /api/simulations/base-curve` - Calculate base curve
- ✅ `POST /api/simulations/photochromic` - Photochromic simulator
- ✅ `POST /api/simulations/ar-coating` - AR coating simulator

### Coupons (Public)
- ✅ `POST /api/coupons/apply` - Apply coupon

### Case Studies (Public)
- ✅ `GET /api/case-studies` - List case studies
- ✅ `GET /api/case-studies/:slug` - Get case study by slug

### Blog (Public)
- ✅ `GET /api/blog` - List blog articles
- ✅ `GET /api/blog/:slug` - Get blog article by slug

### Jobs (Public)
- ✅ `GET /api/jobs` - List jobs
- ✅ `GET /api/jobs/:id` - Get job by ID

### Forms (Public)
- ✅ `GET /api/forms/contact` - Get contact form config
- ✅ `POST /api/forms/contact/submissions` - Submit contact form
- ✅ `GET /api/forms/demo` - Get demo form config
- ✅ `POST /api/forms/demo/submissions` - Submit demo form
- ✅ `GET /api/forms/pricing` - Get pricing form config
- ✅ `POST /api/forms/pricing/submissions` - Submit pricing form
- ✅ `GET /api/forms/job-application` - Get job application form config
- ✅ `POST /api/forms/job-application/submissions` - Submit job application
- ✅ `GET /api/forms/credentials` - Get credentials form config
- ✅ `POST /api/forms/credentials/submissions` - Submit credentials form
- ✅ `GET /api/forms/support` - Get support form config
- ✅ `POST /api/forms/support/submissions` - Submit support form

### Banners (Public)
- ✅ `GET /api/banners` - Get banners

### Campaigns (Public)
- ✅ `GET /api/campaigns` - Get campaigns

### FAQs (Public)
- ✅ `GET /api/faqs` - Get FAQs

### Pages (Public)
- ✅ `GET /api/pages/:slug` - Get page by slug

### CMS (Public)
- ✅ `GET /api/cms/testimonials` - Get testimonials

## Routes NOT Used by Frontend

The following routes are in the Postman collection but are **NOT** used by the frontend (admin-only):

- All `/api/admin/*` routes
- `/api/analytics/*` routes
- `/api/overview` route
- Admin-specific order management routes
- Admin-specific prescription validation/verification routes

These routes are intentionally excluded from `src/config/apiRoutes.ts` as they should only be accessed by the admin panel or backend services.

## Status

✅ **All frontend routes are properly configured and match the Postman collection.**

The `src/config/apiRoutes.ts` file contains all necessary routes for the frontend application. The Postman collection serves as comprehensive API documentation and includes admin routes that the frontend should not access.

