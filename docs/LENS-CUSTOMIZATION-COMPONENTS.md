# Lens Customization Components

This document describes the new lens customization components that match the UI designs shown in the images.

## Components Overview

### 1. TreatmentSelection Component

A card-based selection component for lens treatments/coatings.

**Location:** `src/components/shop/TreatmentSelection.tsx`

**Features:**
- Card-based UI with icons
- Radio button selection
- Price display
- Visual feedback on selection

**Usage:**
```tsx
import TreatmentSelection from './components/shop/TreatmentSelection'
import { treatmentOptions } from './data/lensCustomizationData'

<TreatmentSelection
  treatments={treatmentOptions}
  selectedTreatment={selectedTreatment}
  onSelect={(treatmentId) => setSelectedTreatment(treatmentId)}
  currency="€"
/>
```

**Available Treatments:**
- Scratch Proof (+30.00€)
- Anti Glare (+30.00€)
- Blue Lens Anti Glare (+30.00€)
- Photochromic (price varies)

### 2. LensTypeSelection Component

A component for selecting lens types with color swatches.

**Location:** `src/components/shop/LensTypeSelection.tsx`

**Features:**
- Multiple lens type options
- Color swatch selection for each type
- Price labels (Free, +$XX.XX)
- Descriptions for each option

**Usage:**
```tsx
import LensTypeSelection from './components/shop/LensTypeSelection'
import { lensTypeOptions } from './data/lensCustomizationData'

<LensTypeSelection
  lensTypes={lensTypeOptions}
  selectedLensTypeId={selectedLensType}
  selectedColorId={selectedColor}
  onSelectLensType={(lensTypeId) => setSelectedLensType(lensTypeId)}
  onSelectColor={(lensTypeId, colorId) => {
    setSelectedLensType(lensTypeId)
    setSelectedColor(colorId)
  }}
  currency="$"
/>
```

**Available Lens Types:**
- EyeQLenz™ (with 7 color options)
- Transitions® GEN S™ (with 8 color options)
- Standard (with 2 color options)
- Blokz Photochromic (with 1 color option)

### 3. ShippingPaymentSelection Component

A component for selecting shipping and payment methods.

**Location:** `src/components/shop/ShippingPaymentSelection.tsx`

**Features:**
- Dropdown-style selection buttons
- Modal dialogs for choosing options
- Shipping cost display
- Payment method icons

**Usage:**
```tsx
import ShippingPaymentSelection from './components/shop/ShippingPaymentSelection'
import { shippingOptions, paymentOptions } from './data/lensCustomizationData'

<ShippingPaymentSelection
  shippingOptions={shippingOptions}
  paymentOptions={paymentOptions}
  selectedShippingId={selectedShipping}
  selectedPaymentId={selectedPayment}
  onShippingSelect={(shippingId) => setSelectedShipping(shippingId)}
  onPaymentSelect={(paymentId) => setSelectedPayment(paymentId)}
  currency="$"
/>
```

**Available Shipping Options:**
- Standard Shipping ($5.99, 5-7 days)
- Express Shipping ($12.99, 2-3 days)
- Overnight Shipping ($24.99, 1 day)
- Free Shipping (Free, 5-7 days)

**Available Payment Options:**
- Credit/Debit Card (Stripe)
- PayPal
- Cash on Delivery

### 4. EnhancedLensCustomization Component

A complete workflow component that combines all customization steps.

**Location:** `src/components/shop/EnhancedLensCustomization.tsx`

**Features:**
- Multi-step workflow
- Step indicator
- Navigation between steps
- Complete customization data collection

**Usage:**
```tsx
import EnhancedLensCustomization from './components/shop/EnhancedLensCustomization'

<EnhancedLensCustomization
  onComplete={(customization) => {
    console.log('Customization complete:', customization)
    // Handle completion
  }}
  currency="€"
/>
```

## Data Structure

All sample data is available in `src/data/lensCustomizationData.ts`:

- `treatmentOptions` - Treatment/coating options
- `lensTypeOptions` - Lens types with color swatches
- `prescriptionLensOptions` - Prescription-specific lens options
- `lensCoatingOptions` - Additional coating/style options
- `shippingOptions` - Shipping method options
- `paymentOptions` - Payment method options

## Integration with Existing Checkout

To integrate these components into the existing `ProductCheckout` component:

1. **Add Treatment Step:**
```tsx
// In ProductCheckout component
const [selectedTreatment, setSelectedTreatment] = useState<string>()

// Add treatment step before lens selection
{currentStep === 'treatment' && (
  <TreatmentSelection
    treatments={treatmentOptions}
    selectedTreatment={selectedTreatment}
    onSelect={setSelectedTreatment}
  />
)}
```

2. **Enhance Lens Selection:**
```tsx
// Replace existing lens selection with enhanced version
<LensTypeSelection
  lensTypes={lensTypeOptions}
  selectedLensTypeId={selectedLensType}
  selectedColorId={selectedColor}
  onSelectLensType={setSelectedLensType}
  onSelectColor={(typeId, colorId) => {
    setSelectedLensType(typeId)
    setSelectedColor(colorId)
  }}
/>
```

3. **Add Shipping/Payment Selection:**
```tsx
// Add to checkout summary or as separate step
<ShippingPaymentSelection
  shippingOptions={shippingOptions}
  paymentOptions={paymentOptions}
  selectedShippingId={selectedShipping}
  selectedPaymentId={selectedPayment}
  onShippingSelect={setSelectedShipping}
  onPaymentSelect={setSelectedPayment}
/>
```

## Customization Data

The components use data from `lensCustomizationData.ts`. You can:

1. **Modify existing options** - Edit the arrays in the data file
2. **Add new options** - Extend the arrays with new items
3. **Fetch from API** - Replace static data with API calls

Example API integration:
```tsx
const [treatments, setTreatments] = useState<TreatmentOption[]>([])

useEffect(() => {
  // Fetch treatments from API
  fetchTreatments().then(setTreatments)
}, [])
```

## Styling

All components use Tailwind CSS and match the OptyShop design system:
- Blue accent color: `#6B46C1` (purple)
- Consistent spacing and borders
- Hover states and transitions
- Responsive design

## Next Steps

1. **Backend Integration:**
   - Create API endpoints for treatments, lens types, colors
   - Store customization data in cart/order
   - Calculate pricing with customizations

2. **Enhanced Features:**
   - Image preview with selected colors
   - Price calculator showing total
   - Save customization preferences
   - Comparison view

3. **Testing:**
   - Test all selection flows
   - Verify price calculations
   - Test responsive design
   - Validate data persistence

## Example Complete Flow

```tsx
import EnhancedLensCustomization from './components/shop/EnhancedLensCustomization'

function ProductCustomizationPage() {
  const handleComplete = (customization: LensCustomizationData) => {
    // Add to cart with customization
    addToCart({
      productId: product.id,
      ...customization
    })
  }

  return (
    <EnhancedLensCustomization
      onComplete={handleComplete}
      currency="€"
    />
  )
}
```

All components are ready to use and match the UI designs from the images!

