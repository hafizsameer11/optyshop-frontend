import React from 'react'

interface QuickActionButtonsProps {
    onClearFilters: () => void
    className?: string
}

const QuickActionButtons: React.FC<QuickActionButtonsProps> = ({ onClearFilters, className = '' }) => {
    return (
        <div className={`flex justify-center gap-3 ${className}`}>
            <button
                onClick={onClearFilters}
                className="text-xs bg-gray-50 hover:bg-gray-100 text-gray-600 hover:text-gray-800 rounded-lg px-3 py-1.5 transition-all duration-200 whitespace-nowrap flex-shrink-0 border border-gray-200 hover:border-gray-300 flex items-center gap-1"
            >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Clear All
            </button>
        </div>
    )
}

export default QuickActionButtons
