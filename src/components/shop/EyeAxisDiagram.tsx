import React, { useState, useRef, useEffect } from 'react'

interface EyeAxisDiagramProps {
  rightEyeAxis?: number
  leftEyeAxis?: number
  compact?: boolean
  onRightEyeAxisChange?: (value: number) => void
  onLeftEyeAxisChange?: (value: number) => void
  interactive?: boolean
}

const EyeAxisDiagram: React.FC<EyeAxisDiagramProps> = ({
  rightEyeAxis = 0,
  leftEyeAxis = 30,
  compact = false,
  onRightEyeAxisChange,
  onLeftEyeAxisChange,
  interactive
}) => {
  // Auto-enable interactive mode if onChange handlers are provided
  const isInteractive = interactive !== undefined ? interactive : !!(onRightEyeAxisChange || onLeftEyeAxisChange)
  const [localRightAxis, setLocalRightAxis] = useState(rightEyeAxis)
  const [localLeftAxis, setLocalLeftAxis] = useState(leftEyeAxis)
  const [isDragging, setIsDragging] = useState<'right' | 'left' | null>(null)
  const rightSvgRef = useRef<SVGSVGElement>(null)
  const leftSvgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    setLocalRightAxis(rightEyeAxis)
  }, [rightEyeAxis])

  useEffect(() => {
    setLocalLeftAxis(leftEyeAxis)
  }, [leftEyeAxis])

  const svgWidth = 220
  const svgHeight = 130
  const centerX = svgWidth / 2
  const centerY = svgHeight - 5
  const radius = 105

  const calculateAxisFromPoint = (clientX: number, clientY: number, svgElement: SVGSVGElement, eyeType: 'right' | 'left'): number => {
    const rect = svgElement.getBoundingClientRect()
    const x = clientX - rect.left - centerX
    const y = clientY - rect.top - centerY
    
    // Calculate distance from center to check if click is within protractor area
    const distance = Math.sqrt(x * x + y * y)
    if (distance > radius + 20 || distance < 10) {
      // Click is outside the protractor area, don't update
      return eyeType === 'right' ? localRightAxis : localLeftAxis
    }
    
    // Calculate angle from center
    // For semi-circular protractor: 0° is at bottom right (angle 0), 180° is at bottom left (angle π)
    let angle = Math.atan2(-y, x) // Negative y because SVG y increases downward
    
    // Convert to degrees (0-180 range for semi-circle)
    let degrees = (angle * 180) / Math.PI
    
    // Normalize to 0-180 range
    if (degrees < 0) degrees = 0
    if (degrees > 180) degrees = 180
    
    // Round to nearest degree for better snapping
    return Math.round(degrees)
  }

  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>, eyeType: 'right' | 'left') => {
    if (!isInteractive) return
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(eyeType)
    const svgElement = e.currentTarget
    const newAxis = calculateAxisFromPoint(e.clientX, e.clientY, svgElement, eyeType)
    
    if (eyeType === 'right') {
      setLocalRightAxis(newAxis)
      onRightEyeAxisChange?.(newAxis)
    } else {
      setLocalLeftAxis(newAxis)
      onLeftEyeAxisChange?.(newAxis)
    }
  }

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>, eyeType: 'right' | 'left') => {
    if (!isInteractive || !isDragging || isDragging !== eyeType) return
    e.preventDefault()
    const svgElement = e.currentTarget
    const newAxis = calculateAxisFromPoint(e.clientX, e.clientY, svgElement, eyeType)
    
    if (eyeType === 'right') {
      setLocalRightAxis(newAxis)
      onRightEyeAxisChange?.(newAxis)
    } else {
      setLocalLeftAxis(newAxis)
      onLeftEyeAxisChange?.(newAxis)
    }
  }

  const handleMouseUp = () => {
    setIsDragging(null)
  }

  useEffect(() => {
    if (isDragging) {
      const handleGlobalMouseMove = (e: MouseEvent) => {
        if (!isDragging) return
        const svgElement = isDragging === 'right' ? rightSvgRef.current : leftSvgRef.current
        if (!svgElement) return
        
        const newAxis = calculateAxisFromPoint(e.clientX, e.clientY, svgElement, isDragging)
        
        if (isDragging === 'right') {
          setLocalRightAxis(newAxis)
          onRightEyeAxisChange?.(newAxis)
        } else {
          setLocalLeftAxis(newAxis)
          onLeftEyeAxisChange?.(newAxis)
        }
      }

      const handleGlobalMouseUp = () => {
        setIsDragging(null)
      }

      document.addEventListener('mousemove', handleGlobalMouseMove)
      document.addEventListener('mouseup', handleGlobalMouseUp)

      return () => {
        document.removeEventListener('mousemove', handleGlobalMouseMove)
        document.removeEventListener('mouseup', handleGlobalMouseUp)
      }
    }
  }, [isDragging, onRightEyeAxisChange, onLeftEyeAxisChange])

  const generateProtractor = (axisValue: number, eyeType: 'right' | 'left', svgRef: React.RefObject<SVGSVGElement | null>) => {
    // Convert axis value to angle for semi-circular protractor
    // 0° is at bottom right, 180° is at bottom left
    // In SVG: 0° = 0 radians (pointing right), 180° = π radians (pointing left)
    const angleRad = (axisValue * Math.PI) / 180
    
    // Calculate arrow position (pointing from center towards the axis value on the outer scale)
    const arrowLength = radius + 5
    const arrowX = centerX + Math.cos(angleRad) * arrowLength
    const arrowY = centerY - Math.sin(angleRad) * arrowLength

    // Generate semi-circular arc path (from 0° to 180°)
    const generateArcPath = (r: number) => {
      const startAngle = 0 // 0 degrees (bottom right)
      const endAngle = Math.PI // 180 degrees (bottom left)
      const startX = centerX + r * Math.cos(startAngle)
      const startY = centerY - r * Math.sin(startAngle)
      const endX = centerX + r * Math.cos(endAngle)
      const endY = centerY - r * Math.sin(endAngle)
      return `M ${startX} ${startY} A ${r} ${r} 0 0 0 ${endX} ${endY}`
    }

    // Generate concentric arcs (more arcs for better grid)
    const concentricArcs = []
    for (let i = 1; i <= 5; i++) {
      const arcRadius = radius * (i / 5)
      concentricArcs.push(
        <path
          key={`arc-${i}`}
          d={generateArcPath(arcRadius)}
          fill="none"
          stroke="#999"
          strokeWidth="0.4"
        />
      )
    }

    // Generate radial lines (every 10 degrees, all the way to the edge)
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
          stroke={isMainLine ? "#666" : "#bbb"}
          strokeWidth={isMainLine ? "0.8" : "0.4"}
        />
      )
    }

    // Generate degree markings along the outer arc (every 10 degrees with all labels)
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
          stroke="#333"
          strokeWidth={isMainMark ? "2" : "1.2"}
        />
      )

      // Add degree labels for all 10-degree intervals
      const labelRadius = radius + 15
      const labelX = centerX + Math.cos(angle) * labelRadius
      const labelY = centerY - Math.sin(angle) * labelRadius
      
      degreeMarkings.push(
          <text
          key={`label-${deg}`}
            x={labelX}
            y={labelY}
            textAnchor="middle"
            dominantBaseline="middle"
          fontSize={isMainMark ? "11" : "9"}
            fill="#333"
          fontWeight={isMainMark ? "bold" : "normal"}
          >
          {deg}
          </text>
        )
    }

    return (
      <svg 
        ref={svgRef}
        width={svgWidth} 
        height={svgHeight} 
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        preserveAspectRatio="xMidYMid meet"
        style={{ 
          cursor: isInteractive ? 'pointer' : 'default',
          userSelect: 'none',
          display: 'block',
          maxWidth: '100%',
          height: 'auto'
        }}
        onClick={(e) => {
          if (isInteractive) {
            e.preventDefault()
            e.stopPropagation()
            handleMouseDown(e, eyeType)
          }
        }}
        onMouseDown={(e) => {
          if (isInteractive) {
            e.preventDefault()
            e.stopPropagation()
            handleMouseDown(e, eyeType)
          }
        }}
        onMouseMove={(e) => {
          if (isInteractive) {
            handleMouseMove(e, eyeType)
          }
        }}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <defs>
          <marker
            id={`arrowhead-${eyeType}`}
            markerWidth="10"
            markerHeight="10"
            refX="9"
            refY="5"
            orient="auto"
          >
            <polygon
              points="0 0, 10 5, 0 10"
              fill="#dc2626"
            />
          </marker>
        </defs>

        {/* Background */}
        <rect width={svgWidth} height={svgHeight} fill="white" />
        
        {/* Concentric arcs - drawn first so they're behind everything */}
        {concentricArcs}
        
        {/* Radial lines - drawn before outer arc */}
        {radialLines}
        
        {/* Outer semi-circular arc - main border */}
        <path
          d={generateArcPath(radius)}
          fill="none"
          stroke="#000"
          strokeWidth="2"
        />
        
        {/* Degree markings along the arc */}
        {degreeMarkings}
        
        {/* Center point */}
        <circle
          cx={centerX}
          cy={centerY}
          r="2.5"
          fill="#000"
        />
        
        {/* Arrow pointing to axis value - always show when axis value is defined */}
        {axisValue !== undefined && (
          <line
            x1={centerX}
            y1={centerY}
            x2={arrowX}
            y2={arrowY}
            stroke="#dc2626"
            strokeWidth="2.5"
            markerEnd={`url(#arrowhead-${eyeType})`}
            style={{ pointerEvents: 'none' }}
          />
        )}
        
        {/* Eye indicators - green R and I for right eye (positioned upper left) */}
        {eyeType === 'right' && (
          <>
            <text
              x={centerX - 50}
              y={centerY - 90}
              fontSize="14"
              fill="#22c55e"
              fontWeight="bold"
              fontFamily="Arial, sans-serif"
            >
              R
            </text>
            <text
              x={centerX - 50}
              y={centerY - 75}
              fontSize="14"
              fill="#22c55e"
              fontWeight="bold"
              fontFamily="Arial, sans-serif"
            >
              I
            </text>
          </>
        )}
        
        {/* Additional labels - TABO 0 and INT. for left eye */}
        {eyeType === 'left' && (
          <>
            {/* TABO 0 - below the diagram, slightly to the left of center */}
            <text
              x={centerX - 20}
              y={centerY + 18}
              fontSize="9"
              fill="#333"
              fontWeight="normal"
              fontFamily="Arial, sans-serif"
              textAnchor="middle"
            >
              TABO 0
            </text>
            {/* INT. - at the far right, aligned with 180-degree mark */}
            <text
              x={centerX + radius + 10}
              y={centerY - 25}
              fontSize="9"
              fill="#333"
              fontWeight="normal"
              fontFamily="Arial, sans-serif"
              textAnchor="start"
            >
              INT.
            </text>
          </>
        )}
      </svg>
    )
  }

  if (compact) {
    return (
      <div className="flex gap-8 justify-center items-center bg-white p-4 rounded border border-gray-300">
        <div className="text-center">
          <div className="font-bold text-sm mb-2">Occhio Destro</div>
          <div className="flex justify-center">
            {generateProtractor(localRightAxis, 'right', rightSvgRef)}
          </div>
          {isInteractive && (
            <div className="mt-2 text-xs text-gray-600">
              {localRightAxis}°
            </div>
          )}
        </div>
        <div className="text-center">
          <div className="font-bold text-sm mb-2">Occhio Sinistro</div>
          <div className="flex justify-center">
            {generateProtractor(localLeftAxis, 'left', leftSvgRef)}
          </div>
          {isInteractive && (
            <div className="mt-2 text-xs text-gray-600">
              {localLeftAxis}°
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-300 max-w-2xl mx-auto">
      <div className="flex gap-12 justify-center items-center flex-wrap">
        <div className="text-center">
          <div className="font-bold text-lg mb-4">Occhio Destro</div>
          <div className="flex justify-center">
            {generateProtractor(localRightAxis, 'right', rightSvgRef)}
          </div>
          {isInteractive && (
            <div className="mt-2 text-sm text-gray-600 font-semibold">
              Axis: {localRightAxis}°
            </div>
          )}
        </div>
        <div className="text-center">
          <div className="font-bold text-lg mb-4">Occhio Sinistro</div>
          <div className="flex justify-center">
            {generateProtractor(localLeftAxis, 'left', leftSvgRef)}
          </div>
          {isInteractive && (
            <div className="mt-2 text-sm text-gray-600 font-semibold">
              Axis: {localLeftAxis}°
            </div>
          )}
        </div>
      </div>
      {isInteractive && (
        <div className="mt-4 text-center text-xs text-gray-500">
          Click and drag on the protractor to adjust axis values
        </div>
      )}
    </div>
  )
}

export default EyeAxisDiagram
