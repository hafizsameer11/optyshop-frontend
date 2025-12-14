import React from 'react'

export interface TreatmentOption {
  id: string
  name: string
  price: number
  icon: React.ReactNode
  description?: string
  selected?: boolean
}

interface TreatmentSelectionProps {
  treatments: TreatmentOption[]
  selectedTreatment?: string
  onSelect: (treatmentId: string) => void
  currency?: string
}

const TreatmentSelection: React.FC<TreatmentSelectionProps> = ({
  treatments,
  selectedTreatment,
  onSelect,
  currency = '€'
}) => {
  return (
    <div className="space-y-3">
      {treatments.map((treatment) => (
        <div
          key={treatment.id}
          onClick={() => onSelect(treatment.id)}
          className={`
            relative border-2 rounded-lg p-4 cursor-pointer transition-all
            ${selectedTreatment === treatment.id
              ? 'border-blue-600 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300 bg-white'
            }
          `}
        >
          <div className="flex items-start gap-4">
            {/* Icon */}
            <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center">
              {treatment.icon}
            </div>
            
            {/* Content */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <h4 className="font-semibold text-gray-900">{treatment.name}</h4>
                <span className="text-sm font-medium text-gray-700">
                  {treatment.price > 0 ? `${treatment.price.toFixed(2)}${currency}` : 'Free'}
                </span>
              </div>
              {treatment.description && (
                <p className="text-sm text-gray-600">{treatment.description}</p>
              )}
            </div>
            
            {/* Radio Button */}
            <div className="flex-shrink-0">
              <div
                className={`
                  w-5 h-5 rounded-full border-2 flex items-center justify-center
                  ${selectedTreatment === treatment.id
                    ? 'border-blue-600 bg-blue-600'
                    : 'border-gray-300'
                  }
                `}
              >
                {selectedTreatment === treatment.id && (
                  <div className="w-2 h-2 rounded-full bg-white" />
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default TreatmentSelection

