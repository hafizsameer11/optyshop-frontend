import React, { useState, useEffect } from 'react'
import { getProductOptions, type ProductOptions } from '../../services/productsService'

interface QuickFiltersProps {
    onFilterChange: (filters: {
        gender?: string
        minPrice?: number
        maxPrice?: number
        sortBy?: string
    }) => void
    className?: string
}

const QuickFilters: React.FC<QuickFiltersProps> = ({ onFilterChange, className = '' }) => {
    const [productOptions, setProductOptions] = useState<ProductOptions | null>(null)
    const [gender, setGender] = useState<string>('')
    const [minPrice, setMinPrice] = useState<string>('')
    const [maxPrice, setMaxPrice] = useState<string>('')
    const [sortBy, setSortBy] = useState<string>('newest')

    useEffect(() => {
        const fetchOptions = async () => {
            try {
                const options = await getProductOptions()
                setProductOptions(options)
            } catch (error) {
                console.error('Error fetching product options:', error)
            }
        }
        fetchOptions()
    }, [])

    useEffect(() => {
        const filters: any = {}
        if (gender) filters.gender = gender
        if (minPrice) filters.minPrice = Number(minPrice)
        if (maxPrice) filters.maxPrice = Number(maxPrice)
        if (sortBy) filters.sortBy = sortBy
        
        onFilterChange(filters)
    }, [gender, minPrice, maxPrice, sortBy, onFilterChange])

    return (
        <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 ${className}`}>
            <div className="flex flex-col lg:flex-row lg:flex-wrap items-start lg:items-center gap-3 lg:gap-4 overflow-x-hidden">
                <h3 className="text-sm font-semibold text-gray-800 whitespace-nowrap flex items-center flex-shrink-0">
                    <svg className="w-4 h-4 mr-1.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                    Quick Filters
                </h3>
                
                {/* Gender Filter */}
                <div className="flex items-center gap-2 min-w-0 flex-shrink-0">
                    <label className="text-xs font-medium text-gray-700 whitespace-nowrap">Gender:</label>
                    <select
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                        className="text-xs border border-gray-300 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 min-w-[80px] flex-shrink-0 hover:border-gray-400"
                    >
                        <option value="">All</option>
                        {productOptions?.genders?.map((g) => (
                            <option key={g} value={g}>
                                {g.charAt(0).toUpperCase() + g.slice(1)}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Price Range */}
                <div className="flex items-center gap-2 min-w-0 flex-shrink-0">
                    <label className="text-xs font-medium text-gray-700 whitespace-nowrap">Price:</label>
                    <div className="flex gap-1.5 items-center">
                        <div className="relative">
                            <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-400">$</span>
                            <input
                                type="number"
                                placeholder="Min"
                                value={minPrice}
                                onChange={(e) => setMinPrice(e.target.value)}
                                className="w-14 sm:w-16 text-xs border border-gray-300 rounded-lg pl-5 pr-2 py-1.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 flex-shrink-0 hover:border-gray-400"
                            />
                        </div>
                        <span className="text-xs text-gray-400 flex-shrink-0">-</span>
                        <div className="relative">
                            <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-400">$</span>
                            <input
                                type="number"
                                placeholder="Max"
                                value={maxPrice}
                                onChange={(e) => setMaxPrice(e.target.value)}
                                className="w-14 sm:w-16 text-xs border border-gray-300 rounded-lg pl-5 pr-2 py-1.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 flex-shrink-0 hover:border-gray-400"
                            />
                        </div>
                    </div>
                </div>

                {/* Sort By */}
                <div className="flex items-center gap-2 min-w-0 flex-shrink-0">
                    <label className="text-xs font-medium text-gray-700 whitespace-nowrap">Sort:</label>
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="text-xs border border-gray-300 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 min-w-[90px] flex-shrink-0 hover:border-gray-400"
                    >
                        <option value="newest">Newest</option>
                        <option value="oldest">Oldest</option>
                        <option value="price_low">Price Low</option>
                        <option value="price_high">Price High</option>
                        <option value="name">Name A-Z</option>
                    </select>
                </div>

                {/* Clear Filters */}
                <button
                    onClick={() => {
                        setGender('')
                        setMinPrice('')
                        setMaxPrice('')
                        setSortBy('newest')
                    }}
                    className="text-xs bg-gray-50 hover:bg-gray-100 text-gray-600 hover:text-gray-800 rounded-lg px-3 py-1.5 transition-all duration-200 whitespace-nowrap flex-shrink-0 border border-gray-200 hover:border-gray-300 flex items-center gap-1"
                >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Clear All
                </button>
            </div>
        </div>
    )
}

export default QuickFilters
