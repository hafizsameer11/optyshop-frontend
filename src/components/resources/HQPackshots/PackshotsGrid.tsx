import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCategories, type Category, type CategoryProduct } from '../../../services/categoriesService'

interface PackshotItem {
    id: number
    title: string
    category: string
    categoryId: number
    description: string
    image: string
    price?: string
    slug?: string
}

const PackshotsGrid: React.FC = () => {
    const navigate = useNavigate()
    const [categories, setCategories] = useState<Category[]>([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<string | number>('all')

    // Fetch categories with products
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                setLoading(true)
                const data = await getCategories(true) // includeProducts = true
                setCategories(data)
                
                // Set default active tab to first category if available
                if (data.length > 0 && activeTab === 'all') {
                    // Keep 'all' as default
                }
            } catch (error) {
                console.error('Error fetching categories:', error)
                setCategories([])
            } finally {
                setLoading(false)
            }
        }

        fetchCategories()
    }, [])

    // Convert categories and products to packshot items
    const packshots: PackshotItem[] = categories.flatMap((category) => {
        if (!category.products || category.products.length === 0) {
            // If category has no products, create a placeholder item from the category itself
            return [{
                id: category.id,
                title: category.name,
                category: category.name.toLowerCase(),
                categoryId: category.id,
                description: category.description || '',
                image: category.image || '',
            }]
        }

        return category.products.map((product) => {
            // Parse images JSON string
            let imageUrl = ''
            try {
                const images = JSON.parse(product.images || '[]')
                imageUrl = Array.isArray(images) && images.length > 0 ? images[0] : ''
            } catch {
                imageUrl = product.images || ''
            }

            // Convert localhost URLs to relative paths
            if (imageUrl.includes('http://localhost:5000') || imageUrl.includes('http://127.0.0.1:5000')) {
                const url = new URL(imageUrl)
                imageUrl = url.pathname
            }

            return {
                id: product.id,
                title: product.name,
                category: category.name.toLowerCase(),
                categoryId: category.id,
                description: category.description || '',
                image: imageUrl,
                price: product.price,
                slug: product.slug,
            }
        })
    })

    // Filter packshots based on active tab
    const filteredPackshots = activeTab === 'all'
        ? packshots
        : packshots.filter(p => {
            if (typeof activeTab === 'number') {
                return p.categoryId === activeTab
            }
            // Fallback to category name matching
            return p.category === activeTab.toString().toLowerCase()
        })

    // Get category name for display
    const getCategoryName = (categoryId: number | string): string => {
        if (categoryId === 'all') return 'Show all'
        const category = categories.find(c => c.id === Number(categoryId))
        return category?.name || 'Unknown'
    }

    const handleDownload = (e: React.MouseEvent<HTMLAnchorElement>, slug?: string) => {
        e.preventDefault()
        if (slug) {
            navigate(`/shop/product/${slug}`)
        } else {
            navigate('/pricing-request')
        }
    }

    if (loading) {
        return (
            <section className="bg-white py-12 md:py-16 lg:py-20 px-4 sm:px-6">
                <div className="w-[90%] mx-auto max-w-7xl">
                    <div className="text-center py-12">
                        <div className="text-gray-400">Loading categories...</div>
                    </div>
                </div>
            </section>
        )
    }

    return (
        <section className="bg-white py-12 md:py-16 lg:py-20 px-4 sm:px-6">
            <div className="w-[90%] mx-auto max-w-7xl">
                {/* Tab Navigation */}
                <div className="flex flex-wrap items-center gap-4 md:gap-6 mb-8 md:mb-12 border-b border-gray-200 pb-4">
                    <button
                        onClick={() => setActiveTab('all')}
                        className={`px-4 py-2 text-sm md:text-base font-semibold transition-colors cursor-pointer ${activeTab === 'all'
                            ? 'text-blue-900 border-b-2 border-blue-900'
                            : 'text-gray-600 hover:text-blue-700'
                            }`}
                    >
                        Show all
                    </button>
                    {categories.map((category) => (
                        <button
                            key={category.id}
                            onClick={() => setActiveTab(category.id)}
                            className={`px-4 py-2 text-sm md:text-base font-semibold transition-colors cursor-pointer ${activeTab === category.id
                                ? 'text-blue-900 border-b-2 border-blue-900'
                                : 'text-gray-600 hover:text-blue-700'
                                }`}
                        >
                            {category.name}
                        </button>
                    ))}
                </div>

                {/* Product Grid */}
                {filteredPackshots.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-gray-500">No products found in this category.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                        {filteredPackshots.map((packshot) => (
                            <article
                                key={`${packshot.categoryId}-${packshot.id}`}
                                className="bg-white rounded-lg border-2 border-solid border-gray-300 p-6 hover:border-blue-500 transition-colors flex flex-col"
                            >
                                {/* Image */}
                                <div className="relative w-full h-48 md:h-56 mb-4 overflow-hidden rounded-lg bg-gray-100">
                                    {packshot.image ? (
                                        <img
                                            src={packshot.image}
                                            alt={packshot.title}
                                            className="w-full h-full object-contain"
                                            onError={(e) => {
                                                const target = e.target as HTMLImageElement
                                                target.style.display = 'none'
                                            }}
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                                            No image
                                        </div>
                                    )}
                                </div>

                                {/* Content */}
                                <div className="flex flex-col flex-grow">
                                    {/* Category Tag */}
                                    <span className="text-xs md:text-sm text-gray-600 font-semibold uppercase tracking-wide mb-2">
                                        {getCategoryName(packshot.categoryId)}
                                    </span>

                                    {/* Title */}
                                    <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-3 leading-tight">
                                        {packshot.title}
                                    </h3>

                                    {/* Description */}
                                    {packshot.description && (
                                        <p className="text-sm md:text-base text-gray-600 mb-4 flex-grow leading-relaxed">
                                            {packshot.description}
                                        </p>
                                    )}

                                    {/* Price */}
                                    {packshot.price && (
                                        <p className="text-lg font-semibold text-gray-900 mb-4">
                                            ${parseFloat(packshot.price).toFixed(2)}
                                        </p>
                                    )}

                                    {/* Download/View Link */}
                                    <a
                                        href={packshot.slug ? `/shop/product/${packshot.slug}` : '#'}
                                        onClick={(e) => handleDownload(e, packshot.slug)}
                                        className="text-blue-600 hover:text-blue-700 font-semibold text-sm md:text-base transition-colors inline-flex items-center gap-2 group cursor-pointer"
                                    >
                                        {packshot.slug ? 'View product' : 'Download now'}
                                        <svg
                                            className="w-4 h-4 group-hover:translate-x-1 transition-transform"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M9 5l7 7-7 7"
                                            />
                                        </svg>
                                    </a>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </div>
        </section>
    )
}

export default PackshotsGrid

