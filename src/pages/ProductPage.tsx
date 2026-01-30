import React, { useState } from 'react'
import ProtractorDisplay from '../components/simulations/ProtractorDisplay'

interface ProductPageProps {
  productName?: string
  price?: string
}

const ProductPage: React.FC<ProductPageProps> = ({ 
  productName = 'Classic Round Frame',
  price = '€129.99'
}) => {
  const [couponCode, setCouponCode] = useState('')
  const [pupillaryDistance, setPupillaryDistance] = useState('')
  const [rightEye, setRightEye] = useState({
    sph: '',
    cyl: '',
    axis: '-166'
  })
  const [leftEye, setLeftEye] = useState({
    sph: '',
    cyl: '',
    axis: '-151'
  })
  const [showAxisGuide, setShowAxisGuide] = useState(false)

  const handleCopyRightToLeft = () => {
    setLeftEye({
      sph: rightEye.sph,
      cyl: rightEye.cyl,
      axis: rightEye.axis
    })
  }

  const handleInputChange = (eye: 'right' | 'left', field: 'sph' | 'cyl' | 'axis', value: string) => {
    if (eye === 'right') {
      setRightEye(prev => ({ ...prev, [field]: value }))
    } else {
      setLeftEye(prev => ({ ...prev, [field]: value }))
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Panel - Order Summary */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h2>
            
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800">{productName}</h3>
              <p className="text-2xl font-bold text-blue-600">{price}</p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Have a coupon code?
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter coupon code"
                />
                <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                  Apply
                </button>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Subtotal (1 items)</span>
                <span className="font-semibold">{price}</span>
              </div>
              <div className="flex justify-between text-lg font-bold">
                <span>Estimate Total</span>
                <span className="text-blue-600">{price}</span>
              </div>
            </div>
          </div>

          {/* Center Panel - Product Image */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center mb-4">
              <img 
                src="/assets/images/frame1.png" 
                alt={productName}
                className="max-w-full max-h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/assets/images/frame2.png'
                }}
              />
            </div>
            <h3 className="text-xl font-semibold text-center text-gray-800">{productName}</h3>
            <p className="text-2xl font-bold text-center text-blue-600">{price}</p>
          </div>

          {/* Right Panel - Near Vision Customization */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Near Vision</h2>
            
            {/* Pupillary Distance */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pupillary Distance (PD)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={pupillaryDistance}
                  onChange={(e) => setPupillaryDistance(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                  placeholder="Enter Your Pupillary Distance"
                />
                <button className="absolute right-2 top-2 text-gray-400 hover:text-gray-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Right Eye OD */}
            <div className="mb-4">
              <h3 className="font-semibold text-gray-800 mb-3">Right Eye (OD)</h3>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">SPH</label>
                  <input
                    type="text"
                    value={rightEye.sph}
                    onChange={(e) => handleInputChange('right', 'sph', e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">CYL</label>
                  <input
                    type="text"
                    value={rightEye.cyl}
                    onChange={(e) => handleInputChange('right', 'cyl', e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">AXIS</label>
                  <input
                    type="text"
                    value={rightEye.axis}
                    onChange={(e) => handleInputChange('right', 'axis', e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            {/* Left Eye OS */}
            <div className="mb-4">
              <h3 className="font-semibold text-gray-800 mb-3">Left Eye (OS)</h3>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">SPH</label>
                  <input
                    type="text"
                    value={leftEye.sph}
                    onChange={(e) => handleInputChange('left', 'sph', e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">CYL</label>
                  <input
                    type="text"
                    value={leftEye.cyl}
                    onChange={(e) => handleInputChange('left', 'cyl', e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">AXIS</label>
                  <input
                    type="text"
                    value={leftEye.axis}
                    onChange={(e) => handleInputChange('left', 'axis', e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={handleCopyRightToLeft}
              className="w-full mb-6 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm"
            >
              Copy Right to Left
            </button>

            {/* Axis Measurement Guide */}
            <div className="border-t pt-4">
              <button
                onClick={() => setShowAxisGuide(!showAxisGuide)}
                className="w-full flex items-center justify-between px-4 py-3 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors"
              >
                <span className="font-medium">Axis Measurement Guide</span>
                <span className="text-xs">For Customer Support</span>
                <svg 
                  className={`w-4 h-4 transform transition-transform ${showAxisGuide ? 'rotate-180' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showAxisGuide && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <div className="mb-4">
                    <h4 className="font-semibold text-gray-800 mb-2">Left Eye</h4>
                    <ProtractorDisplay 
                      size={250} 
                      title="Left Eye" 
                      angle={parseInt(rightEye.axis) || 0} 
                    />
                  </div>
                  
                  <div className="mb-4">
                    <h4 className="font-semibold text-gray-800 mb-2">Right Eye</h4>
                    <ProtractorDisplay 
                      size={250} 
                      title="Right Eye" 
                      angle={parseInt(leftEye.axis) || 0} 
                    />
                  </div>
                  
                  <div className="text-xs text-gray-600">
                    <p>Use the protractor to measure the axis of astigmatism.</p>
                    <p>The red line indicates the current axis value.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Continue Button */}
            <button className="w-full mt-6 px-6 py-3 bg-blue-900 text-white font-semibold rounded-md hover:bg-blue-800 transition-colors">
              Continue
            </button>

            {/* Pagination Indicators */}
            <div className="flex justify-center mt-4 space-x-2">
              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
              <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
              <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductPage
