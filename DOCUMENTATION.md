# OptiShop - System Documentation

## Table of Contents
1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Complete System Flow](#complete-system-flow)
4. [Manual Implementation Guide](#manual-implementation-guide)
5. [Key Features & Components](#key-features--components)
6. [Data Flow](#data-flow)
7. [Technology Stack](#technology-stack)

---

## Overview

OptiShop is a modern e-commerce platform specializing in eyewear (glasses and sunglasses) with advanced features including:
- Virtual Try-On using MediaPipe Face Mesh
- 3D Product Viewer
- Shopping Cart & Checkout
- Product Catalog Management
- Blog & Resources
- User Authentication (UI only)

---

## System Architecture

### Frontend Structure
```
src/
├── components/          # Reusable UI components
│   ├── home/           # Home page sections
│   ├── products/       # Product-specific components
│   ├── solutions/      # Solution pages components
│   ├── resources/      # Blog, case studies, etc.
│   ├── shop/           # Shopping cart components
│   └── whoWeAre/       # Company information
├── pages/              # Route pages
├── context/            # React Context (Cart)
├── data/               # Static data files
└── main.tsx           # Application entry point
```

### Key Technologies
- **React 19.2.0** - UI Framework
- **TypeScript** - Type Safety
- **React Router DOM 7.10.1** - Routing
- **Tailwind CSS 4.1.17** - Styling
- **MediaPipe Face Mesh** - Face detection for virtual try-on
- **Three.js** - 3D rendering (imported but CSS-based 3D used)
- **Vite** - Build tool

---

## Complete System Flow

### 1. Application Initialization Flow

```
1. User opens application
   ↓
2. main.tsx loads
   ↓
3. CartProvider wraps App component
   ↓
4. CartProvider loads cart from localStorage
   ↓
5. App.tsx sets up React Router
   ↓
6. Navbar component renders with navigation
   ↓
7. Route matching determines which page to display
```

### 2. Home Page Flow

```
User visits "/"
   ↓
Home.tsx component loads
   ↓
Renders sections in order:
   - Hero (main banner)
   - TrustedBrands (brand logos)
   - StatsHighlight (statistics)
   - LiveDemoSection (virtual try-on trigger)
   - Testimonials
   - PurchasingJourneySection
   - UltraRealisticSection
   - Viewer3DSection
   - CompatibilitySection
   ↓
Footer renders
```

### 3. Virtual Try-On Flow

```
User clicks "Try Now" or "Live Demo"
   ↓
VirtualTryOnModal opens
   ↓
Camera permission requested
   ↓
MediaPipe Face Mesh initializes:
   - Loads face detection model from CDN
   - Sets up camera stream (640x480)
   - Configures detection confidence (0.6)
   ↓
Video stream starts
   ↓
For each video frame:
   1. Face Mesh processes frame
   2. Detects face landmarks (468 points)
   3. Identifies eye positions:
      - Left eye corner (landmark 33)
      - Right eye corner (landmark 263)
      - Nose position (landmark 1)
   4. Calculates:
      - Eye center position
      - Eye distance (for frame sizing)
      - Rotation angle
   5. Draws frame image on canvas:
      - Positioned at eye center
      - Scaled based on eye distance
      - Rotated to match face angle
   ↓
User can switch frames
   ↓
User closes modal → Camera stops
```

### 4. Shopping Flow

#### 4.1 Product Browsing
```
User navigates to "/shop"
   ↓
Products.tsx loads
   ↓
Fetches products from productsData.ts
   ↓
User can:
   - Filter by category (all/eyeglasses/sunglasses/sports)
   - Search by name or brand
   ↓
Filtered products display in grid
   ↓
User clicks product → Can view details
```

#### 4.2 Add to Cart Flow
```
User clicks "Add to Cart" on product
   ↓
handleAddToCart() called
   ↓
addToCart() from CartContext:
   1. Checks if product already in cart
   2. If exists: Increment quantity
   3. If new: Add product with quantity 1
   ↓
Cart state updates
   ↓
useEffect saves cart to localStorage
   ↓
CartIcon updates badge count
```

#### 4.3 Cart Management Flow
```
User navigates to "/cart"
   ↓
Cart.tsx loads
   ↓
Retrieves cartItems from CartContext
   ↓
Displays:
   - Product list with images
   - Quantity controls (+/-)
   - Remove item button
   - Total price calculation
   ↓
User can:
   - Update quantities
   - Remove items
   - Proceed to checkout
```

#### 4.4 Checkout Flow
```
User clicks "Proceed to Checkout"
   ↓
Navigates to "/checkout"
   ↓
Checkout.tsx loads
   ↓
User fills form:
   - Shipping Information
   - Payment Information
   ↓
User submits form
   ↓
handleSubmit():
   1. Validates form data
   2. Simulates payment processing (2s delay)
   3. Sets isCompleted = true
   4. clearCart() called
   ↓
Success page displays
   ↓
Cart cleared from localStorage
```

### 5. Navigation Flow

```
Navbar component:
   ↓
Desktop Navigation:
   - Hover over menu items
   - Dropdowns appear
   - Click to navigate
   ↓
Mobile Navigation:
   - Hamburger menu toggle
   - Accordion-style sections
   - Click to expand/collapse
   ↓
Cart Icon:
   - Shows item count badge
   - Click to navigate to /cart
```

### 6. Product Pages Flow

```
User navigates to product page (e.g., "/virtual-test")
   ↓
Product page component loads
   ↓
Renders multiple sections:
   - HeroSection
   - FeaturesSection
   - DemoSection (if applicable)
   - FAQSection (if applicable)
   - Other relevant sections
   ↓
User can interact with:
   - Demo buttons
   - Contact forms
   - Feature highlights
```

### 7. Blog & Resources Flow

```
User navigates to "/blog"
   ↓
Blog.tsx loads
   ↓
Fetches articles from blogData.ts
   ↓
Displays:
   - Filter options
   - Article grid
   - Pagination (if implemented)
   ↓
User clicks article
   ↓
Navigates to "/blog/:slug"
   ↓
BlogDetail.tsx loads
   ↓
Finds article by slug
   ↓
Renders full article content
```

### 8. Authentication Flow (UI Only)

```
User navigates to "/login"
   ↓
Login.tsx loads
   ↓
User enters:
   - Email
   - Password
   ↓
Form validation:
   - Email format check
   - Password length (min 6 chars)
   ↓
handleSubmit():
   - Currently only logs to console
   - No backend integration
   ↓
User can navigate to "/register"
   ↓
Similar flow for registration
```

---

## Manual Implementation Guide

### Things That Can Be Implemented Manually

#### 1. Backend Integration

**Current State:** No backend API integration
**Manual Implementation Required:**

- **User Authentication**
  - Create backend API endpoints:
    - `POST /api/auth/login` - User login
    - `POST /api/auth/register` - User registration
    - `POST /api/auth/logout` - User logout
    - `GET /api/auth/me` - Get current user
  - Implement JWT token management
  - Add token storage in localStorage/sessionStorage
  - Create AuthContext to manage user state
  - Add protected routes
  - Implement password reset functionality

- **Product Management**
  - Create API endpoints:
    - `GET /api/products` - List all products
    - `GET /api/products/:id` - Get product details
    - `POST /api/products` - Create product (admin)
    - `PUT /api/products/:id` - Update product (admin)
    - `DELETE /api/products/:id` - Delete product (admin)
  - Replace static `productsData.ts` with API calls
  - Add product search/filter API
  - Implement pagination
  - Add product image upload

- **Shopping Cart Backend**
  - Create API endpoints:
    - `GET /api/cart` - Get user's cart
    - `POST /api/cart` - Add item to cart
    - `PUT /api/cart/:itemId` - Update cart item
    - `DELETE /api/cart/:itemId` - Remove cart item
    - `DELETE /api/cart` - Clear cart
  - Sync cart with backend instead of localStorage only
  - Implement cart persistence across devices
  - Add cart expiration logic

- **Order Management**
  - Create API endpoints:
    - `POST /api/orders` - Create order
    - `GET /api/orders` - Get user orders
    - `GET /api/orders/:id` - Get order details
    - `PUT /api/orders/:id/status` - Update order status
  - Integrate payment gateway (Stripe, PayPal, etc.)
  - Implement order confirmation emails
  - Add order tracking
  - Create order history page

#### 2. Payment Processing

**Current State:** Simulated payment (2-second delay)
**Manual Implementation Required:**

- **Payment Gateway Integration**
  - Choose payment provider (Stripe, PayPal, Square, etc.)
  - Create payment intent on backend
  - Implement secure payment form
  - Handle payment confirmation
  - Process refunds if needed
  - Add payment method storage (optional)

- **Order Processing**
  - Create order record in database
  - Generate order number
  - Send confirmation email
  - Update inventory
  - Notify fulfillment team

#### 3. User Account Management

**Current State:** Login/Register UI only
**Manual Implementation Required:**

- **User Profile**
  - Create profile page
  - Add profile editing
  - Implement address management
  - Add saved payment methods
  - Create order history view

- **Account Features**
  - Wishlist functionality
  - Saved addresses
  - Order tracking
  - Review/rating system
  - Account settings

#### 4. Product Management System

**Current State:** Static product data
**Manual Implementation Required:**

- **Admin Dashboard**
  - Create admin authentication
  - Build product CRUD interface
  - Add bulk product import
  - Implement inventory management
  - Add product categories management
  - Create discount/coupon system

- **Product Features**
  - Product variants (size, color, etc.)
  - Stock management
  - Price management
  - Product reviews system
  - Related products suggestions

#### 5. Content Management System (CMS)

**Current State:** Static blog/case study data
**Manual Implementation Required:**

- **Blog Management**
  - Create blog editor interface
  - Add image upload for blog posts
  - Implement categories/tags
  - Add SEO metadata management
  - Create blog scheduling

- **Case Studies Management**
  - Create case study editor
  - Add file uploads (PDFs, images)
  - Implement filtering/search
  - Add download tracking

#### 6. Email System

**Current State:** No email functionality
**Manual Implementation Required:**

- **Email Services**
  - Set up email service (SendGrid, Mailgun, AWS SES)
  - Create email templates
  - Implement:
    - Order confirmation emails
    - Shipping notifications
    - Password reset emails
    - Newsletter subscriptions
    - Abandoned cart reminders

#### 7. Analytics & Tracking

**Current State:** No analytics
**Manual Implementation Required:**

- **Analytics Integration**
  - Add Google Analytics
  - Implement event tracking:
    - Product views
    - Add to cart events
    - Checkout starts
    - Purchase completions
  - Create admin dashboard with metrics
  - Add user behavior tracking

#### 8. Search Functionality

**Current State:** Basic client-side search
**Manual Implementation Required:**

- **Advanced Search**
  - Implement full-text search (Elasticsearch, Algolia)
  - Add search suggestions/autocomplete
  - Implement search filters
  - Add search result ranking
  - Create search analytics

#### 9. Image Optimization

**Current State:** Direct image usage
**Manual Implementation Required:**

- **Image Management**
  - Implement image CDN (Cloudinary, AWS S3)
  - Add image optimization/resizing
  - Implement lazy loading
  - Add responsive image variants
  - Create image upload interface

#### 10. Virtual Try-On Enhancements

**Current State:** Basic face detection with static frames
**Manual Implementation Required:**

- **Advanced Features**
  - Add more frame models (3D models)
  - Implement frame size recommendations
  - Add face shape analysis
  - Create frame comparison feature
  - Implement try-on history
  - Add social sharing of try-on results

#### 11. 3D Viewer Enhancements

**Current State:** CSS-based 3D rotation
**Manual Implementation Required:**

- **3D Model Integration**
  - Load actual 3D models (GLTF/GLB)
  - Implement Three.js scene setup
  - Add lighting controls
  - Implement zoom/pan controls
  - Add frame material customization
  - Create AR preview (WebXR)

#### 12. Inventory Management

**Current State:** Simple inStock boolean
**Manual Implementation Required:**

- **Stock Management**
  - Real-time inventory tracking
  - Low stock alerts
  - Backorder management
  - Multi-warehouse support
  - Stock synchronization

#### 13. Shipping Integration

**Current State:** Free shipping (hardcoded)
**Manual Implementation Required:**

- **Shipping Features**
  - Integrate shipping APIs (FedEx, UPS, USPS)
  - Calculate shipping costs
  - Add shipping method selection
  - Implement address validation
  - Add tracking number integration

#### 14. Multi-language Support

**Current State:** English only
**Manual Implementation Required:**

- **Internationalization**
  - Add i18n library (react-i18next)
  - Create translation files
  - Implement language switcher
  - Add RTL support if needed
  - Localize dates/numbers/currency

#### 15. SEO Optimization

**Current State:** Basic meta tags
**Manual Implementation Required:**

- **SEO Features**
  - Dynamic meta tags per page
  - Open Graph tags
  - Structured data (JSON-LD)
  - Sitemap generation
  - robots.txt configuration
  - Canonical URLs

#### 16. Performance Optimization

**Current State:** Basic optimization
**Manual Implementation Required:**

- **Performance Improvements**
  - Implement code splitting
  - Add service workers (PWA)
  - Optimize bundle size
  - Implement caching strategies
  - Add preloading/prefetching
  - Optimize images (WebP, AVIF)

#### 17. Security Enhancements

**Current State:** Basic security
**Manual Implementation Required:**

- **Security Features**
  - Implement CSRF protection
  - Add rate limiting
  - Implement input sanitization
  - Add XSS protection
  - Implement secure session management
  - Add security headers

#### 18. Testing

**Current State:** No tests
**Manual Implementation Required:**

- **Test Suite**
  - Unit tests (Jest, Vitest)
  - Integration tests
  - E2E tests (Playwright, Cypress)
  - Component tests (React Testing Library)
  - Visual regression tests

#### 19. Error Handling & Logging

**Current State:** Basic error handling
**Manual Implementation Required:**

- **Error Management**
  - Implement error boundary components
  - Add error logging service (Sentry)
  - Create error reporting dashboard
  - Implement user-friendly error messages
  - Add retry mechanisms

#### 20. Admin Panel

**Current State:** No admin interface
**Manual Implementation Required:**

- **Admin Features**
  - Create admin dashboard
  - Add user management
  - Implement role-based access control
  - Create analytics dashboard
  - Add system configuration
  - Implement audit logs

---

## Key Features & Components

### 1. Cart Context (`CartContext.tsx`)

**Purpose:** Global state management for shopping cart

**Features:**
- Add/remove items
- Update quantities
- Calculate totals
- Persist to localStorage
- Auto-sync on mount

**Methods:**
- `addToCart(product)` - Add product to cart
- `removeFromCart(productId)` - Remove product
- `updateQuantity(productId, quantity)` - Update quantity
- `clearCart()` - Empty cart
- `getTotalPrice()` - Calculate total
- `getTotalItems()` - Count items

### 2. Virtual Try-On (`VirtualTryOnModal.tsx`)

**Technology:** MediaPipe Face Mesh

**Process:**
1. Initialize camera stream
2. Load Face Mesh model
3. Process video frames
4. Detect face landmarks
5. Calculate frame position/size
6. Render frame on canvas

**Key Landmarks:**
- Left eye corner: 33
- Right eye corner: 263
- Nose tip: 1

### 3. Product Catalog (`productsData.ts`)

**Structure:**
```typescript
interface Product {
  id: number
  name: string
  brand: string
  category: 'eyeglasses' | 'sunglasses' | 'sports'
  price: number
  image: string
  description: string
  inStock: boolean
  rating?: number
}
```

### 4. Routing (`App.tsx`)

**Routes:**
- `/` - Home
- `/shop` - Products
- `/cart` - Shopping cart
- `/checkout` - Checkout
- `/virtual-test` - Virtual try-on product page
- `/digital-frames` - Digital frames product page
- `/3d-viewer` - 3D viewer product page
- `/blog` - Blog listing
- `/blog/:slug` - Blog detail
- `/login` - Login page
- `/register` - Registration page
- And many more...

### 5. Navigation (`Navbar.tsx`)

**Features:**
- Responsive design (mobile/desktop)
- Dropdown menus
- Cart icon with badge
- Smooth scrolling to sections
- Active route highlighting

---

## Data Flow

### Cart Data Flow

```
User Action
   ↓
Component calls useCart() hook
   ↓
CartContext updates state
   ↓
useEffect triggers
   ↓
localStorage updated
   ↓
All components using cart re-render
   ↓
CartIcon badge updates
```

### Product Data Flow

```
Page Load
   ↓
Component imports productsData.ts
   ↓
Products array loaded
   ↓
Filtering/search applied
   ↓
Filtered products rendered
   ↓
User interaction (filter/search)
   ↓
State updates
   ↓
Re-filter products
   ↓
Re-render
```

### Virtual Try-On Data Flow

```
Modal Opens
   ↓
Camera permission requested
   ↓
MediaPipe Face Mesh loads
   ↓
Camera stream starts
   ↓
Frame captured
   ↓
Face Mesh processes frame
   ↓
Landmarks detected
   ↓
Frame position calculated
   ↓
Canvas updated
   ↓
Repeat for each frame
```

---

## Technology Stack

### Frontend
- **React 19.2.0** - UI library
- **TypeScript 5.9.3** - Type safety
- **React Router DOM 7.10.1** - Routing
- **Tailwind CSS 4.1.17** - Styling
- **Vite 7.2.4** - Build tool

### Libraries
- **@mediapipe/face_mesh** - Face detection
- **@mediapipe/camera_utils** - Camera handling
- **three** - 3D graphics (imported, CSS-based 3D used)

### Development
- **ESLint** - Linting
- **TypeScript ESLint** - Type checking

---

## File Structure Details

### Components Organization

```
components/
├── home/                    # Home page sections
│   ├── Hero.tsx
│   ├── VirtualTryOnModal.tsx
│   ├── LiveDemoSection.tsx
│   └── ...
├── products/                # Product-specific components
│   ├── VirtualTest/
│   ├── DigitalFrames/
│   ├── Viewer3D/
│   └── ...
├── shop/                    # Shopping components
│   └── CartHeroSection.tsx
├── solutions/               # Solution pages
│   ├── ecommerce/
│   ├── drivetostore/
│   └── ...
└── resources/              # Blog, case studies
    ├── Blog/
    ├── CaseStudies/
    └── ...
```

### Pages Organization

```
pages/
├── Home.tsx
├── shop/
│   ├── Products.tsx
│   ├── Cart.tsx
│   └── Checkout.tsx
├── products/
│   ├── VirtualTest.tsx
│   ├── DigitalFrames.tsx
│   └── ...
├── auth/
│   ├── Login.tsx
│   └── Register.tsx
└── ...
```

### Data Files

```
data/
├── productsData.ts      # Product catalog
├── blogData.ts          # Blog articles
├── caseStudiesData.ts   # Case studies
└── contactFormConfig.ts # Contact form config
```

---

## Development Workflow

### Running the Application

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

### Adding New Features

1. Create component in appropriate folder
2. Add route in `App.tsx` if needed
3. Update navigation in `Navbar.tsx` if needed
4. Add data to appropriate data file if needed
5. Test functionality
6. Update documentation

---

## Notes

- **No Backend:** All data is currently static or stored in localStorage
- **No Real Payments:** Checkout simulates payment processing
- **No Real Authentication:** Login/Register are UI-only
- **MediaPipe CDN:** Face Mesh loads from jsdelivr CDN
- **Local Storage:** Cart persists in browser localStorage
- **Responsive Design:** Mobile-first approach with Tailwind CSS

---

## Future Enhancements

1. Backend API integration
2. Real payment processing
3. User authentication system
4. Admin dashboard
5. Email notifications
6. Advanced analytics
7. PWA capabilities
8. Multi-language support
9. Advanced 3D models
10. AR try-on features

---

## Conclusion

This documentation provides a comprehensive overview of the OptiShop system, including:
- Complete system flows for all major features
- Detailed manual implementation guide
- Architecture and data flow explanations
- Technology stack information

Use this document as a reference for understanding the system and planning future enhancements.

