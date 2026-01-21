import React, { useState } from 'react';
import AxisDiagram from './AxisDiagram';

const AxisDiagramDemo: React.FC = () => {
  const [axisValue, setAxisValue] = useState(0);

  return (
    <div className="p-8 bg-white rounded-lg shadow-lg max-w-md mx-auto">
      <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">
        Axis Selector
      </h2>
      
      <div className="mb-6">
        <AxisDiagram
          value={axisValue}
          onChange={setAxisValue}
          min={-180}
          max={180}
          size={250}
        />
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
          <span className="text-sm font-medium text-gray-600">Selected Value:</span>
          <span className="text-lg font-bold text-blue-600">{axisValue}°</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setAxisValue(0)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Reset to 0°
          </button>
          <button
            onClick={() => setAxisValue(90)}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
          >
            Set to 90°
          </button>
          <button
            onClick={() => setAxisValue(-90)}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
          >
            Set to -90°
          </button>
          <button
            onClick={() => setAxisValue(180)}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors"
          >
            Set to 180°
          </button>
        </div>
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded">
        <h3 className="font-semibold text-blue-800 mb-2">How to use:</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Click and drag the needle to select a value</li>
          <li>• Green arc shows positive values (0° to 180°)</li>
          <li>• Red arc shows negative values (-180° to 0°)</li>
          <li>• Use the buttons for quick selection</li>
        </ul>
      </div>
    </div>
  );
};

export default AxisDiagramDemo;
