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
  axisValue = 0
}) => {
  // Calculate the rotation for the needle based on the axisValue
  // For the D-shape:
  // - Positive values (0 to +180): 0° at right, 90° at top, 180° at left
  // - Negative values (-180 to 0): 0° at right, -90° at bottom, -180° at left
  const needleRadians = (axisValue * Math.PI) / 180
  const needleLength = 160
  const needleX = 200 + needleLength * Math.cos(needleRadians)
  const needleY = 200 - needleLength * Math.sin(needleRadians)

  const eyeTypeLabel = eyeType === 'left' ? 'Left Eye' : eyeType === 'right' ? 'Right Eye' : 'Eye'

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

              {/* Major tick marks - Positive values (0 to +180) on top arc */}
              {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150, 160, 170, 180].map((angle) => {
                const radians = (angle * Math.PI) / 180
                
                // Tick marks on top arc
                const outerX = 200 + 180 * Math.cos(radians)
                const outerY = 200 - 180 * Math.sin(radians)
                const innerX = 200 + 165 * Math.cos(radians)
                const innerY = 200 - 165 * Math.sin(radians)

                return (
                  <line
                    key={`major-pos-${angle}`}
                    x1={outerX}
                    y1={outerY}
                    x2={innerX}
                    y2={innerY}
                    stroke="#000"
                    strokeWidth="2"
                  />
                )
              })}

              {/* Major tick marks - Negative values (-180 to -10) on bottom arc */}
              {[-180, -170, -160, -150, -140, -130, -120, -110, -100, -90, -80, -70, -60, -50, -40, -30, -20, -10].map((angle) => {
                const radians = (angle * Math.PI) / 180
                
                // Tick marks on bottom arc
                const outerX = 200 + 180 * Math.cos(radians)
                const outerY = 200 - 180 * Math.sin(radians)
                const innerX = 200 + 165 * Math.cos(radians)
                const innerY = 200 - 165 * Math.sin(radians)

                return (
                  <line
                    key={`major-neg-${angle}`}
                    x1={outerX}
                    y1={outerY}
                    x2={innerX}
                    y2={innerY}
                    stroke="#000"
                    strokeWidth="2"
                  />
                )
              })}

              {/* Minor tick marks at 5-unit intervals - Positive values on top arc */}
              {[5, 15, 25, 35, 45, 55, 65, 75, 85, 95, 105, 115, 125, 135, 145, 155, 165, 175].map((angle) => {
                const radians = (angle * Math.PI) / 180
                
                // Minor tick marks on top arc
                const outerX = 200 + 180 * Math.cos(radians)
                const outerY = 200 - 180 * Math.sin(radians)
                const innerX = 200 + 172 * Math.cos(radians)
                const innerY = 200 - 172 * Math.sin(radians)

                return (
                  <line
                    key={`minor-pos-${angle}`}
                    x1={outerX}
                    y1={outerY}
                    x2={innerX}
                    y2={innerY}
                    stroke="#000"
                    strokeWidth="1"
                  />
                )
              })}

              {/* Minor tick marks at 5-unit intervals - Negative values on bottom arc */}
              {[-175, -165, -155, -145, -135, -125, -115, -105, -95, -85, -75, -65, -55, -45, -35, -25, -15, -5].map((angle) => {
                const radians = (angle * Math.PI) / 180
                
                // Minor tick marks on bottom arc
                const outerX = 200 + 180 * Math.cos(radians)
                const outerY = 200 - 180 * Math.sin(radians)
                const innerX = 200 + 172 * Math.cos(radians)
                const innerY = 200 - 172 * Math.sin(radians)

                return (
                  <line
                    key={`minor-neg-${angle}`}
                    x1={outerX}
                    y1={outerY}
                    x2={innerX}
                    y2={innerY}
                    stroke="#000"
                    strokeWidth="1"
                  />
                )
              })}

              {/* Number labels - Positive values (0° to +180°) on top arc */}
              {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150, 160, 170, 180].map((angle) => {
                const radians = (angle * Math.PI) / 180
                let labelRadius = 145
                let labelX: number
                let labelY: number
                
                // Special positioning for 0 and 180
                if (angle === 0) {
                  // 0° positioned slightly to the right of center
                  labelX = 210
                  labelY = 195
                } else if (angle === 180) {
                  // 180° positioned slightly to the left of center
                  labelX = 190
                  labelY = 195
                } else {
                  // All other positive angles on the top arc
                  labelX = 200 + labelRadius * Math.cos(radians)
                  labelY = 200 - labelRadius * Math.sin(radians)
                }
                
                return (
                  <text
                    key={`label-pos-${angle}`}
                    x={labelX}
                    y={labelY}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="12"
                    fill="#000"
                    fontWeight="500"
                  >
                    {angle > 0 ? `+${angle}°` : '0°'}
                  </text>
                )
              })}

              {/* Number labels - Negative values (-180° to -10°) on bottom arc */}
              {[-180, -170, -160, -150, -140, -130, -120, -110, -100, -90, -80, -70, -60, -50, -40, -30, -20, -10].map((angle) => {
                const radians = (angle * Math.PI) / 180
                let labelRadius = 145
                let labelX: number
                let labelY: number
                
                // Special positioning for -180
                if (angle === -180) {
                  // -180° positioned slightly to the left of center, below baseline
                  labelX = 190
                  labelY = 215
                } else {
                  // All other negative angles on the bottom arc
                  labelX = 200 + labelRadius * Math.cos(radians)
                  labelY = 200 - labelRadius * Math.sin(radians)
                }
                
                return (
                  <text
                    key={`label-neg-${angle}`}
                    x={labelX}
                    y={labelY}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="12"
                    fill="#000"
                    fontWeight="500"
                  >
                    {angle}°
                  </text>
                )
              })}
              
              {/* Base line label */}
              <text
                x="200"
                y="220"
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="14"
                fill="#000"
                fontWeight="bold"
              >
                Base line
              </text>
              
              {/* Centre label */}
              <text
                x="200"
                y="240"
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="12"
                fill="#000"
                fontWeight="500"
              >
                Centre
              </text>

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

              {/* Only show needle when axisValue is not 0 */}
              {axisValue !== 0 && (
                <line
                  x1="200"
                  y1="200"
                  x2={needleX}
                  y2={needleY}
                  stroke="#dc2626"
                  strokeWidth="3"
                  markerEnd="url(#pointer-compact)"
                />
              )}

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

            {/* Major tick marks - Positive values (0 to +180) on top arc */}
            {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150, 160, 170, 180].map((angle) => {
              const radians = (angle * Math.PI) / 180
              
              // Tick marks on top arc
              const outerX = 200 + 180 * Math.cos(radians)
              const outerY = 200 - 180 * Math.sin(radians)
              const innerX = 200 + 165 * Math.cos(radians)
              const innerY = 200 - 165 * Math.sin(radians)

              return (
                <line
                  key={`major-pos-${angle}`}
                  x1={outerX}
                  y1={outerY}
                  x2={innerX}
                  y2={innerY}
                  stroke="#000"
                  strokeWidth="2"
                />
              )
            })}

            {/* Major tick marks - Negative values (-180 to -10) on bottom arc */}
            {[-180, -170, -160, -150, -140, -130, -120, -110, -100, -90, -80, -70, -60, -50, -40, -30, -20, -10].map((angle) => {
              const radians = (angle * Math.PI) / 180
              
              // Tick marks on bottom arc
              const outerX = 200 + 180 * Math.cos(radians)
              const outerY = 200 - 180 * Math.sin(radians)
              const innerX = 200 + 165 * Math.cos(radians)
              const innerY = 200 - 165 * Math.sin(radians)

              return (
                <line
                  key={`major-neg-${angle}`}
                  x1={outerX}
                  y1={outerY}
                  x2={innerX}
                  y2={innerY}
                  stroke="#000"
                  strokeWidth="2"
                />
              )
            })}

            {/* Minor tick marks at 5-unit intervals - Positive values on top arc */}
            {[5, 15, 25, 35, 45, 55, 65, 75, 85, 95, 105, 115, 125, 135, 145, 155, 165, 175].map((angle) => {
              const radians = (angle * Math.PI) / 180
              
              // Minor tick marks on top arc
              const outerX = 200 + 180 * Math.cos(radians)
              const outerY = 200 - 180 * Math.sin(radians)
              const innerX = 200 + 172 * Math.cos(radians)
              const innerY = 200 - 172 * Math.sin(radians)

              return (
                <line
                  key={`minor-pos-${angle}`}
                  x1={outerX}
                  y1={outerY}
                  x2={innerX}
                  y2={innerY}
                  stroke="#000"
                  strokeWidth="1"
                />
              )
            })}

            {/* Minor tick marks at 5-unit intervals - Negative values on bottom arc */}
            {[-175, -165, -155, -145, -135, -125, -115, -105, -95, -85, -75, -65, -55, -45, -35, -25, -15, -5].map((angle) => {
              const radians = (angle * Math.PI) / 180
              
              // Minor tick marks on bottom arc
              const outerX = 200 + 180 * Math.cos(radians)
              const outerY = 200 - 180 * Math.sin(radians)
              const innerX = 200 + 172 * Math.cos(radians)
              const innerY = 200 - 172 * Math.sin(radians)

              return (
                <line
                  key={`minor-neg-${angle}`}
                  x1={outerX}
                  y1={outerY}
                  x2={innerX}
                  y2={innerY}
                  stroke="#000"
                  strokeWidth="1"
                />
              )
            })}

            {/* Number labels - Positive values (0° to +180°) on top arc */}
            {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150, 160, 170, 180].map((angle) => {
              const radians = (angle * Math.PI) / 180
              let labelRadius = 145
              let labelX: number
              let labelY: number
              
              // Special positioning for 0 and 180
              if (angle === 0) {
                // 0° positioned slightly to the right of center
                labelX = 210
                labelY = 195
              } else if (angle === 180) {
                // 180° positioned slightly to the left of center
                labelX = 190
                labelY = 195
              } else {
                // All other positive angles on the top arc
                labelX = 200 + labelRadius * Math.cos(radians)
                labelY = 200 - labelRadius * Math.sin(radians)
              }
              
              return (
                <text
                  key={`label-pos-${angle}`}
                  x={labelX}
                  y={labelY}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="12"
                  fill="#000"
                  fontWeight="500"
                >
                  {angle > 0 ? `+${angle}°` : '0°'}
                </text>
              )
            })}

            {/* Number labels - Negative values (-180° to -10°) on bottom arc */}
            {[-180, -170, -160, -150, -140, -130, -120, -110, -100, -90, -80, -70, -60, -50, -40, -30, -20, -10].map((angle) => {
              const radians = (angle * Math.PI) / 180
              let labelRadius = 145
              let labelX: number
              let labelY: number
              
              // Special positioning for -180
              if (angle === -180) {
                // -180° positioned slightly to the left of center, below baseline
                labelX = 190
                labelY = 215
              } else {
                // All other negative angles on the bottom arc
                labelX = 200 + labelRadius * Math.cos(radians)
                labelY = 200 - labelRadius * Math.sin(radians)
              }
              
              return (
                <text
                  key={`label-neg-${angle}`}
                  x={labelX}
                  y={labelY}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="12"
                  fill="#000"
                  fontWeight="500"
                >
                  {angle}°
                </text>
              )
            })}
            
            {/* Base line label */}
            <text
              x="200"
              y="220"
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="14"
              fill="#000"
              fontWeight="bold"
            >
              Base line
            </text>
            
            {/* Centre label */}
            <text
              x="200"
              y="240"
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="12"
              fill="#000"
              fontWeight="500"
            >
              Centre
            </text>

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

            {/* Only show needle when axisValue is not 0 */}
            {axisValue !== 0 && (
              <line
                x1="200"
                y1="200"
                x2={needleX}
                y2={needleY}
                stroke="#dc2626"
                strokeWidth="3"
                markerEnd="url(#pointer-full)"
              />
            )}

            {/* Center point */}
            <circle cx="200" cy="200" r="4" fill="#dc2626" />
          </svg>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">How to read your axis:</h4>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>The axis is measured in degrees from -180° to +180°</li>
          <li>Positive values (0° to +180°) are shown on the upper arc</li>
          <li>Negative values (-180° to 0°) are shown on the lower arc</li>
          <li>0° is at the right center, +90° is at the top, -90° is at the bottom</li>
          <li>The red needle points to your selected axis value</li>
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

