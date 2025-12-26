# Payment, Order & Transaction Flow - Complete Explanation

This document explains exactly how the payment, order, and transaction flow works in the frontend website.

---

## 🔄 Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    CUSTOMER JOURNEY                              │
└─────────────────────────────────────────────────────────────────┘

1. CART PAGE (/cart)
   └─> Customer adds items to cart
       └─> Items stored in CartContext

2. CHECKOUT PAGE (/checkout)
   └─> Customer fills shipping & payment info
       └─> Selects payment method (Stripe/PayPal/COD)
       └─> Clicks "Place Order"
           │
           ├─> Frontend: Checkout.tsx (handleSubmit)
           │   └─> Validates form fields
           │   └─> Maps cart items to order format
           │   └─> Calls: createOrder(orderData)
           │       │
           │       └─> API: POST /api/orders
           │           └─> Backend creates Order
           │           └─> Returns: { id, order_number, ... }
           │
           └─> IF payment_method === 'stripe':
               │
               ├─> Clear cart
               └─> Navigate to: /payment?orderId={orderId}

3. PAYMENT PAGE (/payment?orderId=123)
   └─> Page loads (Payment.tsx)
       │
       ├─> useEffect runs:
       │   ├─> Extract orderId from URL params
       │   ├─> Initialize Stripe: getStripe()
       │   └─> Create Payment Intent:
       │       └─> Calls: createPaymentIntent({ order_id, currency })
       │           │
       │           └─> API: POST /api/payments/create-intent
       │               └─> Backend creates Stripe Payment Intent
       │               └─> Returns: { client_secret, payment_intent_id }
       │
       └─> Render Stripe Elements:
           └─> <Elements stripe={stripePromise} clientSecret={clientSecret}>
               └─> <PaymentForm />
                   └─> Shows: <PaymentElement /> (card input form)

4. CUSTOMER ENTERS CARD DETAILS
   └─> Fills card number, expiry, CVC in Stripe Elements
       └─> Clicks "Pay Now"
           │
           └─> PaymentForm.handleSubmit()
               │
               ├─> Step 1: Confirm with Stripe.js
               │   └─> stripe.confirmPayment({
               │         elements,
               │         clientSecret,
               │         redirect: 'if_required' // Only if 3D Secure needed
               │       })
               │   └─> Stripe processes payment
               │   └─> Returns: { paymentIntent: { id, status } }
               │
               └─> Step 2: Confirm on Backend
                   └─> Calls: confirmPayment(paymentIntent.id)
                       │
                       └─> API: POST /api/payments/confirm
                           └─> Body: { payment_intent_id: "pi_xxx" }
                           │
                           └─> Backend:
                               ├─> Verifies payment with Stripe
                               ├─> Creates Transaction automatically
                               │   └─> type: 'payment'
                               │   └─> status: 'completed'
                               │   └─> Links to order & user
                               ├─> Updates Order payment_status → 'paid'
                               └─> Returns: { transaction_id, status }

5. SUCCESS REDIRECT
   └─> Navigate to: /customer/orders/{orderId}
       └─> OrderDetail.tsx shows:
           ├─> Order information
           ├─> Payment status: "paid"
           └─> Transaction details (if available)

6. CUSTOMER CAN VIEW:
   ├─> Orders: /customer/orders
   │   └─> GET /api/orders
   │
   └─> Transactions: /customer/transactions
       └─> GET /api/transactions
```

---

## 📁 File Structure & Code Flow

### **1. Checkout Page** (`src/pages/shop/Checkout.tsx`)

**Location in code:**
```typescript
// Line 197-348: handleSubmit function

const handleSubmit = async (e: React.FormEvent) => {
  // 1. Validate form
  // 2. Map cart items to order format
  // 3. Create order via API
  const order = await createOrder(orderData)
  
  // 4. IF Stripe payment:
  if (paymentMethod.toLowerCase() === 'stripe') {
    await clearCart()
    navigate(`/payment?orderId=${order.id}`)  // ← Redirect to payment
  }
  // ELSE: Show success for PayPal/COD
}
```

**API Call:**
```typescript
// src/services/ordersService.ts
export const createOrder = async (orderData) => {
  // POST /api/orders
  // Body: { shipping_address, billing_address, payment_method, cart_items, ... }
  // Returns: Order object with { id, order_number, ... }
}
```

---

### **2. Payment Page** (`src/pages/shop/Payment.tsx`)

**Component Structure:**
```typescript
Payment (Main Component)
  ├─> useEffect: Initialize payment
  │   ├─> Extract orderId from URL: ?orderId=123
  │   ├─> Initialize Stripe: getStripe()
  │   └─> Create Payment Intent: createPaymentIntent({ order_id: 123 })
  │
  └─> <Elements stripe={stripePromise} clientSecret={clientSecret}>
        └─> <PaymentForm orderId={123} clientSecret="pi_xxx_secret_xxx" />
              ├─> Shows: <PaymentElement /> (Stripe card form)
              └─> handleSubmit: Process payment
```

**Initialization (Lines 150-190):**
```typescript
useEffect(() => {
  // 1. Get orderId from URL
  const orderIdParam = searchParams.get('orderId')
  
  // 2. Initialize Stripe
  const stripe = await getStripe()
  setStripePromise(Promise.resolve(stripe))
  
  // 3. Create Payment Intent
  const paymentIntent = await createPaymentIntent({
    order_id: parsedOrderId,
    currency: 'USD'
  })
  
  // 4. Store client_secret for Stripe Elements
  setClientSecret(paymentIntent.client_secret)
}, [orderIdParam])
```

**API Call:**
```typescript
// src/services/paymentsService.ts
export const createPaymentIntent = async (request) => {
  // POST /api/payments/create-intent
  // Body: { order_id: 123, currency: 'USD' }
  // Returns: { client_secret: "pi_xxx_secret_xxx", payment_intent_id: "pi_xxx" }
}
```

---

### **3. Payment Form Component** (`src/pages/shop/Payment.tsx` - PaymentForm)

**Payment Processing (Lines 32-91):**
```typescript
const handleSubmit = async (e: React.FormEvent) => {
  // STEP 1: Confirm payment with Stripe.js (client-side)
  const { error, paymentIntent } = await stripe.confirmPayment({
    elements,              // Stripe Elements instance
    clientSecret,         // From payment intent
    confirmParams: {
      return_url: `${window.location.origin}/customer/orders/${orderId}`
    },
    redirect: 'if_required'  // Only redirect for 3D Secure
  })
  
  // STEP 2: Confirm payment on backend (creates transaction)
  if (paymentIntent && paymentIntent.id) {
    const confirmResult = await confirmPayment(paymentIntent.id)
    // ↑ This calls: POST /api/payments/confirm
    // Backend creates Transaction automatically
    
    // STEP 3: Redirect to order detail
    navigate(`/customer/orders/${orderId}`)
  }
}
```

**API Call:**
```typescript
// src/services/paymentsService.ts
export const confirmPayment = async (paymentIntentId: string) => {
  // POST /api/payments/confirm
  // Body: { payment_intent_id: "pi_xxx" }
  // Backend:
  //   - Verifies payment with Stripe
  //   - Creates Transaction (type: 'payment', status: 'completed')
  //   - Updates Order payment_status → 'paid'
  // Returns: { transaction_id, status, order_id }
}
```

---

## 🔐 Authentication & Security

### **Protected Routes:**
```typescript
// src/App.tsx
<Route path="/payment" element={<ProtectedRoute><Payment /></ProtectedRoute>} />
```

**ProtectedRoute checks:**
- User must be authenticated (logged in)
- User must have role: 'customer'
- If not authenticated → redirects to `/login`

### **API Authentication:**
All payment endpoints require `Bearer {{access_token}}`:
```typescript
// All API calls include:
headers: {
  'Authorization': `Bearer ${accessToken}`
}
```

---

## 📊 Data Flow

### **Order Creation:**
```
Frontend (Checkout.tsx)
  ↓
POST /api/orders
  ↓
Backend creates Order:
  - status: 'pending'
  - payment_status: 'pending'
  - user_id: (from token)
  - items: (from cart_items)
  ↓
Returns: { id: 123, order_number: 'ORD-12345', ... }
```

### **Payment Intent Creation:**
```
Frontend (Payment.tsx)
  ↓
POST /api/payments/create-intent
  Body: { order_id: 123, currency: 'USD' }
  ↓
Backend:
  - Gets order total
  - Creates Stripe Payment Intent
  - Returns client_secret
  ↓
Returns: { client_secret: "pi_xxx_secret_xxx", payment_intent_id: "pi_xxx" }
```

### **Payment Confirmation:**
```
Frontend (Payment.tsx - PaymentForm)
  ↓
1. stripe.confirmPayment() [Stripe.js]
   - Processes payment with Stripe
   - Returns: { paymentIntent: { id, status: 'succeeded' } }
  ↓
2. POST /api/payments/confirm
   Body: { payment_intent_id: "pi_xxx" }
  ↓
Backend:
  - Verifies payment with Stripe
  - Creates Transaction:
    * type: 'payment'
    * status: 'completed'
    * amount: (from order)
    * payment_method: 'stripe'
    * order_id: 123
    * user_id: (from token)
  - Updates Order:
    * payment_status: 'pending' → 'paid'
  ↓
Returns: { transaction_id: 456, status: 'completed', order_id: 123 }
```

---

## 🎯 Key Components

### **1. Checkout.tsx**
- **Purpose:** Collect shipping info and create order
- **Key Function:** `handleSubmit()` - Creates order, redirects to payment if Stripe
- **Location:** `src/pages/shop/Checkout.tsx`

### **2. Payment.tsx**
- **Purpose:** Handle Stripe payment processing
- **Key Functions:**
  - `useEffect()` - Initialize payment intent
  - `PaymentForm.handleSubmit()` - Process payment
- **Location:** `src/pages/shop/Payment.tsx`

### **3. Services:**
- **ordersService.ts** - `createOrder()` - Creates order
- **paymentsService.ts** - `createPaymentIntent()`, `confirmPayment()` - Payment operations
- **stripeService.ts** - `getStripe()` - Stripe initialization

---

## 🔄 Alternative Flows

### **PayPal Payment:**
```
Checkout → Create Order → Show Success (no payment page)
```

### **Cash on Delivery (COD):**
```
Checkout → Create Order → Show Success (no payment page)
```

### **3D Secure (Stripe):**
```
Payment Page → Enter Card → Stripe requires 3D Secure
  → Redirects to bank authentication
  → Returns to return_url
  → Backend confirms payment
```

---

## ✅ What Happens Automatically

1. **Transaction Creation:** When `confirmPayment()` is called, backend automatically creates a Transaction record
2. **Order Status Update:** Order `payment_status` is automatically updated to `'paid'`
3. **Cart Clearing:** Cart is cleared after order creation (for Stripe payments)

---

## 🐛 Error Handling

### **Order Creation Fails:**
- Shows error message
- User can retry

### **Payment Intent Creation Fails:**
- Shows error message
- User can go back to checkout

### **Payment Fails:**
- Stripe error shown to user
- User can retry payment
- Order remains with `payment_status: 'pending'`

### **Backend Confirmation Fails:**
- Payment succeeded with Stripe but backend failed
- User redirected with warning message
- Admin can manually create transaction if needed

---

## 📝 Summary

**The flow ensures:**
1. ✅ Order is created first (with `payment_status: 'pending'`)
2. ✅ Payment intent is created only when needed (Stripe payments)
3. ✅ Payment is processed securely via Stripe.js
4. ✅ Transaction is created automatically by backend
5. ✅ Order status is updated automatically
6. ✅ Customer can view orders and transactions

**All steps are authenticated and secure!**

