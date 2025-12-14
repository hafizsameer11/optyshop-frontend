import React, { useState } from 'react'
import { calculatePD, type PDCalculationResponse } from '../../services/simulationsService'

interface PDCalculatorProps {
  onClose?: () => void
  className?: string
}

const PDCalculator: React.FC<PDCalculatorProps> = ({ onClose, className = '' }) => {
  const [result, setResult] = useState<PDCalculationResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    distancePD: '',
    type: 'binocular' as 'binocular' | 'monocular'
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
      if (formData.distancePD) {
        requestData.distancePD = parseFloat(formData.distancePD)
      }
      if (formData.type) {
        requestData.type = formData.type
      }

      const response = await calculatePD(requestData)

      if (response) {
        setResult(response)
      } else {
        setError('Failed to calculate PD. Please try again.')
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while calculating PD.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    setResult(null)
    setError(null)
    setFormData({
      distancePD: '',
      type: 'binocular'
    })
  }

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-slate-900">Pupillary Distance Calculator</h3>
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
          Calculate your pupillary distance (PD) measurements for distance and near vision.
        </p>

        {/* Input Fields */}
        <div className="space-y-4">
          <div>
            <label htmlFor="distancePD" className="block text-sm font-medium text-slate-700 mb-2">
              Distance PD (mm) <span className="text-slate-400 text-xs">(optional)</span>
            </label>
            <input
              type="number"
              id="distancePD"
              name="distancePD"
              value={formData.distancePD}
              onChange={handleChange}
              min="0"
              step="0.1"
              placeholder="e.g., 64"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-slate-700 mb-2">
              Measurement Type <span className="text-slate-400 text-xs">(optional)</span>
            </label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="binocular">Binocular</option>
              <option value="monocular">Monocular</option>
            </select>
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
            {isLoading ? 'Calculating...' : 'Calculate PD'}
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
          <h4 className="text-lg font-semibold text-blue-900 mb-3">PD Calculation Results</h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-slate-700 font-medium">Distance PD:</span>
              <span className="text-2xl font-bold text-blue-600">
                {result.calculation.distancePD} mm
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-700 font-medium">Near PD:</span>
              <span className="text-2xl font-bold text-blue-600">
                {result.calculation.nearPD} mm
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PDCalculator


