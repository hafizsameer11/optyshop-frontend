import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getCategories, type Category } from '../../services/categoriesService'
import { getProducts, type Product } from '../../services/productsService'
import { getProductImageUrl } from '../../utils/productImage'
import { useTranslation } from 'react-i18next'

interface CategoryWithProducts extends Category {
    fetchedProducts?: Product[]
}

const ShopCategories: React.FC = () => {
    const { t } = useTranslation()
    const [categories, setCategories] = useState<CategoryWithProducts[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchCategoriesAndProducts = async () => {
            try {
                setLoading(true)
                // Fetch categories (with or without products from API)
                const fetchedCategories = await getCategories(true)
                
                // Always fetch ALL products for each category to ensure we have them
                const categoriesWithProducts = await Promise.all(
                    fetchedCategories.map(async (category) => {
                        // Fetch all products for this category using slug
                        try {
                            // First fetch to get total count
                            const firstPage = await getProducts({
                                category: category.slug,
                                page: 1,
                                limit: 100 // Large limit to get all products
                            })
                            
                            if (!firstPage) {
                                return {
                                    ...category,
                                    fetchedProducts: category.products || [],
                                    products: category.products || []
                                } as CategoryWithProducts
                            }
                            
                            let allProducts = firstPage.products || []
                            const totalPages = firstPage.pagination?.pages || 1
                            
                            // Fetch remaining pages if there are more
                            if (totalPages > 1) {
                                const remainingPages = await Promise.all(
                                    Array.from({ length: totalPages - 1 }, (_, i) => 
                                        getProducts({
                                            category: category.slug,
                                            page: i + 2,
                                            limit: 100
                                        })
                                    )
                                )
                                
                                remainingPages.forEach(page => {
                                    if (page?.products) {
                                        allProducts = [...allProducts, ...page.products]
                                    }
                                })
                            }
                            
                            return {
                                ...category,
                                fetchedProducts: allProducts,
                                products: allProducts.length > 0 ? allProducts : (category.products || [])
                            } as CategoryWithProducts
                        } catch (error) {
                            console.error(`Error fetching products for category ${category.name}:`, error)
                            // Fallback to products from category if available
                            return {
                                ...category,
                                fetchedProducts: category.products || [],
                                products: category.products || []
                            } as CategoryWithProducts
                        }
                    })
                )
                
                // Filter to only show categories that have products (either from API or fetched)
                const categoriesWithAnyProducts = categoriesWithProducts.filter(
                    cat => (cat.products && cat.products.length > 0) || (cat.fetchedProducts && cat.fetchedProducts.length > 0)
                )
                
                setCategories(categoriesWithAnyProducts)
            } catch (error) {
                console.error('Error fetching categories:', error)
            } finally {
                setLoading(false)
            }
        }
        fetchCategoriesAndProducts()
    }, [])

    // Helper function to parse product images
    const getProductImages = (product: Category['products'][0]): string[] => {
        if (!product.images) return []
        try {
            const parsed = JSON.parse(product.images)
            return Array.isArray(parsed) ? parsed : []
        } catch {
            return product.images ? [product.images] : []
        }
    }

    // Helper function to get product image URL
    const getImageUrl = (product: Category['products'][0]): string => {
        const images = getProductImages(product)
        if (images.length > 0 && images[0]) {
            return images[0]
        }
        return '/assets/images/frame1.png'
    }

    if (loading) {
        return (
            <section className="bg-white py-12 md:py-16 px-4 sm:px-6">
                <div className="w-[90%] mx-auto max-w-7xl">
                    <div className="text-center py-8">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-950"></div>
                        <p className="mt-4 text-lg text-gray-600">Loading categories...</p>
                    </div>
                </div>
            </section>
        )
    }

    return (
        <section className="bg-white py-12 md:py-16 px-4 sm:px-6">
            <div className="w-[90%] mx-auto max-w-7xl">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 text-center">
                    Shop Categories
                </h2>
                
                {categories.length > 0 ? (
                    <div className="space-y-16">
                        {categories.map((category) => (
                            <div key={category.id} className="category-section">
                                {/* Category Header */}
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                                            {category.name}
                                        </h3>
                                        {category.description && (
                                            <p className="text-gray-600">{category.description}</p>
                                        )}
                                    </div>
                                    <Link
                                        to={`/category/${category.slug}`}
                                        className="text-blue-600 hover:text-blue-800 font-medium text-sm md:text-base flex items-center gap-2 transition-colors"
                                    >
                                        View All
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </Link>
                                </div>

                                {/* Products Grid */}
                                {(() => {
                                    // Get products from either category.products or fetchedProducts
                                    const productsToShow = (category.products && category.products.length > 0) 
                                        ? category.products 
                                        : (category.fetchedProducts || [])
                                    
                                    if (productsToShow.length === 0) {
                                        return <p className="text-gray-500 text-center py-8">No products available in this category</p>
                                    }
                                    
                                    return (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6 md:gap-8">
                                            {productsToShow.map((product) => {
                                                // Handle both API product format (Product) and category product format (CategoryProduct)
                                                const isApiProduct = 'image' in product || 'image_url' in product || 'images' in product
                                                const productImage = isApiProduct
                                                    ? getProductImageUrl(product as Product)
                                                    : getImageUrl(product as Category['products'][0])
                                                const productName = (product as any).name || product.name
                                                const productPrice = (product as any).price || product.price || '0'
                                                const productSlug = (product as any).slug || (product as any).id || product.id
                                                
                                                return (
                                                    <Link
                                                        key={product.id}
                                                        to={`/shop/product/${productSlug}`}
                                                        className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col group border border-gray-200"
                                                    >
                                                        {/* Product Image */}
                                                        <div className="relative h-64 md:h-72 bg-gray-100 overflow-hidden">
                                                            <img
                                                                src={productImage}
                                                                alt={productName}
                                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                                onError={(e) => {
                                                                    const target = e.target as HTMLImageElement
                                                                    target.src = '/assets/images/frame1.png'
                                                                }}
                                                            />
                                                        </div>
                                                        
                                                        {/* Product Info */}
                                                        <div className="p-4 flex-1 flex flex-col">
                                                            <h4 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                                                                {productName}
                                                            </h4>
                                                            <div className="mt-auto">
                                                                <p className="text-xl font-bold text-blue-950">
                                                                    ${parseFloat(productPrice).toFixed(2)}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </Link>
                                                )
                                            })}
                                        </div>
                                    )
                                })()}
                            </div>
                        ))}
                    </div>
                ) : (
                    // Fallback: Show category buttons if no products
                    <div className="flex flex-wrap justify-center gap-4 md:gap-6">
                        <Link
                            to="/shop"
                            className="px-6 py-3 bg-blue-950 text-white rounded-lg font-medium hover:bg-blue-900 transition-colors duration-200 text-sm md:text-base"
                        >
                            {t('navbar.eyeglasses')}
                        </Link>
                        <Link
                            to="/shop"
                            className="px-6 py-3 bg-blue-950 text-white rounded-lg font-medium hover:bg-blue-900 transition-colors duration-200 text-sm md:text-base"
                        >
                            {t('navbar.sunglasses')}
                        </Link>
                    </div>
                )}
            </div>
        </section>
    )
}

export default ShopCategories

