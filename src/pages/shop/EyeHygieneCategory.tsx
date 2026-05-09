import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import { getProducts, type Product } from '../../services/productsService'
import EyeHygieneProductCard from '../../components/products/EyeHygieneProductCard'

const EyeHygieneCategory = () => {
    const { t } = useTranslation()
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
