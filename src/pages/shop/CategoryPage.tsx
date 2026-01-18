import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Navbar from '../../components/Navbar'
import { useCategoryTranslation } from '../../utils/categoryTranslations'
import { 
    getCategoryBySlug, 
    getSubcategoryBySlug, 
    getNestedSubcategoriesByParentId,
    type Category 
} from '../../services/categoriesService'
import CategoryBanner from '../../components/home/CategoryBanner'

const CategoryPage: React.FC = () => {
    const { t } = useTranslation()
    const { translateCategory } = useCategoryTranslation()
    const { categorySlug, subcategorySlug, subSubcategorySlug } = useParams<{ 
        categorySlug: string; 
        subcategorySlug?: string;
        subSubcategorySlug?: string;
    }>()
    const navigate = useNavigate()
    const [categoryInfo, setCategoryInfo] = useState<{ 
        category: Category | null; 
        subcategory: Category | null;
        subSubcategory: Category | null;
    }>({
        category: null,
        subcategory: null,
        subSubcategory: null
    })
    const [loading, setLoading] = useState(true)

    // Fetch category, subcategory, and sub-subcategory info
    useEffect(() => {
        let isCancelled = false

        const fetchCategoryInfo = async () => {
            if (!categorySlug) {
                navigate('/shop')
                return
            }

            let category: Category | null = null
            let subcategory: Category | null = null
            let subSubcategory: Category | null = null

            try {
                category = await getCategoryBySlug(categorySlug)
                if (isCancelled) return
                
                if (!category) {
                    navigate('/shop')
                    return
                }

                if (subcategorySlug) {
                    subcategory = await getSubcategoryBySlug(subcategorySlug, category.id)
                    if (isCancelled) return
                    
                    if (!subcategory) {
                        navigate(`/category/${categorySlug}`)
                        return
                    }

                    // If sub-subcategory slug is provided, fetch it
                    if (subSubcategorySlug) {
                        // Get all nested subcategories (sub-subcategories) for this subcategory
                        const nestedSubcategories = await getNestedSubcategoriesByParentId(subcategory.id)
                        if (!isCancelled) {
                            // Find the sub-subcategory by slug (case-insensitive comparison)
                            const subSubcategorySlugLower = (subSubcategorySlug || '').toLowerCase()
                            subSubcategory = nestedSubcategories.find(sub => 
                                sub.slug && sub.slug.toLowerCase() === subSubcategorySlugLower
                            ) || null
                            
                            if (!subSubcategory) {
                                console.warn(`⚠️ Sub-subcategory "${subSubcategorySlug}" not found under subcategory "${subcategory.name}"`)
                                navigate(`/category/${categorySlug}/${subcategorySlug}`)
                                return
                            }
                        }
                    }
                }

                if (!isCancelled) {
                    setCategoryInfo({ category, subcategory, subSubcategory })
                }
            } catch (error) {
                if (!isCancelled) {
                    console.error('Error fetching category info:', error)
                    navigate('/shop')
                }
            } finally {
                if (!isCancelled) {
                    setLoading(false)
                }
            }
        }

        fetchCategoryInfo()

        return () => {
            isCancelled = true
        }
    }, [categorySlug, subcategorySlug, subSubcategorySlug, navigate])

    if (loading) {
        return (
            <div className="bg-white min-h-screen">
                <Navbar />
                <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-950"></div>
                    <p className="mt-4 text-lg text-gray-600">Loading...</p>
                </div>
            </div>
        )
    }

    if (!categoryInfo.category) {
        return (
            <div className="bg-white min-h-screen">
                <Navbar />
                <div className="text-center py-12">
                    <p className="text-lg text-gray-600">Category not found</p>
                </div>
            </div>
        )
    }

    return (
        <div className="bg-white min-h-screen">
            <Navbar />

            {/* Category Banner - Dynamic banners from backend */}
            {categoryInfo.category && (
                <CategoryBanner 
                    categoryName={translateCategory(categoryInfo.category)}
                    categoryId={categoryInfo.category.id}
                    position={categoryInfo.subSubcategory ? "sub_subcategory_page" : categoryInfo.subcategory ? "subcategory_page" : "category_page"}
                />
            )}

            {/* Page Content */}
            <section className="bg-gray-50 py-8 md:py-10 lg:py-12 px-4 sm:px-6">
                <div className="w-[90%] mx-auto max-w-7xl">
                    {/* Subcategory/Sub-subcategory Info Banner */}
                    {(categoryInfo.subcategory || categoryInfo.subSubcategory) && (
                        <div className="mb-4 bg-white rounded-lg shadow-md py-2 px-3 border-l-2 border-blue-600">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                                <div>
                                    <p className="text-xs text-gray-600 mb-0.5">
                                        {categoryInfo.subSubcategory ? 'Viewing sub-subcategory:' : 'Viewing subcategory:'}
                                    </p>
                                    <h2 className="text-lg md:text-xl font-bold text-gray-900">
                                        {categoryInfo.subSubcategory 
                                            ? translateCategory(categoryInfo.subSubcategory)
                                            : translateCategory(categoryInfo.subcategory)}
                                    </h2>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    <div className="text-center py-12">
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                            {categoryInfo.subSubcategory 
                                ? translateCategory(categoryInfo.subSubcategory)
                                : categoryInfo.subcategory 
                                ? translateCategory(categoryInfo.subcategory)
                                : translateCategory(categoryInfo.category)}
                        </h1>
                        <p className="text-lg text-gray-600 mb-8">
                            {t('shop.discoverCollection', { 
                                name: categoryInfo.subSubcategory 
                                    ? translateCategory(categoryInfo.subSubcategory)
                                    : categoryInfo.subcategory 
                                    ? translateCategory(categoryInfo.subcategory)
                                    : translateCategory(categoryInfo.category) 
                            })}
                        </p>
                        <div className="max-w-md mx-auto">
                            <svg className="mx-auto h-24 w-24 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                            </svg>
                            <p className="text-lg text-gray-600 mb-2 font-semibold">
                                Products coming soon
                            </p>
                            <p className="text-sm text-gray-500 mb-6">
                                This category page is being updated with new products.
                            </p>
                            <button 
                                onClick={() => navigate('/shop')}
                                className="inline-block px-6 py-3 bg-blue-950 text-white rounded-lg hover:bg-blue-900 transition-colors"
                            >
                                Browse All Products
                            </button>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    )
}

export default CategoryPage
