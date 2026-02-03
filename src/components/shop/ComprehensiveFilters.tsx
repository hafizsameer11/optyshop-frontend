import React, { useState, useEffect } from 'react'
import { getProductOptions, type ProductOptions } from '../../services/productsService'

interface ComprehensiveFiltersProps {
    onFilterChange: (filters: {
        gender?: string
        minPrice?: number
        maxPrice?: number
        sortBy?: string
        color?: string
        lensType?: string
        lensCoating?: string
        brand?: string
        inStock?: boolean
        searchTerm?: string
    }) => void
    availableColors?: string[]
    availableBrands?: string[]
    availableLensTypes?: string[]
    availableLensCoatings?: string[]
    className?: string
    categoryLevel?: 'category' | 'subcategory' | 'subsubcategory'
    // activeFiltersCount?: number // Remove unused parameter
}

const ComprehensiveFilters: React.FC<ComprehensiveFiltersProps> = ({
    onFilterChange,
    availableColors = [],
    availableBrands = [],
    availableLensTypes = [],
    availableLensCoatings = [],
    className = '',
    categoryLevel = 'category'
}) => {
    const [productOptions, setProductOptions] = useState<ProductOptions | null>(null)
    const [isExpanded, setIsExpanded] = useState(false)
    
    // Filter states
    const [gender, setGender] = useState<string>('')
    const [minPrice, setMinPrice] = useState<string>('')
    const [maxPrice, setMaxPrice] = useState<string>('')
    const [sortBy, setSortBy] = useState<string>('newest')
    const [selectedColor, setSelectedColor] = useState<string>('')
    const [lensType, setLensType] = useState<string>('')
    const [lensCoating, setLensCoating] = useState<string>('')
    const [brand, setBrand] = useState<string>('')
    const [inStockOnly, setInStockOnly] = useState<boolean>(false)
    const [searchTerm, setSearchTerm] = useState<string>('')

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
        if (selectedColor) filters.color = selectedColor
        if (lensType) filters.lensType = lensType
        if (lensCoating) filters.lensCoating = lensCoating
        if (brand) filters.brand = brand
        if (inStockOnly) filters.inStock = true
        if (searchTerm) filters.searchTerm = searchTerm
        
        onFilterChange(filters)
    }, [gender, minPrice, maxPrice, sortBy, selectedColor, lensType, lensCoating, brand, inStockOnly, searchTerm, onFilterChange])

    const clearAllFilters = () => {
        setGender('')
        setMinPrice('')
        setMaxPrice('')
        setSortBy('newest')
        setSelectedColor('')
        setLensType('')
        setLensCoating('')
        setBrand('')
        setInStockOnly(false)
        setSearchTerm('')
    }

    const getActiveFiltersCount = () => {
        let count = 0
        if (gender) count++
        if (minPrice) count++
        if (maxPrice) count++
        if (selectedColor) count++
        if (lensType) count++
        if (lensCoating) count++
        if (brand) count++
        if (inStockOnly) count++
        if (searchTerm) count++
        return count
    }

    const activeCount = getActiveFiltersCount()

    return (
        <div className={`bg-white rounded-lg shadow-sm border border-gray-200 max-w-xs ${className}`}>
            {/* Header with Gender Buttons */}
            <div className="flex items-center justify-between p-2 border-b border-gray-100">
                <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                    <h3 className="text-sm font-semibold text-gray-800">Filters</h3>
                    {activeCount > 0 && (
                        <span className="bg-blue-100 text-blue-600 text-xs px-2 py-1 rounded-full font-medium">
                            {activeCount}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {/* Gender Buttons */}
                    <div className="flex gap-1">
                        <button
                            onClick={() => setGender('men')}
                            className={`text-xs px-2 py-1 rounded-md transition-all duration-200 ${
                                gender === 'men' 
                                    ? 'bg-blue-500 text-white' 
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            Men Glasses
                        </button>
                        <button
                            onClick={() => setGender('women')}
                            className={`text-xs px-2 py-1 rounded-md transition-all duration-200 ${
                                gender === 'women' 
                                    ? 'bg-blue-500 text-white' 
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            Women Glasses
                        </button>
                    </div>
                    {activeCount > 0 && (
                        <button
                            onClick={clearAllFilters}
                            className="text-xs text-gray-500 hover:text-red-600 transition-colors"
                        >
                            Clear All
                        </button>
                    )}
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <svg className={`w-4 h-4 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Always Visible Quick Filters */}
            <div className="p-2 border-b border-gray-100">
                <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
                    {/* Search */}
                    <div className="flex items-center gap-1 min-w-0 flex-shrink-0">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-20 sm:w-28 text-xs border border-gray-300 rounded-lg pl-6 pr-2 py-1 focus:ring-1 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 hover:border-gray-400"
                            />
                            <svg className="absolute left-1.5 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                    </div>

                    {/* Gender Filter */}
                    <div className="flex items-center gap-1 min-w-0 flex-shrink-0">
                        <label className="text-xs font-medium text-gray-700 whitespace-nowrap">Gender:</label>
                        <select
                            value={gender}
                            onChange={(e) => setGender(e.target.value)}
                            className="text-xs border border-gray-300 rounded-lg px-1.5 py-1 focus:ring-1 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 min-w-[50px] hover:border-gray-400"
                        >
                            <option value="">All</option>
                            {productOptions?.genders?.map((g) => (
                                <option key={g} value={g}>
                                    {g.charAt(0).toUpperCase() + g.slice(1)}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Sort By */}
                    <div className="flex items-center gap-1 min-w-0 flex-shrink-0">
                        <label className="text-xs font-medium text-gray-700 whitespace-nowrap">Sort:</label>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="text-xs border border-gray-300 rounded-lg px-1.5 py-1 focus:ring-1 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 min-w-[60px] hover:border-gray-400"
                        >
                            <option value="newest">Newest</option>
                            <option value="oldest">Oldest</option>
                            <option value="price_low">Price Low</option>
                            <option value="price_high">Price High</option>
                            <option value="name">Name A-Z</option>
                        </select>
                    </div>

                    {/* In Stock Only */}
                    <div className="flex items-center gap-1 min-w-0 flex-shrink-0">
                        <label className="flex items-center gap-1 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={inStockOnly}
                                onChange={(e) => setInStockOnly(e.target.checked)}
                                className="w-3 h-3 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <span className="text-xs font-medium text-gray-700">In Stock</span>
                        </label>
                    </div>
                </div>
            </div>

            {/* Expanded Filters */}
            {isExpanded && (
                <div className="p-2 space-y-3">
                    {/* Price Range */}
                    <div>
                        <label className="text-xs font-semibold text-gray-700 mb-1 block">Price Range</label>
                        <div className="flex gap-2 items-center">
                            <div className="relative">
                                <span className="absolute left-1.5 top-1/2 transform -translate-y-1/2 text-xs text-gray-400">$</span>
                                <input
                                    type="number"
                                    placeholder="Min"
                                    value={minPrice}
                                    onChange={(e) => setMinPrice(e.target.value)}
                                    className="w-16 text-xs border border-gray-300 rounded-lg pl-4 pr-2 py-1 focus:ring-1 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 hover:border-gray-400"
                                />
                            </div>
                            <span className="text-xs text-gray-400">-</span>
                            <div className="relative">
                                <span className="absolute left-1.5 top-1/2 transform -translate-y-1/2 text-xs text-gray-400">$</span>
                                <input
                                    type="number"
                                    placeholder="Max"
                                    value={maxPrice}
                                    onChange={(e) => setMaxPrice(e.target.value)}
                                    className="w-16 text-xs border border-gray-300 rounded-lg pl-4 pr-2 py-1 focus:ring-1 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 hover:border-gray-400"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Color Filter */}
                    {availableColors.length > 0 && (
                        <div>
                            <label className="text-xs font-semibold text-gray-700 mb-1 block">Color</label>
                            <select
                                value={selectedColor}
                                onChange={(e) => setSelectedColor(e.target.value)}
                                className="w-full text-xs border border-gray-300 rounded-lg px-2 py-1 focus:ring-1 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 hover:border-gray-400"
                            >
                                <option value="">All Colors</option>
                                {availableColors.map((color) => (
                                    <option key={color} value={color}>
                                        {color}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Brand Filter */}
                    {(availableBrands.length > 0 || (productOptions as any)?.brands) && (
                        <div>
                            <label className="text-xs font-semibold text-gray-700 mb-1 block">Brand</label>
                            <select
                                value={brand}
                                onChange={(e) => setBrand(e.target.value)}
                                className="w-full text-xs border border-gray-300 rounded-lg px-2 py-1 focus:ring-1 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 hover:border-gray-400"
                            >
                                <option value="">All Brands</option>
                                {(availableBrands.length > 0 ? availableBrands : (productOptions as any)?.brands || []).map((brandName: string) => (
                                    <option key={brandName} value={brandName}>
                                        {brandName}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Lens Type Filter - for contact lenses */}
                    {categoryLevel === 'category' && availableLensTypes.length > 0 && (
                        <div>
                            <label className="text-xs font-semibold text-gray-700 mb-1 block">Lens Type</label>
                            <select
                                value={lensType}
                                onChange={(e) => setLensType(e.target.value)}
                                className="w-full text-xs border border-gray-300 rounded-lg px-2 py-1 focus:ring-1 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 hover:border-gray-400"
                            >
                                <option value="">All Types</option>
                                {availableLensTypes.map((type) => (
                                    <option key={type} value={type}>
                                        {type}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Lens Coating Filter - for contact lenses */}
                    {categoryLevel === 'category' && availableLensCoatings.length > 0 && (
                        <div>
                            <label className="text-xs font-semibold text-gray-700 mb-1 block">Lens Coating</label>
                            <select
                                value={lensCoating}
                                onChange={(e) => setLensCoating(e.target.value)}
                                className="w-full text-xs border border-gray-300 rounded-lg px-2 py-1 focus:ring-1 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 hover:border-gray-400"
                            >
                                <option value="">All Coatings</option>
                                {availableLensCoatings.map((coating) => (
                                    <option key={coating} value={coating}>
                                        {coating}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

export default ComprehensiveFilters
