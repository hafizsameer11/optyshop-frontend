import React, { useState } from 'react';

interface EyePrescriptionProps {
  className?: string;
}

const EyePrescription: React.FC<EyePrescriptionProps> = ({ className = '' }) => {
  const [rightEye, setRightEye] = useState({
    sph: '--',
    cyl: '--',
    axis: '--'
  });

  const [leftEye, setLeftEye] = useState({
    sph: '--',
    cyl: '--',
    axis: '--'
  });

  const [pupillaryDistance, setPupillaryDistance] = useState('');

  const handleInputChange = (eye: 'right' | 'left', field: 'sph' | 'cyl' | 'axis', value: string) => {
    if (eye === 'right') {
      setRightEye(prev => ({ ...prev, [field]: value }));
    } else {
      setLeftEye(prev => ({ ...prev, [field]: value }));
    }
  };

  const copyRightToLeft = () => {
    setLeftEye(rightEye);
  };

  const EyeCard: React.FC<{
    title: string;
    eyeType: 'right' | 'left';
    values: { sph: string; cyl: string; axis: string };
  }> = ({ title, eyeType, values }) => {
    const cardBgColor = eyeType === 'right' ? 'bg-purple-50' : 'bg-blue-50';
    const dotColor = eyeType === 'right' ? 'bg-purple-500' : 'bg-blue-500';
    
    return (
      <div className={`rounded-lg p-6 shadow-sm ${cardBgColor} border border-gray-200 h-full`}>
        <div className="flex items-center mb-6">
          <div className={`w-3 h-3 rounded-full mr-3 ${dotColor}`}></div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <div className="ml-2 w-5 h-5 bg-gray-200 rounded-full flex items-center justify-center">
            <span className="text-gray-600 text-xs font-light">?</span>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <label className="text-sm font-medium text-gray-700 block mb-2">SPH</label>
            <div className="relative">
              <select
                value={values.sph}
                onChange={(e) => handleInputChange(eyeType, 'sph', e.target.value)}
                className="w-full px-3 py-2 rounded-md text-gray-900 text-center font-medium bg-white border border-gray-300 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="--">--</option>
                <option value="-8.00">-8.00</option>
                <option value="-7.50">-7.50</option>
                <option value="-7.00">-7.00</option>
                <option value="-6.50">-6.50</option>
                <option value="-6.00">-6.00</option>
                <option value="-5.50">-5.50</option>
                <option value="-5.00">-5.00</option>
                <option value="-4.50">-4.50</option>
                <option value="-4.00">-4.00</option>
                <option value="-3.50">-3.50</option>
                <option value="-3.00">-3.00</option>
                <option value="-2.50">-2.50</option>
                <option value="-2.00">-2.00</option>
                <option value="-1.50">-1.50</option>
                <option value="-1.00">-1.00</option>
                <option value="-0.75">-0.75</option>
                <option value="-0.50">-0.50</option>
                <option value="-0.25">-0.25</option>
                <option value="0.00">0.00</option>
                <option value="+0.25">+0.25</option>
                <option value="+0.50">+0.50</option>
                <option value="+0.75">+0.75</option>
                <option value="+1.00">+1.00</option>
                <option value="+1.25">+1.25</option>
                <option value="+1.50">+1.50</option>
                <option value="+1.75">+1.75</option>
                <option value="+2.00">+2.00</option>
                <option value="+2.25">+2.25</option>
                <option value="+2.50">+2.50</option>
                <option value="+2.75">+2.75</option>
                <option value="+3.00">+3.00</option>
                <option value="+3.50">+3.50</option>
                <option value="+4.00">+4.00</option>
                <option value="+4.50">+4.50</option>
                <option value="+5.00">+5.00</option>
              </select>
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          <div className="text-center">
            <label className="text-sm font-medium text-gray-700 block mb-2">CYL</label>
            <div className="relative">
              <select
                value={values.cyl}
                onChange={(e) => handleInputChange(eyeType, 'cyl', e.target.value)}
                className="w-full px-3 py-2 rounded-md text-gray-900 text-center font-medium bg-white border border-gray-300 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="--">--</option>
                <option value="-8.00">-8.00</option>
                <option value="-7.50">-7.50</option>
                <option value="-7.00">-7.00</option>
                <option value="-6.50">-6.50</option>
                <option value="-6.00">-6.00</option>
                <option value="-5.50">-5.50</option>
                <option value="-5.00">-5.00</option>
                <option value="-4.50">-4.50</option>
                <option value="-4.00">-4.00</option>
                <option value="-3.50">-3.50</option>
                <option value="-3.00">-3.00</option>
                <option value="-2.50">-2.50</option>
                <option value="-2.00">-2.00</option>
                <option value="-1.50">-1.50</option>
                <option value="-1.00">-1.00</option>
                <option value="-0.75">-0.75</option>
                <option value="-0.50">-0.50</option>
                <option value="-0.25">-0.25</option>
                <option value="0.00">0.00</option>
                <option value="+0.25">+0.25</option>
                <option value="+0.50">+0.50</option>
                <option value="+0.75">+0.75</option>
                <option value="+1.00">+1.00</option>
                <option value="+1.25">+1.25</option>
                <option value="+1.50">+1.50</option>
                <option value="+1.75">+1.75</option>
                <option value="+2.00">+2.00</option>
                <option value="+2.25">+2.25</option>
                <option value="+2.50">+2.50</option>
                <option value="+2.75">+2.75</option>
                <option value="+3.00">+3.00</option>
                <option value="+3.50">+3.50</option>
                <option value="+4.00">+4.00</option>
                <option value="+4.50">+4.50</option>
                <option value="+5.00">+5.00</option>
              </select>
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          <div className="text-center">
            <label className="text-sm font-medium text-gray-700 block mb-2">AXIS</label>
            <div className="relative">
              <select
                value={values.axis}
                onChange={(e) => handleInputChange(eyeType, 'axis', e.target.value)}
                className="w-full px-3 py-2 rounded-md text-gray-900 text-center font-medium bg-white border border-gray-300 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="--">--</option>
                {Array.from({ length: 181 }, (_, i) => i).map(num => (
                  <option key={num} value={num}>{num}</option>
                ))}
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
            <option value="">Enter Your Pupillary Distance</option>
            <option value="60">60</option>
            <option value="61">61</option>
            <option value="62">62</option>
            <option value="63">63</option>
            <option value="64">64</option>
            <option value="65">65</option>
            <option value="66">66</option>
            <option value="67">67</option>
            <option value="68">68</option>
          </select>
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
    </div>
  );
};

export default EyePrescription;
