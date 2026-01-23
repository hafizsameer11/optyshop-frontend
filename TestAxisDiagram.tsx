import React from 'react'
import EyeAxisDiagram from './src/components/shop/EyeAxisDiagram'

const TestAxisDiagram = () => {
  return (
    <div style={{ padding: '20px' }}>
      <h2 className="text-xl font-bold mb-6">Axis Diagram</h2>
      
      {/* Main diagram matching the image */}
      <div className="mb-8">
        <EyeAxisDiagram 
          rightEyeAxis={0} 
          leftEyeAxis={30} 
          compact={false} 
        />
      </div>

      {/* Compact version for comparison */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Compact Version:</h3>
        <EyeAxisDiagram 
          rightEyeAxis={0} 
          leftEyeAxis={30} 
          compact={true} 
        />
      </div>
    </div>
  )
}

export default TestAxisDiagram
