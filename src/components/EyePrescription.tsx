import React, { useState, useEffect } from 'react';
import { getNearVisionFormStructure, getFieldValues, type PrescriptionFormStructure } from '../services/prescriptionFormsService';

interface EyePrescriptionProps {
  className?: string;
  onPrescriptionChange?: (prescriptionData: PrescriptionData) => void;
}

interface PrescriptionData {
  pd?: string;
  right_eye_sph?: string;
  right_eye_cyl?: string;
  right_eye_axis?: string;
  left_eye_sph?: string;
  left_eye_cyl?: string;
  left_eye_axis?: string;
  copy_left_to_right?: boolean;
}

const EyePrescription: React.FC<EyePrescriptionProps> = ({ className = '', onPrescriptionChange }) => {
  const [rightEye, setRightEye] = useState({
    sph: '',
    cyl: '',
    axis: ''
  });

  const [leftEye, setLeftEye] = useState({
    sph: '',
    cyl: '',
    axis: ''
  });

  const [pupillaryDistance, setPupillaryDistance] = useState('');
  const [formStructure, setFormStructure] = useState<PrescriptionFormStructure | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch form structure from API
  useEffect(() => {
    const fetchFormStructure = async () => {
      try {
        setLoading(true);
        const structure = await getNearVisionFormStructure();
        console.log('API Response - Form Structure:', structure);
        setFormStructure(structure);
        setError('');
      } catch (err: any) {
        console.error('Failed to fetch prescription form structure:', err);
        setError(err.message || 'Failed to load prescription options');
      } finally {
        setLoading(false);
      }
    };

    fetchFormStructure();
  }, []);

  // Notify parent of prescription changes
  useEffect(() => {
    if (onPrescriptionChange) {
      const prescriptionData: PrescriptionData = {
        pd: pupillaryDistance || undefined,
        right_eye_sph: rightEye.sph,
        right_eye_cyl: rightEye.cyl,
        right_eye_axis: rightEye.axis,
        left_eye_sph: leftEye.sph,
        left_eye_cyl: leftEye.cyl,
        left_eye_axis: leftEye.axis,
      };
      onPrescriptionChange(prescriptionData);
    }
  }, [rightEye, leftEye, pupillaryDistance, onPrescriptionChange]);

  const handleInputChange = (eye: 'right' | 'left', field: 'sph' | 'cyl' | 'axis', value: string) => {
    console.log(`Changing ${eye} eye ${field} to: ${value}`);
    if (eye === 'right') {
      setRightEye(prev => ({ ...prev, [field]: value }));
    } else {
      setLeftEye(prev => ({ ...prev, [field]: value }));
    }
  };

  const copyRightToLeft = () => {
    setLeftEye(rightEye);
  };

  // Get dropdown options from API with default placeholder
  const getSphOptions = () => {
    const options = [<option key="" value="">Select SPH</option>];
    
    if (formStructure) {
      const sphValues = getFieldValues(formStructure, 'sph', 'both');
      console.log('SPH Values from API:', sphValues);
      if (sphValues.length > 0) {
        options.push(...sphValues.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        )));
      }
    }
    return options;
  };

  const getCylOptions = () => {
    const options = [<option key="" value="">Select CYL</option>];
    
    if (formStructure) {
      const cylValues = getFieldValues(formStructure, 'cyl', 'both');
      if (cylValues.length > 0) {
        options.push(...cylValues.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        )));
      }
    }
    return options;
  };

  const getAxisOptions = () => {
    const options = [<option key="" value="">Select AXIS</option>];
    
    if (formStructure) {
      const axisValues = getFieldValues(formStructure, 'axis', 'both');
      if (axisValues.length > 0) {
        options.push(...axisValues.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        )));
      }
    }
    return options;
  };

  const getPdOptions = () => {
    const options = [<option key="" value="">Select Pupillary Distance</option>];
    
    if (formStructure) {
      const pdValues = getFieldValues(formStructure, 'pd', 'both');
      if (pdValues.length > 0) {
        options.push(...pdValues.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        )));
      }
    }
    return options;
  };

  const EyeCard: React.FC<{
    title: string;
    eyeType: 'right' | 'left';
    values: { sph: string; cyl: string; axis: string };
  }> = ({ title, eyeType, values }) => {
    const cardBgColor = eyeType === 'right' ? 'bg-purple-50' : 'bg-blue-50';
    const dotColor = eyeType === 'right' ? 'bg-purple-500' : 'bg-blue-500';
    
    return (
      <div className={`rounded-lg p-5 shadow-sm ${cardBgColor} border border-gray-200 h-full flex flex-col`}>
        <div className="flex items-center mb-5">
          <div className={`w-3 h-3 rounded-full mr-3 ${dotColor}`}></div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <div className="ml-2 w-5 h-5 bg-gray-200 rounded-full flex items-center justify-center">
            <span className="text-gray-600 text-xs font-light">?</span>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-3 items-end flex-grow">
          <div className="text-center">
            <label className="text-sm font-medium text-gray-700 block mb-1">SPH</label>
            <div className="relative">
              <select
                value={values.sph}
                onChange={(e) => handleInputChange(eyeType, 'sph', e.target.value)}
                className="w-full px-2 py-2 h-10 rounded-md text-gray-900 text-center font-medium bg-white border border-gray-300 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
              >
                {getSphOptions()}
              </select>
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          <div className="text-center">
            <label className="text-sm font-medium text-gray-700 block mb-1">CYL</label>
            <div className="relative">
              <select
                value={values.cyl}
                onChange={(e) => handleInputChange(eyeType, 'cyl', e.target.value)}
                className="w-full px-2 py-2 h-10 rounded-md text-gray-900 text-center font-medium bg-white border border-gray-300 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
              >
                {getCylOptions()}
              </select>
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          <div className="text-center">
            <label className="text-sm font-medium text-gray-700 block mb-1">AXIS</label>
            <div className="relative">
              <select
                value={values.axis}
                onChange={(e) => handleInputChange(eyeType, 'axis', e.target.value)}
                className="w-full px-2 py-2 h-10 rounded-md text-gray-900 text-center font-medium bg-white border border-gray-300 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
              >
                {getAxisOptions()}
              </select>
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`w-full max-w-4xl mx-auto ${className}`}>
      {loading && (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          <span className="ml-2 text-gray-600">Loading prescription options...</span>
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}
      
      {!loading && !error && (
        <>
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Near Vision</h2>
      
      <div className="mb-8">
        <div className="flex items-center mb-3">
          <label className="text-lg font-medium text-gray-900">Pupillary Distance (PD)</label>
          <div className="ml-2 w-5 h-5 bg-gray-200 rounded-full flex items-center justify-center">
            <span className="text-gray-600 text-xs font-light">?</span>
          </div>
        </div>
        <div className="relative">
          <select
            value={pupillaryDistance}
            onChange={(e) => setPupillaryDistance(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-gray-900 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            {getPdOptions()}
          </select>
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-6 items-stretch">
        <EyeCard 
          title="Right Eye OD" 
          eyeType="right" 
          values={rightEye}
        />
        <EyeCard 
          title="Left Eye OS" 
          eyeType="left" 
          values={leftEye}
        />
      </div>
      
      <div className="flex justify-center mt-8">
        <button
          onClick={copyRightToLeft}
          className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200 font-medium flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
          Copy Right to Left
        </button>
      </div>
        </>
      )}
    </div>
  );
};

export default EyePrescription;
