import React from 'react'

export interface ColorSwatch {
  id: string
  name: string
  color: string // CSS color or gradient
  gradient?: boolean // If true, color is a gradient
  selected?: boolean
}

export interface LensTypeOption {
  id: string
  name: string
  description: string
  price?: number
  priceLabel?: string // e.g., "+$60.90" or "Free"
  colors: ColorSwatch[]
  selectedColorId?: string
  selected?: boolean
}

interface LensTypeSelectionProps {
  lensTypes: LensTypeOption[]
  selectedLensTypeId?: string
  selectedColorId?: string
  onSelectLensType: (lensTypeId: string) => void
  onSelectColor: (lensTypeId: string, colorId: string) => void
  currency?: string
}

const LensTypeSelection: React.FC<LensTypeSelectionProps> = ({
  lensTypes,
  selectedLensTypeId,
  selectedColorId,
  onSelectLensType,
  onSelectColor,
  currency = '$'
}) => {
  return (
    <div className="space-y-6">
      {lensTypes.map((lensType) => (
        <div
          key={lensType.id}
          className={`
            border rounded-lg p-4 transition-all
            ${selectedLensTypeId === lensType.id
              ? 'border-blue-600 bg-blue-50'
              : 'border-gray-200 bg-white'
            }
          `}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-gray-900">
              {lensType.name}
              {lensType.priceLabel && (
                <span className="ml-2 text-sm font-normal text-gray-600">
                  ({lensType.priceLabel})
                </span>
              )}
            </h3>
          </div>
          
          {/* Description */}
          <p className="text-sm text-gray-600 mb-4">{lensType.description}</p>
          
          {/* Color Swatches */}
          {lensType.colors.length > 0 && (
            <div>
              {lensType.colors.length > 0 && lensType.colors[0].name && (
                <div className="text-xs font-medium text-gray-500 mb-2">
                  {lensType.colors[0].name}
                </div>
              )}
              <div className="flex flex-wrap gap-3">
                {lensType.colors.map((color) => {
                  const isSelected = selectedLensTypeId === lensType.id && 
                                   (selectedColorId === color.id || 
                                    (lensType.selectedColorId === color.id && !selectedColorId))
                  
                  return (
                    <button
                      key={color.id}
                      onClick={() => {
                        onSelectLensType(lensType.id)
                        onSelectColor(lensType.id, color.id)
                      }}
                      className={`
                        relative w-10 h-10 rounded-full border-2 transition-all
                        ${isSelected
                          ? 'border-blue-600 ring-2 ring-blue-200'
                          : 'border-gray-300 hover:border-gray-400'
                        }
                      `}
                      style={{
                        background: color.gradient 
                          ? `linear-gradient(135deg, ${color.color})`
                          : color.color
                      }}
                      title={color.name}
                    >
                      {isSelected && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <svg className="w-5 h-5 text-white drop-shadow-lg" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export default LensTypeSelection

