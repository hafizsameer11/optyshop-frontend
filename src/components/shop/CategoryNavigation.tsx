import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useCategoryTranslation } from '../../utils/categoryTranslations'
import {
    getSubcategoriesByCategoryId,
    getNestedSubcategoriesByParentId,
    type Category
} from '../../services/categoriesService'
import QuickFilters from './QuickFilters'
import QuickActionButtons from './QuickActionButtons'

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
    subSubcategory,
    onFilterChange
}) => {
    const { translateCategory } = useCategoryTranslation()
    const [subcategories, setSubcategories] = useState<Category[]>([])
    const [subSubcategories, setSubSubcategories] = useState<Category[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true)
            try {
                if (category && !subcategory && !subSubcategory) {
                    // Category page: fetch subcategories
                    const categorySubcategories = await getSubcategoriesByCategoryId(category.id)
                    setSubcategories(categorySubcategories || [])
                } else if (subcategory && !subSubcategory) {
                    // Subcategory page: fetch sub-subcategories
                    const nestedSubcategories = await getNestedSubcategoriesByParentId(subcategory.id)
                    setSubSubcategories(nestedSubcategories || [])
                } else if (subSubcategory && subcategory) {
                    // Sub-subcategory page: fetch sibling sub-subcategories
                    const siblingSubcategories = await getNestedSubcategoriesByParentId(subcategory.id)
                    setSubSubcategories(siblingSubcategories?.filter(sub => sub.id !== subSubcategory.id) || [])
                }
            } catch (error) {
                console.error('Error fetching navigation data:', error)
            } finally {
                setLoading(false)
            }
        }

        if (category) {
            fetchData()
        }
    }, [category, subcategory, subSubcategory])

    if (loading) {
        return (
            <div className="flex justify-center py-4 mb-6">
                <div className="flex gap-2">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-8 w-24 bg-gray-200 rounded-full animate-pulse"></div>
                    ))}
                </div>
            </div>
        )
    }

    // Determine what to show based on current page level
    const isCategoryPage = category && !subcategory && !subSubcategory
    const isSubcategoryPage = category && subcategory && !subSubcategory
    const isSubSubcategoryPage = category && subcategory && subSubcategory

    const hasNavigationItems = isCategoryPage 
        ? subcategories.length > 0 
        : isSubcategoryPage 
            ? subSubcategories.length > 0
            : isSubSubcategoryPage
                ? subSubcategories.length > 0
                : false

    if (!hasNavigationItems) {
        return null
    }

    return (
        <div className="py-2 mb-2">
            <div className="max-w-7xl mx-auto px-2 sm:px-4">
                {/* Single Filter Section */}
                <div className="mb-2">
                    <QuickFilters onFilterChange={onFilterChange || (() => {})} />
                </div>

                {/* Quick Action Buttons */}
                <div className="mb-2">
                    <QuickActionButtons 
                        onClearFilters={() => {
                            // Clear filters by calling onFilterChange with empty values
                            if (onFilterChange) {
                                onFilterChange({
                                    gender: '',
                                    minPrice: undefined,
                                    maxPrice: undefined,
                                    sortBy: 'newest'
                                })
                            }
                        }}
                    />
                </div>

                {/* Center Navigation Buttons */}
                <div className="flex justify-center">
                    <div className="flex flex-wrap justify-center gap-2 max-w-full overflow-x-hidden">
                        {/* Category Page: Show subcategories */}
                        {isCategoryPage && subcategories.map((sub) => (
                            <Link
                                key={`sub-${sub.id}`}
                                to={`/category/${category?.slug}/${sub.slug}`}
                                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-medium rounded-full hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105"
                            >
                                {translateCategory(sub)}
                            </Link>
                        ))}

                        {/* Subcategory Page: Show category button and sub-subcategories */}
                        {isSubcategoryPage && (
                            <>
                                {/* Category button */}
                                <Link
                                    to={`/category/${category?.slug}`}
                                    className="px-4 py-2 bg-gradient-to-r from-gray-500 to-gray-600 text-white text-sm font-medium rounded-full hover:from-gray-600 hover:to-gray-700 transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105"
                                >
                                    {translateCategory(category)}
                                </Link>
                                
                                {/* Sub-subcategory buttons */}
                                {subSubcategories.map((subSub) => (
                                    <Link
                                        key={`subsub-${subSub.id}`}
                                        to={`/category/${category?.slug}/${subcategory?.slug}/${subSub.slug}`}
                                        className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white text-sm font-medium rounded-full hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105"
                                    >
                                        {translateCategory(subSub)}
                                    </Link>
                                ))}
                            </>
                        )}

                        {/* Sub-subcategory Page: Show category button and sibling sub-subcategories */}
                        {isSubSubcategoryPage && (
                            <>
                                {/* Category button */}
                                <Link
                                    to={`/category/${category?.slug}`}
                                    className="px-4 py-2 bg-gradient-to-r from-gray-500 to-gray-600 text-white text-sm font-medium rounded-full hover:from-gray-600 hover:to-gray-700 transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105"
                                >
                                    {translateCategory(category)}
                                </Link>
                                
                                {/* Sibling sub-subcategory buttons */}
                                {subSubcategories.map((sibling) => (
                                    <Link
                                        key={`sibling-${sibling.id}`}
                                        to={`/category/${category?.slug}/${subcategory?.slug}/${sibling.slug}`}
                                        className="px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white text-sm font-medium rounded-full hover:from-purple-600 hover:to-purple-700 transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105"
                                    >
                                        {translateCategory(sibling)}
                                    </Link>
                                ))}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default CategoryNavigation
