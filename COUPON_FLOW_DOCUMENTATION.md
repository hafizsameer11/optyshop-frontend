# Coupon Integration Flow Documentation

## Overview
The coupon system allows customers to apply discount codes during checkout. Coupons can be applied in three places:
1. **Cart Page** (`src/pages/shop/Cart.tsx`)
2. **Checkout Page** (`src/pages/shop/Checkout.tsx`)
3. **Product Checkout Modal** (`src/components/shop/ProductCheckout.tsx`)

## API Endpoint

### Apply Coupon
- **Endpoint**: `POST /api/coupons/apply`
- **Type**: PUBLIC (may require auth for user-specific limits)
- **Request Body**:
```json
{
  "code": "SAVE20",
  "subtotal": 150.00,
  "cartItems": [
    {
      "product_id": 123,
      "quantity": 1,
      "unit_price": 150.00
    }
  ]
}
```

- **Response**:
```json
{
  "success": true,
  "data": {
    "discount_amount": 30.00,
    "discount_type": "percentage",
    "discount_value": 20,
    "final_total": 120.00,
    "original_total": 150.00
  }
}
```

## Flow Diagram

```
User enters coupon code
    ↓
Click "Apply" button
    ↓
Frontend validates (code not empty)
    ↓
Calculate cart subtotal
    ↓
Build cart items array
    ↓
POST /api/coupons/apply
    ↓
Backend validates coupon:
  - Code exists and is active
  - Not expired
  - Meets minimum order requirements
  - User hasn't exceeded usage limit
  - Applies to cart items
    ↓
Backend calculates discount
    ↓
Returns discount details
    ↓
Frontend updates UI:
  - Shows applied coupon badge
  - Displays discount amount
  - Updates final total
    ↓
User proceeds to checkout
    ↓
Coupon code included in order creation
    ↓
Backend validates coupon again during order creation
    ↓
Order created with discount applied
```

## Implementation Details

### 1. Cart Page (`src/pages/shop/Cart.tsx`)

**State Management:**
- `couponCode`: User-entered coupon code
- `appliedCoupon`: Coupon discount details from API
- `isApplyingCoupon`: Loading state
- `couponError`: Error message if coupon is invalid

**Functions:**
- `handleApplyCoupon()`: 
  - Validates coupon code
  - Calculates subtotal from cart items
  - Calls `applyCoupon()` service
  - Updates state with discount details
  
- `handleRemoveCoupon()`:
  - Clears coupon code and discount
  - Resets totals

**UI Location:**
- Order Summary section
- Before shipping method selection
- Shows input field or applied coupon badge

**Total Calculation:**
```javascript
const getSubtotal = () => {
  if (appliedCoupon) {
    return appliedCoupon.final_total
  }
  return getTotalPrice()
}

const getFinalTotal = () => {
  const subtotal = getSubtotal()
  const shipping = selectedShippingMethod?.price || 0
  return subtotal + shipping
}
```

### 2. Checkout Page (`src/pages/shop/Checkout.tsx`)

**Similar to Cart Page:**
- Same state management
- Same coupon handlers
- Same UI structure

**Order Creation:**
- Coupon code passed in order payload:
```javascript
const orderPayload = {
  // ... other fields
  coupon_code: appliedCoupon ? couponCode : undefined
}
```

### 3. Product Checkout Modal (`src/components/shop/ProductCheckout.tsx`)

**State Management:**
- Same as Cart/Checkout pages

**Coupon Application:**
- Calculates subtotal from `orderSummary` (product + lens options + coatings + treatments)
- Builds cart items array with single product
- Applies coupon to the total customization price

**UI Location:**
- Order Summary section (left column)
- Before Payment Method selection
- After Shipping Method selection

**Total Calculation:**
```javascript
const getSubtotal = () => {
  return orderSummary
    .filter(item => item.type !== 'shipping')
    .reduce((sum, item) => sum + (Number(item.price) || 0), 0)
}

const getFinalTotal = () => {
  const subtotal = getSubtotal()
  const discount = getDiscountAmount()
  const shipping = selectedShippingMethod?.price || 0
  
  if (appliedCoupon) {
    return appliedCoupon.final_total + shipping
  }
  
  return subtotal - discount + shipping
}
```

**Order Creation:**
- Coupon code included in `orderPayload`:
```javascript
const orderPayload = {
  // ... other fields
  coupon_code: appliedCoupon ? couponCode : undefined
}
```

## Service Layer (`src/services/couponsService.ts`)

**Function: `applyCoupon()`**
- Takes: code, subtotal, cartItems
- Returns: `CouponDiscount | null`
- Handles API communication
- Converts code to uppercase
- Returns null on error

**Types:**
```typescript
interface CouponDiscount {
  discount_amount: number
  discount_type?: 'percentage' | 'fixed'
  discount_value?: number
  final_total: number
  original_total: number
}

interface CartItemForCoupon {
  product_id: number
  quantity: number
  unit_price: number
}
```

## Order Creation Integration

### Authenticated Users (`createOrder`)
```javascript
const orderPayload = {
  cart_items: [...],
  shipping_address: {...},
  billing_address: {...},
  payment_method: 'stripe',
  shipping_method_id: 1,
  coupon_code: appliedCoupon ? couponCode : undefined
}
```

### Guest Users (`createGuestOrder`)
```javascript
const guestOrderData = {
  ...orderPayload,
  first_name: '...',
  last_name: '...',
  email: '...',
  // ... other customer fields
  coupon_code: appliedCoupon ? couponCode : undefined
}
```

## Backend Validation

The backend validates coupons at two stages:

1. **During Application** (`POST /api/coupons/apply`):
   - Checks if coupon exists
   - Validates expiration date
   - Checks minimum order amount
   - Validates usage limits (per user, total uses)
   - Calculates discount

2. **During Order Creation** (`POST /api/orders`):
   - Re-validates coupon (prevents race conditions)
   - Ensures coupon still valid
   - Applies discount to order total
   - Records coupon usage

## Error Handling

**Common Errors:**
- "Please enter a coupon code" - Empty input
- "Invalid or expired coupon code" - API returns null
- Backend validation errors shown to user

**UI Feedback:**
- Loading state: "..." on Apply button
- Success: Green badge with checkmark
- Error: Red error message below input
- Remove button: Allows clearing coupon

## User Experience Flow

1. **User views cart/checkout**
2. **Sees "Have a coupon code?" section**
3. **Enters coupon code** (auto-uppercase)
4. **Clicks "Apply" or presses Enter**
5. **Loading indicator shows**
6. **If valid:**
   - Green badge appears: "COUPONCODE Applied"
   - Discount shown in order summary
   - Total updated
   - Remove button available
7. **If invalid:**
   - Red error message
   - No discount applied
   - Can try again
8. **Proceeds to checkout**
9. **Coupon code sent with order**
10. **Backend validates and applies discount**

## Testing Checklist

- [ ] Apply valid coupon code
- [ ] Apply invalid coupon code (shows error)
- [ ] Apply expired coupon (shows error)
- [ ] Remove applied coupon
- [ ] Apply coupon, then change cart items (recalculate)
- [ ] Apply coupon in Cart, proceed to Checkout (coupon persists)
- [ ] Apply coupon in Product Checkout Modal
- [ ] Create order with coupon (verify discount in order)
- [ ] Create order without coupon (no discount)
- [ ] Test with different discount types (percentage, fixed)
- [ ] Test minimum order amount requirement
- [ ] Test usage limits (per user, total)

## Notes

- Coupon codes are case-insensitive (converted to uppercase)
- Discount is calculated on subtotal (before shipping)
- Shipping is added after discount
- Coupon must be re-applied if cart changes significantly
- Backend has final authority on coupon validation
- Coupon usage is tracked per user and globally

