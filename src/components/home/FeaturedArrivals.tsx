import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getProducts, type Product } from '../../services/productsService'
import { getProductImageUrl } from '../../utils/productImage'
import { getCategoriesWithSubcategories, type Category } from '../../services/categoriesService'

interface FeaturedArrivalsProps {
    categorySlug?: string
    categoryName?: string
    limit?: number
}

const FeaturedArrivals: React.FC<FeaturedArrivalsProps> = ({ 
    categorySlug, 
    categoryName, 
    limit = 4 
}) => {
    const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let isCancelled = false
        
        const fetchFeaturedProducts = async () => {
            try {
                setLoading(true)
                const filters: any = {
                    page: 1,
                    limit: limit,
                    sortBy: 'created_at',
                    sortOrder: 'desc'
                }

                if (categorySlug) {
                    // Find category by slug to get ID
                    const categories = await getCategoriesWithSubcategories()
                    if (isCancelled) return
                    const category = categories.find(cat => cat.slug === categorySlug)
                    if (category) {
                        filters.category = category.id
                    }
                }

                const result = await getProducts(filters)
                if (isCancelled) return
                
                if (result) {
                    setProducts(result.products)
                }
            } catch (error) {
                if (!isCancelled) {
                    console.error('Error fetching featured products:', error)
                }
            } finally {
                if (!isCancelled) {
                    setLoading(false)
                }
            }
        }
        fetchFeaturedProducts()
        
        return () => {
            isCancelled = true
        }
    }, [categorySlug, limit])

    if (loading) {
        return (
            <section className="bg-white py-12 md:py-16 px-4 sm:px-6">
                <div className="w-[90%] mx-auto max-w-7xl">
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
                        FEATURED ARRIVALS
                    </h2>
                    <h3 className="text-xl md:text-2xl font-semibold text-gray-700 mb-6">
                        {categoryName || 'Products'}
                    </h3>
                    <div className="text-center py-8">Loading...</div>
                </div>
            </section>
        )
    }

    if (products.length === 0) {
        return null
    }

    return (
        <section className="bg-white py-12 md:py-16 px-4 sm:px-6">
            <div className="w-[90%] mx-auto max-w-7xl">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
                    FEATURED ARRIVALS
                </h2>
                <h3 className="text-xl md:text-2xl font-semibold text-gray-700 mb-6">
                    {categoryName || 'Products'}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
                    {products.map((product) => (
                        <Link
                            key={product.id}
                            to={`/shop/product/${product.slug || product.id}`}
                            className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col group border border-gray-200"
                        >
                            {/* Product Image */}
                            <div className="relative h-64 md:h-72 bg-gray-100 overflow-hidden">
                                <img
                                    src={getProductImageUrl(product)}
                                    alt={product.name}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    onError={(e) => {
                                        const target = e.target as HTMLImageElement
                                        target.src = '/assets/images/frame1.png'
                                    }}
                                />
                            </div>
                            
                            {/* Product Info */}
                            <div className="p-4 flex-1 flex flex-col">
                                <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                                    {product.name}
                                </h3>
                                {product.description && (
                                    <p className="text-sm text-gray-600 mb-4 line-clamp-2 flex-1">
                                        {product.description}
                                    </p>
                                )}
                                <div className="mt-auto">
                                    <p className="text-xl font-bold text-blue-950">
                                        {product.price ? `${parseFloat(product.price).toFixed(2)} €` : 'Price on request'}
                                    </p>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    )
}

export default FeaturedArrivals

