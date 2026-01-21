import React, { useState, useEffect } from 'react'

interface AxisDiagramProps {
  onClose?: () => void
  compact?: boolean
  axisValue?: number
}

const AxisDiagram: React.FC<AxisDiagramProps> = ({
  onClose,
  compact = false,
  axisValue = 0
}) => {
  const [needleAngle, setNeedleAngle] = useState(0);

  useEffect(() => {
    // Convert axis value to rotation angle for circular protractor
    // In ophthalmology: 0° is at right (3 o'clock), 90° is at top (12 o'clock)
    // 180° is at left (9 o'clock), 270° is at bottom (6 o'clock)
    // Negative values go clockwise from 0°, positive values go counter-clockwise
    let angle = 0;
    
    if (axisValue < 0) {
      // Negative values: -1 becomes 359°, -65 becomes 295°, -84 becomes 276°, -90 becomes 270°
      angle = 360 + axisValue; // axisValue is negative, so this adds to 360
    } else {
      // Positive values: 0 becomes 0°, 90 becomes 90°, 180 becomes 180°
      angle = axisValue;
    }
    
    setNeedleAngle(angle);
  }, [axisValue]);

  const centerX = 150;
  const centerY = 150;
  const radius = 120;
  const needleLength = radius * 0.8;

  // Calculate needle position
  const needleAngleRad = (needleAngle - 90) * (Math.PI / 180);
  const needleX = centerX + Math.cos(needleAngleRad) * needleLength;
  const needleY = centerY + Math.sin(needleAngleRad) * needleLength;

  // Generate angle markings for circular protractor
  const generateMarkings = () => {
    const markings = [];
    
    // Main degree markings every 10 degrees
    for (let i = 0; i <= 360; i += 10) {
      const angle = (i - 90) * (Math.PI / 180); // Convert to radians, adjust for SVG coordinate system
      const isMainMarking = i % 30 === 0;
      const markLength = isMainMarking ? 15 : 8;
      
      const x1 = centerX + Math.cos(angle) * (radius - markLength);
      const y1 = centerY + Math.sin(angle) * (radius - markLength);
      const x2 = centerX + Math.cos(angle) * radius;
      const y2 = centerY + Math.sin(angle) * radius;
      
      markings.push(
        <line
          key={`mark-${i}`}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke="#333"
          strokeWidth={isMainMarking ? 2 : 1}
        />
      );
      
      // Add degree labels for main markings
      if (isMainMarking) {
        const labelRadius = radius - 25;
        const labelX = centerX + Math.cos(angle) * labelRadius;
        const labelY = centerY + Math.sin(angle) * labelRadius;
        
        // Calculate the display value (ophthalmic axis convention)
        let displayValue = i;
        if (i > 0 && i <= 180) {
          displayValue = i; // Positive values: 0° to 180° (right to left, through top)
        } else if (i > 180) {
          displayValue = i - 360; // Negative values: 181° to 359° become -179° to -1°
        }
        
        markings.push(
          <text
            key={`label-${i}`}
            x={labelX}
            y={labelY}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="12"
            fill="#333"
            fontWeight="bold"
          >
            {displayValue}
          </text>
        );
      }
    }
    
    return markings;
  };

  
  if (compact) {
    return (
      <div className="bg-gray-100 rounded-lg p-4 border border-gray-300 shadow-sm" style={{ width: '300px', height: '320px' }}>
        <div className="flex justify-center items-center h-full">
          <div className="relative" style={{ width: '280px', height: '280px' }}>
            {/* Circular Protractor SVG */}
            <svg
              viewBox="0 0 300 300"
              className="w-full h-full"
              style={{ maxWidth: '100%', height: 'auto' }}
            >
              {/* Outer circle */}
              <circle
                cx={centerX}
                cy={centerY}
                r={radius}
                fill="white"
                stroke="#333"
                strokeWidth="2"
              />
              
              {/* Inner circle */}
              <circle
                cx={centerX}
                cy={centerY}
                r="8"
                fill="#333"
              />
              
              {/* Angle markings */}
              {generateMarkings()}
              
              {/* Horizontal and vertical reference lines */}
              <line
                x1={centerX - radius}
                y1={centerY}
                x2={centerX + radius}
                y2={centerY}
                stroke="#666"
                strokeWidth="1"
                strokeDasharray="2,2"
              />
              <line
                x1={centerX}
                y1={centerY - radius}
                x2={centerX}
                y2={centerY + radius}
                stroke="#666"
                strokeWidth="1"
                strokeDasharray="2,2"
              />
              
              {/* Needle */}
              <line
                x1={centerX}
                y1={centerY}
                x2={needleX}
                y2={needleY}
                stroke="#ff0000"
                strokeWidth="3"
                strokeLinecap="round"
              />
              
              {/* Needle base circle */}
              <circle
                cx={centerX}
                cy={centerY}
                r="6"
                fill="#ff0000"
              />
            </svg>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-100 rounded-lg p-4 w-72 h-80 mx-auto border border-gray-300 shadow-sm">
      {onClose && (
        <div className="flex justify-end mb-4">
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      <div className="flex justify-center items-center mb-2">
        <div className="relative" style={{ width: '200px', height: '200px' }}>
          {/* Circular Protractor SVG */}
          <svg
            viewBox="0 0 300 300"
            className="w-full h-full"
            style={{ maxWidth: '200px', height: '200px' }}
          >
            {/* Outer circle */}
            <circle
              cx={centerX}
              cy={centerY}
              r={radius}
              fill="white"
              stroke="#333"
              strokeWidth="2"
            />
            
            {/* Inner circle */}
            <circle
              cx={centerX}
              cy={centerY}
              r="8"
              fill="#333"
            />
            
            {/* Angle markings */}
            {generateMarkings()}
            
            {/* Horizontal and vertical reference lines */}
            <line
              x1={centerX - radius}
              y1={centerY}
              x2={centerX + radius}
              y2={centerY}
              stroke="#666"
              strokeWidth="1"
              strokeDasharray="2,2"
            />
            <line
              x1={centerX}
              y1={centerY - radius}
              x2={centerX}
              y2={centerY + radius}
              stroke="#666"
              strokeWidth="1"
              strokeDasharray="2,2"
            />
            
            {/* Needle */}
            <line
              x1={centerX}
              y1={centerY}
              x2={needleX}
              y2={needleY}
              stroke="#ff0000"
              strokeWidth="3"
              strokeLinecap="round"
            />
            
            {/* Needle base circle */}
            <circle
              cx={centerX}
              cy={centerY}
              r="6"
              fill="#ff0000"
            />
          </svg>
        </div>
      </div>

      <div className="text-center mb-2">
        <div className="text-lg font-bold text-gray-800">
          Axis: {axisValue}°
        </div>
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

