import React, { useState } from 'react';
import AxisDiagram from './AxisDiagram';

const AxisDiagramDemo: React.FC = () => {
  const [axisValue, setAxisValue] = useState(0);
  const [showDualScale, setShowDualScale] = useState(false);
  const [notation, setNotation] = useState<'INT' | 'TABO'>('INT');

  return (
    <div className="p-8 bg-white rounded-lg shadow-lg max-w-2xl mx-auto">
      <h2 className="text-3xl font-bold text-center mb-6 text-gray-800">
        Axis Diagram Demo
      </h2>
      
      {/* Controls */}
      <div className="mb-6 flex flex-wrap gap-4 justify-center">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Notation:</label>
          <select
            value={notation}
            onChange={(e) => setNotation(e.target.value as 'INT' | 'TABO')}
            className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="INT">International (INT)</option>
            <option value="TABO">TABO</option>
          </select>
        </div>
        
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="dualScale"
            checked={showDualScale}
            onChange={(e) => setShowDualScale(e.target.checked)}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="dualScale" className="text-sm font-medium text-gray-700">
            Show Dual Scale (INT/TABO)
          </label>
        </div>
      </div>
      
      <div className="mb-6 flex justify-center">
        <AxisDiagram
          value={axisValue}
          onChange={setAxisValue}
          size={400}
          showDualScale={showDualScale}
          notation={notation}
        />
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
          <span className="text-sm font-medium text-gray-600">Selected Value:</span>
          <span className="text-2xl font-bold text-blue-600">{axisValue}°</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <button
            onClick={() => setAxisValue(0)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors font-medium"
          >
            0°
          </button>
          <button
            onClick={() => setAxisValue(45)}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors font-medium"
          >
            45°
          </button>
          <button
            onClick={() => setAxisValue(90)}
            className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors font-medium"
          >
            90°
          </button>
          <button
            onClick={() => setAxisValue(135)}
            className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors font-medium"
          >
            135°
          </button>
          <button
            onClick={() => setAxisValue(180)}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors font-medium"
          >
            180°
          </button>
          <button
            onClick={() => setAxisValue(30)}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors font-medium"
          >
            30°
          </button>
          <button
            onClick={() => setAxisValue(60)}
            className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600 transition-colors font-medium"
          >
            60°
          </button>
          <button
            onClick={() => setAxisValue(120)}
            className="px-4 py-2 bg-pink-500 text-white rounded hover:bg-pink-600 transition-colors font-medium"
          >
            120°
          </button>
        </div>
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold text-blue-800 mb-3">How to use:</h3>
        <div className="grid md:grid-cols-2 gap-4 text-sm text-blue-700">
          <div>
            <h4 className="font-semibold mb-2">Mouse Controls:</h4>
            <ul className="space-y-1">
              <li>• Click and drag the needle to select a value</li>
              <li>• Semi-circular protractor (0° to 180°)</li>
              <li>• Outer scale shows INT values (0-180)</li>
              {showDualScale && <li>• Inner scale shows TABO values (180-0)</li>}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Keyboard Controls:</h4>
            <ul className="space-y-1">
              <li>• Arrow keys: Adjust by 5°</li>
              <li>• Page Up/Down: Adjust by 15°</li>
              <li>• Home: Set to 0°</li>
              <li>• End: Set to 180°</li>
              <li>• Tab to navigate between diagrams</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-4 p-4 bg-green-50 rounded-lg">
        <h3 className="font-semibold text-green-800 mb-2">Features:</h3>
        <ul className="text-sm text-green-700 space-y-1">
          <li>• Semi-circular protractor design</li>
          <li>• Dual scale support (INT/TABO notation systems)</li>
          <li>• Interactive needle with arrow pointer</li>
          <li>• Concentric arc grid for precise reading</li>
          <li>• Accessibility features with keyboard navigation</li>
          <li>• Screen reader support with ARIA labels</li>
        </ul>
      </div>
    </div>
  );
};

export default AxisDiagramDemo;
