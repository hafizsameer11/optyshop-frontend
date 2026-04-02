import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { getProductOptions, type ProductOptions } from '../../services/productsService'

export type ShopFilterPayload = {
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
    frameShape?: string
    frameMaterial?: string
    isFeatured?: boolean
    baseCurve?: string
    diameter?: string
    replacementPeriod?: string
    model?: string
    features?: string
    categoryText?: string
    caliber?: string
    bridge?: string
    temples?: string
    /** Synced to parent; not sent to products API as-is */
    featuredOnly?: boolean
}

interface ComprehensiveFiltersProps {
    onFilterChange: (filters: ShopFilterPayload) => void
    onClearAll?: () => void
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
    /** e.g. eye-glasses, contact-lenses — drives which extra filters are shown */
    categorySlug?: string
    onClose?: () => void
    showCloseButton?: boolean
}

const ComprehensiveFilters: React.FC<ComprehensiveFiltersProps> = ({
    onFilterChange,
    onClearAll,
    availableColors = [],
    availableBrands = [],
    availableLensTypes = [],
    availableLensCoatings = [],
    availableCategories = [],
    availableSubcategories = [],
    selectedCategory = 'all',
    selectedSubcategory = null,
    className = '',
    categoryLevel = 'category',
    categorySlug = '',
    onClose,
    showCloseButton = false
}) => {
    const { t } = useTranslation()
    const [productOptions, setProductOptions] = useState<ProductOptions | null>(null)
    const [isExpanded, setIsExpanded] = useState(true)
    const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false)

    const isContactLenses = categorySlug === 'contact-lenses'
    const isEyeHygiene = categorySlug === 'eye-hygiene'
    const showEyewearFilters = Boolean(categorySlug) && !isContactLenses && !isEyeHygiene
    
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
    const [gender, setGender] = useState<string>('')
    const [frameShape, setFrameShape] = useState<string>('')
    const [frameMaterial, setFrameMaterial] = useState<string>('')
    const [featuredOnly, setFeaturedOnly] = useState<boolean>(false)
    const [baseCurve, setBaseCurve] = useState<string>('')
    const [diameter, setDiameter] = useState<string>('')
    const [replacementPeriod, setReplacementPeriod] = useState<string>('')
    const [categoryText, setCategoryText] = useState<string>('')
    const [model, setModel] = useState<string>('')
    const [features, setFeatures] = useState<string>('')
    const [caliber, setCaliber] = useState<string>('')
    const [bridge, setBridge] = useState<string>('')
    const [temples, setTemples] = useState<string>('')
    
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
        const filters: ShopFilterPayload = {}

        const minPriceNum = validateAndConvertPrice(minPrice)
        const maxPriceNum = validateAndConvertPrice(maxPrice)

        if (minPriceNum !== undefined) {
            filters.minPrice = minPriceNum
        }
        if (maxPriceNum !== undefined) {
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
        if (searchTerm) filters.search = searchTerm
        if (gender) filters.gender = gender
        if (frameShape) filters.frameShape = frameShape
        if (frameMaterial) filters.frameMaterial = frameMaterial
        if (featuredOnly) filters.isFeatured = true
        if (baseCurve.trim()) filters.baseCurve = baseCurve.trim()
        if (diameter.trim()) filters.diameter = diameter.trim()
        if (replacementPeriod.trim()) filters.replacementPeriod = replacementPeriod.trim()
        if (categoryText.trim()) filters.categoryText = categoryText.trim()
        if (model.trim()) filters.model = model.trim()
        if (features.trim()) filters.features = features.trim()
        if (caliber.trim()) filters.caliber = caliber.trim()
        if (bridge.trim()) filters.bridge = bridge.trim()
        if (temples.trim()) filters.temples = temples.trim()

        onFilterChange({
            ...filters,
            minPrice: minPriceNum,
            maxPrice: maxPriceNum,
            featuredOnly,
            gender,
            frameShape,
            frameMaterial,
            baseCurve,
            diameter,
            replacementPeriod,
            categoryText,
            model,
            features,
            caliber,
            bridge,
            temples,
        })
    }, [
        minPrice,
        maxPrice,
        sortBy,
        selectedColor,
        lensType,
        lensCoating,
        brand,
        inStockOnly,
        searchTerm,
        gender,
        frameShape,
        frameMaterial,
        featuredOnly,
        baseCurve,
        diameter,
        replacementPeriod,
        categoryText,
        model,
        features,
        caliber,
        bridge,
        temples,
        onFilterChange,
    ])

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
        setGender('')
        setFrameShape('')
        setFrameMaterial('')
        setFeaturedOnly(false)
        setBaseCurve('')
        setDiameter('')
        setReplacementPeriod('')
        setCategoryText('')
        setModel('')
        setFeatures('')
        setCaliber('')
        setBridge('')
        setTemples('')
        onClearAll?.()
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
        if (gender) count++
        if (frameShape) count++
        if (frameMaterial) count++
        if (featuredOnly) count++
        if (baseCurve.trim()) count++
        if (diameter.trim()) count++
        if (replacementPeriod.trim()) count++
        if (categoryText.trim()) count++
        if (model.trim()) count++
        if (features.trim()) count++
        if (caliber.trim()) count++
        if (bridge.trim()) count++
        if (temples.trim()) count++
        return count
    }

    const activeCount = getActiveFiltersCount()

    return (
        <>
            {/* Filter Toggle Button - Always Visible */}
            {!showCloseButton && (
                <div className="mb-4 lg:hidden">
                    <button
                        type="button"
                        onClick={() => setIsMobileFilterOpen(true)}
                        className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                        </svg>
                        <span className="font-medium text-sm">{t('shop.filters.filters', 'Filtri')}</span>
                        {activeCount > 0 && (
                            <span className="bg-blue-100 text-blue-600 text-xs px-2 py-1 rounded-full font-medium">
                                {activeCount}
                            </span>
                        )}
                    </button>
                </div>
            )}

            {/* Desktop sidebar */}
            <div className={`hidden lg:block ${className}`}>
                <div className="rounded-2xl border border-slate-200/90 bg-white shadow-sm">
                    {/* Header */}
                    <div className="p-3 border-b border-gray-100">
                        {/* Filter Title */}
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                                </svg>
                                <h3 className="text-sm font-semibold text-gray-800">{t('shop.filters.filters', 'Filtri')}</h3>
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
                                        className="text-xs text-gray-600 hover:text-red-600 transition-colors font-medium"
                                    >
                                        {t('shop.filters.clearAll', 'Cancella tutto')}
                                    </button>
                                )}
                                {showCloseButton && onClose && (
                                    <button
                                        onClick={onClose}
                                        className="text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
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
                        
                        {/* Search - Always visible */}
                        <div className="space-y-2">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder={t('shop.filters.searchPlaceholder', 'Cerca...')}
                                    value={searchInput}
                                    onChange={(e) => setSearchInput(e.target.value)}
                                    onKeyPress={handleSearchKeyPress}
                                    className="w-full text-xs border border-gray-300 rounded-lg pl-8 pr-3 py-2 focus:ring-1 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 hover:border-gray-400"
                                />
                                <svg className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <button
                                onClick={handleSearch}
                                className="w-full bg-blue-500 text-white text-xs font-medium py-2 rounded-lg hover:bg-blue-600 transition-colors duration-200"
                            >
                                {t('shop.filters.search', 'Cerca')}
                            </button>
                        </div>
                    </div>

                    {/* Always Visible Quick Filters */}
                    <div className="p-3 space-y-3 border-b border-gray-100">
                        {/* Sort By */}
                        <div>
                            <label className="text-xs font-semibold text-gray-700 mb-1 block">{t('shop.filters.sortBy', 'Ordina per')}</label>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="w-full text-xs border border-gray-300 rounded-lg px-2 py-1.5 focus:ring-1 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 hover:border-gray-400"
                            >
                                <option value="newest">{t('shop.filters.newestFirst', 'Più recenti')}</option>
                                <option value="oldest">{t('shop.filters.oldestFirst', 'Meno recenti')}</option>
                                <option value="price_low">{t('shop.filters.priceLowToHigh', 'Prezzo: crescente')}</option>
                                <option value="price_high">{t('shop.filters.priceHighToLow', 'Prezzo: decrescente')}</option>
                                <option value="relevance">{t('shop.filters.relevance', 'Rilevanza')}</option>
                                <option value="name">{t('shop.filters.nameAZ', 'Nome: A-Z')}</option>
                            </select>
                        </div>

                        {/* In Stock Only */}
                        <div className="flex items-center">
                            <label className="flex cursor-pointer items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={inStockOnly}
                                    onChange={(e) => setInStockOnly(e.target.checked)}
                                    className="h-3.5 w-3.5 rounded border-slate-300 text-slate-900 focus:ring-slate-400"
                                />
                                <span className="text-xs font-medium text-slate-700">{t('shop.filters.inStockOnly', 'Solo disponibili')}</span>
                            </label>
                        </div>

                        {productOptions?.genders && productOptions.genders.length > 0 && (
                            <div>
                                <label className="mb-1 block text-xs font-semibold text-slate-700">{t('shop.filters.gender', 'Genere')}</label>
                                <select
                                    value={gender}
                                    onChange={(e) => setGender(e.target.value)}
                                    className="w-full rounded-lg border border-slate-200 px-2 py-2 text-xs outline-none transition-colors focus:border-slate-400 focus:ring-1 focus:ring-slate-300"
                                >
                                    <option value="">{t('shop.filters.allGenders', 'Tutti i generi')}</option>
                                    {productOptions.genders.map((g) => (
                                        <option key={g} value={g}>
                                            {g}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div className="flex items-center">
                            <label className="flex cursor-pointer items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={featuredOnly}
                                    onChange={(e) => setFeaturedOnly(e.target.checked)}
                                    className="h-3.5 w-3.5 rounded border-slate-300 text-amber-600 focus:ring-amber-400"
                                />
                                <span className="text-xs font-medium text-slate-700">{t('shop.filters.featuredOnly', 'In evidenza')}</span>
                            </label>
                        </div>

                        {/* Category and Subcategory Buttons */}
                        {availableCategories.length > 0 && (
                            <div>
                                <label className="text-xs font-semibold text-gray-700 mb-1 block">{t('shop.filters.category', 'Categoria')}</label>
                                <div className="flex flex-wrap gap-1">
                                    {availableCategories.slice(0, 4).map((category) => (
                                        <button
                                            key={category.id}
                                            onClick={() => onFilterChange({ 
                                                ...{}, 
                                                category: category.slug || category.id,
                                                subcategory: null 
                                            })}
                                            className={`text-xs px-2 py-1 rounded-md transition-all duration-200 whitespace-nowrap ${selectedCategory === (category.slug || category.id) ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                                        >
                                            {category.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {availableSubcategories.length > 0 && (
                            <div>
                                <label className="text-xs font-semibold text-gray-700 mb-1 block">Subcategory</label>
                                <div className="flex flex-wrap gap-1">
                                    {availableSubcategories.slice(0, 4).map((subcategory) => (
                                        <button
                                            key={subcategory.id}
                                            onClick={() => onFilterChange({ 
                                                ...{}, 
                                                subcategory: subcategory.slug || subcategory.id
                                            })}
                                            className={`text-xs px-2 py-1 rounded-md transition-all duration-200 whitespace-nowrap ${selectedSubcategory === (subcategory.slug || subcategory.id) ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
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
                        <div className="p-3 space-y-3">
                            {/* Price Range */}
                            <div>
                                <label className="text-xs font-semibold text-gray-700 mb-1 block">{t('shop.filters.price', 'Prezzo')}</label>
                                <div className="flex gap-2 items-center">
                                    <div className="relative flex-1">
                                        <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-400">€</span>
                                        <input
                                            type="text"
                                            placeholder={t('shop.filters.min', 'Min')}
                                            value={minPrice}
                                            onChange={(e) => handleMinPriceChange(e.target.value)}
                                            className={`w-full text-xs border rounded-lg pl-5 pr-2 py-1.5 focus:ring-1 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 hover:border-gray-400 ${minPrice && validateAndConvertPrice(minPrice) === undefined ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
                                        />
                                    </div>
                                    <span className="text-xs text-gray-400">-</span>
                                    <div className="relative flex-1">
                                        <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-400">€</span>
                                        <input
                                            type="text"
                                            placeholder={t('shop.filters.max', 'Max')}
                                            value={maxPrice}
                                            onChange={(e) => handleMaxPriceChange(e.target.value)}
                                            className={`w-full text-xs border rounded-lg pl-5 pr-2 py-1.5 focus:ring-1 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 hover:border-gray-400 ${maxPrice && validateAndConvertPrice(maxPrice) === undefined ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
                                        />
                                    </div>
                                </div>
                                {/* Validation feedback */}
                                {minPrice && maxPrice && validateAndConvertPrice(minPrice) !== undefined && validateAndConvertPrice(maxPrice) !== undefined && (
                                    <div className="mt-1">
                                        {validateAndConvertPrice(minPrice)! > validateAndConvertPrice(maxPrice)! && (
                                            <p className="text-xs text-red-600">{t('shop.filters.minGreaterThanMax', 'Il prezzo minimo non puo superare il massimo')}</p>
                                        )}
                                    </div>
                                )}
                                {(minPrice && validateAndConvertPrice(minPrice) === undefined) || (maxPrice && validateAndConvertPrice(maxPrice) === undefined) ? (
                                    <p className="text-xs text-red-600 mt-1">{t('shop.filters.validPrices', 'Inserisci prezzi validi')}</p>
                                ) : null}
                            </div>

                            {/* Color Filter */}
                            {availableColors.length > 0 && (
                                <div>
                                    <label className="text-xs font-semibold text-gray-700 mb-1 block">{t('shop.filters.color', 'Colore')}</label>
                                    <select
                                        value={selectedColor}
                                        onChange={(e) => setSelectedColor(e.target.value)}
                                        className="w-full text-xs border border-gray-300 rounded-lg px-2 py-1.5 focus:ring-1 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 hover:border-gray-400"
                                    >
                                        <option value="">{t('shop.filters.allColors', 'Tutti i colori')}</option>
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
                                    <label className="text-xs font-semibold text-gray-700 mb-1 block">{t('shop.filters.brand', 'Brand')}</label>
                                    <select
                                        value={brand}
                                        onChange={(e) => setBrand(e.target.value)}
                                        className="w-full text-xs border border-gray-300 rounded-lg px-2 py-1.5 focus:ring-1 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 hover:border-gray-400"
                                    >
                                        <option value="">{t('shop.filters.allBrands', 'Tutti i brand')}</option>
                                        {(availableBrands.length > 0 ? availableBrands : (productOptions as any)?.brands || []).map((brandName: string) => (
                                            <option key={brandName} value={brandName}>
                                                {brandName}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div>
                                <label className="text-xs font-semibold text-gray-700 mb-1 block">{t('shop.filters.category', 'Categoria')}</label>
                                <input
                                    type="text"
                                    value={categoryText}
                                    onChange={(e) => setCategoryText(e.target.value)}
                                    placeholder={t('shop.filters.category', 'Categoria')}
                                    className="w-full text-xs border border-gray-300 rounded-lg px-2 py-1.5 focus:ring-1 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 hover:border-gray-400"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-gray-700 mb-1 block">{t('shop.filters.model', 'Modello')}</label>
                                <input
                                    type="text"
                                    value={model}
                                    onChange={(e) => setModel(e.target.value)}
                                    placeholder={t('shop.filters.model', 'Modello')}
                                    className="w-full text-xs border border-gray-300 rounded-lg px-2 py-1.5 focus:ring-1 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 hover:border-gray-400"
                                />
                            </div>

                            {showEyewearFilters && productOptions?.frameShapes && productOptions.frameShapes.length > 0 && (
                                <div>
                                    <label className="mb-1 block text-xs font-semibold text-slate-700">{t('shop.filters.shape', 'Forma')}</label>
                                    <select
                                        value={frameShape}
                                        onChange={(e) => setFrameShape(e.target.value)}
                                        className="w-full rounded-lg border border-slate-200 px-2 py-2 text-xs outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-300"
                                    >
                                        <option value="">{t('shop.filters.allShapes', 'Tutte le forme')}</option>
                                        {productOptions.frameShapes.map((shape) => (
                                            <option key={shape} value={shape}>
                                                {shape}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {showEyewearFilters && productOptions?.frameMaterials && productOptions.frameMaterials.length > 0 && (
                                <div>
                                    <label className="mb-1 block text-xs font-semibold text-slate-700">{t('shop.filters.material', 'Materiale')}</label>
                                    <select
                                        value={frameMaterial}
                                        onChange={(e) => setFrameMaterial(e.target.value)}
                                        className="w-full rounded-lg border border-slate-200 px-2 py-2 text-xs outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-300"
                                    >
                                        <option value="">{t('shop.filters.allMaterials', 'Tutti i materiali')}</option>
                                        {productOptions.frameMaterials.map((mat) => (
                                            <option key={mat} value={mat}>
                                                {mat}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {showEyewearFilters && (
                                <div className="grid grid-cols-3 gap-2">
                                    <div>
                                        <label className="mb-1 block text-[11px] font-semibold text-slate-700">{t('shop.filters.caliber', 'Calibro')}</label>
                                        <input
                                            type="text"
                                            value={caliber}
                                            onChange={(e) => setCaliber(e.target.value)}
                                            placeholder="MM"
                                            className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-300"
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-[11px] font-semibold text-slate-700">{t('shop.filters.bridge', 'Ponte')}</label>
                                        <input
                                            type="text"
                                            value={bridge}
                                            onChange={(e) => setBridge(e.target.value)}
                                            placeholder="MM"
                                            className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-300"
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-[11px] font-semibold text-slate-700">{t('shop.filters.temples', 'Aste')}</label>
                                        <input
                                            type="text"
                                            value={temples}
                                            onChange={(e) => setTemples(e.target.value)}
                                            placeholder="MM"
                                            className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-300"
                                        />
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="text-xs font-semibold text-gray-700 mb-1 block">{t('shop.filters.features', 'Caratteristiche')}</label>
                                <input
                                    type="text"
                                    value={features}
                                    onChange={(e) => setFeatures(e.target.value)}
                                    placeholder={t('shop.filters.features', 'Caratteristiche')}
                                    className="w-full text-xs border border-gray-300 rounded-lg px-2 py-1.5 focus:ring-1 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 hover:border-gray-400"
                                />
                            </div>

                            {availableLensTypes.length > 0 && (
                                <div>
                                    <label className="mb-1 block text-xs font-semibold text-slate-700">Lens type</label>
                                    <select
                                        value={lensType}
                                        onChange={(e) => setLensType(e.target.value)}
                                        className="w-full rounded-lg border border-slate-200 px-2 py-2 text-xs outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-300"
                                    >
                                        <option value="">All types</option>
                                        {availableLensTypes.map((type) => (
                                            <option key={type} value={type}>
                                                {type}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {availableLensCoatings.length > 0 && (
                                <div>
                                    <label className="mb-1 block text-xs font-semibold text-slate-700">Lens coating / treatment</label>
                                    <select
                                        value={lensCoating}
                                        onChange={(e) => setLensCoating(e.target.value)}
                                        className="w-full rounded-lg border border-slate-200 px-2 py-2 text-xs outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-300"
                                    >
                                        <option value="">All</option>
                                        {availableLensCoatings.map((coating) => (
                                            <option key={coating} value={coating}>
                                                {coating}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {isContactLenses && (
                                <div className="space-y-2 border-t border-slate-100 pt-3">
                                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                        Contact lens details
                                    </p>
                                    <div>
                                        <label className="mb-1 block text-xs font-medium text-slate-600">Base curve</label>
                                        <input
                                            type="text"
                                            value={baseCurve}
                                            onChange={(e) => setBaseCurve(e.target.value)}
                                            placeholder="e.g. 8.6"
                                            className="w-full rounded-lg border border-slate-200 px-2 py-2 text-xs outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-300"
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-xs font-medium text-slate-600">Diameter (mm)</label>
                                        <input
                                            type="text"
                                            value={diameter}
                                            onChange={(e) => setDiameter(e.target.value)}
                                            placeholder="e.g. 14.2"
                                            className="w-full rounded-lg border border-slate-200 px-2 py-2 text-xs outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-300"
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-xs font-medium text-slate-600">Replacement</label>
                                        <input
                                            type="text"
                                            value={replacementPeriod}
                                            onChange={(e) => setReplacementPeriod(e.target.value)}
                                            placeholder="Daily, monthly…"
                                            className="w-full rounded-lg border border-slate-200 px-2 py-2 text-xs outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-300"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Filter Drawer - Slides from Left (Both Mobile and Desktop) */}
            <div className={`fixed inset-0 z-50 ${isMobileFilterOpen ? 'block' : 'hidden'}`}>
                {/* Backdrop */}
                <div 
                    className="absolute inset-0 bg-black bg-opacity-50 transition-opacity duration-300"
                    onClick={() => setIsMobileFilterOpen(false)}
                />
                
                {/* Filter Drawer */}
                <div className={`absolute top-0 left-0 h-full w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out ${isMobileFilterOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                    {/* Drawer Header */}
                    <div className="p-3 border-b border-gray-100 bg-white sticky top-0 z-10">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                                </svg>
                                <h3 className="text-sm font-semibold text-gray-800">{t('shop.filters.filters', 'Filtri')}</h3>
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
                                        className="text-xs text-gray-600 hover:text-red-600 transition-colors font-medium"
                                    >
                                        {t('shop.filters.clearAll', 'Cancella tutto')}
                                    </button>
                                )}
                                <button
                                    onClick={() => setIsMobileFilterOpen(false)}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Drawer Content - Scrollable */}
                    <div className="h-full overflow-y-auto pb-16">
                        {/* Search Section */}
                        <div className="p-3 space-y-2 border-b border-gray-100">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder={t('shop.filters.searchProducts', 'Cerca prodotti...')}
                                    value={searchInput}
                                    onChange={(e) => setSearchInput(e.target.value)}
                                    onKeyPress={handleSearchKeyPress}
                                    className="w-full text-xs border border-gray-300 rounded-lg pl-8 pr-3 py-2 focus:ring-1 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 hover:border-gray-400"
                                />
                                <svg className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <button
                                onClick={handleSearch}
                                className="w-full bg-blue-500 text-white text-xs font-medium py-2 rounded-lg hover:bg-blue-600 transition-colors duration-200"
                            >
                                {t('shop.filters.search', 'Cerca')}
                            </button>
                        </div>

                        {/* Quick Filters */}
                        <div className="p-3 space-y-3 border-b border-gray-100">
                            {/* Sort By */}
                            <div>
                                <label className="text-xs font-semibold text-gray-700 mb-1 block">{t('shop.filters.sortBy', 'Ordina per')}</label>
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="w-full text-xs border border-gray-300 rounded-lg px-2 py-1.5 focus:ring-1 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 hover:border-gray-400"
                                >
                                    <option value="newest">{t('shop.filters.newestFirst', 'Più recenti')}</option>
                                    <option value="oldest">{t('shop.filters.oldestFirst', 'Meno recenti')}</option>
                                    <option value="price_low">{t('shop.filters.priceLowToHigh', 'Prezzo: crescente')}</option>
                                    <option value="price_high">{t('shop.filters.priceHighToLow', 'Prezzo: decrescente')}</option>
                                    <option value="relevance">{t('shop.filters.relevance', 'Rilevanza')}</option>
                                    <option value="name">{t('shop.filters.nameAZ', 'Nome: A-Z')}</option>
                                </select>
                            </div>

                            <div className="flex items-center">
                                <label className="flex cursor-pointer items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={inStockOnly}
                                        onChange={(e) => setInStockOnly(e.target.checked)}
                                        className="h-3.5 w-3.5 rounded border-slate-300 text-slate-900 focus:ring-slate-400"
                                    />
                                    <span className="text-xs font-medium text-gray-700">{t('shop.filters.inStockOnly', 'Solo disponibili')}</span>
                                </label>
                            </div>

                            {productOptions?.genders && productOptions.genders.length > 0 && (
                                <div>
                                    <label className="mb-1 block text-xs font-semibold text-gray-700">{t('shop.filters.gender', 'Genere')}</label>
                                    <select
                                        value={gender}
                                        onChange={(e) => setGender(e.target.value)}
                                        className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-blue-500"
                                    >
                                        <option value="">{t('shop.filters.allGenders', 'Tutti i generi')}</option>
                                        {productOptions.genders.map((g) => (
                                            <option key={g} value={g}>
                                                {g}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div className="flex items-center">
                                <label className="flex cursor-pointer items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={featuredOnly}
                                        onChange={(e) => setFeaturedOnly(e.target.checked)}
                                        className="h-3.5 w-3.5 rounded border-slate-300 text-amber-600 focus:ring-amber-400"
                                    />
                                    <span className="text-xs font-medium text-gray-700">{t('shop.filters.featuredOnly', 'In evidenza')}</span>
                                </label>
                            </div>

                            {/* Category and Subcategory Buttons */}
                            {availableCategories.length > 0 && (
                                <div>
                                    <label className="text-xs font-semibold text-gray-700 mb-1 block">{t('shop.filters.category', 'Categoria')}</label>
                                    <div className="flex flex-wrap gap-1">
                                        {availableCategories.slice(0, 6).map((category) => (
                                            <button
                                                key={category.id}
                                                onClick={() => onFilterChange({ 
                                                    ...{}, 
                                                    category: category.slug || category.id,
                                                    subcategory: null 
                                                })}
                                                className={`text-xs px-2 py-1 rounded-md transition-all duration-200 whitespace-nowrap ${selectedCategory === (category.slug || category.id) ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                                            >
                                                {category.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {availableSubcategories.length > 0 && (
                                <div>
                                    <label className="text-xs font-semibold text-gray-700 mb-1 block">Subcategory</label>
                                    <div className="flex flex-wrap gap-1">
                                        {availableSubcategories.slice(0, 6).map((subcategory) => (
                                            <button
                                                key={subcategory.id}
                                                onClick={() => onFilterChange({ 
                                                    ...{}, 
                                                    subcategory: subcategory.slug || subcategory.id
                                                })}
                                                className={`text-xs px-2 py-1 rounded-md transition-all duration-200 whitespace-nowrap ${selectedSubcategory === (subcategory.slug || subcategory.id) ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                                            >
                                                {subcategory.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Expanded Filters */}
                        <div className="p-3 space-y-3">
                            {/* Price Range */}
                            <div>
                                <label className="text-xs font-semibold text-gray-700 mb-1 block">{t('shop.filters.price', 'Prezzo')}</label>
                                <div className="flex gap-2 items-center">
                                    <div className="relative flex-1">
                                        <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-400">€</span>
                                        <input
                                            type="text"
                                            placeholder="Min"
                                            value={minPrice}
                                            onChange={(e) => handleMinPriceChange(e.target.value)}
                                            className={`w-full text-xs border rounded-lg pl-5 pr-2 py-1.5 focus:ring-1 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 hover:border-gray-400 ${minPrice && validateAndConvertPrice(minPrice) === undefined ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
                                        />
                                    </div>
                                    <span className="text-xs text-gray-400">-</span>
                                    <div className="relative flex-1">
                                        <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-400">€</span>
                                        <input
                                            type="text"
                                            placeholder="Max"
                                            value={maxPrice}
                                            onChange={(e) => handleMaxPriceChange(e.target.value)}
                                            className={`w-full text-xs border rounded-lg pl-5 pr-2 py-1.5 focus:ring-1 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 hover:border-gray-400 ${maxPrice && validateAndConvertPrice(maxPrice) === undefined ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
                                        />
                                    </div>
                                </div>
                                {/* Validation feedback */}
                                {minPrice && maxPrice && validateAndConvertPrice(minPrice) !== undefined && validateAndConvertPrice(maxPrice) !== undefined && (
                                    <div className="mt-1">
                                        {validateAndConvertPrice(minPrice)! > validateAndConvertPrice(maxPrice)! && (
                                            <p className="text-xs text-red-600">Min price cannot be greater than max price</p>
                                        )}
                                    </div>
                                )}
                                {(minPrice && validateAndConvertPrice(minPrice) === undefined) || (maxPrice && validateAndConvertPrice(maxPrice) === undefined) ? (
                                    <p className="text-xs text-red-600 mt-1">Please enter valid prices</p>
                                ) : null}
                            </div>

                            {/* Color Filter */}
                            {availableColors.length > 0 && (
                                <div>
                                    <label className="text-xs font-semibold text-gray-700 mb-1 block">Color</label>
                                    <select
                                        value={selectedColor}
                                        onChange={(e) => setSelectedColor(e.target.value)}
                                        className="w-full text-xs border border-gray-300 rounded-lg px-2 py-1.5 focus:ring-1 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 hover:border-gray-400"
                                    >
                                        <option value="">{t('shop.filters.allColors', 'Tutti i colori')}</option>
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
                                        className="w-full text-xs border border-gray-300 rounded-lg px-2 py-1.5 focus:ring-1 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 hover:border-gray-400"
                                    >
                                        <option value="">{t('shop.filters.allBrands', 'Tutti i brand')}</option>
                                        {(availableBrands.length > 0 ? availableBrands : (productOptions as any)?.brands || []).map((brandName: string) => (
                                            <option key={brandName} value={brandName}>
                                                {brandName}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div>
                                <label className="text-xs font-semibold text-gray-700 mb-1 block">{t('shop.filters.category', 'Categoria')}</label>
                                <input
                                    type="text"
                                    value={categoryText}
                                    onChange={(e) => setCategoryText(e.target.value)}
                                    placeholder={t('shop.filters.category', 'Categoria')}
                                    className="w-full text-xs border border-gray-300 rounded-lg px-2 py-1.5 focus:ring-1 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 hover:border-gray-400"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-gray-700 mb-1 block">{t('shop.filters.model', 'Modello')}</label>
                                <input
                                    type="text"
                                    value={model}
                                    onChange={(e) => setModel(e.target.value)}
                                    placeholder={t('shop.filters.model', 'Modello')}
                                    className="w-full text-xs border border-gray-300 rounded-lg px-2 py-1.5 focus:ring-1 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 hover:border-gray-400"
                                />
                            </div>

                            {showEyewearFilters && productOptions?.frameShapes && productOptions.frameShapes.length > 0 && (
                                <div>
                                    <label className="mb-1 block text-xs font-semibold text-gray-700">{t('shop.filters.shape', 'Forma')}</label>
                                    <select
                                        value={frameShape}
                                        onChange={(e) => setFrameShape(e.target.value)}
                                        className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-xs focus:ring-1 focus:ring-blue-500"
                                    >
                                        <option value="">{t('shop.filters.allShapes', 'Tutte le forme')}</option>
                                        {productOptions.frameShapes.map((shape) => (
                                            <option key={shape} value={shape}>
                                                {shape}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {showEyewearFilters && productOptions?.frameMaterials && productOptions.frameMaterials.length > 0 && (
                                <div>
                                    <label className="mb-1 block text-xs font-semibold text-gray-700">{t('shop.filters.material', 'Materiale')}</label>
                                    <select
                                        value={frameMaterial}
                                        onChange={(e) => setFrameMaterial(e.target.value)}
                                        className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-xs focus:ring-1 focus:ring-blue-500"
                                    >
                                        <option value="">{t('shop.filters.allMaterials', 'Tutti i materiali')}</option>
                                        {productOptions.frameMaterials.map((mat) => (
                                            <option key={mat} value={mat}>
                                                {mat}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {showEyewearFilters && (
                                <div className="grid grid-cols-3 gap-2">
                                    <div>
                                        <label className="mb-1 block text-[11px] font-semibold text-slate-700">{t('shop.filters.caliber', 'Calibro')}</label>
                                        <input
                                            type="text"
                                            value={caliber}
                                            onChange={(e) => setCaliber(e.target.value)}
                                            placeholder="MM"
                                            className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-xs focus:ring-1 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-[11px] font-semibold text-slate-700">{t('shop.filters.bridge', 'Ponte')}</label>
                                        <input
                                            type="text"
                                            value={bridge}
                                            onChange={(e) => setBridge(e.target.value)}
                                            placeholder="MM"
                                            className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-xs focus:ring-1 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-[11px] font-semibold text-slate-700">{t('shop.filters.temples', 'Aste')}</label>
                                        <input
                                            type="text"
                                            value={temples}
                                            onChange={(e) => setTemples(e.target.value)}
                                            placeholder="MM"
                                            className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-xs focus:ring-1 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="text-xs font-semibold text-gray-700 mb-1 block">{t('shop.filters.features', 'Caratteristiche')}</label>
                                <input
                                    type="text"
                                    value={features}
                                    onChange={(e) => setFeatures(e.target.value)}
                                    placeholder={t('shop.filters.features', 'Caratteristiche')}
                                    className="w-full text-xs border border-gray-300 rounded-lg px-2 py-1.5 focus:ring-1 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 hover:border-gray-400"
                                />
                            </div>

                            {availableLensTypes.length > 0 && (
                                <div>
                                    <label className="mb-1 block text-xs font-semibold text-gray-700">Lens type</label>
                                    <select
                                        value={lensType}
                                        onChange={(e) => setLensType(e.target.value)}
                                        className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-xs focus:ring-1 focus:ring-blue-500"
                                    >
                                        <option value="">All types</option>
                                        {availableLensTypes.map((type) => (
                                            <option key={type} value={type}>
                                                {type}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {availableLensCoatings.length > 0 && (
                                <div>
                                    <label className="mb-1 block text-xs font-semibold text-gray-700">Lens coating</label>
                                    <select
                                        value={lensCoating}
                                        onChange={(e) => setLensCoating(e.target.value)}
                                        className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-xs focus:ring-1 focus:ring-blue-500"
                                    >
                                        <option value="">All</option>
                                        {availableLensCoatings.map((coating) => (
                                            <option key={coating} value={coating}>
                                                {coating}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {isContactLenses && (
                                <div className="space-y-2 border-t border-gray-100 pt-2">
                                    <p className="text-[11px] font-semibold uppercase text-gray-500">Contact lens</p>
                                    <input
                                        type="text"
                                        value={baseCurve}
                                        onChange={(e) => setBaseCurve(e.target.value)}
                                        placeholder="Base curve"
                                        className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-xs"
                                    />
                                    <input
                                        type="text"
                                        value={diameter}
                                        onChange={(e) => setDiameter(e.target.value)}
                                        placeholder="Diameter (mm)"
                                        className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-xs"
                                    />
                                    <input
                                        type="text"
                                        value={replacementPeriod}
                                        onChange={(e) => setReplacementPeriod(e.target.value)}
                                        placeholder="Replacement"
                                        className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-xs"
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Apply Button - Fixed at bottom */}
                    <div className="absolute bottom-0 left-0 right-0 p-3 bg-white border-t border-gray-100">
                        <button
                            onClick={() => setIsMobileFilterOpen(false)}
                            className="w-full bg-blue-500 text-white font-medium py-2 rounded-lg hover:bg-blue-600 transition-colors duration-200 text-sm"
                        >
                            {t('shop.filters.applyFilters', 'Applica filtri')}
                        </button>
                    </div>
                </div>
            </div>
        </>
    )
}

export default ComprehensiveFilters
