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
    // 0° is at the right (3 o'clock position)
    // Positive values go counter-clockwise
    // Negative values go clockwise
    let angle = 0;
    
    if (axisValue < 0) {
      // Negative values: -1 becomes 1°, -90 becomes 90°, -180 becomes 180°
      angle = Math.abs(axisValue);
    } else if (axisValue > 0) {
      // Positive values: 1 becomes 359°, 90 becomes 270°, 180 becomes 180°
      angle = 360 - axisValue;
    }
    
    setNeedleAngle(angle);
  }, [axisValue]);

  const centerX = 200;
  const centerY = 200;
  const radius = 160;
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
        
        // Calculate the display value (positive/negative)
        let displayValue = i;
        if (i > 0 && i < 180) {
          displayValue = -i; // Negative on the right side (0° to 180°)
        } else if (i > 180) {
          displayValue = 360 - i; // Positive on the left side (180° to 360°)
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
      <div className="bg-gray-100 rounded-lg p-4 border border-gray-300 shadow-sm">
        <div className="flex justify-center items-center">
          <div className="relative" style={{ width: '400px', height: '400px' }}>
            {/* Circular Protractor SVG */}
            <svg
              viewBox="0 0 400 400"
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
    <div className="bg-gray-100 rounded-lg p-6 max-w-2xl mx-auto border border-gray-300 shadow-sm">
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

      <div className="flex justify-center items-center mb-4">
        <div className="relative" style={{ width: '400px', height: '400px' }}>
          {/* Circular Protractor SVG */}
          <svg
            viewBox="0 0 400 400"
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

      <div className="text-center mb-4">
        <div className="text-lg font-bold text-gray-800">
          Axis: {axisValue}°
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">How to read your axis:</h4>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>The axis is measured in degrees from -180° to +180°</li>
          <li>Negative values (-180° to 0°) are shown on the right side</li>
          <li>Positive values (0° to +180°) are shown on the left side</li>
          <li>0° is at the right (3 o'clock position)</li>
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

