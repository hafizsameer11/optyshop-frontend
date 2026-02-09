import React from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { Category } from '../../services/categoriesService'

interface CategoryNavigationProps {
    category: Category | null
    subcategory: Category | null
    subSubcategory: Category | null
    onFilterChange?: (filters: {
        gender?: string
        minPrice?: number
        maxPrice?: number
        sortBy?: string
    }) => void
}

const CategoryNavigation: React.FC<CategoryNavigationProps> = ({ 
    category, 
    subcategory, 
    subSubcategory
}) => {
    const { t } = useTranslation()

    const generateBreadcrumbPath = () => {
        const path = []
        
        if (category) {
            path.push({
                name: category.name,
                slug: category.slug,
                url: `/category/${category.slug}`
            })
        }
        
        if (subcategory) {
            path.push({
                name: subcategory.name,
                slug: subcategory.slug,
                url: `/category/${category?.slug}/${subcategory.slug}`
            })
        }
        
        if (subSubcategory) {
            path.push({
                name: subSubcategory.name,
                slug: subSubcategory.slug,
                url: `/category/${category?.slug}/${subcategory?.slug}/${subSubcategory.slug}`
            })
        }
        
        return path
    }

    const breadcrumbPath = generateBreadcrumbPath()

    return (
        <div className="bg-white border-b border-gray-200">
            <div className="max-w-screen-2xl mx-auto px-4 py-3">
                {/* Breadcrumbs */}
                <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-3">
                    <Link 
                        to="/shop" 
                        className="hover:text-blue-600 transition-colors"
                    >
                        {t('shop.home', 'Shop')}
                    </Link>
                    
                    {breadcrumbPath.map((item, index) => (
                        <React.Fragment key={item.url}>
                            <span className="text-gray-400">/</span>
                            {index === breadcrumbPath.length - 1 ? (
                                <span className="text-gray-900 font-medium">
                                    {item.name}
                                </span>
                            ) : (
                                <Link 
                                    to={item.url}
                                    className="hover:text-blue-600 transition-colors"
                                >
                                    {item.name}
                                </Link>
                            )}
                        </React.Fragment>
                    ))}
                </nav>

                {/* Subcategory Navigation */}
                {category && !subcategory && category.subcategories && category.subcategories.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        <span className="text-sm font-medium text-gray-700 self-center">
                            {t('shop.browseBy', 'Browse by')}:
                        </span>
                        {category.subcategories.map((sub) => (
                            <Link
                                key={sub.id}
                                to={`/category/${category.slug}/${sub.slug}`}
                                className="px-3 py-1 bg-gray-100 hover:bg-blue-100 hover:text-blue-700 rounded-full text-sm font-medium text-gray-700 transition-colors"
                            >
                                {sub.name}
                                {sub.children && sub.children.length > 0 && (
                                    <span className="ml-1 text-xs text-gray-500">
                                        ({sub.children.length})
                                    </span>
                                )}
                            </Link>
                        ))}
                    </div>
                )}

                {/* Sub-subcategory Navigation */}
                {subcategory && !subSubcategory && subcategory.children && subcategory.children.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        <span className="text-sm font-medium text-gray-700 self-center">
                            {t('shop.refineBy', 'Refine by')}:
                        </span>
                        {subcategory.children.map((subSub) => (
                            <Link
                                key={subSub.id}
                                to={`/category/${category?.slug}/${subcategory.slug}/${subSub.slug}`}
                                className="px-3 py-1 bg-gray-100 hover:bg-blue-100 hover:text-blue-700 rounded-full text-sm font-medium text-gray-700 transition-colors"
                            >
                                {subSub.name}
                            </Link>
                        ))}
                    </div>
                )}

                {/* Current level info */}
                {subSubcategory && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-blue-800">
                                    {t('shop.currentlyBrowsing', 'Currently browsing')}: <span className="font-semibold">{subSubcategory.name}</span>
                                </p>
                                <p className="text-xs text-blue-600 mt-1">
                                    {t('shop.categoryPath', 'Path')}: {category?.name} → {subcategory?.name} → {subSubcategory.name}
                                </p>
                            </div>
                            <Link
                                to={`/category/${category?.slug}/${subcategory?.slug}`}
                                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                            >
                                {t('shop.backTo', 'Back to')} {subcategory?.name}
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default CategoryNavigation
