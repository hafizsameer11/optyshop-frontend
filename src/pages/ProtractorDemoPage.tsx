import React from 'react'
import ProtractorDisplay from '../components/simulations/ProtractorDisplay'

const ProtractorDemoPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Protractor Display Demo</h1>
          <p className="text-gray-600 mb-8">
            Full circular protractor for complete eye measurements with 360° degree markings and angle indicator.
          </p>
          
          <div className="flex flex-col items-center space-y-8">
            {/* Eye Measurement Protractor */}
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Complete Eye Measurement Diagram</h2>
              <ProtractorDisplay size={350} title="Eye Measurement" angle={45} />
            </div>
            
            {/* Different angle example */}
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Measurement Example (120°)</h2>
              <ProtractorDisplay size={350} title="Eye Measurement" angle={120} />
            </div>
          </div>
          
          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">Features</h3>
            <ul className="list-disc list-inside text-blue-800 space-y-1">
              <li>Full 360° circular protractor for complete eye measurements</li>
              <li>Negative values (-10° to -180°) displayed in red for upper half</li>
              <li>Positive values (+10° to +180°) displayed in green for lower half</li>
              <li>Red angle indicator line with arrow showing current measurement</li>
              <li>Horizontal base line and vertical reference line</li>
              <li>Center indicator with red dot</li>
              <li>Adjustable angle measurement display</li>
              <li>Suitable for both left and right eye measurements</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProtractorDemoPage
