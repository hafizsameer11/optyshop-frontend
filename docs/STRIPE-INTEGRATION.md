# Stripe Payment Integration Guide

This document explains how Stripe payment processing is integrated into OptyShop.

## Overview

Stripe is integrated as the primary payment gateway for processing customer payments. The integration follows Stripe's recommended security practices by handling sensitive payment data on the client side using Stripe Elements.

## Architecture

```
Frontend (React)
    ↓
Stripe Elements (Secure Payment Form)
    ↓
Stripe.js (@stripe/stripe-js)
    ↓
Backend API (Payment Intent Creation)
    ↓
Stripe API (Payment Processing)
```

## Setup

### 1. Environment Variables

Create a `.env` file in the root directory:

```env
# Stripe Configuration
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...  # Your Stripe publishable key
```

**Important:**
- Use `pk_test_...` for development/testing
- Use `pk_live_...` for production
- Never commit your secret keys to version control
- Add `.env` to `.gitignore`

### 2. Install Dependencies

Stripe is already included in `package.json`:
```json
"@stripe/stripe-js": "^8.5.3"
```

If you need to reinstall:
```bash
npm install @stripe/stripe-js
```

## Frontend Implementation

### Stripe Service (`src/services/stripeService.ts`)

The Stripe service provides:

1. **Initialization**: `initializeStripe()` - Loads Stripe with publishable key
2. **Payment Processing**: `processPayment()` - Confirms payment with Stripe
3. **Configuration Check**: `isStripeAvailable()` - Checks if Stripe is configured

### Usage Example

```typescript
import { initializeStripe, processPayment } from '../services/stripeService';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

// Initialize Stripe
const stripe = await initializeStripe();

// In your checkout component
const { stripe, elements } = useStripe();

// Process payment
const result = await processPayment(elements, clientSecret);
```

## Backend Integration

### Payment Flow

1. **Create Payment Intent** (Backend)
   ```
   POST /api/payments/create-intent
   {
     "amount": 19999,  // Amount in cents
     "currency": "usd",
     "order_id": 123,
     "metadata": { ... }
   }
   ```

2. **Response** (Backend)
   ```json
   {
     "clientSecret": "pi_xxx_secret_xxx",
     "paymentIntentId": "pi_xxx"
   }
   ```

3. **Confirm Payment** (Frontend)
   - Uses Stripe Elements to collect payment details
   - Calls `stripe.confirmPayment()` with client secret
   - Handles 3D Secure if required

4. **Transaction Creation** (Backend)
   - Backend creates transaction record
   - Updates order payment status
   - Stores gateway response

## Integration with Checkout

The checkout process should:

1. Initialize Stripe when checkout page loads
2. Create payment intent when user submits order
3. Show Stripe Elements payment form
4. Process payment when user confirms
5. Handle success/error states
6. Redirect to order confirmation

## Security Best Practices

✅ **Implemented:**
- Publishable key only (never secret key in frontend)
- Stripe Elements for secure card input
- Client-side payment confirmation
- HTTPS required for production

⚠️ **Backend Must:**
- Validate payment amounts
- Verify payment intent status
- Store transaction records
- Handle webhooks for payment status updates

## Testing

### Test Cards

Use Stripe's test cards:

- **Success**: `4242 4242 4242 4242`
- **3D Secure**: `4000 0025 0000 3155`
- **Decline**: `4000 0000 0000 0002`

### Test Mode

1. Use test publishable key: `pk_test_...`
2. Use test mode in Stripe Dashboard
3. Monitor test transactions in Stripe Dashboard

## Error Handling

The service handles:
- Missing publishable key
- Stripe initialization errors
- Payment confirmation errors
- Network errors
- 3D Secure authentication

## Transaction Tracking

After successful payment:
1. Backend creates transaction record
2. Transaction includes:
   - `gateway_transaction_id`: Stripe payment intent ID
   - `gateway_response`: Full Stripe response
   - `status`: `completed`
   - `type`: `payment`
3. Frontend displays transaction in customer dashboard

## Next Steps

1. **Backend API**: Create payment intent endpoint
2. **Checkout Integration**: Add Stripe Elements to checkout page
3. **Error Handling**: Add user-friendly error messages
4. **Success Flow**: Redirect to order confirmation
5. **Webhooks**: Set up Stripe webhooks for payment status updates

## Resources

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Elements](https://stripe.com/docs/payments/elements)
- [Stripe React Integration](https://stripe.com/docs/stripe-js/react)
- [Stripe Testing](https://stripe.com/docs/testing)

