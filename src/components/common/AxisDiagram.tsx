import React, { useState, useEffect, useRef } from 'react'

interface AxisDiagramProps {
  value?: number
  onChange?: (value: number) => void
  min?: number
  max?: number
  disabled?: boolean
  size?: number
  showDualScale?: boolean
  notation?: 'INT' | 'TABO'
}

const AxisDiagram: React.FC<AxisDiagramProps> = ({
  value = 0,
  onChange,
  min = -180,
  max = 180,
  disabled = false,
  size = 400,
  showDualScale = false,
  notation = 'INT'
}) => {
  const [currentValue, setCurrentValue] = useState(value)
  const [isDragging, setIsDragging] = useState(false)
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    setCurrentValue(value)
  }, [value])

  // Normalize axis value to 0-180 range for semi-circular display
  const normalizeAxis = (value: number): number => {
    if (value < 0) {
      // Convert negative values: -179 → 1, -90 → 90, -1 → 179
      return 180 + value
    }
    if (value > 180) {
      // Wrap values > 180: 181 → 1, 270 → 90
      return value % 180
    }
    return value
  }

  // Convert axis value to angle for semi-circular protractor
  const axisToAngle = (axisValue: number): number => {
    const normalized = normalizeAxis(axisValue)
    return (normalized * Math.PI) / 180
  }

  // Convert angle to axis value
  const angleToAxis = (angle: number): number => {
    let degrees = (angle * 180) / Math.PI
    
    // Normalize to 0-180 range for semi-circle
    if (degrees < 0) degrees = 0
    if (degrees > 180) degrees = 180
    
    return Math.round(degrees)
  }

  const svgWidth = size
  const svgHeight = size * 0.625 // 5:8 ratio for semi-circle
  const centerX = svgWidth / 2
  const centerY = svgHeight - 50
  const radius = size * 0.35

  // Calculate needle position
  const normalizedValue = normalizeAxis(currentValue)
  const angleRad = axisToAngle(normalizedValue)
  const arrowLength = radius - 5
  const arrowX = centerX + Math.cos(angleRad) * arrowLength
  const arrowY = centerY - Math.sin(angleRad) * arrowLength

  // Generate semi-circular arc path
  const generateArcPath = (r: number) => {
    const startAngle = 0 // 0 degrees (bottom right)
    const endAngle = Math.PI // 180 degrees (bottom left)
    const startX = centerX + r * Math.cos(startAngle)
    const startY = centerY - r * Math.sin(startAngle)
    const endX = centerX + r * Math.cos(endAngle)
    const endY = centerY - r * Math.sin(endAngle)
    return `M ${startX} ${startY} A ${r} ${r} 0 0 0 ${endX} ${endY}`
  }

  // Generate concentric arcs for grid
  const concentricArcs = []
  for (let i = 1; i <= 6; i++) {
    const arcRadius = radius * (i / 6)
    concentricArcs.push(
      <path
        key={`arc-${i}`}
        d={generateArcPath(arcRadius)}
        fill="none"
        stroke={i === 6 ? "#999" : "#ccc"}
        strokeWidth={i === 6 ? "1" : "0.8"}
      />
    )
  }

  // Generate radial lines
  const radialLines = []
  for (let deg = 0; deg <= 180; deg += 10) {
    const angle = (deg * Math.PI) / 180
    const isMainLine = deg % 30 === 0
    const x = centerX + Math.cos(angle) * radius
    const y = centerY - Math.sin(angle) * radius
    
    radialLines.push(
      <line
        key={`radial-${deg}`}
        x1={centerX}
        y1={centerY}
        x2={x}
        y2={y}
        stroke={isMainLine ? "#333" : "#aaa"}
        strokeWidth={isMainLine ? "1.8" : "1"}
      />
    )
  }

  // Generate degree markings and labels
  const degreeMarkings = []
  for (let deg = 0; deg <= 180; deg += 10) {
    const angle = (deg * Math.PI) / 180
    const isMainMark = deg % 30 === 0
    const markLength = isMainMark ? 10 : 5
    const markX1 = centerX + Math.cos(angle) * radius
    const markY1 = centerY - Math.sin(angle) * radius
    const markX2 = centerX + Math.cos(angle) * (radius - markLength)
    const markY2 = centerY - Math.sin(angle) * (radius - markLength)
    
    degreeMarkings.push(
      <line
        key={`mark-${deg}`}
        x1={markX1}
        y1={markY1}
        x2={markX2}
        y2={markY2}
        stroke="#000"
        strokeWidth={isMainMark ? "3.5" : "2.5"}
      />
    )

    // Outer scale labels (INT scale: 0-180)
    const labelRadius = radius + 28
    const labelX = centerX + Math.cos(angle) * labelRadius
    const labelY = centerY - Math.sin(angle) * labelRadius
    
    degreeMarkings.push(
      <text
        key={`label-outer-${deg}`}
        x={labelX}
        y={labelY}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={isMainMark ? "22" : "16"}
        fill="#000"
        fontWeight={isMainMark ? "bold" : "600"}
        fontFamily="Arial, sans-serif"
      >
        {deg}
      </text>
    )
    
    // Inner scale labels (TABO) - if dual scale is enabled
    if (showDualScale) {
      const taboValue = 180 - deg
      const innerLabelRadius = radius - 38
      const innerLabelX = centerX + Math.cos(angle) * innerLabelRadius
      const innerLabelY = centerY - Math.sin(angle) * innerLabelRadius
      
      degreeMarkings.push(
        <text
          key={`label-inner-${deg}`}
          x={innerLabelX}
          y={innerLabelY}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={isMainMark ? "18" : "14"}
          fill={isMainMark ? "#444" : "#999"}
          fontWeight={isMainMark ? "600" : "normal"}
          fontFamily="Arial, sans-serif"
        >
          {taboValue}
        </text>
      )
    }
  }

  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (disabled) return
    setIsDragging(true)
    updateValue(e)
  }

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!isDragging || disabled) return
    updateValue(e)
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const updateValue = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return
    
    const rect = svgRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left - centerX
    const y = e.clientY - rect.top - centerY
    
    // Calculate distance from center to check if click is within protractor area
    const distance = Math.sqrt(x * x + y * y)
    if (distance > radius + 20 || distance < 10) {
      return // Outside valid area
    }
    
    // Calculate angle from center
    let angle = Math.atan2(-y, x) // Negative y because SVG y increases downward
    
    // Convert to degrees (0-180 range for semi-circle)
    let degrees = (angle * 180) / Math.PI
    
    // Normalize to 0-180 range
    if (degrees < 0) degrees = 0
    if (degrees > 180) degrees = 180
    
    const newAxisValue = Math.round(degrees)
    
    setCurrentValue(newAxisValue)
    onChange?.(newAxisValue)
  }

  useEffect(() => {
    const handleGlobalMouseUp = () => setIsDragging(false)
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!isDragging || disabled || !svgRef.current) return
      
      const rect = svgRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left - centerX
      const y = e.clientY - rect.top - centerY
      
      // Calculate distance from center
      const distance = Math.sqrt(x * x + y * y)
      if (distance > radius + 20 || distance < 10) {
        return // Outside valid area
      }
      
      let angle = Math.atan2(-y, x)
      let degrees = (angle * 180) / Math.PI
      
      if (degrees < 0) degrees = 0
      if (degrees > 180) degrees = 180
      
      const newAxisValue = Math.round(degrees)
      
      setCurrentValue(newAxisValue)
      onChange?.(newAxisValue)
    }

    if (isDragging) {
      document.addEventListener('mouseup', handleGlobalMouseUp)
      document.addEventListener('mousemove', handleGlobalMouseMove)
    }

    return () => {
      document.removeEventListener('mouseup', handleGlobalMouseUp)
      document.removeEventListener('mousemove', handleGlobalMouseMove)
    }
  }, [isDragging, disabled, onChange])

  return (
    <div className="flex flex-col items-center space-y-2">
      <svg
        ref={svgRef}
        width={svgWidth}
        height={svgHeight}
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        preserveAspectRatio="xMidYMid meet"
        className={`cursor-pointer ${disabled ? 'opacity-50' : ''}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        style={{ userSelect: 'none' }}
      >
        <defs>
          <marker
            id="arrowhead"
            markerWidth="14"
            markerHeight="14"
            refX="12"
            refY="7"
            orient="auto"
          >
            <polygon
              points="0 0, 14 7, 0 14"
              fill="#2563eb"
            />
          </marker>
        </defs>

        {/* Background */}
        <rect width={svgWidth} height={svgHeight} fill="white" />
        
        {/* Concentric arcs */}
        {concentricArcs}
        
        {/* Radial lines */}
        {radialLines}
        
        {/* Outer semi-circular arc - main border */}
        <path
          d={generateArcPath(radius)}
          fill="none"
          stroke="#000"
          strokeWidth="3"
        />
        
        {/* Degree markings */}
        {degreeMarkings}
        
        {/* Center point */}
        <circle
          cx={centerX}
          cy={centerY}
          r="6"
          fill="#000"
          stroke="#fff"
          strokeWidth="2"
        />
        
        {/* Arrow pointing to axis value */}
        <line
          x1={centerX}
          y1={centerY}
          x2={arrowX}
          y2={arrowY}
          stroke="#2563eb"
          strokeWidth="6"
          markerEnd="url(#arrowhead)"
          style={{ pointerEvents: 'none' }}
        />
        
        {/* 0° label below the diagram at center */}
        <text
          x={centerX}
          y={centerY + 45}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="22"
          fill="#333"
          fontFamily="Arial, sans-serif"
          fontWeight="600"
        >
          0°
        </text>
        
        {/* Notation labels */}
        {notation === 'INT' && (
          <text
            x={centerX + radius + 30}
            y={centerY + 15}
            fontSize="22"
            fill="#000"
            fontWeight="700"
            fontFamily="Arial, sans-serif"
            textAnchor="start"
          >
            INT.
          </text>
        )}
        
        {notation === 'TABO' && (
          <text
            x={centerX - radius - 30}
            y={centerY + 15}
            fontSize="22"
            fill="#000"
            fontWeight="700"
            fontFamily="Arial, sans-serif"
            textAnchor="end"
          >
            TABO
          </text>
        )}
      </svg>
      
      <div className="text-center">
        <div className="text-2xl font-bold text-gray-800">{normalizedValue}°</div>
        <div className="text-sm text-gray-500">
          {notation === 'INT' ? 'International System' : 'TABO System'}
        </div>
      </div>
    </div>
  )
}

export default AxisDiagram;
