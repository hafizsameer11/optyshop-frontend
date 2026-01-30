import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import { useCart, type CartProduct } from '../../context/CartContext'
import { getProducts, type Product } from '../../services/productsService'
import { getProductImageUrl } from '../../utils/productImage'
import EyeHygieneProductCard from '../../components/products/EyeHygieneProductCard'

const EyeHygieneCategory = () => {
    const { t } = useTranslation()
    const { addToCart } = useCart()
    const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)
    const [filters, setFilters] = useState({
        size_volume: '',
        pack_type: '',
        priceRange: '',
        sortBy: 'name'
    })

    useEffect(() => {
        fetchEyeHygieneProducts()
    }, [filters])

    const fetchEyeHygieneProducts = async () => {
        try {
            setLoading(true)
            const filterParams: any = {
                category: 'eye-hygiene',
                limit: 50
            }
            
            // Add filters if they have values
            if (filters.size_volume) filterParams.size_volume = filters.size_volume
            if (filters.pack_type) filterParams.pack_type = filters.pack_type
            if (filters.sortBy) filterParams.sortBy = filters.sortBy
            
            const response = await getProducts(filterParams)
            if (response) {
                setProducts(response.products || [])
            }
        } catch (error) {
            console.error('Error fetching eye hygiene products:', error)
            setProducts([])
        } finally {
            setLoading(false)
        }
    }

    const handleAddToCart = (product: Product, variant?: any) => {
        try {
            const salePrice = product?.sale_price ? Number(product.sale_price) : null
            const regularPrice = variant?.price || product?.price ? Number(product.price) : 0
            const finalPrice = salePrice && salePrice < regularPrice ? salePrice : regularPrice
            
            const cartProduct = {
                id: product?.id || 0,
                name: variant?.name || product?.name || '',
                brand: product?.brand || '',
                category: 'eye-hygiene',
                price: finalPrice,
                image: variant?.image_url || getProductImageUrl(product),
                description: variant?.description || product?.description || '',
                inStock: variant?.stock_quantity > 0 || product?.in_stock !== false,
                rating: product?.rating ? Number(product.rating) : undefined,
                type: 'eye_hygiene_variant' as const,
                customization: {
                    variant_id: variant?.id,
                    size_volume: variant?.size_volume,
                    pack_type: variant?.pack_type
                }
            }
            addToCart(cartProduct as unknown as CartProduct)
        } catch (error) {
            console.error('Error adding to cart:', error)
        }
    }

    const handleFilterChange = (filterName: string, value: string) => {
        setFilters(prev => ({
            ...prev,
            [filterName]: value
        }))
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Navbar />
                <div className="max-w-7xl mx-auto px-4 py-8">
                    <div className="animate-pulse">
                        <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="bg-white rounded-lg p-4">
                                    <div className="h-40 bg-gray-200 rounded mb-4"></div>
                                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <Footer />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            
            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        {t('shop.eyeHygieneProducts', 'Eye Hygiene Products')}
                    </h1>
                    <p className="text-gray-600">
                        {t('shop.eyeHygieneDescription', 'Complete your eye care routine with our premium hygiene products')}
                    </p>
                </div>

                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Filters Sidebar */}
                    <div className="lg:w-64 flex-shrink-0">
                        <div className="bg-white rounded-lg p-6 shadow-sm">
                            <h3 className="font-semibold text-gray-900 mb-4">
                                {t('shop.filters', 'Filters')}
                            </h3>
                            
                            {/* Size Filter */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {t('shop.filterBySize', 'Filter by Size')}
                                </label>
                                <select
                                    value={filters.size_volume}
                                    onChange={(e) => handleFilterChange('size_volume', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">{t('shop.allSizes', 'All Sizes')}</option>
                                    <option value="5ml">5ml</option>
                                    <option value="10ml">10ml</option>
                                    <option value="30ml">30ml</option>
                                    <option value="60ml">60ml</option>
                                </select>
                            </div>

                            {/* Pack Type Filter */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {t('shop.filterByPackType', 'Filter by Pack Type')}
                                </label>
                                <select
                                    value={filters.pack_type}
                                    onChange={(e) => handleFilterChange('pack_type', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">{t('shop.allPackTypes', 'All Pack Types')}</option>
                                    <option value="Single">Single</option>
                                    <option value="Pack of 2">Pack of 2</option>
                                    <option value="Pack of 3">Pack of 3</option>
                                    <option value="Pack of 6">Pack of 6</option>
                                </select>
                            </div>

                            {/* Price Range Filter */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {t('shop.filterByPrice', 'Filter by Price')}
                                </label>
                                <select
                                    value={filters.priceRange}
                                    onChange={(e) => handleFilterChange('priceRange', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">{t('shop.allPrices', 'All Prices')}</option>
                                    <option value="0-25">€0 - €25</option>
                                    <option value="25-50">€25 - €50</option>
                                    <option value="50-100">€50 - €100</option>
                                    <option value="100+">€100+</option>
                                </select>
                            </div>

                            {/* Sort By */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {t('shop.sortBy', 'Sort By')}
                                </label>
                                <select
                                    value={filters.sortBy}
                                    onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="name">{t('shop.name', 'Name')}</option>
                                    <option value="price-low">{t('shop.priceLowToHigh', 'Price: Low to High')}</option>
                                    <option value="price-high">{t('shop.priceHighToLow', 'Price: High to Low')}</option>
                                    <option value="rating">{t('shop.rating', 'Rating')}</option>
                                </select>
                            </div>

                            {/* Clear Filters */}
                            <button
                                onClick={() => setFilters({
                                    size_volume: '',
                                    pack_type: '',
                                    priceRange: '',
                                    sortBy: 'name'
                                })}
                                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                            >
                                {t('shop.clearFilters', 'Clear Filters')}
                            </button>
                        </div>
                    </div>

                    {/* Products Grid */}
                    <div className="flex-1">
                        {products.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="text-gray-400 mb-4">
                                    <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">
                                    {t('shop.noProductsFound', 'No products found')}
                                </h3>
                                <p className="text-gray-500">
                                    {t('shop.tryDifferentFilters', 'Try adjusting your filters or browse all products')}
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {products.map(product => (
                                    <EyeHygieneProductCard
                                        key={product.id}
                                        product={product}
                                        onAddToCart={handleAddToCart}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            <Footer />
        </div>
    )
}

export default EyeHygieneCategory
