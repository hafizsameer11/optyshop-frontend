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
    }, [minPrice, maxPrice, sortBy, selectedColor, lensType, lensCoating, brand, inStockOnly, searchTerm, onFilterChange])

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
        <div className={`bg-white rounded-lg shadow-sm border border-gray-200 w-full ${className}`}>
            {/* Header */}
            <div className="p-2 border-b border-gray-100">
                {/* Filter Title */}
                <div className="flex items-center justify-between mb-3">
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
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <svg className={`w-4 h-4 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                </div>
                
                {/* Filter Controls - Better responsive layout */}
                <div className="space-y-2">
                    {/* Category and Subcategory Buttons */}
                    <div className="flex flex-wrap gap-2">
                        {availableCategories.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                                {availableCategories.slice(0, 4).map((category) => (
                                    <button
                                        key={category.id}
                                        onClick={() => onFilterChange({ 
                                            ...{}, 
                                            category: category.slug || category.id,
                                            subcategory: null 
                                        })}
                                        className={`text-xs px-2 py-1 rounded-md transition-all duration-200 whitespace-nowrap ${
                                            selectedCategory === (category.slug || category.id)
                                                ? 'bg-blue-500 text-white'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                    >
                                        {category.name}
                                    </button>
                                ))}
                            </div>
                        )}

                        {availableSubcategories.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                                {availableSubcategories.slice(0, 4).map((subcategory) => (
                                    <button
                                        key={subcategory.id}
                                        onClick={() => onFilterChange({ 
                                            ...{}, 
                                            subcategory: subcategory.slug || subcategory.id
                                        })}
                                        className={`text-xs px-2 py-1 rounded-md transition-all duration-200 whitespace-nowrap ${
                                            selectedSubcategory === (subcategory.slug || subcategory.id)
                                                ? 'bg-blue-500 text-white'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                    >
                                        {subcategory.name}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Search, Sort, and Stock Controls */}
                    <div className="flex flex-wrap items-center gap-3">
                        {/* Search */}
                        <div className="flex items-center gap-1">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-24 sm:w-32 text-xs border border-gray-300 rounded-lg pl-6 pr-2 py-1.5 focus:ring-1 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 hover:border-gray-400"
                                />
                                <svg className="absolute left-1.5 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                        </div>

                        {/* Sort By */}
                        <div className="flex items-center gap-1">
                            <label className="text-xs font-medium text-gray-700 whitespace-nowrap">Sort:</label>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="text-xs border border-gray-300 rounded-lg px-2 py-1.5 focus:ring-1 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 min-w-[70px] hover:border-gray-400"
                            >
                                <option value="newest">Newest</option>
                                <option value="oldest">Oldest</option>
                                <option value="price_low">Price Low</option>
                                <option value="price_high">Price High</option>
                                <option value="name">Name A-Z</option>
                            </select>
                        </div>

                        {/* In Stock Only */}
                        <div className="flex items-center gap-1">
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
