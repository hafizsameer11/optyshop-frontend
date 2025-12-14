import React, { useState } from 'react'
import { calculatePupillaryHeight, type PupillaryHeightResponse } from '../../services/simulationsService'

interface PupillaryHeightCalculatorProps {
  onClose?: () => void
  className?: string
}

const PupillaryHeightCalculator: React.FC<PupillaryHeightCalculatorProps> = ({ onClose, className = '' }) => {
  const [result, setResult] = useState<PupillaryHeightResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    pupilPosition: '',
    frameMidline: '',
    pixelToMMRatio: ''
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setResult(null)

    setIsLoading(true)

    try {
      // Build request data - only include fields that have values
      const requestData: any = {}
      if (formData.pupilPosition) {
        requestData.pupilPosition = parseFloat(formData.pupilPosition)
      }
      if (formData.frameMidline) {
        requestData.frameMidline = parseFloat(formData.frameMidline)
      }
      if (formData.pixelToMMRatio) {
        requestData.pixelToMMRatio = parseFloat(formData.pixelToMMRatio)
      }

      const response = await calculatePupillaryHeight(requestData)

      if (response) {
        setResult(response)
      } else {
        setError('Failed to calculate pupillary height. Please try again.')
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while calculating pupillary height.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    setResult(null)
    setError(null)
    setFormData({
      pupilPosition: '',
      frameMidline: '',
      pixelToMMRatio: ''
    })
  }

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-slate-900">Pupillary Height Calculator</h3>
        {onClose && (
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700 transition-colors"
            aria-label="Close calculator"
          >
            ✕
          </button>
        )}
      </div>

      <form onSubmit={handleCalculate} className="space-y-4">
        <p className="text-slate-600 text-sm mb-4">
          Calculate the pupillary height to ensure proper lens positioning in your frames.
        </p>

        {/* Input Fields */}
        <div className="space-y-4">
          <div>
            <label htmlFor="pupilPosition" className="block text-sm font-medium text-slate-700 mb-2">
              Pupil Position (mm) <span className="text-slate-400 text-xs">(optional)</span>
            </label>
            <input
              type="number"
              id="pupilPosition"
              name="pupilPosition"
              value={formData.pupilPosition}
              onChange={handleChange}
              min="0"
              step="0.1"
              placeholder="e.g., 150"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label htmlFor="frameMidline" className="block text-sm font-medium text-slate-700 mb-2">
              Frame Midline (mm) <span className="text-slate-400 text-xs">(optional)</span>
            </label>
            <input
              type="number"
              id="frameMidline"
              name="frameMidline"
              value={formData.frameMidline}
              onChange={handleChange}
              min="0"
              step="0.1"
              placeholder="e.g., 140"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label htmlFor="pixelToMMRatio" className="block text-sm font-medium text-slate-700 mb-2">
              Pixel to MM Ratio <span className="text-slate-400 text-xs">(optional)</span>
            </label>
            <input
              type="number"
              id="pixelToMMRatio"
              name="pixelToMMRatio"
              value={formData.pixelToMMRatio}
              onChange={handleChange}
              min="0"
              step="0.01"
              placeholder="e.g., 0.1"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 bg-blue-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Calculating...' : 'Calculate Pupillary Height'}
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="px-6 py-3 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors"
          >
            Reset
          </button>
        </div>
      </form>

      {result && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="text-lg font-semibold text-blue-900 mb-3">Calculation Results</h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-slate-700 font-medium">Height Difference:</span>
              <span className="text-xl font-bold text-blue-600">
                {result.calculation.heightDifferenceMM} mm
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-700 font-medium">Pupil Position:</span>
              <span className="text-xl font-bold text-blue-600">
                {result.calculation.pupilPosition} mm
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-700 font-medium">Frame Midline:</span>
              <span className="text-xl font-bold text-blue-600">
                {result.calculation.frameMidline} mm
              </span>
            </div>
            <div className="flex justify-between items-center mt-3 pt-3 border-t border-blue-200">
              <span className="text-slate-700 font-medium">Direction:</span>
              <span className="text-lg font-semibold text-blue-600 capitalize">
                {result.calculation.direction}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PupillaryHeightCalculator


