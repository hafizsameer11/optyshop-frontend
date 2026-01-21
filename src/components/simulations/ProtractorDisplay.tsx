import React from 'react'

interface ProtractorDisplayProps {
  className?: string
  size?: number
  title?: string
  angle?: number // Angle indicator in degrees
}

const ProtractorDisplay: React.FC<ProtractorDisplayProps> = ({ 
  className = '', 
  size = 300,
  title = 'Eye Measurement',
  angle = 45
}) => {
  const centerX = size / 2
  const centerY = size / 2
  const radius = size / 2 - 30

  // Generate degree markings for relevant arc only
  const generateMarkings = () => {
    const markings = []
    
    // Determine if we should show positive or negative arc
    const isNegativeAngle = angle < 0
    
    // Generate markings for relevant arc only
    if (isNegativeAngle) {
      // Show negative arc (upper half): -10° to -170°
      for (let i = 190; i < 350; i += 10) {
        const displayAngle = -(360 - i)
        const radian = (i * Math.PI) / 180
        const x1 = centerX + (radius - 8) * Math.cos(radian)
        const y1 = centerY - (radius - 8) * Math.sin(radian)
        const x2 = centerX + radius * Math.cos(radian)
        const y2 = centerY - radius * Math.sin(radian)
        
        // Calculate text position
        const textRadius = radius + 20
        const textX = centerX + textRadius * Math.cos(radian)
        const textY = centerY - textRadius * Math.sin(radian)
        
        markings.push({
          type: 'marking',
          x1, y1, x2, y2,
          text: `${displayAngle}°`,
          textX, textY,
          isNegative: true
        })
      }
    } else {
      // Show positive arc (lower half): +10° to +170°
      for (let i = 10; i <= 170; i += 10) {
        const radian = (i * Math.PI) / 180
        const x1 = centerX + (radius - 8) * Math.cos(radian)
        const y1 = centerY - (radius - 8) * Math.sin(radian)
        const x2 = centerX + radius * Math.cos(radian)
        const y2 = centerY - radius * Math.sin(radian)
        
        // Calculate text position
        const textRadius = radius + 20
        const textX = centerX + textRadius * Math.cos(radian)
        const textY = centerY - textRadius * Math.sin(radian)
        
        markings.push({
          type: 'marking',
          x1, y1, x2, y2,
          text: `+${i}°`,
          textX, textY,
          isNegative: false
        })
      }
    }
    
    return markings
  }

  const markings = generateMarkings()
  
  // Calculate angle indicator line position
  let angleRadian: number
  if (angle < 0) {
    // Convert negative angle to positive radian for upper arc
    angleRadian = ((360 + angle) * Math.PI) / 180
  } else {
    // Positive angle for lower arc
    angleRadian = (angle * Math.PI) / 180
  }
  const indicatorX = centerX + (radius - 15) * Math.cos(angleRadian)
  const indicatorY = centerY - (radius - 15) * Math.sin(angleRadian)

  return (
    <div className={`bg-white border-2 border-gray-300 rounded-lg p-4 ${className}`}>
      {title && (
        <h3 className="text-center text-lg font-semibold text-gray-800 mb-4">
          {title}
        </h3>
      )}
      <div className="flex items-center justify-center">
        <svg 
          width={size} 
          height={size} 
          viewBox={`0 0 ${size} ${size}`}
          className="overflow-visible"
        >
        {/* Arc path instead of full circle */}
        <path
          d={angle < 0 
            ? `M ${centerX + radius} ${centerY} A ${radius} ${radius} 0 1 1 ${centerX - radius * Math.cos(10 * Math.PI / 180)} ${centerY - radius * Math.sin(10 * Math.PI / 180)}`
            : `M ${centerX + radius} ${centerY} A ${radius} ${radius} 0 0 1 ${centerX - radius * Math.cos(10 * Math.PI / 180)} ${centerY + radius * Math.sin(10 * Math.PI / 180)}`
          }
          fill="none"
          stroke="#374151"
          strokeWidth="2"
        />
        
        {/* Horizontal base line */}
        <line
          x1={centerX - radius - 10}
          y1={centerY}
          x2={centerX + radius + 10}
          y2={centerY}
          stroke="#374151"
          strokeWidth="2"
        />
        
        {/* Vertical line */}
        <line
          x1={centerX}
          y1={centerY - radius - 10}
          x2={centerX}
          y2={centerY + radius + 10}
          stroke="#374151"
          strokeWidth="1"
          strokeDasharray="5,5"
        />
        
        {/* Degree markings and labels */}
        {markings.map((marking, index) => (
          <g key={index}>
            {/* Marking line */}
            <line
              x1={marking.x1}
              y1={marking.y1}
              x2={marking.x2}
              y2={marking.y2}
              stroke="#374151"
              strokeWidth="1"
            />
            
            {/* Degree label */}
            <text
              x={marking.textX}
              y={marking.textY}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="10"
              fill={marking.isNegative ? "#ef4444" : "#10b981"}
              fontWeight="500"
            >
              {marking.text}
            </text>
          </g>
        ))}
        
        {/* Angle indicator line */}
        <line
          x1={centerX}
          y1={centerY}
          x2={indicatorX}
          y2={indicatorY}
          stroke="#ef4444"
          strokeWidth="3"
          markerEnd="url(#arrowhead)"
        />
        
        {/* Arrow marker definition */}
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="10"
            refX="9"
            refY="3"
            orient="auto"
          >
            <polygon
              points="0 0, 10 3, 0 6"
              fill="#ef4444"
            />
          </marker>
        </defs>
        
        {/* Center dot */}
        <circle
          cx={centerX}
          cy={centerY}
          r="4"
          fill="#ef4444"
        />
        
        {/* Labels */}
        <text
          x={centerX + radius + 25}
          y={centerY + 5}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="12"
          fill="#374151"
          fontWeight="500"
        >
          Base line
        </text>
        
        <text
          x={centerX}
          y={centerY + radius + 25}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="12"
          fill="#374151"
          fontWeight="500"
        >
          Centre
        </text>
        
        {/* Angle display */}
        <text
          x={centerX}
          y={centerY - radius - 25}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="14"
          fill="#ef4444"
          fontWeight="bold"
        >
          {angle}°
        </text>
      </svg>
      </div>
    </div>
  )
}

export default ProtractorDisplay
