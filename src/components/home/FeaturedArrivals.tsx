import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getProducts, type Product } from '../../services/productsService'
import ProductCard from '../products/ProductCard'

interface FeaturedArrivalsProps {
    categorySlug?: string
    categoryName?: string
    limit?: number
}

const FeaturedArrivals: React.FC<FeaturedArrivalsProps> = ({
    categorySlug,
    categoryName,
    limit = 4,
}) => {
    const { t } = useTranslation()
    const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let isCancelled = false

        const fetchFeaturedProducts = async () => {
            try {
                setLoading(true)
                const filters: any = {
                    page: 1,
                    limit,
                    sortBy: 'created_at',
                    sortOrder: 'desc',
                }
                if (categorySlug) {
                    filters.category = categorySlug
                }

                const result = await getProducts(filters)
                if (isCancelled) return

                if (result?.products) {
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
        void fetchFeaturedProducts()

        return () => {
            isCancelled = true
        }
    }, [categorySlug, limit])

    if (loading) {
        return (
            <section className="bg-white py-12 md:py-16 px-4 sm:px-6">
                <div className="w-[90%] mx-auto max-w-7xl">
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
                        {t('home.featuredArrivals.title')}
                    </h2>
                    <h3 className="text-xl md:text-2xl font-semibold text-gray-700 mb-6">
                        {categoryName || t('common.products')}
                    </h3>
                    <div className="text-center py-8">{t('common.loading')}</div>
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
                    {t('home.featuredArrivals.title')}
                </h2>
                <h3 className="text-xl md:text-2xl font-semibold text-gray-700 mb-6">
                    {categoryName || t('common.products')}
                </h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-5 xl:grid-cols-5 xl:gap-4">
                    {products.map((product) => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            </div>
        </section>
    )
}

export default FeaturedArrivals
