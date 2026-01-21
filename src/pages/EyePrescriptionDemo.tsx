import React from 'react';
import EyePrescription from '../components/EyePrescription';

const EyePrescriptionDemo: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          Eye Prescription Form
        </h1>
        
        <div className="flex justify-center">
          <EyePrescription />
        </div>
      </div>
    </div>
  );
};

export default EyePrescriptionDemo;
