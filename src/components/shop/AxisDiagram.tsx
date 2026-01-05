import React from 'react'

interface AxisDiagramProps {
  onClose?: () => void
  compact?: boolean
}

const AxisDiagram: React.FC<AxisDiagramProps> = ({ onClose, compact = false }) => {
  if (compact) {
    return (
      <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
        <div className="flex justify-center items-center">
          <div className="relative" style={{ width: '280px', height: '140px' }}>
            {/* SVG Protractor Diagram */}
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
            
            {/* Center point */}
            <circle cx="200" cy="200" r="3" fill="#000" />
            
            {/* Radial lines */}
            {[0, 30, 60, 90, 120, 150, 180].map((angle, index) => {
              const radians = (angle * Math.PI) / 180
              const x = 200 + 180 * Math.sin(radians)
              const y = 200 - 180 * Math.cos(radians)
              return (
                <line
                  key={angle}
                  x1="200"
                  y1="200"
                  x2={x}
                  y2={y}
                  stroke="#000"
                  strokeWidth="1"
                />
              )
            })}
            
            {/* Additional radial lines for more detail */}
            {[15, 45, 75, 105, 135, 165].map((angle) => {
              const radians = (angle * Math.PI) / 180
              const x = 200 + 180 * Math.sin(radians)
              const y = 200 - 180 * Math.cos(radians)
              return (
                <line
                  key={angle}
                  x1="200"
                  y1="200"
                  x2={x}
                  y2={y}
                  stroke="#ccc"
                  strokeWidth="0.5"
                  strokeDasharray="2,2"
                />
              )
            })}
            
            {/* Outer arc with angle labels */}
            <path
              d="M 20 200 A 180 180 0 0 1 380 200"
              fill="none"
              stroke="#000"
              strokeWidth="2"
            />
            
            {/* Angle labels on outer arc */}
            {[
              { angle: 0, label: '0°', x: 20, y: 200 },
              { angle: 30, label: '30°', x: 95, y: 44 },
              { angle: 60, label: '60°', x: 246, y: 44 },
              { angle: 90, label: '90°', x: 200, y: 20 },
              { angle: 120, label: '120°', x: 154, y: 44 },
              { angle: 150, label: '150°', x: 305, y: 44 },
              { angle: 180, label: '180°', x: 380, y: 200 },
            ].map(({ label, x, y }) => (
              <text
                key={label}
                x={x}
                y={y + 5}
                textAnchor="middle"
                fontSize="14"
                fill="#000"
                fontWeight="bold"
              >
                {label}
              </text>
            ))}
            
            {/* Example arrow pointing to ~90 degrees */}
            <defs>
              <marker
                id="arrowhead-compact"
                markerWidth="8"
                markerHeight="8"
                refX="7"
                refY="2.5"
                orient="auto"
              >
                <polygon points="0 0, 8 2.5, 0 5" fill="#3b82f6" />
              </marker>
            </defs>
            <line
              x1="200"
              y1="200"
              x2="200"
              y2="20"
              stroke="#3b82f6"
              strokeWidth="2.5"
              markerEnd="url(#arrowhead-compact)"
            />
          </svg>
        </div>
        </div>
        <p className="text-xs text-center text-gray-600 mt-3 font-medium">Current Axis: 90°</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg p-6 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-gray-900">Axis of Astigmatism</h3>
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
      
      <div className="mb-4">
        <p className="text-sm text-gray-600 mb-4">
          The axis indicates the orientation of astigmatism in your eye. Use this diagram to find the correct axis value from your prescription.
        </p>
      </div>

      <div className="flex justify-center items-center mb-4">
        <div className="relative" style={{ width: '400px', height: '200px' }}>
          {/* SVG Protractor Diagram */}
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
            
            {/* Center point */}
            <circle cx="200" cy="200" r="3" fill="#000" />
            
            {/* Radial lines */}
            {[0, 30, 60, 90, 120, 150, 180].map((angle, index) => {
              const radians = (angle * Math.PI) / 180
              const x = 200 + 180 * Math.sin(radians)
              const y = 200 - 180 * Math.cos(radians)
              return (
                <line
                  key={angle}
                  x1="200"
                  y1="200"
                  x2={x}
                  y2={y}
                  stroke="#000"
                  strokeWidth="1"
                />
              )
            })}
            
            {/* Additional radial lines for more detail */}
            {[15, 45, 75, 105, 135, 165].map((angle) => {
              const radians = (angle * Math.PI) / 180
              const x = 200 + 180 * Math.sin(radians)
              const y = 200 - 180 * Math.cos(radians)
              return (
                <line
                  key={angle}
                  x1="200"
                  y1="200"
                  x2={x}
                  y2={y}
                  stroke="#ccc"
                  strokeWidth="0.5"
                  strokeDasharray="2,2"
                />
              )
            })}
            
            {/* Outer arc with angle labels */}
            <path
              d="M 20 200 A 180 180 0 0 1 380 200"
              fill="none"
              stroke="#000"
              strokeWidth="2"
            />
            
            {/* Angle labels on outer arc */}
            {[
              { angle: 0, label: '0°', x: 20, y: 200 },
              { angle: 30, label: '30°', x: 95, y: 44 },
              { angle: 60, label: '60°', x: 246, y: 44 },
              { angle: 90, label: '90°', x: 200, y: 20 },
              { angle: 120, label: '120°', x: 154, y: 44 },
              { angle: 150, label: '150°', x: 305, y: 44 },
              { angle: 180, label: '180°', x: 380, y: 200 },
            ].map(({ label, x, y }) => (
              <text
                key={label}
                x={x}
                y={y + 5}
                textAnchor="middle"
                fontSize="14"
                fill="#000"
                fontWeight="bold"
              >
                {label}
              </text>
            ))}
            
            {/* Example arrow pointing to ~20-25 degrees */}
            <defs>
              <marker
                id="arrowhead"
                markerWidth="10"
                markerHeight="10"
                refX="9"
                refY="3"
                orient="auto"
              >
                <polygon points="0 0, 10 3, 0 6" fill="#3b82f6" />
              </marker>
            </defs>
            <line
              x1="200"
              y1="200"
              x2="270"
              y2="60"
              stroke="#3b82f6"
              strokeWidth="3"
              markerEnd="url(#arrowhead)"
            />
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

