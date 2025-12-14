# Calculator Integration Positions

This document shows where each calculator is integrated in the application.

## ✅ Base Curve Calculator

### Position 1: Viewer3DModal (3D Viewer Page)
- **Location**: `src/components/products/Viewer3D/Viewer3DModal.tsx`
- **Trigger Button**: "Base Curve" button in the top control bar
- **Modal Position**: Centered overlay with backdrop
- **Z-Index**: `z-[60]` (above main modal)
- **Status**: ✅ Fully Integrated

### Position 2: VirtualTryOnModal (Home Page)
- **Location**: `src/components/home/VirtualTryOnModal.tsx`
- **Trigger Button**: "Base Curve" button in the header
- **Modal Position**: Centered overlay with backdrop
- **Z-Index**: `z-[70]` (above main modal)
- **Status**: ✅ Fully Integrated

## ✅ Lens Thickness Calculator

### Position 1: Viewer3DModal (3D Viewer Page)
- **Location**: `src/components/products/Viewer3D/Viewer3DModal.tsx`
- **Trigger Button**: "Lens Thickness" button in the top control bar
- **Modal Position**: Centered overlay with backdrop
- **Z-Index**: `z-[60]` (above main modal)
- **Status**: ✅ Fully Integrated

### Position 2: VirtualTryOnModal (Home Page)
- **Location**: `src/components/home/VirtualTryOnModal.tsx`
- **Trigger Button**: "Lens Thickness" button in the header
- **Modal Position**: Centered overlay with backdrop
- **Z-Index**: `z-[70]` (above main modal)
- **Status**: ✅ Fully Integrated

## ✅ PD Calculator

### Position: PupilDistance Page
- **Location**: `src/pages/solutions/PupilDistance.tsx`
- **Trigger Button**: "Open PD Calculator" button in the calculators section
- **Modal Position**: Centered overlay with backdrop
- **Z-Index**: `z-[70]`
- **Status**: ✅ Fully Integrated

## ✅ Pupillary Height Calculator

### Position: PupilDistance Page
- **Location**: `src/pages/solutions/PupilDistance.tsx`
- **Trigger Button**: "Open Height Calculator" button in the calculators section
- **Modal Position**: Centered overlay with backdrop
- **Z-Index**: `z-[70]`
- **Status**: ✅ Fully Integrated

## Integration Details

### Viewer3DModal Integration
```
Header Controls:
├── Photochromic Toggle
├── AR Coating Toggle
├── Base Curve Button → Opens Base Curve Calculator Modal
├── Lens Thickness Button → Opens Lens Thickness Calculator Modal
└── Close Button
```

### VirtualTryOnModal Integration
```
Header Controls:
├── Photochromic Toggle
├── AR Coating Toggle
├── Base Curve Button → Opens Base Curve Calculator Modal
├── Lens Thickness Button → Opens Lens Thickness Calculator Modal
└── Close Button
```

### PupilDistance Page Integration
```
Calculators Section:
├── PD Calculator Card → Opens PD Calculator Modal
└── Pupillary Height Calculator Card → Opens Pupillary Height Calculator Modal
```

## Modal Styling

All calculator modals use:
- **Backdrop**: `bg-black/80 backdrop-blur-sm`
- **Container**: `bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl`
- **Position**: `fixed inset-0 z-[60] or z-[70] flex items-center justify-center p-4`
- **Close Button**: Integrated in calculator component header

## Status: ✅ All Calculators Properly Positioned

All calculators are integrated in their correct positions and ready for use!

