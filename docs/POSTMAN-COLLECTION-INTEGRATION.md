# Postman Collection Integration

This document describes how the OptyShop Postman collection is integrated with the frontend codebase.

## 📁 Collection Location

The Postman collection is located at:
- **File**: `OptyShop_API.postman_collection.json`
- **Description**: Complete API collection for OptyShop - Smart Optical E-Commerce & Simulation System

## 🔗 Integration Overview

The Postman collection serves as the **source of truth** for all API endpoints. The frontend codebase integrates with it through:

1. **API Routes Configuration** (`src/config/apiRoutes.ts`) - Maps all endpoints
2. **Service Files** (`src/services/*.ts`) - Implements API calls
3. **API Client** (`src/utils/api.ts`) - Handles HTTP requests and authentication

## 📋 Collection Structure

The Postman collection is organized into three main sections:

### 1. Website (Public) - No Auth Required
- **Auth**: Register, Login, Refresh Token
- **Products & Categories**: All GET endpoints
- **Simulations**: All calculation endpoints (PD, lens thickness, recommendations, etc.)
- **Marketing Content**: Case studies, blog, jobs (GET only)
- **Forms**: Configs and submissions (GET configs, POST submissions)
- **CMS**: Banners, Campaigns, FAQs, Pages, Testimonials
- **Coupons**: Apply coupon endpoint
- **Health**: `/health`, `/api`

### 2. Customer (Authenticated) - `Authorization: Bearer {{access_token}}`
- **Auth**: Get Current User, Update Profile, Change Password, Logout
- **Cart**: All cart operations
- **Orders**: Create, List, Get by ID, Cancel
- **Transactions**: List, Get by ID
- **Payments**: Create Intent, Confirm, Get Status
- **Prescriptions**: All CRUD operations

### 3. Admin (Authenticated) - `Authorization: Bearer {{admin_token}}`
- **Note**: Admin endpoints are **NOT** used by the frontend
- These are for backend/admin panel use only

## 🔄 Mapping Postman to Codebase

### Endpoint Mapping

| Postman Collection | Frontend Route Config | Service File |
|-------------------|----------------------|--------------|
| `/api/auth/*` | `API_ROUTES.AUTH.*` | `authService.ts` |
| `/api/products/*` | `API_ROUTES.PRODUCTS.*` | `productsService.ts` |
| `/api/categories/*` | `API_ROUTES.CATEGORIES.*` | `categoriesService.ts` |
| `/api/subcategories/*` | `API_ROUTES.SUBCATEGORIES.*` | `categoriesService.ts` |
| `/api/cart/*` | `API_ROUTES.CART.*` | `cartService.ts` |
| `/api/orders/*` | `API_ROUTES.ORDERS.*` | `ordersService.ts` |
| `/api/prescriptions/*` | `API_ROUTES.PRESCRIPTIONS.*` | `prescriptionsService.ts` |
| `/api/simulations/*` | `API_ROUTES.SIMULATIONS.*` | `simulationsService.ts` |
| `/api/blog/*` | `API_ROUTES.BLOG.*` | `blogService.ts` |
| `/api/jobs/*` | `API_ROUTES.JOBS.*` | `jobsService.ts` |
| `/api/case-studies/*` | `API_ROUTES.CASE_STUDIES.*` | `caseStudiesService.ts` |
| `/api/coupons/*` | `API_ROUTES.COUPONS.*` | `couponsService.ts` |
| `/api/forms/*` | `API_ROUTES.FORMS.*` | `formsService.ts` |
| `/api/banners` | `API_ROUTES.BANNERS.*` | `bannersService.ts` |
| `/api/campaigns` | `API_ROUTES.CAMPAIGNS.*` | `campaignsService.ts` |
| `/api/faqs` | `API_ROUTES.FAQS.*` | `faqsService.ts` |
| `/api/pages/*` | `API_ROUTES.PAGES.*` | `pagesService.ts` |
| `/api/cms/testimonials` | `API_ROUTES.CMS.TESTIMONIALS` | `testimonialsService.ts` |
| `/api/lens/*` | `API_ROUTES.LENS.*` | `lensOptionsService.ts`, `lensTreatmentsService.ts` |
| `/api/shipping-methods/*` | `API_ROUTES.SHIPPING_METHODS.*` | `shippingMethodsService.ts` |
| `/api/payments/*` | `API_ROUTES.PAYMENTS.*` | `paymentsService.ts` |
| `/api/customization/*` | `API_ROUTES.CUSTOMIZATION.*` | `customizationService.ts` |
| `/api/health` | `API_ROUTES.HEALTH.*` | `healthService.ts` |

## 🛠️ Service Files

All service files follow a consistent pattern:

```typescript
// 1. Import dependencies
import { apiClient } from '../utils/api';
import { API_ROUTES } from '../config/apiRoutes';

// 2. Define types/interfaces
export interface MyType { ... }

// 3. Implement API functions
export const getMyData = async (): Promise<MyType[]> => {
  try {
    const response = await apiClient.get<MyType[]>(
      API_ROUTES.MY_ENDPOINT.LIST,
      false // or true for authenticated endpoints
    );
    // Handle response...
  } catch (error) {
    // Handle error...
  }
};
```

## ✅ Endpoint Coverage

### Public Endpoints (Website)
- ✅ Auth: Register, Login, Refresh Token
- ✅ Products: All GET endpoints
- ✅ Categories: All GET endpoints
- ✅ Subcategories: All GET endpoints
- ✅ Simulations: All calculation endpoints
- ✅ Blog: List, Get by Slug
- ✅ Jobs: List, Get by ID
- ✅ Case Studies: List, Get by Slug
- ✅ Forms: All config and submission endpoints
- ✅ CMS: Banners, Campaigns, FAQs, Pages, Testimonials
- ✅ Coupons: Apply
- ✅ Lens Options & Treatments: All GET endpoints
- ✅ Shipping Methods: All GET endpoints
- ✅ Product Customization: All endpoints
- ✅ Health: Check, API Info

### Authenticated Endpoints (Customer)
- ✅ Auth: Get Current User, Update Profile, Change Password, Logout
- ✅ Cart: All operations
- ✅ Orders: Create, List, Get by ID, Cancel
- ✅ Transactions: List, Get by ID
- ✅ Payments: Create Intent, Confirm, Get Status
- ✅ Prescriptions: All CRUD operations

### Admin Endpoints
- ❌ **Not integrated** (intentionally excluded from frontend)

## 🔍 Validation

To ensure the Postman collection stays in sync with the codebase:

1. **Check Route Coverage**: All Postman endpoints should have corresponding routes in `apiRoutes.ts`
2. **Check Service Coverage**: All routes should have corresponding service functions
3. **Check Type Definitions**: All API responses should have TypeScript interfaces

## 📝 Usage Example

### Using a Service

```typescript
import { getBlogArticles, getBlogArticleBySlug } from '../services/blogService';

// Get all blog articles
const articles = await getBlogArticles({ page: 1, limit: 10 });

// Get a specific article
const article = await getBlogArticleBySlug('my-article-slug');
```

### Using Auth Service

```typescript
import { login, register, getCurrentUser } from '../services/authService';

// Login
const response = await login({ email: 'user@example.com', password: 'password' });
if (response.success) {
  localStorage.setItem('access_token', response.data.token);
  localStorage.setItem('refresh_token', response.data.refreshToken);
}

// Get current user
const userResponse = await getCurrentUser();
if (userResponse.success) {
  console.log('Current user:', userResponse.data);
}
```

## 🔄 Updating the Integration

When the Postman collection is updated:

1. **Review Changes**: Check what endpoints were added/modified/removed
2. **Update Routes**: Add new routes to `src/config/apiRoutes.ts`
3. **Update Services**: Add new service functions or update existing ones
4. **Update Types**: Add/update TypeScript interfaces as needed
5. **Test**: Verify all endpoints work correctly

## 📚 Related Documentation

- [API Integration Documentation](./API-INTEGRATION.md)
- [API Routes Configuration](../src/config/apiRoutes.ts)
- [API Client Utility](../src/utils/api.ts)

## 🎯 Best Practices

1. **Always use service files** - Don't call `apiClient` directly from components
2. **Use TypeScript types** - Define interfaces for all API responses
3. **Handle errors gracefully** - All service functions should handle errors
4. **Follow naming conventions** - Service functions should match Postman request names
5. **Document changes** - Update this document when adding new endpoints

