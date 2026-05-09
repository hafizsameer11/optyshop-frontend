import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getCategories, type Category, type CategoryProduct } from '../../services/categoriesService'
import type { Product } from '../../services/productsService'
import { useCategoryTranslation } from '../../utils/categoryTranslations'
import CategoryBanner from './CategoryBanner'
import ProductCard from '../products/ProductCard'

interface CategoryWithProducts extends Category {
    fetchedProducts?: CategoryProduct[]
}

/** One home “Shop categories” row: top-level category or a subcategory (e.g. Sunglasses) with its own banner API */
interface ShopCategorySection {
    rowKey: string
    /** Category/subcategory used for products, links, and labels */
    category: CategoryWithProducts
    /** When set, this row is a subcategory — banner uses parent id + sub id */
    parentCategory: Category | null
}

const ShopCategories: React.FC = () => {
    const { t } = useTranslation()
    const { menuCategoryLabel } = useCategoryTranslation()
    const [categorySections, setCategorySections] = useState<ShopCategorySection[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let isCancelled = false

        const fetchCategoriesAndProducts = async () => {
            try {
                setLoading(true)
                // Subcategories included so rows like "Sunglasses" get correct banner (subcategory page_type + ids)
                const fetchedCategories = await getCategories({
                    includeProducts: true,
                    includeSubcategories: true,
                })

                if (isCancelled) return

                const sortedTop = [...fetchedCategories].sort(
                    (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
                )

                const sections: ShopCategorySection[] = []

                for (const cat of sortedTop) {
                    const subs = [...(cat.subcategories || [])]
                        .filter((s) => s.is_active !== false)
                        .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
                    const subsWithProducts = subs.filter((s) => (s.products?.length ?? 0) > 0)

                    if ((cat.products?.length ?? 0) > 0) {
                        const categoryProducts = cat.products || []
                        sections.push({
                            rowKey: `cat-${cat.id}`,
                            category: {
                                ...cat,
                                fetchedProducts: categoryProducts,
                                products: categoryProducts,
                            },
                            parentCategory: null,
                        })
                    }

                    for (const sub of subsWithProducts) {
                        const subProducts = sub.products || []
                        sections.push({
                            rowKey: `sub-${cat.id}-${sub.id}`,
                            category: {
                                ...sub,
                                fetchedProducts: subProducts,
                                products: subProducts,
                            },
                            parentCategory: cat,
                        })
                    }
                }

                if (isCancelled) return

                const withProducts = sections.filter(
                    (s) =>
                        (s.category.products && s.category.products.length > 0) ||
                        (s.category.fetchedProducts && s.category.fetchedProducts.length > 0)
                )

                // Cap rows (each row still loads its own banner); was 6 top-level only — hid Sunglasses when ordered late or as sub
                setCategorySections(withProducts.slice(0, 24))
            } catch (error) {
                if (!isCancelled) {
                    console.error('Error fetching categories:', error)
                }
            } finally {
                if (!isCancelled) {
                    setLoading(false)
                }
            }
        }

        fetchCategoriesAndProducts()

        return () => {
            isCancelled = true
        }
    }, [])

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
                {categorySections.length > 0 ? (
                    <div className="space-y-16">
                        {categorySections.map((section) => {
                            const category = section.category
                            const parent = section.parentCategory
                            const categoryPath = parent
                                ? `/category/${parent.slug}/${category.slug}`
                                : `/category/${category.slug}`
                            const productsToShow =
                                category.products && category.products.length > 0
                                    ? category.products
                                    : category.fetchedProducts || []

                            return (
                                <div key={section.rowKey} className="category-section">
                                    <CategoryBanner
                                        categoryName={menuCategoryLabel(category)}
                                        categoryId={parent ? parent.id : category.id}
                                        subcategoryId={parent ? category.id : undefined}
                                        position={parent ? 'subcategory_page' : 'category_section'}
                                    />
                                    <div className="mb-6 mt-2 flex flex-wrap items-center justify-between gap-3">
                                        <h2 className="min-w-0 text-lg font-semibold tracking-tight text-gray-900 md:text-xl">
                                            {menuCategoryLabel(category)}
                                        </h2>
                                        <Link
                                            to={categoryPath}
                                            className="inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-blue-600 transition-colors hover:text-blue-800 md:text-base"
                                        >
                                            {t('navbar.viewAll')}
                                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </Link>
                                    </div>

                                    {productsToShow.length === 0 ? (
                                        <p className="text-gray-500 text-center py-8">
                                            No products available in this category
                                        </p>
                                    ) : (
                                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4 lg:gap-5 xl:grid-cols-5 xl:gap-4">
                                            {productsToShow.map((product) => (
                                                <ProductCard
                                                    key={product.id}
                                                    product={product as unknown as Product}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )
                        })}
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
