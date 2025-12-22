import React, { useState } from 'react'
import { calculateLensThickness, type LensThicknessResponse } from '../../services/simulationsService'

interface LensThicknessCalculatorProps {
  onClose?: () => void
  className?: string
}

const LensThicknessCalculator: React.FC<LensThicknessCalculatorProps> = ({ onClose, className = '' }) => {
  const [frameDiameter, setFrameDiameter] = useState<string>('')
  const [lensPower, setLensPower] = useState<string>('')
  const [lensIndex, setLensIndex] = useState<string>('')
  const [result, setResult] = useState<LensThicknessResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setResult(null)

    // Trim whitespace from inputs
    const diameterStr = frameDiameter.trim()
    const powerStr = lensPower.trim()
    const indexStr = lensIndex.trim()

    // Validate that all required fields are filled
    if (!diameterStr) {
      setError('Please enter a frame diameter')
      return
    }

    if (!powerStr) {
      setError('Please enter a lens power')
      return
    }

    if (!indexStr) {
      setError('Please enter a lens index')
      return
    }

    const diameter = parseFloat(diameterStr)
    const power = parseFloat(powerStr)
    const index = parseFloat(indexStr)

    if (isNaN(diameter) || diameter <= 0) {
      setError('Frame diameter must be a valid positive number (e.g., 52)')
      return
    }

    if (diameter > 100) {
      setError('Frame diameter seems too large. Please enter a value between 40-80 mm')
      return
    }

    if (isNaN(power)) {
      setError('Lens power must be a valid number (e.g., -4.5 or +2.0)')
      return
    }

    if (Math.abs(power) > 20) {
      setError('Lens power seems too high. Please enter a value between -20 and +20')
      return
    }

    if (isNaN(index) || index <= 0) {
      setError('Lens index must be a valid positive number (e.g., 1.49, 1.56, 1.60, 1.67, 1.74)')
      return
    }

    if (index < 1.4 || index > 1.8) {
      setError('Lens index should be between 1.4 and 1.8 (common values: 1.49, 1.56, 1.60, 1.67, 1.74)')
      return
    }

    setIsLoading(true)

    try {
      const response = await calculateLensThickness({
        frameDiameter: diameter,
        lensPower: power,
        lensIndex: index,
      })

      if (response && response.calculation) {
        setResult(response)
      } else {
        setError('Failed to calculate lens thickness. Please check your inputs and try again.')
      }
    } catch (err: any) {
      const errorMessage = err.message || err.error || 'An error occurred while calculating lens thickness. Please try again.'
      setError(errorMessage)
      console.error('Lens thickness calculation error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    setFrameDiameter('')
    setLensPower('')
    setLensIndex('')
    setResult(null)
    setError(null)
  }

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-slate-900">Lens Thickness Calculator</h3>
        {onClose && (
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700 transition-colors w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center"
            aria-label="Close calculator"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <form onSubmit={handleCalculate} className="space-y-4">
        <div>
          <label htmlFor="frameDiameter" className="block text-sm font-medium text-slate-700 mb-2">
            Frame Diameter (mm)
            <span className="text-red-500 ml-1">*</span>
          </label>
          <input
            type="number"
            id="frameDiameter"
            step="0.1"
            min="40"
            max="80"
            value={frameDiameter}
            onChange={(e) => setFrameDiameter(e.target.value)}
            required
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter frame diameter (e.g., 52)"
          />
        </div>

        <div>
          <label htmlFor="lensPower" className="block text-sm font-medium text-slate-700 mb-2">
            Lens Power (D)
            <span className="text-red-500 ml-1">*</span>
          </label>
          <input
            type="number"
            id="lensPower"
            step="0.25"
            min="-20"
            max="20"
            value={lensPower}
            onChange={(e) => setLensPower(e.target.value)}
            required
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter lens power (e.g., -4.5 or +2.0)"
          />
        </div>

        <div>
          <label htmlFor="lensIndex" className="block text-sm font-medium text-slate-700 mb-2">
            Lens Index
            <span className="text-red-500 ml-1">*</span>
          </label>
          <input
            type="number"
            id="lensIndex"
            step="0.01"
            min="1.4"
            max="1.8"
            value={lensIndex}
            onChange={(e) => setLensIndex(e.target.value)}
            required
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter lens index (e.g., 1.49, 1.56, 1.60, 1.67, 1.74)"
          />
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
            {isLoading ? 'Calculating...' : 'Calculate Thickness'}
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
              <span className="text-slate-700 font-medium">Edge Thickness:</span>
              <span className="text-xl font-bold text-blue-600">
                {result.calculation.edgeThickness.toFixed(2)} mm
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-700 font-medium">Center Thickness:</span>
              <span className="text-xl font-bold text-blue-600">
                {result.calculation.centerThickness.toFixed(2)} mm
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-700 font-medium">Thickness Category:</span>
              <span className="text-lg font-semibold text-blue-600 capitalize">
                {result.calculation.thicknessCategory}
              </span>
            </div>
            {result.calculation.recommendation && (
              <div className="mt-3 pt-3 border-t border-blue-200">
                <p className="text-sm text-slate-600">{result.calculation.recommendation}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default LensThicknessCalculator


