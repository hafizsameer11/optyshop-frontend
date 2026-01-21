import React, { useState, useEffect, useRef } from 'react';

interface AxisDiagramProps {
  value?: number;
  onChange?: (value: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  size?: number;
}

const AxisDiagram: React.FC<AxisDiagramProps> = ({
  value = 0,
  onChange,
  min = -180,
  max = 180,
  disabled = false,
  size = 200
}) => {
  const [currentValue, setCurrentValue] = useState(value);
  const [isDragging, setIsDragging] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    setCurrentValue(value);
  }, [value]);

  const centerX = size / 2;
  const centerY = size / 2;
  const radius = size * 0.35;
  const strokeWidth = size * 0.08;

  // Calculate angle from value (convert to radians)
  const valueToAngle = (val: number) => {
    const normalizedValue = ((val - min) / (max - min)) * 360 - 180;
    return (normalizedValue * Math.PI) / 180;
  };

  // Calculate value from angle
  const angleToValue = (angle: number) => {
    const degrees = (angle * 180) / Math.PI;
    const normalizedValue = (degrees + 180) / 360;
    return Math.round(min + normalizedValue * (max - min));
  };

  const currentAngle = valueToAngle(currentValue);
  const needleX = centerX + Math.cos(currentAngle) * radius;
  const needleY = centerY + Math.sin(currentAngle) * radius;

  // Arc paths
  const positiveArcPath = describeArc(centerX, centerY, radius, 0, 180);
  const negativeArcPath = describeArc(centerX, centerY, radius, 180, 360);

  // Tick marks and labels
  const ticks = [];
  for (let i = min; i <= max; i += 30) {
    const angle = valueToAngle(i);
    const tickStartX = centerX + Math.cos(angle) * (radius - strokeWidth);
    const tickStartY = centerY + Math.sin(angle) * (radius - strokeWidth);
    const tickEndX = centerX + Math.cos(angle) * (radius - strokeWidth * 0.5);
    const tickEndY = centerY + Math.sin(angle) * (radius - strokeWidth * 0.5);
    
    const labelX = centerX + Math.cos(angle) * (radius - strokeWidth * 1.5);
    const labelY = centerY + Math.sin(angle) * (radius - strokeWidth * 1.5);

    ticks.push({
      x1: tickStartX,
      y1: tickStartY,
      x2: tickEndX,
      y2: tickEndY,
      labelX,
      labelY,
      value: i,
      angle: angle * (180 / Math.PI)
    });
  }

  function describeArc(x: number, y: number, radius: number, startAngle: number, endAngle: number) {
    const start = polarToCartesian(x, y, radius, endAngle);
    const end = polarToCartesian(x, y, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    return [
      "M", start.x, start.y,
      "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y
    ].join(" ");
  }

  function polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number) {
    const angleInRadians = (angleInDegrees * Math.PI) / 180.0;
    return {
      x: centerX + radius * Math.cos(angleInRadians),
      y: centerY + radius * Math.sin(angleInRadians)
    };
  }

  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (disabled) return;
    setIsDragging(true);
    updateValue(e);
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!isDragging || disabled) return;
    updateValue(e);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const updateValue = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    
    const rect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - centerX;
    const y = e.clientY - rect.top - centerY;
    
    let angle = Math.atan2(y, x);
    let newValue = angleToValue(angle);
    
    // Clamp value to min/max range
    newValue = Math.max(min, Math.min(max, newValue));
    
    setCurrentValue(newValue);
    onChange?.(newValue);
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => setIsDragging(false);
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!isDragging || disabled || !svgRef.current) return;
      
      const rect = svgRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left - centerX;
      const y = e.clientY - rect.top - centerY;
      
      let angle = Math.atan2(y, x);
      let newValue = angleToValue(angle);
      
      newValue = Math.max(min, Math.min(max, newValue));
      
      setCurrentValue(newValue);
      onChange?.(newValue);
    };

    if (isDragging) {
      document.addEventListener('mouseup', handleGlobalMouseUp);
      document.addEventListener('mousemove', handleGlobalMouseMove);
    }

    return () => {
      document.removeEventListener('mouseup', handleGlobalMouseUp);
      document.removeEventListener('mousemove', handleGlobalMouseMove);
    };
  }, [isDragging, disabled, min, max, onChange]);

  return (
    <div className="flex flex-col items-center space-y-2">
      <svg
        ref={svgRef}
        width={size}
        height={size}
        className={`cursor-pointer ${disabled ? 'opacity-50' : ''}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        {/* Negative arc (top) */}
        <path
          d={negativeArcPath}
          fill="none"
          stroke="#ef4444"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          opacity={0.8}
        />
        
        {/* Positive arc (bottom) */}
        <path
          d={positiveArcPath}
          fill="none"
          stroke="#22c55e"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          opacity={0.8}
        />

        {/* Tick marks */}
        {ticks.map((tick, index) => (
          <g key={index}>
            <line
              x1={tick.x1}
              y1={tick.y1}
              x2={tick.x2}
              y2={tick.y2}
              stroke="#374151"
              strokeWidth={2}
            />
            <text
              x={tick.labelX}
              y={tick.labelY}
              fill="#374151"
              fontSize={size * 0.08}
              textAnchor="middle"
              dominantBaseline="middle"
              transform={`rotate(${tick.angle}, ${tick.labelX}, ${tick.labelY})`}
            >
              {tick.value}
            </text>
          </g>
        ))}

        {/* Center circle */}
        <circle
          cx={centerX}
          cy={centerY}
          r={strokeWidth * 0.8}
          fill="#1f2937"
        />

        {/* Needle */}
        <line
          x1={centerX}
          y1={centerY}
          x2={needleX}
          y2={needleY}
          stroke="#dc2626"
          strokeWidth={3}
          strokeLinecap="round"
          className={`transition-none ${isDragging ? 'stroke-red-600' : ''}`}
        />

        {/* Needle tip */}
        <circle
          cx={needleX}
          cy={needleY}
          r={strokeWidth * 0.3}
          fill="#dc2626"
        />
      </svg>
      
      <div className="text-center">
        <div className="text-2xl font-bold text-gray-800">{currentValue}°</div>
        <div className="text-sm text-gray-500">Axis Value</div>
      </div>
    </div>
  );
};

export default AxisDiagram;
