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
  const taboToInt = (taboValue: number | undefined | null): number => {
    if (taboValue === undefined || taboValue === null || isNaN(taboValue)) {
      return 0
    }
    const normalized = normalizeAxis(taboValue)
    return 180 - normalized
  }
  
  // International to TABO conversion: TABO = 180 - INT
  // Examples: INT 150 → TABO 30, INT 60 → TABO 120, INT 80 → TABO 100
  const intToTabo = (intValue: number | undefined | null): number => {
    if (intValue === undefined || intValue === null || isNaN(intValue)) {
      return 0
    }
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
    setLocalRightPrescription(prev => {
      const newPrescription = {
        sphere: rightEyePrescription?.sphere !== undefined ? rightEyePrescription.sphere : prev.sphere,
        cylinder: rightEyePrescription?.cylinder !== undefined ? rightEyePrescription.cylinder : prev.cylinder,
        axis: rightEyePrescription?.axis !== undefined ? rightEyePrescription.axis : (prev.axis ?? rightAxisValue)
      }
      // Only update if values actually changed
      if (
        newPrescription.sphere !== prev.sphere ||
        newPrescription.cylinder !== prev.cylinder ||
        newPrescription.axis !== prev.axis
      ) {
        return newPrescription
      }
      return prev
    })
  }, [rightEyePrescription?.sphere, rightEyePrescription?.cylinder, rightEyePrescription?.axis, rightAxisValue])

  useEffect(() => {
    setLocalLeftPrescription(prev => {
      const newPrescription = {
        sphere: leftEyePrescription?.sphere !== undefined ? leftEyePrescription.sphere : prev.sphere,
        cylinder: leftEyePrescription?.cylinder !== undefined ? leftEyePrescription.cylinder : prev.cylinder,
        axis: leftEyePrescription?.axis !== undefined ? leftEyePrescription.axis : (prev.axis ?? leftAxisValue)
      }
      // Only update if values actually changed
      if (
        newPrescription.sphere !== prev.sphere ||
        newPrescription.cylinder !== prev.cylinder ||
        newPrescription.axis !== prev.axis
      ) {
        return newPrescription
      }
      return prev
    })
  }, [leftEyePrescription?.sphere, leftEyePrescription?.cylinder, leftEyePrescription?.axis, leftAxisValue])

  useEffect(() => {
    setLocalRightAxis(rightAxisValue)
  }, [rightAxisValue])

  useEffect(() => {
    setLocalLeftAxis(leftAxisValue)
  }, [leftAxisValue])

  const svgWidth = 800
  const svgHeight = 500
  const centerX = svgWidth / 2
  const centerY = svgHeight - 80
  const radius = 220

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
    // Trim the value and handle empty strings
    const trimmedValue = value.trim()
    if (trimmedValue === '') {
      const updated = eyeType === 'right' 
        ? { ...localRightPrescription, [field]: undefined }
        : { ...localLeftPrescription, [field]: undefined }
      
      if (eyeType === 'right') {
        setLocalRightPrescription(updated)
        onRightEyePrescriptionChange?.(updated)
        if (field === 'axis') {
          setLocalRightAxis(0)
          onRightEyeAxisChange?.(0)
        }
      } else {
        setLocalLeftPrescription(updated)
        onLeftEyePrescriptionChange?.(updated)
        if (field === 'axis') {
          setLocalLeftAxis(0)
          onLeftEyeAxisChange?.(0)
        }
      }
      return
    }
    
    // For axis, use integer parsing; for sphere/cylinder, use float parsing
    const normalizedValue = trimmedValue.replace(',', '.')
    const numValue = field === 'axis' 
      ? parseInt(normalizedValue, 10) 
      : parseFloat(normalizedValue)
    
    // Check if parsing resulted in NaN
    if (isNaN(numValue)) {
      return // Don't update if value is invalid
    }
    
    if (eyeType === 'right') {
      // Right eye uses International system - store directly
      const updated = { ...localRightPrescription, [field]: numValue }
      setLocalRightPrescription(updated)
      onRightEyePrescriptionChange?.(updated)
      if (field === 'axis') {
        const normalized = normalizeAxis(numValue)
        setLocalRightAxis(normalized)
        onRightEyeAxisChange?.(normalized)
      }
    } else {
      // Left eye uses TABO system - convert TABO input to INT for storage
      if (field === 'axis') {
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
    if (value === undefined || value === null || isNaN(value)) return ''
    // Show 0.00 as "0,00" instead of empty string
    // Handle both positive and negative values
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
    // Use radius - 5 to ensure arrow stays well within the diagram bounds
    const arrowLength = radius - 5
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
          stroke={isMainLine ? "#333" : "#aaa"}
          strokeWidth={isMainLine ? "1.8" : "1"}
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
          strokeWidth={isMainMark ? "3.5" : "2.5"}
        />
      )

      // Outer scale (INT) - 0 to 180 from right to left
      // At right (deg=0): shows 0, at left (deg=180): shows 180
      const labelRadius = radius + 28
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
          fontSize={isMainMark ? "22" : "16"}
          fill="#000"
          fontWeight={isMainMark ? "bold" : "600"}
          fontFamily="Arial, sans-serif"
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
      const innerLabelRadius = radius - 38
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
          fontSize={isMainMark ? "18" : "14"}
          fill={isMainMark ? "#444" : "#999"}
          fontWeight={isMainMark ? "600" : "normal"}
          fontFamily="Arial, sans-serif"
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
          width: '100%',
          maxWidth: '100%',
          height: 'auto',
          overflow: 'visible',
          margin: '0 auto'
        }}
        xmlns="http://www.w3.org/2000/svg"
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
        
        {/* Concentric arcs - drawn first so they're behind everything */}
        {concentricArcs}
        
        {/* Radial lines - drawn before outer arc */}
        {radialLines}
        
        {/* Outer semi-circular arc - main border */}
        <path
          d={generateArcPath(radius)}
          fill="none"
          stroke="#000"
          strokeWidth="3"
        />
        
        {/* Degree markings along the arc */}
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
        
        {/* Arrow pointing to axis value - always show the needle */}
        <line
          x1={centerX}
          y1={centerY}
          x2={arrowX}
          y2={arrowY}
          stroke="#2563eb"
          strokeWidth="6"
          markerEnd={`url(#arrowhead-${eyeType})`}
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
        
        {/* Eye indicators - green R and I for right eye (positioned upper left) */}
        {eyeType === 'right' && (
          <>
            <text
              x={centerX - 110}
              y={centerY - 200}
              fontSize="26"
              fill="#22c55e"
              fontWeight="bold"
              fontFamily="Arial, sans-serif"
            >
              R
            </text>
            <text
              x={centerX - 110}
              y={centerY - 165}
              fontSize="26"
              fill="#22c55e"
              fontWeight="bold"
              fontFamily="Arial, sans-serif"
            >
              I
            </text>
          </>
        )}
        
        {/* TABO and INT. labels - shown only on left eye (Occhio Sinistro) */}
        {eyeType === 'left' && (
          <>
            {/* TABO 0 - below the diagram, aligned with the left side (180-degree mark) */}
            {(() => {
              const taboAngle = (180 * Math.PI) / 180
              const taboX = centerX + Math.cos(taboAngle) * (radius - 50)
              return (
                <text
                  x={taboX}
                  y={centerY + 45}
                  fontSize="22"
                  fill="#000"
                  fontWeight="700"
                  fontFamily="Arial, sans-serif"
                  textAnchor="middle"
                >
                  TABO 0
                </text>
              )
            })()}
            {/* INT. - at the far right, horizontally aligned with the 0-degree mark on outer scale */}
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
            {/* Display TABO value for left eye - show the converted TABO value */}
            {(() => {
              const taboValue = intToTabo(normalizedAxis)
              if (!isNaN(taboValue) && taboValue !== undefined && taboValue !== null) {
                return (
                  <text
                    x={centerX}
                    y={centerY - radius - 85}
                    fontSize="24"
                    fill="#2563eb"
                    fontWeight="bold"
                    fontFamily="Arial, sans-serif"
                    textAnchor="middle"
                  >
                    TABO: {taboValue}°
                  </text>
                )
              }
              return null
            })()}
          </>
        )}
      </svg>
    )
  }

  if (compact) {
    return (
      <div className="bg-white p-6 rounded-lg border-2 border-gray-300 shadow-lg" style={{ overflow: 'visible', width: '100%' }}>
        <div className="flex flex-col gap-8 justify-center items-center mb-8" style={{ overflow: 'visible', width: '100%' }}>
          <div className="text-center w-full" style={{ overflow: 'visible', minWidth: '400px' }}>
            <div className="font-bold text-lg mb-4 text-blue-700">{t('prescription.rightEye', 'Right Eye OD')}</div>
            <div className="flex justify-center items-center" style={{ overflow: 'visible', minHeight: '520px' }}>
              {generateProtractor(localRightAxis, 'right', rightSvgRef)}
            </div>
          </div>
          <div className="text-center w-full" style={{ overflow: 'visible', minWidth: '400px' }}>
            <div className="font-bold text-lg mb-4 text-blue-700">{t('prescription.leftEye', 'Left Eye OS')}</div>
            <div className="flex justify-center items-center" style={{ overflow: 'visible', minHeight: '520px' }}>
              {generateProtractor(localLeftAxis, 'left', leftSvgRef)}
            </div>
            <div className="mt-3 text-sm font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full inline-block">
              Uses TABO system
            </div>
          </div>
        </div>
        
        {/* Prescription Table */}
        <div className="mt-6">
          <table className="w-full border-collapse border-2 border-gray-300 text-base table-auto">
            <thead>
              <tr className="bg-gradient-to-r from-gray-100 to-gray-200">
                <th className="border-2 border-gray-300 px-4 py-3 text-left font-bold text-gray-800 text-sm w-[25%]"></th>
                <th className="border-2 border-gray-300 px-4 py-3 text-center font-bold text-gray-800 text-sm w-[25%]">{t('prescription.sphere', 'Sphere')}</th>
                <th className="border-2 border-gray-300 px-4 py-3 text-center font-bold text-gray-800 text-sm w-[25%]">{t('prescription.cylinder', 'Cylinder')}</th>
                <th className="border-2 border-gray-300 px-4 py-3 text-center font-bold text-gray-800 text-sm w-[25%]">
                  {t('prescription.axis', 'Axis')}
                  <span className="block text-xs font-normal text-blue-600 mt-1">(Left: TABO)</span>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="hover:bg-blue-50 transition-colors">
                <td className="border-2 border-gray-300 px-4 py-3 font-bold text-blue-700 text-sm">{t('prescription.rightEye', 'Right Eye OD')}</td>
                <td className="border-2 border-gray-300 px-4 py-3 text-center">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={localRightPrescription.sphere !== undefined && localRightPrescription.sphere !== null && !isNaN(localRightPrescription.sphere) ? formatPrescriptionValue(localRightPrescription.sphere) : ''}
                    onChange={(e) => handlePrescriptionChange('right', 'sphere', e.target.value)}
                    onBlur={(e) => {
                      const value = e.target.value.trim()
                      if (value === '') {
                        handlePrescriptionChange('right', 'sphere', '')
                      }
                    }}
                    className="w-full text-center text-blue-700 font-semibold text-sm border-2 border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 rounded-lg px-3 py-2 transition-all"
                    placeholder="0,00"
                  />
                </td>
                <td className="border-2 border-gray-300 px-4 py-3 text-center">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={localRightPrescription.cylinder !== undefined && localRightPrescription.cylinder !== null && !isNaN(localRightPrescription.cylinder) ? formatPrescriptionValue(localRightPrescription.cylinder) : ''}
                    onChange={(e) => handlePrescriptionChange('right', 'cylinder', e.target.value)}
                    onBlur={(e) => {
                      const value = e.target.value.trim()
                      if (value === '') {
                        handlePrescriptionChange('right', 'cylinder', '')
                      }
                    }}
                    className="w-full text-center text-blue-700 font-semibold text-sm border-2 border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 rounded-lg px-3 py-2 transition-all"
                    placeholder="0,00"
                  />
                </td>
                <td className="border-2 border-gray-300 px-4 py-3 text-center">
                  <input
                    type="number"
                    inputMode="numeric"
                    min="0"
                    max="180"
                    step="1"
                    value={localRightPrescription.axis !== undefined && localRightPrescription.axis !== null ? localRightPrescription.axis : (localRightAxis !== undefined && localRightAxis !== null ? localRightAxis : '')}
                    onChange={(e) => {
                      const value = e.target.value === '' ? undefined : parseInt(e.target.value)
                      handlePrescriptionChange('right', 'axis', value !== undefined ? value.toString() : '')
                    }}
                    className="w-full text-center text-blue-700 font-bold text-sm border-2 border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 rounded-lg px-3 py-2 transition-all"
                    placeholder="--"
                  />
                </td>
              </tr>
              <tr className="hover:bg-blue-50 transition-colors">
                <td className="border-2 border-gray-300 px-4 py-3 font-bold text-blue-700 text-sm">{t('prescription.leftEye', 'Left Eye OS')}</td>
                <td className="border-2 border-gray-300 px-4 py-3 text-center">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={localLeftPrescription.sphere !== undefined && localLeftPrescription.sphere !== null && !isNaN(localLeftPrescription.sphere) ? formatPrescriptionValue(localLeftPrescription.sphere) : ''}
                    onChange={(e) => handlePrescriptionChange('left', 'sphere', e.target.value)}
                    onBlur={(e) => {
                      const value = e.target.value.trim()
                      if (value === '') {
                        handlePrescriptionChange('left', 'sphere', '')
                      }
                    }}
                    className="w-full text-center text-blue-700 font-semibold text-sm border-2 border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 rounded-lg px-3 py-2 transition-all"
                    placeholder="0,00"
                  />
                </td>
                <td className="border-2 border-gray-300 px-4 py-3 text-center">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={localLeftPrescription.cylinder !== undefined && localLeftPrescription.cylinder !== null && !isNaN(localLeftPrescription.cylinder) ? formatPrescriptionValue(localLeftPrescription.cylinder) : ''}
                    onChange={(e) => handlePrescriptionChange('left', 'cylinder', e.target.value)}
                    onBlur={(e) => {
                      const value = e.target.value.trim()
                      if (value === '') {
                        handlePrescriptionChange('left', 'cylinder', '')
                      }
                    }}
                    className="w-full text-center text-blue-700 font-semibold text-sm border-2 border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 rounded-lg px-3 py-2 transition-all"
                    placeholder="0,00"
                  />
                </td>
                <td className="border-2 border-gray-300 px-4 py-3 text-center">
                  <div className="relative">
                    <input
                      type="number"
                      inputMode="numeric"
                      min="0"
                      max="180"
                      step="1"
                      value={(() => {
                        const axisValue = localLeftPrescription.axis !== undefined ? localLeftPrescription.axis : localLeftAxis
                        if (axisValue === undefined || axisValue === null) return ''
                        const taboValue = intToTabo(axisValue)
                        return taboValue.toString()
                      })()}
                      onChange={(e) => {
                        const value = e.target.value === '' ? undefined : parseInt(e.target.value)
                        handlePrescriptionChange('left', 'axis', value !== undefined ? value.toString() : '')
                      }}
                      onBlur={(e) => {
                        const value = e.target.value.trim()
                        if (value === '') {
                          handlePrescriptionChange('left', 'axis', '')
                        }
                      }}
                      className="w-full text-center text-blue-700 font-bold text-sm border-2 border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 rounded-lg px-3 py-2 pr-12 transition-all"
                      placeholder="--"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-blue-600 font-bold whitespace-nowrap pointer-events-none bg-blue-50 px-2 py-1 rounded">TABO</span>
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
    <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-300 w-full" style={{ overflow: 'visible', width: '100%' }}>
      <div className="flex flex-col gap-8 justify-center items-center mb-6" style={{ overflow: 'visible', width: '100%' }}>
        <div className="text-center w-full" style={{ overflow: 'visible', minWidth: '0' }}>
          <div className="font-bold text-lg mb-4 text-blue-600">{t('prescription.rightEye', 'Right Eye OD')}</div>
          <div className="flex justify-center items-center" style={{ overflow: 'visible', minHeight: '400px' }}>
            {generateProtractor(localRightAxis, 'right', rightSvgRef)}
          </div>
        </div>
        <div className="text-center w-full" style={{ overflow: 'visible', minWidth: '0' }}>
          <div className="font-bold text-lg mb-4 text-blue-600">{t('prescription.leftEye', 'Left Eye OS')}</div>
          <div className="flex justify-center items-center" style={{ overflow: 'visible', minHeight: '400px' }}>
            {generateProtractor(localLeftAxis, 'left', leftSvgRef)}
          </div>
          <div className="mt-2 text-xs text-gray-600 italic">
            Uses TABO system (converted to INT for storage)
          </div>
        </div>
      </div>
      
      {/* Prescription Table */}
      <div className="mt-6">
        <table className="w-full border-collapse border-2 border-gray-300 text-base table-auto">
          <thead>
            <tr className="bg-gradient-to-r from-gray-100 to-gray-200">
              <th className="border-2 border-gray-300 px-4 py-3 text-left font-bold text-gray-800 text-sm w-[25%]"></th>
              <th className="border-2 border-gray-300 px-4 py-3 text-center font-bold text-gray-800 text-sm w-[25%]">{t('prescription.sphere', 'Sphere')}</th>
              <th className="border-2 border-gray-300 px-4 py-3 text-center font-bold text-gray-800 text-sm w-[25%]">{t('prescription.cylinder', 'Cylinder')}</th>
              <th className="border-2 border-gray-300 px-4 py-3 text-center font-bold text-gray-800 text-sm w-[25%]">
                {t('prescription.axis', 'Axis')}
                <span className="block text-xs font-normal text-blue-600 mt-1">(Left: TABO)</span>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr className="hover:bg-blue-50 transition-colors">
              <td className="border-2 border-gray-300 px-4 py-3 font-bold text-blue-700 text-sm">{t('prescription.rightEye', 'Right Eye OD')}</td>
              <td className="border-2 border-gray-300 px-4 py-3 text-center">
                <input
                  type="text"
                  inputMode="decimal"
                  value={localRightPrescription.sphere !== undefined && localRightPrescription.sphere !== null && !isNaN(localRightPrescription.sphere) ? formatPrescriptionValue(localRightPrescription.sphere) : ''}
                  onChange={(e) => handlePrescriptionChange('right', 'sphere', e.target.value)}
                  onBlur={(e) => {
                    const value = e.target.value.trim()
                    if (value === '') {
                      handlePrescriptionChange('right', 'sphere', '')
                    }
                  }}
                  className="w-full text-center text-blue-600 font-semibold text-sm border-2 border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 rounded-lg px-3 py-2 transition-all"
                  placeholder="0,00"
                />
              </td>
              <td className="border-2 border-gray-300 px-4 py-3 text-center">
                <input
                  type="text"
                  inputMode="decimal"
                  value={localRightPrescription.cylinder !== undefined && localRightPrescription.cylinder !== null && !isNaN(localRightPrescription.cylinder) ? formatPrescriptionValue(localRightPrescription.cylinder) : ''}
                  onChange={(e) => handlePrescriptionChange('right', 'cylinder', e.target.value)}
                  onBlur={(e) => {
                    const value = e.target.value.trim()
                    if (value === '') {
                      handlePrescriptionChange('right', 'cylinder', '')
                    }
                  }}
                  className="w-full text-center text-blue-600 font-semibold text-sm border-2 border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 rounded-lg px-3 py-2 transition-all"
                  placeholder="0,00"
                />
              </td>
                <td className="border-2 border-gray-300 px-4 py-3 text-center">
                  <input
                    type="number"
                    inputMode="numeric"
                    min="0"
                    max="180"
                    step="1"
                    value={localRightPrescription.axis !== undefined && localRightPrescription.axis !== null ? localRightPrescription.axis : (localRightAxis !== undefined && localRightAxis !== null ? localRightAxis : '')}
                    onChange={(e) => {
                      const value = e.target.value === '' ? undefined : parseInt(e.target.value)
                      handlePrescriptionChange('right', 'axis', value !== undefined ? value.toString() : '')
                    }}
                    className="w-full text-center text-blue-600 font-bold text-sm border-2 border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 rounded-lg px-3 py-2 transition-all"
                    placeholder="--"
                  />
                </td>
            </tr>
            <tr className="hover:bg-blue-50 transition-colors">
              <td className="border-2 border-gray-300 px-4 py-3 font-bold text-blue-700 text-sm">{t('prescription.leftEye', 'Left Eye OS')}</td>
              <td className="border-2 border-gray-300 px-4 py-3 text-center">
                <input
                  type="text"
                  inputMode="decimal"
                  value={localLeftPrescription.sphere !== undefined && localLeftPrescription.sphere !== null && !isNaN(localLeftPrescription.sphere) ? formatPrescriptionValue(localLeftPrescription.sphere) : ''}
                  onChange={(e) => handlePrescriptionChange('left', 'sphere', e.target.value)}
                  onBlur={(e) => {
                    const value = e.target.value.trim()
                    if (value === '') {
                      handlePrescriptionChange('left', 'sphere', '')
                    }
                  }}
                  className="w-full text-center text-blue-600 font-semibold text-sm border-2 border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 rounded-lg px-3 py-2 transition-all"
                  placeholder="0,00"
                />
              </td>
              <td className="border-2 border-gray-300 px-4 py-3 text-center">
                <input
                  type="text"
                  inputMode="decimal"
                  value={localLeftPrescription.cylinder !== undefined && localLeftPrescription.cylinder !== null && !isNaN(localLeftPrescription.cylinder) ? formatPrescriptionValue(localLeftPrescription.cylinder) : ''}
                  onChange={(e) => handlePrescriptionChange('left', 'cylinder', e.target.value)}
                  onBlur={(e) => {
                    const value = e.target.value.trim()
                    if (value === '') {
                      handlePrescriptionChange('left', 'cylinder', '')
                    }
                  }}
                  className="w-full text-center text-blue-600 font-semibold text-sm border-2 border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 rounded-lg px-3 py-2 transition-all"
                  placeholder="0,00"
                />
              </td>
                <td className="border-2 border-gray-300 px-4 py-3 text-center">
                  <div className="relative">
                    <input
                      type="number"
                      inputMode="numeric"
                      min="0"
                      max="180"
                      step="1"
                      value={(() => {
                        const axisValue = localLeftPrescription.axis !== undefined ? localLeftPrescription.axis : localLeftAxis
                        if (axisValue === undefined || axisValue === null) return ''
                        const taboValue = intToTabo(axisValue)
                        return taboValue.toString()
                      })()}
                      onChange={(e) => {
                        const value = e.target.value === '' ? undefined : parseInt(e.target.value)
                        handlePrescriptionChange('left', 'axis', value !== undefined ? value.toString() : '')
                      }}
                      onBlur={(e) => {
                        const value = e.target.value.trim()
                        if (value === '') {
                          handlePrescriptionChange('left', 'axis', '')
                        }
                      }}
                      className="w-full text-center text-blue-600 font-semibold text-sm border-2 border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 rounded-lg px-3 py-2 pr-12 transition-all"
                      placeholder="--"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-blue-600 font-bold whitespace-nowrap pointer-events-none bg-blue-50 px-2 py-1 rounded">TABO</span>
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
