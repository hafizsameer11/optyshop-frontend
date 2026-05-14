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
        <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-2 sm:p-3 ${className}`}>
            <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto scrollbar-hide">
                <h3 className="text-xs font-semibold text-gray-800 whitespace-nowrap flex items-center flex-shrink-0">
                    <svg className="w-3 h-3 mr-1 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                    Filters
                </h3>
                
                {/* Gender Filter */}
                <div className="flex items-center gap-1 min-w-0 flex-shrink-0">
                    <label className="text-xs font-medium text-gray-700 whitespace-nowrap">Gender:</label>
                    <select
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                        className="text-xs border border-gray-300 rounded px-1.5 py-1 focus:ring-1 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 min-w-[60px] hover:border-gray-400"
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
                <div className="flex items-center gap-1 min-w-0 flex-shrink-0">
                    <label className="text-xs font-medium text-gray-700 whitespace-nowrap">Price:</label>
                    <div className="flex gap-1 items-center">
                        <div className="relative">
                            <span className="absolute left-1.5 top-1/2 transform -translate-y-1/2 text-xs text-gray-400">€</span>
                            <input
                                type="number"
                                placeholder="Min"
                                value={minPrice}
                                onChange={(e) => setMinPrice(e.target.value)}
                                className="w-12 text-xs border border-gray-300 rounded pl-4 pr-1 py-1 focus:ring-1 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 hover:border-gray-400"
                            />
                        </div>
                        <span className="text-xs text-gray-400">-</span>
                        <div className="relative">
                            <span className="absolute left-1.5 top-1/2 transform -translate-y-1/2 text-xs text-gray-400">€</span>
                            <input
                                type="number"
                                placeholder="Max"
                                value={maxPrice}
                                onChange={(e) => setMaxPrice(e.target.value)}
                                className="w-12 text-xs border border-gray-300 rounded pl-4 pr-1 py-1 focus:ring-1 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 hover:border-gray-400"
                            />
                        </div>
                    </div>
                </div>

                {/* Sort By */}
                <div className="flex items-center gap-1 min-w-0 flex-shrink-0">
                    <label className="text-xs font-medium text-gray-700 whitespace-nowrap">Sort:</label>
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="text-xs border border-gray-300 rounded px-1.5 py-1 focus:ring-1 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 min-w-[70px] hover:border-gray-400"
                    >
                        <option value="newest">Newest</option>
                        <option value="oldest">Oldest</option>
                        <option value="price_low">Price Low</option>
                        <option value="price_high">Price High</option>
                        <option value="name">Name A-Z</option>
                    </select>
                </div>
            </div>
        </div>
    )
}

export default QuickFilters
