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
        search?: string
        category?: string | number
        subcategory?: string | number | null
    }) => void
    availableColors?: string[]
    availableBrands?: string[]
    availableLensTypes?: string[]
    availableLensCoatings?: string[]
    availableCategories?: Array<{ id: string | number; name: string; slug: string }>
    availableSubcategories?: Array<{ id: string | number; name: string; slug: string }>
    selectedCategory?: string | number
    selectedSubcategory?: string | number | null
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
    availableCategories = [],
    availableSubcategories = [],
    selectedCategory = 'all',
    selectedSubcategory = null,
    className = '',
    categoryLevel = 'category'
}) => {
    const [productOptions, setProductOptions] = useState<ProductOptions | null>(null)
    const [isExpanded, setIsExpanded] = useState(false)
    
    // Filter states
    const [minPrice, setMinPrice] = useState<string>('')
    const [maxPrice, setMaxPrice] = useState<string>('')
    const [sortBy, setSortBy] = useState<string>('newest')
    const [selectedColor, setSelectedColor] = useState<string>('')
    const [lensType, setLensType] = useState<string>('')
    const [lensCoating, setLensCoating] = useState<string>('')
    const [brand, setBrand] = useState<string>('')
    const [inStockOnly, setInStockOnly] = useState<boolean>(false)
    const [searchTerm, setSearchTerm] = useState<string>('')
    const [searchInput, setSearchInput] = useState<string>('')
    
    // Validation and conversion functions
    const validateAndConvertPrice = (value: string): number | undefined => {
        if (!value || value.trim() === '') return undefined
        const num = Number(value)
        return isNaN(num) || num < 0 ? undefined : num
    }
    
    const handleMinPriceChange = (value: string) => {
        // Allow only valid numbers and empty string
        if (value === '' || /^\d*\.?\d*$/.test(value)) {
            setMinPrice(value)
        }
    }
    
    const handleMaxPriceChange = (value: string) => {
        // Allow only valid numbers and empty string
        if (value === '' || /^\d*\.?\d*$/.test(value)) {
            setMaxPrice(value)
        }
    }

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
        
        // Convert and validate prices
        const minPriceNum = validateAndConvertPrice(minPrice)
        const maxPriceNum = validateAndConvertPrice(maxPrice)
        
        // Only apply prices if they're valid and make sense
        if (minPriceNum !== undefined) {
            filters.minPrice = minPriceNum
        }
        if (maxPriceNum !== undefined) {
            // Only apply max price if it's greater than min price (when both are set)
            if (minPriceNum === undefined || maxPriceNum >= minPriceNum) {
                filters.maxPrice = maxPriceNum
            }
        }
        
        if (sortBy) filters.sortBy = sortBy
        if (selectedColor) filters.color = selectedColor
        if (lensType) filters.lensType = lensType
        if (lensCoating) filters.lensCoating = lensCoating
        if (brand) filters.brand = brand
        if (inStockOnly) filters.inStock = true
        if (searchTerm) {
            filters.search = searchTerm
            if (import.meta.env.DEV) {
                console.log('🔍 Search filter applied:', searchTerm)
            }
        }
        
        onFilterChange(filters)
    }, [minPrice, maxPrice, sortBy, selectedColor, lensType, lensCoating, brand, inStockOnly, searchTerm, onFilterChange])

    const handleSearch = () => {
        setSearchTerm(searchInput)
        if (import.meta.env.DEV) {
            console.log('🔍 Search button clicked with term:', searchInput)
        }
    }

    const handleSearchKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch()
        }
    }

    const clearAllFilters = () => {
        setMinPrice('')
        setMaxPrice('')
        setSortBy('newest')
        setSelectedColor('')
        setLensType('')
        setLensCoating('')
        setBrand('')
        setInStockOnly(false)
        setSearchTerm('')
        setSearchInput('')
    }

    const getActiveFiltersCount = () => {
        let count = 0
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
        <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
            {/* Header */}
            <div className="p-4 border-b border-gray-100">
                {/* Filter Title */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                        </svg>
                        <h3 className="text-base font-semibold text-gray-800">Filters</h3>
                        {activeCount > 0 && (
                            <span className="bg-blue-100 text-blue-600 text-xs px-2 py-1 rounded-full font-medium">
                                {activeCount}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        {activeCount > 0 && (
                            <button
                                onClick={clearAllFilters}
                                className="text-sm text-gray-600 hover:text-red-600 transition-colors font-medium"
                            >
                                Clear All
                            </button>
                        )}
                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <svg className={`w-5 h-5 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                    </div>
                </div>
                
                {/* Search - Always visible */}
                <div className="space-y-3">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search products..."
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            onKeyPress={handleSearchKeyPress}
                            className="w-full text-sm border border-gray-300 rounded-lg pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 hover:border-gray-400"
                        />
                        <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <button
                        onClick={handleSearch}
                        className="w-full bg-blue-500 text-white text-sm font-medium py-2.5 rounded-lg hover:bg-blue-600 transition-colors duration-200"
                    >
                        Search
                    </button>
                </div>
            </div>

            {/* Always Visible Quick Filters */}
            <div className="p-4 space-y-4 border-b border-gray-100">
                {/* Sort By */}
                <div>
                    <label className="text-sm font-semibold text-gray-700 mb-2 block">Sort By</label>
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 hover:border-gray-400"
                    >
                        <option value="newest">Newest First</option>
                        <option value="oldest">Oldest First</option>
                        <option value="price_low">Price: Low to High</option>
                        <option value="price_high">Price: High to Low</option>
                        <option value="name">Name: A to Z</option>
                    </select>
                </div>

                {/* In Stock Only */}
                <div className="flex items-center">
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={inStockOnly}
                            onChange={(e) => setInStockOnly(e.target.checked)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-700">In Stock Only</span>
                    </label>
                </div>

                {/* Category and Subcategory Buttons */}
                {availableCategories.length > 0 && (
                    <div>
                        <label className="text-sm font-semibold text-gray-700 mb-2 block">Category</label>
                        <div className="flex flex-wrap gap-2">
                            {availableCategories.slice(0, 6).map((category) => (
                                <button
                                    key={category.id}
                                    onClick={() => onFilterChange({ 
                                        ...{}, 
                                        category: category.slug || category.id,
                                        subcategory: null 
                                    })}
                                    className={`text-xs px-3 py-1.5 rounded-md transition-all duration-200 whitespace-nowrap ${
                                        selectedCategory === (category.slug || category.id)
                                            ? 'bg-blue-500 text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                    {category.name}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {availableSubcategories.length > 0 && (
                    <div>
                        <label className="text-sm font-semibold text-gray-700 mb-2 block">Subcategory</label>
                        <div className="flex flex-wrap gap-2">
                            {availableSubcategories.slice(0, 6).map((subcategory) => (
                                <button
                                    key={subcategory.id}
                                    onClick={() => onFilterChange({ 
                                        ...{}, 
                                        subcategory: subcategory.slug || subcategory.id
                                    })}
                                    className={`text-xs px-3 py-1.5 rounded-md transition-all duration-200 whitespace-nowrap ${
                                        selectedSubcategory === (subcategory.slug || subcategory.id)
                                            ? 'bg-blue-500 text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                    {subcategory.name}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Expanded Filters */}
            {isExpanded && (
                <div className="p-4 space-y-4">
                    {/* Price Range */}
                    <div>
                        <label className="text-sm font-semibold text-gray-700 mb-2 block">Price Range</label>
                        <div className="flex gap-3 items-center">
                            <div className="relative flex-1">
                                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-400">$</span>
                                <input
                                    type="text"
                                    placeholder="Min"
                                    value={minPrice}
                                    onChange={(e) => handleMinPriceChange(e.target.value)}
                                    className={`w-full text-sm border rounded-lg pl-7 pr-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 hover:border-gray-400 ${
                                        minPrice && validateAndConvertPrice(minPrice) === undefined ? 'border-red-300 bg-red-50' : 'border-gray-300'
                                    }`}
                                />
                            </div>
                            <span className="text-sm text-gray-400">-</span>
                            <div className="relative flex-1">
                                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-400">$</span>
                                <input
                                    type="text"
                                    placeholder="Max"
                                    value={maxPrice}
                                    onChange={(e) => handleMaxPriceChange(e.target.value)}
                                    className={`w-full text-sm border rounded-lg pl-7 pr-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 hover:border-gray-400 ${
                                        maxPrice && validateAndConvertPrice(maxPrice) === undefined ? 'border-red-300 bg-red-50' : 'border-gray-300'
                                    }`}
                                />
                            </div>
                        </div>
                        {/* Validation feedback */}
                        {minPrice && maxPrice && validateAndConvertPrice(minPrice) !== undefined && validateAndConvertPrice(maxPrice) !== undefined && (
                            <div className="mt-2">
                                {validateAndConvertPrice(minPrice)! > validateAndConvertPrice(maxPrice)! && (
                                    <p className="text-xs text-red-600">Min price cannot be greater than max price</p>
                                )}
                            </div>
                        )}
                        {(minPrice && validateAndConvertPrice(minPrice) === undefined) || (maxPrice && validateAndConvertPrice(maxPrice) === undefined) ? (
                            <p className="text-xs text-red-600 mt-2">Please enter valid prices</p>
                        ) : null}
                    </div>

                    {/* Color Filter */}
                    {availableColors.length > 0 && (
                        <div>
                            <label className="text-sm font-semibold text-gray-700 mb-2 block">Color</label>
                            <select
                                value={selectedColor}
                                onChange={(e) => setSelectedColor(e.target.value)}
                                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 hover:border-gray-400"
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
                            <label className="text-sm font-semibold text-gray-700 mb-2 block">Brand</label>
                            <select
                                value={brand}
                                onChange={(e) => setBrand(e.target.value)}
                                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 hover:border-gray-400"
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
                            <label className="text-sm font-semibold text-gray-700 mb-2 block">Lens Type</label>
                            <select
                                value={lensType}
                                onChange={(e) => setLensType(e.target.value)}
                                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 hover:border-gray-400"
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
                            <label className="text-sm font-semibold text-gray-700 mb-2 block">Lens Coating</label>
                            <select
                                value={lensCoating}
                                onChange={(e) => setLensCoating(e.target.value)}
                                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 hover:border-gray-400"
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
