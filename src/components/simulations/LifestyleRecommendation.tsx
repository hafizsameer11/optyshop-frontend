import React, { useState } from 'react'
import { getLifestyleRecommendation, type LifestyleRecommendationResponse } from '../../services/simulationsService'

interface LifestyleRecommendationProps {
  onClose?: () => void
  className?: string
}

const LifestyleRecommendation: React.FC<LifestyleRecommendationProps> = ({ onClose, className = '' }) => {
  const [lifestyle, setLifestyle] = useState<string[]>([])
  const [activities, setActivities] = useState<string[]>([])
  const [result, setResult] = useState<LifestyleRecommendationResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const lifestyleOptions = ['digital_work', 'outdoor', 'driving', 'sports', 'reading']
  const activityOptions = ['computer_use', 'sunlight_exposure', 'night_driving', 'gaming', 'reading']

  const toggleLifestyle = (option: string) => {
    setLifestyle((prev) =>
      prev.includes(option) ? prev.filter((item) => item !== option) : [...prev, option]
    )
  }

  const toggleActivity = (option: string) => {
    setActivities((prev) =>
      prev.includes(option) ? prev.filter((item) => item !== option) : [...prev, option]
    )
  }

  const handleGetRecommendation = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setResult(null)

    setIsLoading(true)

    try {
      const response = await getLifestyleRecommendation({
        lifestyle: lifestyle.length > 0 ? lifestyle : undefined,
        activities: activities.length > 0 ? activities : undefined,
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
    setLifestyle([])
    setActivities([])
    setResult(null)
    setError(null)
  }

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-slate-900">Lifestyle Lens Recommendation</h3>
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
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Lifestyle (Select all that apply)
          </label>
          <div className="flex flex-wrap gap-2">
            {lifestyleOptions.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => toggleLifestyle(option)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  lifestyle.includes(option)
                    ? 'bg-blue-500 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {option.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Activities (Select all that apply)
          </label>
          <div className="flex flex-wrap gap-2">
            {activityOptions.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => toggleActivity(option)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activities.includes(option)
                    ? 'bg-blue-500 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {option.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
              </button>
            ))}
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
        <div className="mt-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
          <h4 className="text-lg font-semibold text-purple-900 mb-3">Recommendation</h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-slate-700 font-medium">Lens Type:</span>
              <span className="text-xl font-bold text-purple-600 capitalize">
                {result.recommendation.lensType}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-700 font-medium">Lens Index:</span>
              <span className="text-xl font-bold text-purple-600">
                {result.recommendation.index}
              </span>
            </div>
            <div className="mt-3 pt-3 border-t border-purple-200">
              <p className="text-sm font-medium text-slate-700 mb-2">Coatings:</p>
              <div className="flex flex-wrap gap-2">
                {result.recommendation.coatings.map((coating, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm capitalize"
                  >
                    {coating.replace('_', ' ')}
                  </span>
                ))}
              </div>
            </div>
            {result.recommendation.features && result.recommendation.features.length > 0 && (
              <div className="mt-3 pt-3 border-t border-purple-200">
                <p className="text-sm font-medium text-slate-700 mb-2">Features:</p>
                <ul className="list-disc list-inside space-y-1 text-sm text-slate-600">
                  {result.recommendation.features.map((feature, index) => (
                    <li key={index}>{feature}</li>
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

export default LifestyleRecommendation


