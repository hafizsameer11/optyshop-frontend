# API Integration Documentation

This document describes how the frontend integrates with the OptyShop backend API.

## Postman Collection

The complete API collection is available in `OptyShop-API.postman_collection.json`. This collection includes:

- **Website (Public)**: All public endpoints that don't require authentication
- **Customer (Authenticated)**: Customer-specific endpoints requiring `access_token`
- **Admin**: Admin endpoints requiring `admin_token` (not used by frontend)

## Frontend API Routes Configuration

The frontend API routes are defined in `src/config/apiRoutes.ts`. This file contains all the routes used by the frontend application.

### Authentication Strategy

#### Public Routes (No Auth Required)
- Auth: Register, Login, Refresh Token
- Products & Categories: All GET endpoints
- Simulations: All calculation endpoints
- Marketing Content: Case studies, blog, jobs
- Forms: Configs and submissions
- CMS: Banners, Campaigns, FAQs, Pages, Testimonials
- Coupons: Apply coupon endpoint

#### Customer Routes (Requires `access_token`)
- Auth: Get Current User, Update Profile, Change Password, Logout
- Cart: All cart operations
- Orders: Create, List, Get by ID, Cancel
- Prescriptions: All CRUD operations

### Important Notes

1. **Admin Routes**: The frontend should NEVER call admin routes (`/api/admin/*`). These are only for backend/admin panel use.

2. **Base URL**: Configured via `VITE_API_BASE_URL` environment variable (defaults to `https://optyshop-frontend.hmstech.org/api`)

3. **Token Management**: 
   - Access tokens stored in `localStorage` as `access_token`
   - Refresh tokens stored in `localStorage` as `refresh_token`
   - Automatic token refresh handled by `apiClient` in `src/utils/api.ts`

## Using the API Routes

```typescript
import { API_ROUTES } from '../config/apiRoutes';
import { apiClient } from '../utils/api';

// Public endpoint
const products = await apiClient.get(API_ROUTES.PRODUCTS.LIST);

// Authenticated endpoint
const cart = await apiClient.get(API_ROUTES.CART.GET, true);
```

## Testing with Postman

1. Import `OptyShop-API.postman_collection.json` into Postman
2. Set the `base_url` variable to your backend URL (default: `http://localhost:5000`)
3. For authenticated requests, first login to get tokens, then set `access_token` or `admin_token` variables

## API Client

The `apiClient` utility (`src/utils/api.ts`) handles:
- Automatic token injection for authenticated requests
- Token refresh on 401 errors
- Error handling and response formatting
- Network error detection

