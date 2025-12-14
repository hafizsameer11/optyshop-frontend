# How the API Integration Works

This document explains how the lens customization and payment API integration works end-to-end.

## 📋 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Data Flow](#data-flow)
3. [API Routes Layer](#api-routes-layer)
4. [Services Layer](#services-layer)
5. [React Hook Layer](#react-hook-layer)
6. [Component Usage](#component-usage)
7. [Complete Example](#complete-example)

---

## 🏗️ Architecture Overview

The integration follows a layered architecture:

```
┌─────────────────────────────────────────┐
│         React Components                │
│  (TreatmentSelection, LensTypeSelection)│
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│      useLensCustomization Hook          │
│  (Fetches & Transforms Data)            │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│         Services Layer                  │
│  (lensOptionsService, etc.)              │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│         API Routes Config               │
│  (apiRoutes.ts)                         │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│         API Client                      │
│  (utils/api.ts)                         │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│         Backend API                     │
│  (https://piro-optyshopbackend-muhs96-c5eb95-72-61-22-134.traefik.me/api/...)        │
└─────────────────────────────────────────┘
```

---

## 🔄 Data Flow

### Step-by-Step Flow:

1. **Component Renders** → Calls `useLensCustomization()` hook
2. **Hook Initializes** → Calls service functions in parallel
3. **Services Execute** → Build API URLs using route config
4. **API Client** → Makes HTTP requests to backend
5. **Backend Responds** → Returns JSON data
6. **Services Transform** → Parse response and return typed data
7. **Hook Transforms** → Convert API format to component format
8. **Component Receives** → Ready-to-use data with loading states

---

## 🛣️ API Routes Layer

**File:** `src/config/apiRoutes.ts`

This layer defines all API endpoint paths. It's like a map of available routes.

```typescript
export const API_ROUTES = {
  LENS: {
    OPTIONS: {
      LIST: `/lens/options`,                    // GET /api/lens/options
      BY_ID: (id) => `/lens/options/${id}`,     // GET /api/lens/options/1
    },
    TREATMENTS: {
      LIST: `/lens/treatments`,                 // GET /api/lens/treatments
      BY_ID: (id) => `/lens/treatments/${id}`,  // GET /api/lens/treatments/1
    },
  },
  SHIPPING_METHODS: {
    LIST: `/shipping-methods`,                 // GET /api/shipping-methods
    BY_ID: (id) => `/shipping-methods/${id}`,   // GET /api/shipping-methods/1
  },
  PAYMENTS: {
    CREATE_INTENT: `/payments/create-intent`,   // POST /api/payments/create-intent
    CONFIRM: `/payments/confirm`,              // POST /api/payments/confirm
    INTENT_STATUS: (id) => `/payments/intent/${id}`, // GET /api/payments/intent/pi_123
  },
}
```

**Why this layer?**
- Single source of truth for all routes
- Easy to update if API changes
- Type-safe route building
- Consistent across the app

---

## 🔧 Services Layer

**Files:** 
- `src/services/lensOptionsService.ts`
- `src/services/lensTreatmentsService.ts`
- `src/services/shippingMethodsService.ts`
- `src/services/paymentsService.ts`

Services handle the actual API communication. They:
1. Build the full URL using routes
2. Make HTTP requests via `apiClient`
3. Handle errors
4. Return typed data

### Example: `lensOptionsService.ts`

```typescript
// 1. Define the data types
export interface LensOption {
  id: number;
  name: string;
  type: string;
  colors?: LensColor[];
  // ... more fields
}

// 2. Create the service function
export const getLensOptions = async (params?: {
  type?: string;
  isActive?: boolean;
}): Promise<LensOption[] | null> => {
  try {
    // 3. Build query string from params
    const queryParams = {};
    if (params?.type) queryParams.type = params.type;
    if (params?.isActive) queryParams.isActive = params.isActive;
    
    // 4. Build full URL
    const url = buildQueryString(API_ROUTES.LENS.OPTIONS.LIST, queryParams);
    // Result: "/lens/options?type=mirror&isActive=true"
    
    // 5. Make API call (false = public endpoint, no auth needed)
    const response = await apiClient.get<LensOptionsResponse>(url, false);
    
    // 6. Handle response
    if (response.success && response.data) {
      return response.data; // Return typed data
    }
    
    return null; // Return null on error
  } catch (error) {
    console.error('Error:', error);
    return null;
  }
};
```

### How `apiClient` Works:

```typescript
// Inside apiClient.get():
// 1. Prepends base URL: "https://piro-optyshopbackend-muhs96-c5eb95-72-61-22-134.traefik.me/api"
// 2. Adds Authorization header if needed (2nd param = true)
// 3. Makes GET request
// 4. Parses JSON response
// 5. Returns { success: boolean, data: T, message?: string }
```

**Backend Response Example:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Mirror Lenses",
      "type": "mirror",
      "base_price": 20.00,
      "colors": [
        {
          "id": 1,
          "name": "Blue Mirror",
          "hex_code": "#0066CC",
          "is_active": true
        }
      ]
    }
  ]
}
```

---

## 🎣 React Hook Layer

**File:** `src/hooks/useLensCustomization.ts`

The hook is the bridge between services and components. It:
1. Fetches data from multiple services
2. Transforms API data to component format
3. Manages loading/error states
4. Provides easy-to-use interface

### How It Works:

```typescript
export const useLensCustomization = () => {
  const [treatments, setTreatments] = useState<TreatmentOption[]>([])
  const [lensTypes, setLensTypes] = useState<LensTypeOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    setLoading(true)
    
    try {
      // 1. Fetch all data in parallel (faster!)
      const [treatmentsData, lensOptionsData, shippingData] = await Promise.all([
        getLensTreatments({ isActive: true }),
        getLensOptions({ isActive: true }),
        getShippingMethods({ isActive: true }),
      ])

      // 2. Transform API data to component format
      if (treatmentsData) {
        setTreatments(
          treatmentsData.map(treatment => ({
            id: String(treatment.id),
            name: treatment.name,
            price: treatment.price,
            icon: getIconForType(treatment.type),
            description: treatment.description,
          }))
        )
      }

      // 3. For lens options, fetch full details with colors
      if (lensOptionsData) {
        const optionsWithColors = await Promise.all(
          lensOptionsData.map(option => getLensOptionById(option.id))
        )
        
        setLensTypes(
          optionsWithColors.map(option => ({
            id: String(option.id),
            name: option.name,
            description: option.description,
            colors: option.colors?.map(color => ({
              id: String(color.id),
              name: color.name,
              color: color.hex_code || '#000000',
            })),
          }))
        )
      }
    } catch (err) {
      setError('Failed to load options')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData() // Fetch on mount
  }, [])

  return {
    treatments,      // Ready for TreatmentSelection component
    lensTypes,       // Ready for LensTypeSelection component
    shippingOptions, // Ready for ShippingPaymentSelection component
    loading,         // Show spinner
    error,           // Show error message
    refetch: fetchData, // Manual refresh
  }
}
```

### Data Transformation Example:

**API Format (from backend):**
```json
{
  "id": 1,
  "name": "Scratch Proof",
  "type": "scratch_proof",
  "price": 30.00,
  "description": "Protects lenses from scratches"
}
```

**Component Format (after transformation):**
```typescript
{
  id: "1",                    // String instead of number
  name: "Scratch Proof",
  price: 30.00,
  icon: <SVGComponent />,     // React component
  description: "Protects lenses from scratches"
}
```

---

## 🎨 Component Usage

### Simple Example:

```typescript
import { useLensCustomization } from '../hooks/useLensCustomization'
import TreatmentSelection from '../components/shop/TreatmentSelection'

function MyComponent() {
  // 1. Use the hook
  const { treatments, loading, error } = useLensCustomization()
  
  // 2. Handle loading state
  if (loading) {
    return <div>Loading treatments...</div>
  }
  
  // 3. Handle error state
  if (error) {
    return <div>Error: {error}</div>
  }
  
  // 4. Use the data
  return (
    <TreatmentSelection
      treatments={treatments}  // Already in correct format!
      selectedTreatment={selectedTreatment}
      onSelect={handleSelect}
    />
  )
}
```

### Advanced Example with All Features:

```typescript
import { useLensCustomization } from '../hooks/useLensCustomization'
import TreatmentSelection from '../components/shop/TreatmentSelection'
import LensTypeSelection from '../components/shop/LensTypeSelection'
import ShippingPaymentSelection from '../components/shop/ShippingPaymentSelection'

function CheckoutPage() {
  const [selectedTreatment, setSelectedTreatment] = useState<string>()
  const [selectedLensType, setSelectedLensType] = useState<string>()
  const [selectedColor, setSelectedColor] = useState<string>()
  const [selectedShipping, setSelectedShipping] = useState<string>()
  const [selectedPayment, setSelectedPayment] = useState<string>()

  // Fetch all customization options
  const {
    treatments,
    lensTypes,
    shippingOptions,
    paymentOptions,
    loading,
    error,
    refetch
  } = useLensCustomization()

  if (loading) {
    return <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded p-4">
        <p className="text-red-800">{error}</p>
        <button onClick={refetch} className="mt-2 text-blue-600">
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Treatment Selection */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Choose Treatment</h2>
        <TreatmentSelection
          treatments={treatments}
          selectedTreatment={selectedTreatment}
          onSelect={setSelectedTreatment}
        />
      </section>

      {/* Lens Type & Color Selection */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Choose Lens Type & Color</h2>
        <LensTypeSelection
          lensTypes={lensTypes}
          selectedLensTypeId={selectedLensType}
          selectedColorId={selectedColor}
          onSelectLensType={setSelectedLensType}
          onSelectColor={(typeId, colorId) => {
            setSelectedLensType(typeId)
            setSelectedColor(colorId)
          }}
        />
      </section>

      {/* Shipping & Payment */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Shipping & Payment</h2>
        <ShippingPaymentSelection
          shippingOptions={shippingOptions}
          paymentOptions={paymentOptions}
          selectedShippingId={selectedShipping}
          selectedPaymentId={selectedPayment}
          onShippingSelect={setSelectedShipping}
          onPaymentSelect={setSelectedPayment}
        />
      </section>
    </div>
  )
}
```

---

## 💳 Payment Flow Example

### Complete Payment Integration:

```typescript
import { createPaymentIntent, confirmPayment } from '../services/paymentsService'
import { getStripe, processPayment } from '../services/stripeService'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'

function PaymentForm({ orderId }: { orderId: number }) {
  const stripe = useStripe()
  const elements = useElements()
  const [clientSecret, setClientSecret] = useState<string>()

  // Step 1: Create payment intent when component mounts
  useEffect(() => {
    const initializePayment = async () => {
      const intent = await createPaymentIntent({
        order_id: orderId,
        // amount is optional - uses order total if omitted
      })
      
      if (intent) {
        setClientSecret(intent.client_secret)
      }
    }
    
    initializePayment()
  }, [orderId])

  // Step 2: Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!stripe || !elements || !clientSecret) {
      return
    }

    // Step 3: Confirm payment with Stripe
    const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
      elements,
      clientSecret,
      confirmParams: {
        return_url: `${window.location.origin}/customer/orders`,
      },
    })

    if (stripeError) {
      console.error('Stripe error:', stripeError)
      return
    }

    // Step 4: Confirm payment on backend
    if (paymentIntent) {
      const result = await confirmPayment(paymentIntent.id)
      
      if (result) {
        // Payment successful!
        // Redirect to order confirmation
        window.location.href = `/customer/orders/${result.order_id}`
      }
    }
  }

  if (!clientSecret) {
    return <div>Loading payment form...</div>
  }

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      <button 
        type="submit" 
        disabled={!stripe}
        className="mt-4 px-6 py-2 bg-blue-600 text-white rounded"
      >
        Pay Now
      </button>
    </form>
  )
}

// Wrap with Stripe Elements provider
function CheckoutPage({ orderId }: { orderId: number }) {
  const [stripePromise, setStripePromise] = useState<Promise<any> | null>(null)

  useEffect(() => {
    // Initialize Stripe
    const init = async () => {
      const stripe = await getStripe()
      if (stripe) {
        setStripePromise(Promise.resolve(stripe))
      }
    }
    init()
  }, [])

  if (!stripePromise) {
    return <div>Loading...</div>
  }

  return (
    <Elements stripe={stripePromise}>
      <PaymentForm orderId={orderId} />
    </Elements>
  )
}
```

---

## 🔍 Debugging Tips

### 1. Check Network Tab
Open browser DevTools → Network tab to see:
- Request URL
- Request headers
- Response data
- Status codes

### 2. Check Console Logs
Services log errors to console:
```typescript
console.error('Failed to fetch lens options:', response.message)
```

### 3. Verify API Response Format
Make sure backend returns:
```json
{
  "success": true,
  "data": [...]
}
```

### 4. Check Authentication
Payment endpoints require auth token:
```typescript
// In apiClient, if 2nd param is true:
headers['Authorization'] = `Bearer ${accessToken}`
```

---

## 📊 Summary

1. **API Routes** → Define endpoint paths
2. **Services** → Make HTTP requests, return typed data
3. **Hook** → Fetches from services, transforms data, manages state
4. **Components** → Use hook, display data, handle user interactions

**Key Benefits:**
- ✅ Type-safe throughout
- ✅ Centralized error handling
- ✅ Loading states built-in
- ✅ Easy to test
- ✅ Reusable across components

---

## 🚀 Quick Start

```typescript
// 1. Import the hook
import { useLensCustomization } from '../hooks/useLensCustomization'

// 2. Use in component
const { treatments, lensTypes, loading } = useLensCustomization()

// 3. Use the data
<TreatmentSelection treatments={treatments} />
```

That's it! The hook handles everything else automatically. 🎉

