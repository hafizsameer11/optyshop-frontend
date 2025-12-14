# Simulations & Calculators Integration

This document describes the complete integration of all simulation calculators and virtual try-on features with the backend API.

## ✅ Integrated Features

### 1. Base Curve Calculator
- **Component**: `src/components/simulations/BaseCurveCalculator.tsx`
- **API Endpoint**: `POST /api/simulations/base-curve`
- **Service**: `calculateBaseCurve()` in `src/services/simulationsService.ts`
- **Used In**:
  - `Viewer3DModal` - 3D Viewer page
  - `VirtualTryOnModal` - Home page virtual try-on

**API Request:**
```json
{
  "spherePower": -3.00,
  "cylinderPower": -0.75
}
```
Note: `cornealCurvature` is optional and only included if provided.

**API Response:**
```json
{
  "success": true,
  "message": "Base curve calculated",
  "data": {
    "calculation": {
      "baseCurve": 8.5,
      "recommendation": "Recommended base curve for your prescription"
    }
  }
}
```

**Frontend Handling:**
- Request only includes `cornealCurvature` if user provides a value
- Response handling supports multiple response structures
- Automatically extracts `calculation` from `data.calculation` or wraps `data.baseCurve`

### 2. Lens Thickness Calculator
- **Component**: `src/components/simulations/LensThicknessCalculator.tsx`
- **API Endpoint**: `POST /api/simulations/lens-thickness`
- **Service**: `calculateLensThickness()` in `src/services/simulationsService.ts`
- **Used In**:
  - `Viewer3DModal` - 3D Viewer page
  - `VirtualTryOnModal` - Home page virtual try-on

**API Request:**
```json
{
  "frameDiameter": 52,
  "lensPower": -4.5,
  "lensIndex": 1.67
}
```

**API Response:**
```json
{
  "calculation": {
    "edgeThickness": 5.2,
    "centerThickness": 1.5,
    "frameDiameter": 52,
    "lensPower": -4.5,
    "lensIndex": 1.67,
    "thicknessCategory": "medium",
    "recommendation": "Lens thickness recommendation"
  }
}
```

### 3. PD (Pupillary Distance) Calculator
- **Component**: `src/components/simulations/PDCalculator.tsx`
- **API Endpoint**: `POST /api/simulations/pd`
- **Service**: `calculatePD()` in `src/services/simulationsService.ts`
- **Used In**: `PupilDistance` page

**API Request:**
```json
{
  "distancePD": 64,
  "type": "binocular"
}
```

### 4. Pupillary Height Calculator
- **Component**: `src/components/simulations/PupillaryHeightCalculator.tsx`
- **API Endpoint**: `POST /api/simulations/pupillary-height`
- **Service**: `calculatePupillaryHeight()` in `src/services/simulationsService.ts`
- **Used In**: `PupilDistance` page

**API Request:**
```json
{
  "pupilPosition": 150,
  "frameMidline": 140,
  "pixelToMMRatio": 0.1
}
```

### 5. Kids Lens Recommendation
- **Component**: `src/components/simulations/KidsLensRecommendation.tsx`
- **API Endpoint**: `POST /api/simulations/kids-lens-recommendation`
- **Service**: `getKidsLensRecommendation()` in `src/services/simulationsService.ts`

**API Request:**
```json
{
  "age": 8,
  "pd": 52,
  "power": -2.0
}
```

### 6. Lifestyle Recommendation
- **Component**: `src/components/simulations/LifestyleRecommendation.tsx`
- **API Endpoint**: `POST /api/simulations/lifestyle-recommendation`
- **Service**: `getLifestyleRecommendation()` in `src/services/simulationsService.ts`

**API Request:**
```json
{
  "screenUsage": "high",
  "outdoorActivities": "frequent",
  "nightDriving": true,
  "prescriptionStrength": -5.0
}
```

### 7. Photochromic Simulator
- **API Endpoint**: `POST /api/simulations/photochromic`
- **Service**: `simulatePhotochromic()` in `src/services/simulationsService.ts`
- **Used In**: `Viewer3DModal`

**API Request:**
```json
{
  "sunlightLevel": 75
}
```

### 8. AR Coating Simulator
- **API Endpoint**: `POST /api/simulations/ar-coating`
- **Service**: `simulateARCoating()` in `src/services/simulationsService.ts`
- **Used In**: `Viewer3DModal`

**API Request:**
```json
{
  "reflectionIntensity": 45
}
```

## Virtual Try-On Integration

### Viewer3DModal
- **Location**: `src/components/products/Viewer3D/Viewer3DModal.tsx`
- **Features**:
  - Product frame selection from API
  - 3D frame rotation
  - Photochromic simulation toggle
  - AR Coating simulation toggle
  - Base Curve Calculator modal
  - Lens Thickness Calculator modal

### VirtualTryOnModal
- **Location**: `src/components/home/VirtualTryOnModal.tsx`
- **Features**:
  - Live camera feed for virtual try-on
  - Frame selection sidebar
  - Base Curve Calculator modal
  - Lens Thickness Calculator modal

## API Integration Status

✅ **All simulation endpoints are properly integrated:**

1. ✅ Base Curve Calculator - Fully integrated
2. ✅ Lens Thickness Calculator - Fully integrated
3. ✅ PD Calculator - Fully integrated
4. ✅ Pupillary Height Calculator - Fully integrated
5. ✅ Kids Lens Recommendation - Fully integrated
6. ✅ Lifestyle Recommendation - Fully integrated
7. ✅ Photochromic Simulator - Fully integrated
8. ✅ AR Coating Simulator - Fully integrated

## Service Layer

All API calls are handled through:
- **Service File**: `src/services/simulationsService.ts`
- **API Client**: `src/utils/api.ts`
- **Routes Config**: `src/config/apiRoutes.ts`

## Error Handling

All calculators include:
- ✅ Input validation
- ✅ Loading states
- ✅ Error messages
- ✅ Success result display
- ✅ Reset functionality

## Usage Example

```typescript
import { calculateBaseCurve } from '../services/simulationsService'

const result = await calculateBaseCurve({
  spherePower: -3.00,
  cylinderPower: -0.75,
  cornealCurvature: 7.5
})

if (result) {
  console.log('Base Curve:', result.calculation.baseCurve)
}
```

## Testing

All calculators can be tested by:
1. Opening the respective modals in the application
2. Entering test values
3. Clicking "Calculate" to see API integration in action
4. Checking browser console for API calls (in dev mode)

## Virtual Try-On Product Integration

### ✅ VirtualTryOnModal - Products from Backend
- **Location**: `src/components/home/VirtualTryOnModal.tsx`
- **Integration**: Now fetches products from backend API using `getProducts()` service
- **Features**:
  - Fetches up to 50 products from `/api/products` endpoint
  - Displays products in sidebar and bottom strip
  - Uses `getProductImageUrl()` utility for consistent image handling
  - Fallback to default frame if product image fails to load
  - Loading and error states

### ✅ Viewer3DModal - Products from Backend
- **Location**: `src/components/products/Viewer3D/Viewer3DModal.tsx`
- **Integration**: Already fetches products from backend API
- **Features**:
  - Fetches products using `getProducts()` service
  - 3D frame rotation with backend products
  - All calculators integrated

## Forms Integration Status

✅ **All forms are properly integrated with API:**

1. ✅ Contact Form - `POST /api/forms/contact/submissions`
   - Location: `src/components/contact/ContactFormSection.tsx`
   - Navigates to `/thank-you` on success

2. ✅ Demo Form - `POST /api/forms/demo/submissions`
   - Location: `src/components/home/LiveDemoSection.tsx`
   - Location: `src/components/products/VirtualTest/DemoSection.tsx`
   - Location: `src/components/products/DigitalFrames/DemoSection.tsx`
   - Location: `src/components/solutions/ecommerce/ContactDemoSection.tsx`
   - Navigates to `/thank-you` on success

3. ✅ Pricing Form - `POST /api/forms/pricing/submissions`
   - Integrated in pricing request pages

4. ✅ Job Application Form - `POST /api/forms/job-application/submissions`
   - Integrated in job application pages

## Status: ✅ COMPLETE

All simulation calculators, virtual try-on features, and forms are fully integrated with the backend API and ready for use.

### Recent Updates:
- ✅ VirtualTryOnModal now fetches products from backend instead of hardcoded images
- ✅ All calculators properly integrated in their respective pages
- ✅ All forms connected to API endpoints
- ✅ Error handling and loading states implemented
- ✅ Product images use centralized utility for consistency

