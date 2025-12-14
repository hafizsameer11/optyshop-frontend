# Form Submission Guide

## ✅ Calculator Forms - Manual Submission

All calculator forms can be submitted manually in two ways:

### 1. Button Click
- Click the **"Calculate Base Curve"** or **"Calculate Thickness"** button
- The form will validate inputs and submit to the API

### 2. Enter Key
- Press **Enter** while focused on any input field
- The form will automatically submit (standard HTML form behavior)

## Forms Available

### Base Curve Calculator
- **Location**: 
  - Viewer3DModal (3D Viewer page)
  - VirtualTryOnModal (Home page)
- **Required Fields**:
  - Sphere Power (D) *
  - Cylinder Power (D) *
- **Optional Fields**:
  - Corneal Curvature (mm)
- **Submit**: Click "Calculate Base Curve" or press Enter

### Lens Thickness Calculator
- **Location**: 
  - Viewer3DModal (3D Viewer page)
  - VirtualTryOnModal (Home page)
- **Required Fields**:
  - Frame Diameter (mm) *
  - Lens Power (D) *
  - Lens Index *
- **Submit**: Click "Calculate Thickness" or press Enter

### PD Calculator
- **Location**: PupilDistance page
- **Submit**: Click "Calculate PD" or press Enter

### Pupillary Height Calculator
- **Location**: PupilDistance page
- **Submit**: Click "Calculate Height" or press Enter

## Form Validation

All forms include:
- ✅ Required field validation
- ✅ Number format validation
- ✅ Positive number validation (where applicable)
- ✅ Real-time error messages
- ✅ Loading states during API calls

## Testing Manual Submission

To test form submission:

1. **Open any calculator modal**
2. **Fill in the required fields**
3. **Submit using either method**:
   - Click the Calculate button
   - OR press Enter in any input field
4. **Verify**:
   - Loading state appears
   - Results display on success
   - Error message shows on failure

## Troubleshooting

If forms don't submit:

1. **Check required fields** - All required fields must be filled
2. **Check number format** - Values must be valid numbers
3. **Check browser console** - Look for API errors
4. **Check backend** - Ensure backend is running on `http://localhost:5000`

## Status: ✅ All Forms Ready for Manual Submission

All calculator forms are fully functional and ready for manual testing!

