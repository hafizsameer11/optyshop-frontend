import React, { useState } from 'react'
import { calculateBaseCurve, type BaseCurveResponse } from '../../services/simulationsService'

interface BaseCurveCalculatorProps {
  onClose?: () => void
  className?: string
}

const BaseCurveCalculator: React.FC<BaseCurveCalculatorProps> = ({ onClose, className = '' }) => {
  const [spherePower, setSpherePower] = useState<string>('-3')
  const [cylinderPower, setCylinderPower] = useState<string>('-0.75')
  const [cornealCurvature, setCornealCurvature] = useState<string>('')
  const [result, setResult] = useState<BaseCurveResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setResult(null)

    // Validate inputs
    const sphere = parseFloat(spherePower)
    const cylinder = parseFloat(cylinderPower)
    const corneal = cornealCurvature ? parseFloat(cornealCurvature) : null

    if (isNaN(sphere)) {
      setError('Sphere power must be a valid number')
      return
    }

    if (isNaN(cylinder)) {
      setError('Cylinder power must be a valid number')
      return
    }

    if (cornealCurvature && corneal !== null && isNaN(corneal)) {
      setError('Corneal curvature must be a valid number or empty')
      return
    }

    setIsLoading(true)

    try {
      // Build request data - only include cornealCurvature if provided
      const data: { spherePower: number; cylinderPower: number; cornealCurvature?: number } = {
        spherePower: sphere,
        cylinderPower: cylinder,
      }
      
      // Only add cornealCurvature if it's provided (not null/empty)
      if (corneal !== null && !isNaN(corneal)) {
        data.cornealCurvature = corneal
      }

      if (import.meta.env.DEV) {
        console.log('[Base Curve] Sending request:', data)
      }

      const response = await calculateBaseCurve(data)

      if (response && response.calculation) {
        setResult(response)
        if (import.meta.env.DEV) {
          console.log('[Base Curve] Calculation result:', response)
        }
      } else {
        setError('Failed to calculate base curve. The server returned an invalid response.')
      }
    } catch (err: any) {
      // Show detailed error message from API
      const errorMessage = err.message || err.error || 'An error occurred while calculating base curve.'
      setError(errorMessage)
      
      if (import.meta.env.DEV) {
        console.error('[Base Curve] Error details:', err)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    setSpherePower('-3')
    setCylinderPower('-0.75')
    setCornealCurvature('')
    setResult(null)
    setError(null)
  }

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-slate-900">Base Curve Calculator</h3>
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
          <label htmlFor="spherePower" className="block text-sm font-medium text-slate-700 mb-2">
            Sphere Power (D)
            <span className="text-red-500 ml-1">*</span>
          </label>
          <input
            type="number"
            id="spherePower"
            step="0.25"
            value={spherePower}
            onChange={(e) => setSpherePower(e.target.value)}
            required
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="-3.00"
          />
        </div>

        <div>
          <label htmlFor="cylinderPower" className="block text-sm font-medium text-slate-700 mb-2">
            Cylinder Power (D)
            <span className="text-red-500 ml-1">*</span>
          </label>
          <input
            type="number"
            id="cylinderPower"
            step="0.25"
            value={cylinderPower}
            onChange={(e) => setCylinderPower(e.target.value)}
            required
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="-0.75"
          />
        </div>

        <div>
          <label htmlFor="cornealCurvature" className="block text-sm font-medium text-slate-700 mb-2">
            Corneal Curvature (mm)
            <span className="text-slate-500 text-xs ml-1">(Optional)</span>
          </label>
          <input
            type="number"
            id="cornealCurvature"
            step="0.1"
            value={cornealCurvature}
            onChange={(e) => setCornealCurvature(e.target.value)}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Leave empty if unknown"
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div className="flex-1">
                <p className="font-semibold">Error</p>
                <p className="text-sm mt-1 whitespace-pre-line">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 bg-blue-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Calculating...' : 'Calculate Base Curve'}
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

      {result && result.calculation && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="text-lg font-semibold text-blue-900 mb-3">Calculation Result</h4>
          <div className="space-y-2">
            {result.calculation.baseCurve !== undefined && (
              <div className="flex justify-between items-center">
                <span className="text-slate-700 font-medium">Base Curve:</span>
                <span className="text-2xl font-bold text-blue-600">
                  {typeof result.calculation.baseCurve === 'number' 
                    ? result.calculation.baseCurve.toFixed(2) 
                    : result.calculation.baseCurve} D
                </span>
              </div>
            )}
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

export default BaseCurveCalculator

