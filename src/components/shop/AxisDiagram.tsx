import React from 'react'

interface AxisDiagramProps {
  onClose?: () => void
  compact?: boolean
  eyeType?: 'left' | 'right' | 'both'
  axisValue?: number
}

const AxisDiagram: React.FC<AxisDiagramProps> = ({ 
  onClose, 
  compact = false,
  eyeType = 'left',
  axisValue = 35
}) => {
  // Calculate pointer position based on axis value
  const pointerAngle = axisValue
  const pointerRadians = (pointerAngle * Math.PI) / 180
  const pointerLength = 170
  const pointerX = 200 + pointerLength * Math.sin(pointerRadians)
  const pointerY = 200 - pointerLength * Math.cos(pointerRadians)

  const eyeTypeLabel = eyeType === 'left' ? 'Occhio Sinistro' : eyeType === 'right' ? 'Occhio Destro' : 'Occhio'

  if (compact) {
    return (
      <div className="bg-gray-100 rounded-lg p-4 border border-gray-300 shadow-sm">
        {/* Title */}
        <div className="text-left mb-3">
          <h3 className="text-base font-bold text-gray-900">{eyeTypeLabel}</h3>
        </div>
        
        <div className="flex justify-center items-center">
          <div className="relative" style={{ width: '400px', height: '200px' }}>
            {/* SVG Gauge Diagram */}
            <svg
              viewBox="0 0 400 200"
              className="w-full h-full"
              style={{ maxWidth: '100%', height: 'auto' }}
            >
              {/* Semi-circle base line */}
              <line
                x1="0"
                y1="200"
                x2="400"
                y2="200"
                stroke="#000"
                strokeWidth="2"
              />
              
              {/* Outer arc */}
              <path
                d="M 20 200 A 180 180 0 0 1 380 200"
                fill="none"
                stroke="#000"
                strokeWidth="2"
              />
              
              {/* Major tick marks at 20-unit intervals (0, 20, 40, 60, 80, 100, 120, 140, 160, 180) */}
              {[0, 20, 40, 60, 80, 100, 120, 140, 160, 180].map((angle) => {
                const radians = (angle * Math.PI) / 180
                const outerX = 200 + 180 * Math.sin(radians)
                const outerY = 200 - 180 * Math.cos(radians)
                const innerX = 200 + 165 * Math.sin(radians)
                const innerY = 200 - 165 * Math.cos(radians)
                return (
                  <line
                    key={`major-${angle}`}
                    x1={outerX}
                    y1={outerY}
                    x2={innerX}
                    y2={innerY}
                    stroke="#000"
                    strokeWidth="2"
                  />
                )
              })}
              
              {/* Minor tick marks at 10-unit intervals */}
              {[10, 30, 50, 70, 90, 110, 130, 150, 170].map((angle) => {
                const radians = (angle * Math.PI) / 180
                const outerX = 200 + 180 * Math.sin(radians)
                const outerY = 200 - 180 * Math.cos(radians)
                const innerX = 200 + 172 * Math.sin(radians)
                const innerY = 200 - 172 * Math.cos(radians)
                return (
                  <line
                    key={`minor-${angle}`}
                    x1={outerX}
                    y1={outerY}
                    x2={innerX}
                    y2={innerY}
                    stroke="#000"
                    strokeWidth="1"
                  />
                )
              })}
              
              {/* Number labels at 20-unit intervals */}
              {[0, 20, 40, 60, 80, 100, 120, 140, 160, 180].map((angle) => {
                const radians = (angle * Math.PI) / 180
                const labelRadius = 155
                const labelX = 200 + labelRadius * Math.sin(radians)
                const labelY = 200 - labelRadius * Math.cos(radians)
                return (
                  <text
                    key={`label-${angle}`}
                    x={labelX}
                    y={labelY}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="12"
                    fill="#000"
                    fontWeight="500"
                  >
                    {angle}
                  </text>
                )
              })}
              
              {/* Red triangular pointer */}
              <defs>
                <marker
                  id="pointer-compact"
                  markerWidth="12"
                  markerHeight="12"
                  refX="10"
                  refY="3"
                  orient="auto"
                >
                  <polygon points="0 0, 12 3, 0 6" fill="#dc2626" stroke="#dc2626" strokeWidth="0.5" />
                </marker>
              </defs>
              
              <line
                x1="200"
                y1="200"
                x2={pointerX}
                y2={pointerY}
                stroke="#dc2626"
                strokeWidth="3"
                markerEnd="url(#pointer-compact)"
              />
              
              {/* Center point */}
              <circle cx="200" cy="200" r="4" fill="#dc2626" />
            </svg>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-100 rounded-lg p-6 max-w-2xl mx-auto border border-gray-300 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-gray-900">{eyeTypeLabel}</h3>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <div className="flex justify-center items-center mb-4">
        <div className="relative" style={{ width: '400px', height: '200px' }}>
          {/* SVG Gauge Diagram */}
          <svg
            viewBox="0 0 400 200"
            className="w-full h-full"
            style={{ maxWidth: '100%', height: 'auto' }}
          >
            {/* Semi-circle base line */}
            <line
              x1="0"
              y1="200"
              x2="400"
              y2="200"
              stroke="#000"
              strokeWidth="2"
            />
            
            {/* Outer arc */}
            <path
              d="M 20 200 A 180 180 0 0 1 380 200"
              fill="none"
              stroke="#000"
              strokeWidth="2"
            />
            
            {/* Major tick marks at 20-unit intervals (0, 20, 40, 60, 80, 100, 120, 140, 160, 180) */}
            {[0, 20, 40, 60, 80, 100, 120, 140, 160, 180].map((angle) => {
              const radians = (angle * Math.PI) / 180
              const outerX = 200 + 180 * Math.sin(radians)
              const outerY = 200 - 180 * Math.cos(radians)
              const innerX = 200 + 165 * Math.sin(radians)
              const innerY = 200 - 165 * Math.cos(radians)
              return (
                <line
                  key={`major-${angle}`}
                  x1={outerX}
                  y1={outerY}
                  x2={innerX}
                  y2={innerY}
                  stroke="#000"
                  strokeWidth="2"
                />
              )
            })}
            
            {/* Minor tick marks at 10-unit intervals */}
            {[10, 30, 50, 70, 90, 110, 130, 150, 170].map((angle) => {
              const radians = (angle * Math.PI) / 180
              const outerX = 200 + 180 * Math.sin(radians)
              const outerY = 200 - 180 * Math.cos(radians)
              const innerX = 200 + 172 * Math.sin(radians)
              const innerY = 200 - 172 * Math.cos(radians)
              return (
                <line
                  key={`minor-${angle}`}
                  x1={outerX}
                  y1={outerY}
                  x2={innerX}
                  y2={innerY}
                  stroke="#000"
                  strokeWidth="1"
                />
              )
            })}
            
            {/* Number labels at 20-unit intervals */}
            {[0, 20, 40, 60, 80, 100, 120, 140, 160, 180].map((angle) => {
              const radians = (angle * Math.PI) / 180
              const labelRadius = 155
              const labelX = 200 + labelRadius * Math.sin(radians)
              const labelY = 200 - labelRadius * Math.cos(radians)
              return (
                <text
                  key={`label-${angle}`}
                  x={labelX}
                  y={labelY}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="12"
                  fill="#000"
                  fontWeight="500"
                >
                  {angle}
                </text>
              )
            })}
            
            {/* Red triangular pointer */}
            <defs>
              <marker
                id="pointer-full"
                markerWidth="12"
                markerHeight="12"
                refX="10"
                refY="3"
                orient="auto"
              >
                <polygon points="0 0, 12 3, 0 6" fill="#dc2626" stroke="#dc2626" strokeWidth="0.5" />
              </marker>
            </defs>
            
            <line
              x1="200"
              y1="200"
              x2={pointerX}
              y2={pointerY}
              stroke="#dc2626"
              strokeWidth="3"
              markerEnd="url(#pointer-full)"
            />
            
            {/* Center point */}
            <circle cx="200" cy="200" r="4" fill="#dc2626" />
          </svg>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">How to read your axis:</h4>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>The axis is measured in degrees from 0° to 180°</li>
          <li>0° and 180° are the same (horizontal axis)</li>
          <li>90° is the vertical axis</li>
          <li>Find the axis value on your prescription and select it from the dropdown</li>
          <li>If you have astigmatism (CYL value), you must provide an axis value</li>
        </ul>
      </div>

      {onClose && (
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-950 text-white rounded-lg hover:bg-blue-900 transition-colors"
          >
            Close
          </button>
        </div>
      )}
    </div>
  )
}

export default AxisDiagram

