import React, { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'

interface PrescriptionValues {
  sphere?: number
  cylinder?: number
  axis?: number
}

interface EyeAxisDiagramProps {
  rightEyeAxis?: number
  leftEyeAxis?: number
  rightEyePrescription?: PrescriptionValues
  leftEyePrescription?: PrescriptionValues
  compact?: boolean
  onRightEyeAxisChange?: (value: number) => void
  onLeftEyeAxisChange?: (value: number) => void
  onRightEyePrescriptionChange?: (prescription: PrescriptionValues) => void
  onLeftEyePrescriptionChange?: (prescription: PrescriptionValues) => void
  interactive?: boolean
}

const EyeAxisDiagram: React.FC<EyeAxisDiagramProps> = ({
  rightEyeAxis,
  leftEyeAxis,
  rightEyePrescription,
  leftEyePrescription,
  compact = false,
  onRightEyeAxisChange,
  onLeftEyeAxisChange,
  onRightEyePrescriptionChange,
  onLeftEyePrescriptionChange,
  interactive
}) => {
  const { t } = useTranslation()
  
  // TABO to International conversion: INT = 180 - TABO
  // Examples: TABO 30 → INT 150, TABO 120 → INT 60, TABO 100 → INT 80
  const taboToInt = (taboValue: number): number => {
    const normalized = normalizeAxis(taboValue)
    return 180 - normalized
  }
  
  // International to TABO conversion: TABO = 180 - INT
  // Examples: INT 150 → TABO 30, INT 60 → TABO 120, INT 80 → TABO 100
  const intToTabo = (intValue: number): number => {
    const normalized = normalizeAxis(intValue)
    return 180 - normalized
  }
  
  // Normalize axis value to 0-180 range (handle negative values)
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

  // Use prescription axis if provided, otherwise use prop values, and normalize
  const rightAxisValue = normalizeAxis(rightEyePrescription?.axis ?? rightEyeAxis ?? 0)
  const leftAxisValue = normalizeAxis(leftEyePrescription?.axis ?? leftEyeAxis ?? 30)
  
  // Auto-enable interactive mode if onChange handlers are provided
  const isInteractive = interactive !== undefined ? interactive : !!(onRightEyeAxisChange || onLeftEyeAxisChange)
  const [localRightAxis, setLocalRightAxis] = useState(rightAxisValue)
  const [localLeftAxis, setLocalLeftAxis] = useState(leftAxisValue)
  const [isDragging, setIsDragging] = useState<'right' | 'left' | null>(null)
  const rightSvgRef = useRef<SVGSVGElement>(null)
  const leftSvgRef = useRef<SVGSVGElement>(null)
  
  // Local state for editable prescription values
  const [localRightPrescription, setLocalRightPrescription] = useState<PrescriptionValues>({
    sphere: rightEyePrescription?.sphere,
    cylinder: rightEyePrescription?.cylinder,
    axis: rightEyePrescription?.axis ?? rightAxisValue
  })
  const [localLeftPrescription, setLocalLeftPrescription] = useState<PrescriptionValues>({
    sphere: leftEyePrescription?.sphere,
    cylinder: leftEyePrescription?.cylinder,
    axis: leftEyePrescription?.axis ?? leftAxisValue
  })
  
  // Update local prescription when props change
  useEffect(() => {
    setLocalRightPrescription({
      sphere: rightEyePrescription?.sphere,
      cylinder: rightEyePrescription?.cylinder,
      axis: rightEyePrescription?.axis ?? rightAxisValue
    })
  }, [rightEyePrescription, rightAxisValue])
  
  useEffect(() => {
    setLocalLeftPrescription({
      sphere: leftEyePrescription?.sphere,
      cylinder: leftEyePrescription?.cylinder,
      axis: leftEyePrescription?.axis ?? leftAxisValue
    })
  }, [leftEyePrescription, leftAxisValue])

  useEffect(() => {
    setLocalRightAxis(rightAxisValue)
  }, [rightAxisValue])

  useEffect(() => {
    setLocalLeftAxis(leftAxisValue)
  }, [leftAxisValue])

  const svgWidth = 240
  const svgHeight = 145
  const centerX = svgWidth / 2
  const centerY = svgHeight - 20
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
    // calculateAxisFromPoint returns INT value (from outer scale)
    const newIntAxis = calculateAxisFromPoint(e.clientX, e.clientY, svgElement, eyeType)
    
    if (eyeType === 'right') {
      // Right eye: store INT directly
      setLocalRightAxis(newIntAxis)
      onRightEyeAxisChange?.(newIntAxis)
      // Update prescription with INT value
      const updated = { ...localRightPrescription, axis: newIntAxis }
      setLocalRightPrescription(updated)
      onRightEyePrescriptionChange?.(updated)
    } else {
      // Left eye: store INT (for diagram), but user sees TABO in input
      setLocalLeftAxis(newIntAxis)
      onLeftEyeAxisChange?.(newIntAxis)
      // Update prescription with INT value (stored internally)
      const updated = { ...localLeftPrescription, axis: newIntAxis }
      setLocalLeftPrescription(updated)
      onLeftEyePrescriptionChange?.(updated)
    }
  }

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>, eyeType: 'right' | 'left') => {
    if (!isInteractive || !isDragging || isDragging !== eyeType) return
    e.preventDefault()
    const svgElement = e.currentTarget
    // calculateAxisFromPoint returns INT value (from outer scale)
    const newIntAxis = calculateAxisFromPoint(e.clientX, e.clientY, svgElement, eyeType)
    
    if (eyeType === 'right') {
      // Right eye: store INT directly
      setLocalRightAxis(newIntAxis)
      onRightEyeAxisChange?.(newIntAxis)
      const updated = { ...localRightPrescription, axis: newIntAxis }
      setLocalRightPrescription(updated)
      onRightEyePrescriptionChange?.(updated)
    } else {
      // Left eye: store INT (for diagram), but user sees TABO in input
      setLocalLeftAxis(newIntAxis)
      onLeftEyeAxisChange?.(newIntAxis)
      const updated = { ...localLeftPrescription, axis: newIntAxis }
      setLocalLeftPrescription(updated)
      onLeftEyePrescriptionChange?.(updated)
    }
  }

  const handleMouseUp = () => {
    setIsDragging(null)
  }

  // Handlers for prescription value changes
  const handlePrescriptionChange = (eyeType: 'right' | 'left', field: 'sphere' | 'cylinder' | 'axis', value: string) => {
    // For axis, use integer parsing; for sphere/cylinder, use float parsing
    const numValue = value === '' ? undefined : (field === 'axis' ? parseInt(value.replace(',', '.')) : parseFloat(value.replace(',', '.')))
    
    if (eyeType === 'right') {
      // Right eye uses International system - store directly
      const updated = { ...localRightPrescription, [field]: numValue }
      setLocalRightPrescription(updated)
      onRightEyePrescriptionChange?.(updated)
      if (field === 'axis' && numValue !== undefined) {
        const normalized = normalizeAxis(numValue)
        setLocalRightAxis(normalized)
        onRightEyeAxisChange?.(normalized)
      }
    } else {
      // Left eye uses TABO system - convert TABO input to INT for storage
      if (field === 'axis' && numValue !== undefined) {
        // User entered TABO value, convert to INT for storage
        const intValue = taboToInt(numValue)
        const updated = { ...localLeftPrescription, axis: intValue }
        setLocalLeftPrescription(updated)
        onLeftEyePrescriptionChange?.(updated)
        setLocalLeftAxis(intValue)
        onLeftEyeAxisChange?.(intValue)
      } else {
        // For sphere/cylinder, store directly
        const updated = { ...localLeftPrescription, [field]: numValue }
        setLocalLeftPrescription(updated)
        onLeftEyePrescriptionChange?.(updated)
      }
    }
  }

      useEffect(() => {
        if (isDragging) {
          const handleGlobalMouseMove = (e: MouseEvent) => {
            if (!isDragging) return
            const svgElement = isDragging === 'right' ? rightSvgRef.current : leftSvgRef.current
            if (!svgElement) return
            
            // calculateAxisFromPoint returns INT value (from outer scale)
            const newIntAxis = calculateAxisFromPoint(e.clientX, e.clientY, svgElement, isDragging)
            
            if (isDragging === 'right') {
              // Right eye: store INT directly
              setLocalRightAxis(newIntAxis)
              onRightEyeAxisChange?.(newIntAxis)
              const updated = { ...localRightPrescription, axis: newIntAxis }
              setLocalRightPrescription(updated)
              onRightEyePrescriptionChange?.(updated)
            } else {
              // Left eye: store INT (for diagram), but user sees TABO in input
              setLocalLeftAxis(newIntAxis)
              onLeftEyeAxisChange?.(newIntAxis)
              const updated = { ...localLeftPrescription, axis: newIntAxis }
              setLocalLeftPrescription(updated)
              onLeftEyePrescriptionChange?.(updated)
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

  // Format prescription value for display
  const formatPrescriptionValue = (value?: number): string => {
    if (value === undefined || value === null) return ''
    return value.toFixed(2).replace('.', ',')
  }

  const generateProtractor = (axisValue: number, eyeType: 'right' | 'left', svgRef: React.RefObject<SVGSVGElement | null>) => {
    // Normalize axis value to 0-180 range to ensure arrow stays within diagram
    let normalizedAxis = axisValue
    if (normalizedAxis < 0) {
      // Convert negative values: -179 → 1, -90 → 90, -1 → 179
      normalizedAxis = 180 + normalizedAxis
    }
    if (normalizedAxis > 180) {
      // Wrap values > 180
      normalizedAxis = normalizedAxis % 180
    }
    // Ensure final value is in valid range
    normalizedAxis = Math.max(0, Math.min(180, normalizedAxis))
    
    // Convert axis value to angle for semi-circular protractor
    // 0° is at bottom right, 180° is at bottom left
    // In SVG: 0° = 0 radians (pointing right), 180° = π radians (pointing left)
    const angleRad = (normalizedAxis * Math.PI) / 180
    
    // Calculate arrow position (pointing from center towards the axis value on the outer scale)
    // Use radius - 3 to ensure arrow stays well within the diagram bounds
    const arrowLength = radius - 3
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

    // Generate concentric arcs (more arcs for better grid) - improved visibility
    const concentricArcs = []
    for (let i = 1; i <= 5; i++) {
      const arcRadius = radius * (i / 5)
      concentricArcs.push(
        <path
          key={`arc-${i}`}
          d={generateArcPath(arcRadius)}
          fill="none"
          stroke="#ccc"
          strokeWidth="0.6"
        />
      )
    }

    // Generate radial lines (every 10 degrees, all the way to the edge) - improved visibility
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
          stroke={isMainLine ? "#555" : "#aaa"}
          strokeWidth={isMainLine ? "1.2" : "0.8"}
        />
      )
    }

    // Generate degree markings along the outer arc (every 10 degrees with bidirectional labels)
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
          strokeWidth={isMainMark ? "2.5" : "1.5"}
        />
      )

      // Outer scale (INT) - 0 to 180 from right to left
      // At right (deg=0): shows 0, at left (deg=180): shows 180
      const labelRadius = radius + 15
      const labelX = centerX + Math.cos(angle) * labelRadius
      const labelY = centerY - Math.sin(angle) * labelRadius
      
      // Outer scale label (INT scale: 0-180) - show all 10-degree intervals
      degreeMarkings.push(
        <text
          key={`label-outer-${deg}`}
          x={labelX}
          y={labelY}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={isMainMark ? "11" : "9"}
          fill="#000"
          fontWeight={isMainMark ? "bold" : "normal"}
        >
          {deg}
        </text>
      )
      
      // Inner scale (TABO) - 180 to 0 from left to right
      // TABO is complementary: at position where INT shows 'deg', TABO shows (180 - deg)
      // At right (deg=0, INT=0): TABO shows 180
      // At left (deg=180, INT=180): TABO shows 0
      // So TABO goes 180→0 from left to right
      const taboValue = 180 - deg
      const innerLabelRadius = radius - 20
      const innerLabelX = centerX + Math.cos(angle) * innerLabelRadius
      const innerLabelY = centerY - Math.sin(angle) * innerLabelRadius
      
      // Show inner scale labels for all 10-degree intervals, but make main marks more prominent
      degreeMarkings.push(
        <text
          key={`label-inner-${deg}`}
          x={innerLabelX}
          y={innerLabelY}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={isMainMark ? "10" : "8"}
          fill={isMainMark ? "#666" : "#aaa"}
          fontWeight="normal"
        >
          {taboValue}
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
              fill="#2563eb"
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
        
        {/* 0 labels at left and right ends of horizontal baseline */}
        <text
          x={centerX - radius}
          y={centerY + 8}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="11"
          fill="#000"
          fontFamily="Arial, sans-serif"
          fontWeight="normal"
        >
          0
        </text>
        <text
          x={centerX + radius}
          y={centerY + 8}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="11"
          fill="#000"
          fontFamily="Arial, sans-serif"
          fontWeight="normal"
        >
          0
        </text>
        
        {/* Arrow pointing to axis value - always show the needle */}
        <line
          x1={centerX}
          y1={centerY}
          x2={arrowX}
          y2={arrowY}
          stroke="#2563eb"
          strokeWidth="2.5"
          markerEnd={`url(#arrowhead-${eyeType})`}
          style={{ pointerEvents: 'none' }}
        />
        
        {/* 0° label below the diagram */}
        <text
          x={centerX}
          y={centerY + 15}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="10"
          fill="#999"
          fontFamily="Arial, sans-serif"
        >
          0°
        </text>
        
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
        
        {/* TABO 0 and INT. labels - shown only on left eye (Occhio Sinistro) */}
        {eyeType === 'left' && (
          <>
            {/* TABO 0 - below the diagram, aligned with the left side (180-degree mark) */}
            {(() => {
              const taboAngle = (180 * Math.PI) / 180
              const taboX = centerX + Math.cos(taboAngle) * (radius - 20)
              return (
                <text
                  x={taboX}
                  y={centerY + 12}
                  fontSize="11"
                  fill="#000"
                  fontWeight="normal"
                  fontFamily="Arial, sans-serif"
                  textAnchor="middle"
                >
                  TABO 0
                </text>
              )
            })()}
            {/* INT. - at the far right, horizontally aligned with the 0-degree mark on outer scale */}
            <text
              x={centerX + radius + 8}
              y={centerY - 2}
              fontSize="11"
              fill="#000"
              fontWeight="normal"
              fontFamily="Arial, sans-serif"
              textAnchor="start"
            >
              INT.
            </text>
            {/* Display TABO value for left eye - show the converted TABO value */}
            {(() => {
              const taboValue = intToTabo(normalizedAxis)
              return (
                <text
                  x={centerX}
                  y={centerY - radius - 25}
                  fontSize="12"
                  fill="#2563eb"
                  fontWeight="bold"
                  fontFamily="Arial, sans-serif"
                  textAnchor="middle"
                >
                  TABO: {taboValue}°
                </text>
              )
            })()}
          </>
        )}
      </svg>
    )
  }

  if (compact) {
    return (
      <div className="bg-white p-4 rounded border border-gray-300">
        <div className="flex gap-8 justify-center items-center mb-4">
          <div className="text-center">
            <div className="font-bold text-sm mb-2 text-blue-600">{t('prescription.rightEye', 'Occhio Destro')}</div>
            <div className="flex justify-center">
              {generateProtractor(localRightAxis, 'right', rightSvgRef)}
            </div>
          </div>
          <div className="text-center">
            <div className="font-bold text-sm mb-2 text-blue-600">{t('prescription.leftEye', 'Occhio Sinistro')}</div>
            <div className="flex justify-center">
              {generateProtractor(localLeftAxis, 'left', leftSvgRef)}
            </div>
            <div className="mt-1 text-[10px] text-gray-600 italic">
              Uses TABO system
            </div>
          </div>
        </div>
        
        {/* Prescription Table */}
        <div className="mt-4">
          <table className="w-full border-collapse border border-gray-300 text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-3 py-1 text-left font-semibold text-gray-700 text-xs"></th>
                <th className="border border-gray-300 px-3 py-1 text-center font-semibold text-gray-700 text-xs">{t('prescription.sphere', 'Sfera')}</th>
                <th className="border border-gray-300 px-3 py-1 text-center font-semibold text-gray-700 text-xs">{t('prescription.cylinder', 'Cil.')}</th>
                <th className="border border-gray-300 px-3 py-1 text-center font-semibold text-gray-700 text-xs">
                  {t('prescription.axis', 'Asse')}
                  <span className="block text-[9px] font-normal text-gray-500 mt-0.5">(Left: TABO)</span>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-300 px-3 py-1 font-semibold text-blue-600 text-xs">{t('prescription.rightEye', 'Occhio Destro')}</td>
                <td className="border border-gray-300 px-3 py-1 text-center">
                  <input
                    type="text"
                    value={localRightPrescription.sphere !== undefined ? formatPrescriptionValue(localRightPrescription.sphere) : ''}
                    onChange={(e) => handlePrescriptionChange('right', 'sphere', e.target.value)}
                    className="w-full text-center text-blue-600 text-xs border-none bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-400 rounded px-1 py-0.5"
                    placeholder="0,00"
                  />
                </td>
                <td className="border border-gray-300 px-3 py-1 text-center">
                  <input
                    type="text"
                    value={localRightPrescription.cylinder !== undefined ? formatPrescriptionValue(localRightPrescription.cylinder) : ''}
                    onChange={(e) => handlePrescriptionChange('right', 'cylinder', e.target.value)}
                    className="w-full text-center text-blue-600 text-xs border-none bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-400 rounded px-1 py-0.5"
                    placeholder="0,00"
                  />
                </td>
                <td className="border border-gray-300 px-3 py-1 text-center">
                  <input
                    type="number"
                    min="0"
                    max="180"
                    value={localRightPrescription.axis !== undefined ? localRightPrescription.axis : localRightAxis}
                    onChange={(e) => {
                      const value = e.target.value === '' ? undefined : parseInt(e.target.value)
                      handlePrescriptionChange('right', 'axis', value !== undefined ? value.toString() : '')
                    }}
                    className="w-full text-center text-blue-600 font-semibold text-xs border-none bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-400 rounded px-1 py-0.5"
                  />
                </td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-3 py-1 font-semibold text-blue-600 text-xs">{t('prescription.leftEye', 'Occhio Sinistro')}</td>
                <td className="border border-gray-300 px-3 py-1 text-center">
                  <input
                    type="text"
                    value={localLeftPrescription.sphere !== undefined ? formatPrescriptionValue(localLeftPrescription.sphere) : ''}
                    onChange={(e) => handlePrescriptionChange('left', 'sphere', e.target.value)}
                    className="w-full text-center text-blue-600 text-xs border-none bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-400 rounded px-1 py-0.5"
                    placeholder="0,00"
                  />
                </td>
                <td className="border border-gray-300 px-3 py-1 text-center">
                  <input
                    type="text"
                    value={localLeftPrescription.cylinder !== undefined ? formatPrescriptionValue(localLeftPrescription.cylinder) : ''}
                    onChange={(e) => handlePrescriptionChange('left', 'cylinder', e.target.value)}
                    className="w-full text-center text-blue-600 text-xs border-none bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-400 rounded px-1 py-0.5"
                    placeholder="0,00"
                  />
                </td>
                <td className="border border-gray-300 px-3 py-1 text-center">
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="180"
                      value={localLeftPrescription.axis !== undefined ? intToTabo(localLeftPrescription.axis) : (localLeftAxis !== undefined ? intToTabo(localLeftAxis) : '')}
                      onChange={(e) => {
                        const value = e.target.value === '' ? undefined : parseInt(e.target.value)
                        handlePrescriptionChange('left', 'axis', value !== undefined ? value.toString() : '')
                      }}
                      className="w-full text-center text-blue-600 font-semibold text-xs border-none bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-400 rounded px-1 py-0.5"
                      placeholder="--"
                    />
                    <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[8px] text-gray-500 font-normal">TABO</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-300 max-w-2xl mx-auto">
      <div className="flex gap-12 justify-center items-center flex-wrap mb-6">
        <div className="text-center">
          <div className="font-bold text-lg mb-4 text-blue-600">{t('prescription.rightEye', 'Occhio Destro')}</div>
          <div className="flex justify-center">
            {generateProtractor(localRightAxis, 'right', rightSvgRef)}
          </div>
        </div>
        <div className="text-center">
          <div className="font-bold text-lg mb-4 text-blue-600">{t('prescription.leftEye', 'Occhio Sinistro')}</div>
          <div className="flex justify-center">
            {generateProtractor(localLeftAxis, 'left', leftSvgRef)}
          </div>
          <div className="mt-2 text-xs text-gray-600 italic">
            Uses TABO system (converted to INT for storage)
          </div>
        </div>
      </div>
      
      {/* Prescription Table */}
      <div className="mt-6">
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-700"></th>
              <th className="border border-gray-300 px-4 py-2 text-center font-semibold text-gray-700">{t('prescription.sphere', 'Sfera')}</th>
              <th className="border border-gray-300 px-4 py-2 text-center font-semibold text-gray-700">{t('prescription.cylinder', 'Cil.')}</th>
              <th className="border border-gray-300 px-4 py-2 text-center font-semibold text-gray-700">
                {t('prescription.axis', 'Asse')}
                <span className="block text-xs font-normal text-gray-500 mt-1">(Left: TABO)</span>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-gray-300 px-4 py-2 font-semibold text-blue-600">{t('prescription.rightEye', 'Occhio Destro')}</td>
              <td className="border border-gray-300 px-4 py-2 text-center">
                <input
                  type="text"
                  value={localRightPrescription.sphere !== undefined ? formatPrescriptionValue(localRightPrescription.sphere) : ''}
                  onChange={(e) => handlePrescriptionChange('right', 'sphere', e.target.value)}
                  className="w-full text-center text-blue-600 border-none bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-400 rounded px-2 py-1"
                  placeholder="0,00"
                />
              </td>
              <td className="border border-gray-300 px-4 py-2 text-center">
                <input
                  type="text"
                  value={localRightPrescription.cylinder !== undefined ? formatPrescriptionValue(localRightPrescription.cylinder) : ''}
                  onChange={(e) => handlePrescriptionChange('right', 'cylinder', e.target.value)}
                  className="w-full text-center text-blue-600 border-none bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-400 rounded px-2 py-1"
                  placeholder="0,00"
                />
              </td>
                <td className="border border-gray-300 px-4 py-2 text-center">
                  <input
                    type="number"
                    min="0"
                    max="180"
                    value={localRightPrescription.axis !== undefined ? localRightPrescription.axis : localRightAxis}
                    onChange={(e) => {
                      const value = e.target.value === '' ? undefined : parseInt(e.target.value)
                      handlePrescriptionChange('right', 'axis', value !== undefined ? value.toString() : '')
                    }}
                    className="w-full text-center text-blue-600 font-semibold border-none bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-400 rounded px-2 py-1"
                  />
                </td>
            </tr>
            <tr>
              <td className="border border-gray-300 px-4 py-2 font-semibold text-blue-600">{t('prescription.leftEye', 'Occhio Sinistro')}</td>
              <td className="border border-gray-300 px-4 py-2 text-center">
                <input
                  type="text"
                  value={localLeftPrescription.sphere !== undefined ? formatPrescriptionValue(localLeftPrescription.sphere) : ''}
                  onChange={(e) => handlePrescriptionChange('left', 'sphere', e.target.value)}
                  className="w-full text-center text-blue-600 border-none bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-400 rounded px-2 py-1"
                  placeholder="0,00"
                />
              </td>
              <td className="border border-gray-300 px-4 py-2 text-center">
                <input
                  type="text"
                  value={localLeftPrescription.cylinder !== undefined ? formatPrescriptionValue(localLeftPrescription.cylinder) : ''}
                  onChange={(e) => handlePrescriptionChange('left', 'cylinder', e.target.value)}
                  className="w-full text-center text-blue-600 border-none bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-400 rounded px-2 py-1"
                  placeholder="0,00"
                />
              </td>
                <td className="border border-gray-300 px-4 py-2 text-center">
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="180"
                      value={localLeftPrescription.axis !== undefined ? intToTabo(localLeftPrescription.axis) : (localLeftAxis !== undefined ? intToTabo(localLeftAxis) : '')}
                      onChange={(e) => {
                        const value = e.target.value === '' ? undefined : parseInt(e.target.value)
                        handlePrescriptionChange('left', 'axis', value !== undefined ? value.toString() : '')
                      }}
                      className="w-full text-center text-blue-600 font-semibold border-none bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-400 rounded px-2 py-1 pr-12"
                      placeholder="--"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-500 font-normal">TABO</span>
                  </div>
                </td>
            </tr>
          </tbody>
        </table>
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
