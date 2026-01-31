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
        <div className={`flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-3 sm:gap-4 ${className}`}>
            <h3 className="text-xs font-semibold text-gray-700 whitespace-nowrap">Quick Filters</h3>
            
            {/* Gender Filter */}
            <div className="flex items-center gap-1 min-w-0">
                <label className="text-xs text-gray-600 whitespace-nowrap">Gender:</label>
                <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="text-xs border border-gray-300 rounded px-1 py-0.5 focus:ring-1 focus:ring-blue-500 focus:border-transparent outline-none min-w-0 flex-shrink-0"
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
            <div className="flex items-center gap-1 min-w-0">
                <label className="text-xs text-gray-600 whitespace-nowrap">Price:</label>
                <div className="flex gap-1 items-center">
                    <input
                        type="number"
                        placeholder="Min"
                        value={minPrice}
                        onChange={(e) => setMinPrice(e.target.value)}
                        className="w-14 sm:w-16 text-xs border border-gray-300 rounded px-1 py-0.5 focus:ring-1 focus:ring-blue-500 focus:border-transparent outline-none flex-shrink-0"
                    />
                    <span className="text-xs text-gray-500 flex-shrink-0">-</span>
                    <input
                        type="number"
                        placeholder="Max"
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(e.target.value)}
                        className="w-14 sm:w-16 text-xs border border-gray-300 rounded px-1 py-0.5 focus:ring-1 focus:ring-blue-500 focus:border-transparent outline-none flex-shrink-0"
                    />
                </div>
            </div>

            {/* Sort By */}
            <div className="flex items-center gap-1 min-w-0">
                <label className="text-xs text-gray-600 whitespace-nowrap">Sort:</label>
                <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="text-xs border border-gray-300 rounded px-1 py-0.5 focus:ring-1 focus:ring-blue-500 focus:border-transparent outline-none min-w-0 flex-shrink-0"
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
                className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded px-2 py-1 transition-colors whitespace-nowrap flex-shrink-0"
            >
                Clear All
            </button>
        </div>
    )
}

export default QuickFilters
