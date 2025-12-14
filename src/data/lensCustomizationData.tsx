/**
 * Lens Customization Data
 * Sample data for treatments, lens types, and colors based on UI designs
 */

import React from 'react'

// Treatment Icons
export const TreatmentIcons = {
  scratchProof: (
    <svg className="w-8 h-8 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  antiGlare: (
    <svg className="w-8 h-8 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="5" strokeWidth={2} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2v4m0 12v4M2 12h4m12 0h4" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.93 4.93l2.83 2.83m9.9 9.9l2.83 2.83M4.93 19.07l2.83-2.83m9.9-9.9l2.83-2.83" />
    </svg>
  ),
  blueLens: (
    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="5" strokeWidth={2} />
      <circle cx="12" cy="12" r="2" fill="currentColor" />
    </svg>
  ),
  photochromic: (
    <svg className="w-8 h-8 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
}

// Treatment Options
export const treatmentOptions = [
  {
    id: 'scratch_proof',
    name: 'Scratch Proof',
    price: 30.00,
    icon: TreatmentIcons.scratchProof,
    description: 'Protect your lenses from scratches and daily wear'
  },
  {
    id: 'anti_glare',
    name: 'Anti Glare',
    price: 30.00,
    icon: TreatmentIcons.antiGlare,
    description: 'Reduce glare and reflections for clearer vision'
  },
  {
    id: 'blue_lens_anti_glare',
    name: 'Blue Lens Anti Glare',
    price: 30.00,
    icon: TreatmentIcons.blueLens,
    description: 'Blue light protection with anti-glare coating'
  },
  {
    id: 'photochromic',
    name: 'Photochromic',
    price: 0, // Price varies
    icon: TreatmentIcons.photochromic,
    description: 'Automatically darkens in sunlight, clear indoors'
  }
]

// Lens Type Options with Colors
export const lensTypeOptions = [
  {
    id: 'eyeqlenz',
    name: 'EyeQLenz™',
    description: 'Block infrared, UV, and blue light with lenses that stay clear indoors and darken outdoors, featuring a subtle pink sheen.',
    priceLabel: 'Premium',
    colors: [
      { id: 'gray1', name: 'Gray', color: '#4a5568', gradient: false },
      { id: 'brown1', name: 'Brown', color: '#744210', gradient: false },
      { id: 'teal1', name: 'Teal', color: '#234e52', gradient: false },
      { id: 'purple1', name: 'Purple', color: '#553c9a', gradient: false },
      { id: 'brown2', name: 'Brown', color: '#7c2d12', gradient: false },
      { id: 'pink1', name: 'Pink', color: '#9f1239', gradient: false },
      { id: 'green1', name: 'Green', color: '#14532d', gradient: false }
    ]
  },
  {
    id: 'transitions_gen_s',
    name: 'Transitions® GEN S™',
    description: 'Darken outdoors in seconds and come in 8 vibrant colors. The perfect everyday lens.',
    priceLabel: '+$60.90',
    colors: [
      { id: 'gray2', name: 'Gray', color: '#6b7280', gradient: false },
      { id: 'charcoal', name: 'Charcoal', color: '#374151', gradient: false },
      { id: 'brown3', name: 'Brown', color: '#92400e', gradient: false },
      { id: 'plum', name: 'Plum', color: '#581c87', gradient: false },
      { id: 'slate_blue', name: 'Slate Blue', color: '#475569', gradient: false },
      { id: 'teal2', name: 'Teal', color: '#134e4a', gradient: false },
      { id: 'olive', name: 'Olive', color: '#365314', gradient: false },
      { id: 'mauve', name: 'Mauve', color: '#831843', gradient: false }
    ]
  },
  {
    id: 'standard',
    name: 'Standard',
    description: 'Lenses that are clear indoors, darken outdoors, and block 100% UV rays.',
    priceLabel: 'Free',
    colors: [
      { id: 'gray3', name: 'Gray', color: '#6b7280', gradient: false },
      { id: 'brown4', name: 'Brown', color: '#78350f', gradient: false }
    ]
  },
  {
    id: 'blokz_photochromic',
    name: 'Blokz Photochromic',
    description: 'Virtually clear indoors, automatically darkens outdoors for blue light and UV protection.',
    priceLabel: 'Premium',
    colors: [
      { id: 'gray4', name: 'Gray', color: '#4b5563', gradient: false }
    ]
  }
]

// Prescription Lens Options
export const prescriptionLensOptions = [
  {
    id: 'polarized',
    name: 'Polarized',
    price: 76.95,
    description: 'Reduce glare and see clearly for outdoor activities and driving.',
    subOptions: [
      {
        name: 'Classic Free',
        colors: [
          { id: 'p_gray', name: 'Gray', color: '#4b5563' },
          { id: 'p_brown', name: 'Brown', color: '#78350f' },
          { id: 'p_green', name: 'Green', color: '#14532d' }
        ]
      }
    ]
  },
  {
    id: 'mirror',
    name: 'Mirror',
    price: 27.95,
    description: 'Reflective mirror coating for style and sun protection.',
    colors: [
      { id: 'm_green', name: 'Green/Yellow', color: 'linear-gradient(135deg, #84cc16, #eab308)', gradient: true },
      { id: 'm_blue', name: 'Blue', color: 'linear-gradient(135deg, #3b82f6, #1e40af)', gradient: true },
      { id: 'm_silver', name: 'Silver', color: 'linear-gradient(135deg, #e5e7eb, #9ca3af)', gradient: true },
      { id: 'm_purple', name: 'Purple', color: 'linear-gradient(135deg, #a855f7, #7c3aed)', gradient: true },
      { id: 'm_orange', name: 'Orange/Gold', color: 'linear-gradient(135deg, #f97316, #ea580c)', gradient: true },
      { id: 'm_cyan', name: 'Cyan', color: 'linear-gradient(135deg, #06b6d4, #0891b2)', gradient: true },
      { id: 'm_yellow', name: 'Yellow/Gold', color: 'linear-gradient(135deg, #eab308, #ca8a04)', gradient: true },
      { id: 'm_pink', name: 'Pink/Purple', color: 'linear-gradient(135deg, #ec4899, #db2777)', gradient: true }
    ]
  }
]

// Lens Coating/Style Options
export const lensCoatingOptions = [
  {
    id: 'classic_premium',
    name: 'Classic',
    price: 60.90,
    description: 'Subtle color and basic UV protection for a timeless look.',
    subOptions: [
      {
        name: 'Fashion Free',
        colors: [
          { id: 'c_lavender', name: 'Lavender', color: '#c084fc' },
          { id: 'c_yellow', name: 'Yellow/Beige', color: '#fef3c7' },
          { id: 'c_blue', name: 'Blue/Teal', color: '#7dd3fc' },
          { id: 'c_pink1', name: 'Pink', color: '#fbcfe8' },
          { id: 'c_pink2', name: 'Pink', color: '#f9a8d4' }
        ]
      }
    ]
  },
  {
    id: 'mirror_coating',
    name: 'Mirror',
    price: 20.00,
    description: 'Reflective mirror coating',
    colors: [
      { id: 'mc_gold', name: 'Gold', color: '#fbbf24', gradient: false },
      { id: 'mc_purple', name: 'Purple', color: '#a855f7', gradient: false },
      { id: 'mc_cyan', name: 'Cyan', color: '#06b6d4', gradient: false },
      { id: 'mc_rainbow', name: 'Rainbow', color: 'linear-gradient(135deg, #ec4899, #f97316, #eab308)', gradient: true },
      { id: 'mc_lime', name: 'Lime', color: '#84cc16', gradient: false },
      { id: 'mc_orange', name: 'Orange', color: '#f97316', gradient: false },
      { id: 'mc_blue', name: 'Blue', color: '#3b82f6', gradient: false },
      { id: 'mc_silver', name: 'Silver', color: '#9ca3af', gradient: false }
    ]
  },
  {
    id: 'gradient',
    name: 'Gradient',
    price: 4.00,
    description: 'Gradient tint from top to bottom',
    colors: [
      { id: 'g_gray', name: 'Gray Gradient', color: 'linear-gradient(135deg, #374151, #9ca3af)', gradient: true },
      { id: 'g_blue_gray', name: 'Blue-Gray Gradient', color: 'linear-gradient(135deg, #475569, #cbd5e1)', gradient: true },
      { id: 'g_brown1', name: 'Brown Gradient', color: 'linear-gradient(135deg, #78350f, #d97706)', gradient: true },
      { id: 'g_brown2', name: 'Brown Gradient', color: 'linear-gradient(135deg, #92400e, #f59e0b)', gradient: true },
      { id: 'g_green', name: 'Green Gradient', color: 'linear-gradient(135deg, #365314, #84cc16)', gradient: true },
      { id: 'g_pink', name: 'Pink Gradient', color: 'linear-gradient(135deg, #831843, #f472b6)', gradient: true },
      { id: 'g_purple', name: 'Purple Gradient', color: 'linear-gradient(135deg, #581c87, #c084fc)', gradient: true },
      { id: 'g_blue', name: 'Blue Gradient', color: 'linear-gradient(135deg, #1e40af, #60a5fa)', gradient: true }
    ]
  },
  {
    id: 'classic_free',
    name: 'Classic',
    price: 0,
    priceLabel: 'Free',
    description: 'Standard clear lenses',
    colors: [
      { id: 'cf_sage', name: 'Sage Green', color: '#86efac' },
      { id: 'cf_tan', name: 'Tan', color: '#fcd34d' },
      { id: 'cf_forest', name: 'Forest Green', color: '#14532d' },
      { id: 'cf_charcoal', name: 'Charcoal', color: '#374151' },
      { id: 'cf_brown', name: 'Brown', color: '#92400e' },
      { id: 'cf_gray', name: 'Gray', color: '#6b7280' },
      { id: 'cf_white', name: 'White', color: '#ffffff' },
      { id: 'cf_off_white', name: 'Off-White', color: '#f9fafb' },
      { id: 'cf_cream', name: 'Cream', color: '#fef3c7' },
      { id: 'cf_beige', name: 'Beige', color: '#fef9e7' }
    ]
  }
]

// Shipping Options
export const shippingOptions = [
  {
    id: 'standard',
    name: 'Standard Shipping',
    description: 'Regular delivery',
    price: 5.99,
    estimatedDays: '5-7 business days'
  },
  {
    id: 'express',
    name: 'Express Shipping',
    description: 'Faster delivery',
    price: 12.99,
    estimatedDays: '2-3 business days'
  },
  {
    id: 'overnight',
    name: 'Overnight Shipping',
    description: 'Next day delivery',
    price: 24.99,
    estimatedDays: '1 business day'
  },
  {
    id: 'free',
    name: 'Free Shipping',
    description: 'Free standard shipping',
    price: 0,
    estimatedDays: '5-7 business days'
  }
]

// Payment Options
export const paymentOptions = [
  {
    id: 'stripe',
    name: 'Credit/Debit Card',
    description: 'Pay securely with Stripe',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    )
  },
  {
    id: 'paypal',
    name: 'PayPal',
    description: 'Pay with your PayPal account',
    icon: (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.105zm14.146-14.42a.915.915 0 0 0-.272-.725c-.266-.304-.66-.44-1.193-.44h-3.015c-.525 0-.968.382-1.05.9l-1.12 7.105h2.19c.524 0 .968-.382 1.05-.9l1.12-7.105c.082-.518.526-.9 1.05-.9h3.015c.525 0 .968.382 1.05.9l1.12 7.105h2.19c.524 0 .968-.382 1.05-.9l1.12-7.105z"/>
      </svg>
    )
  },
  {
    id: 'cod',
    name: 'Cash on Delivery',
    description: 'Pay when you receive',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    )
  }
]

