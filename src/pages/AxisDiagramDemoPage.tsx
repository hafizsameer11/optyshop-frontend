import React from 'react';
import AxisDiagram from '../components/common/AxisDiagramDemo';

const AxisDiagramDemoPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
          Axis Diagram Component Demo
        </h1>
        <div className="flex justify-center">
          <AxisDiagram />
        </div>
      </div>
    </div>
  );
};

export default AxisDiagramDemoPage;
