import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getProducts, type Product } from '../../services/productsService'
import ProductCard from '../products/ProductCard'

const LATEST_LIMIT = 5

const LatestArrivals: React.FC = () => {
    const { t } = useTranslation()
    const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let isCancelled = false

        const fetchLatestProducts = async () => {
            try {
                setLoading(true)
                const result = await getProducts({
                    page: 1,
                    limit: LATEST_LIMIT,
                    sortBy: 'created_at',
                    sortOrder: 'desc',
                })
                if (isCancelled) return

                if (result?.products) {
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
        void fetchLatestProducts()

        return () => {
            isCancelled = true
        }
    }, [])

    if (loading) {
        return (
            <section className="bg-gray-50 py-12 md:py-16 px-4 sm:px-6">
                <div className="w-[90%] mx-auto max-w-7xl">
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">{t('home.latestArrivals.title')}</h2>
                    <div className="text-center py-8">{t('common.loading')}</div>
                </div>
            </section>
        )
    }

    if (products.length === 0) {
        return null
    }

    return (
        <section className="bg-gray-50 py-12 md:py-16 px-4 sm:px-6">
            <div className="w-[90%] mx-auto max-w-screen-2xl">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">{t('home.latestArrivals.title')}</h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-5 xl:grid-cols-5 xl:gap-4">
                    {products.map((product) => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            </div>
        </section>
    )
}

export default LatestArrivals
