import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getProducts, type Product } from '../../services/productsService'
import { getProductImageUrl } from '../../utils/productImage'

const LatestArrivals: React.FC = () => {
    const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let isCancelled = false
        
        const fetchLatestProducts = async () => {
            try {
                setLoading(true)
                const result = await getProducts({
                    page: 1,
                    limit: 4,
                    sortBy: 'created_at',
                    sortOrder: 'desc'
                })
                if (isCancelled) return
                
                if (result) {
                    setProducts(result.products)
                }
            } catch (error) {
                if (!isCancelled) {
                    console.error('Error fetching latest products:', error)
                }
            } finally {
                if (!isCancelled) {
                    setLoading(false)
                }
            }
        }
        fetchLatestProducts()
        
        return () => {
            isCancelled = true
        }
    }, [])

    if (loading) {
        return (
            <section className="bg-gray-50 py-12 md:py-16 px-4 sm:px-6">
                <div className="w-[90%] mx-auto max-w-7xl">
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">Latest Arrivals</h2>
                    <div className="text-center py-8">Loading...</div>
                </div>
            </section>
        )
    }

    if (products.length === 0) {
        return null
    }

    return (
        <section className="bg-gray-50 py-12 md:py-16 px-4 sm:px-6">
            <div className="w-[90%] mx-auto max-w-7xl">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">Latest Arrivals</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
                    {products.map((product) => (
                        <Link
                            key={product.id}
                            to={`/shop/product/${product.slug || product.id}`}
                            className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col group"
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

export default LatestArrivals

