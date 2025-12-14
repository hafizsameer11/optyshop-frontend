import React, { useState } from 'react'
import { getKidsLensRecommendation, type KidsLensRecommendationResponse } from '../../services/simulationsService'

interface KidsLensRecommendationProps {
  onClose?: () => void
  className?: string
}

const KidsLensRecommendation: React.FC<KidsLensRecommendationProps> = ({ onClose, className = '' }) => {
  const [age, setAge] = useState<string>('')
  const [prescription, setPrescription] = useState<string>('')
  const [result, setResult] = useState<KidsLensRecommendationResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGetRecommendation = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setResult(null)

    const ageNum = age ? parseFloat(age) : undefined
    const prescriptionNum = prescription ? parseFloat(prescription) : undefined

    if (age && (isNaN(ageNum!) || ageNum! <= 0)) {
      setError('Age must be a valid positive number')
      return
    }

    if (prescription && isNaN(prescriptionNum!)) {
      setError('Prescription must be a valid number')
      return
    }

    setIsLoading(true)

    try {
      const response = await getKidsLensRecommendation({
        age: ageNum,
        prescription: prescriptionNum,
      })

      if (response) {
        setResult(response)
      } else {
        setError('Failed to get recommendation. Please try again.')
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while getting recommendation.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    setAge('')
    setPrescription('')
    setResult(null)
    setError(null)
  }

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-slate-900">Kids Lens Recommendation</h3>
        {onClose && (
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700 transition-colors"
            aria-label="Close recommendation"
          >
            ✕
          </button>
        )}
      </div>

      <form onSubmit={handleGetRecommendation} className="space-y-4">
        <div>
          <label htmlFor="age" className="block text-sm font-medium text-slate-700 mb-2">
            Age (years)
            <span className="text-slate-500 text-xs ml-1">(Optional)</span>
          </label>
          <input
            type="number"
            id="age"
            step="1"
            min="0"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter child's age"
          />
        </div>

        <div>
          <label htmlFor="prescription" className="block text-sm font-medium text-slate-700 mb-2">
            Prescription (D)
            <span className="text-slate-500 text-xs ml-1">(Optional)</span>
          </label>
          <input
            type="number"
            id="prescription"
            step="0.25"
            value={prescription}
            onChange={(e) => setPrescription(e.target.value)}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter prescription power"
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
            {isLoading ? 'Getting Recommendation...' : 'Get Recommendation'}
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
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h4 className="text-lg font-semibold text-green-900 mb-3">Recommendation</h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-slate-700 font-medium">Material:</span>
              <span className="text-xl font-bold text-green-600 capitalize">
                {result.recommendation.material}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-700 font-medium">Lens Index:</span>
              <span className="text-xl font-bold text-green-600">
                {result.recommendation.index}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-700 font-medium">Impact Resistant:</span>
              <span className="text-lg font-semibold text-green-600">
                {result.recommendation.impactResistant ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="mt-3 pt-3 border-t border-green-200">
              <p className="text-sm font-medium text-slate-700 mb-2">Coatings:</p>
              <div className="flex flex-wrap gap-2">
                {result.recommendation.coatings.map((coating, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm capitalize"
                  >
                    {coating.replace('_', ' ')}
                  </span>
                ))}
              </div>
            </div>
            {result.recommendation.reasons && result.recommendation.reasons.length > 0 && (
              <div className="mt-3 pt-3 border-t border-green-200">
                <p className="text-sm font-medium text-slate-700 mb-2">Reasons:</p>
                <ul className="list-disc list-inside space-y-1 text-sm text-slate-600">
                  {result.recommendation.reasons.map((reason, index) => (
                    <li key={index}>{reason}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default KidsLensRecommendation


