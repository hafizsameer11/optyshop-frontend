import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useCategoryTranslation } from '../../utils/categoryTranslations'
import {
    getRelatedCategories,
    getRelatedCategoriesForSubcategory,
    getSubcategoriesByCategoryId,
    getNestedSubcategoriesByParentId,
    type Category
} from '../../services/categoriesService'

interface RelatedCategoriesProps {
    category: Category | null
    subcategory: Category | null
    subSubcategory: Category | null
}

const RelatedCategories: React.FC<RelatedCategoriesProps> = ({
    category,
    subcategory,
    subSubcategory
}) => {
    const { translateCategory } = useCategoryTranslation()
    const [relatedCategories, setRelatedCategories] = useState<Category[]>([])
    const [relatedSubcategories, setRelatedSubcategories] = useState<Category[]>([])
    const [siblingSubcategories, setSiblingSubcategories] = useState<Category[]>([])
    const [loading, setLoading] = useState(true)

    // Helper function to filter subcategories based on the current subcategory type
    const filterSubcategoriesByType = (subcategories: Category[], currentSubcategory: Category): Category[] => {
        if (!currentSubcategory || !subcategories || subcategories.length === 0) {
            return subcategories || []
        }

        const currentName = (currentSubcategory.name || '').toLowerCase()
        
        // Determine the type of the current subcategory
        const isSpherical = /spherical|sferiche|sferica/i.test(currentName)
        const isAstigmatism = /astigmatism|astigmatismo|toric|torica/i.test(currentName)
        const isColored = /colored|coloured|color|colour/i.test(currentName)
        
        // Filter subcategories based on the detected type
        return subcategories.filter(sub => {
            const subName = (sub.name || '').toLowerCase()
            
            if (isSpherical) {
                // For spherical pages, show ONLY spherical-related subcategories
                // Exclude anything that is clearly not spherical (replacement frequency, colors, astigmatism)
                const isReplacementFrequency = /daily|weekly|monthly|disposable|frequent/i.test(subName)
                const isColoredType = /colored|coloured|color|colour/i.test(subName)
                const isAstigmatismType = /astigmatism|astigmatismo|toric|torica/i.test(subName)
                
                // Include if it's spherical OR if it doesn't match any excluded categories
                return /spherical|sferiche|sferica/i.test(subName) || 
                       (!isReplacementFrequency && !isColoredType && !isAstigmatismType)
            } else if (isAstigmatism) {
                // For astigmatism pages, show only astigmatism-related subcategories
                return /astigmatism|astigmatismo|toric|torica/i.test(subName)
            } else if (isColored) {
                // For colored pages, show only colored-related subcategories
                return /colored|coloured|color|colour/i.test(subName)
            } else {
                // For other types, show all subcategories
                return true
            }
        })
    }

    useEffect(() => {
        const fetchRelatedData = async () => {
            setLoading(true)
            try {
                const promises: Promise<any>[] = []

                // Fetch related categories based on current level
                if (subSubcategory) {
                    // We're in a sub-subcategory page
                    // Get sibling sub-subcategories (filter by type)
                    if (subcategory?.id) {
                        promises.push(
                            getNestedSubcategoriesByParentId(subcategory.id)
                                .then(subcategories => {
                                    // Filter subcategories based on the current subcategory type
                                    const filteredSubcategories = filterSubcategoriesByType(subcategories, subSubcategory)
                                    const siblings = filteredSubcategories.filter(sub => sub.id !== subSubcategory.id)
                                    setSiblingSubcategories(siblings)
                                })
                        )
                    }

                    // Get related subcategories of the same parent category (filter by type)
                    if (category?.id) {
                        promises.push(
                            getSubcategoriesByCategoryId(category.id)
                                .then(subcategories => {
                                    // Filter subcategories based on the current subcategory type
                                    const filteredSubcategories = filterSubcategoriesByType(subcategories, subSubcategory)
                                    const related = filteredSubcategories.filter(sub => sub.id !== subcategory?.id)
                                    setRelatedSubcategories(related)
                                })
                        )
                    }
                } else if (subcategory) {
                    // We're in a subcategory page
                    // Get sibling subcategories (filter by type)
                    if (category?.id) {
                        promises.push(
                            getSubcategoriesByCategoryId(category.id)
                                .then(subcategories => {
                                    // Filter subcategories based on the current subcategory type
                                    const filteredSubcategories = filterSubcategoriesByType(subcategories, subcategory)
                                    const siblings = filteredSubcategories.filter(sub => sub.id !== subcategory.id)
                                    setSiblingSubcategories(siblings)
                                })
                        )
                    }

                    // Get nested subcategories of current subcategory (filter by type)
                    promises.push(
                        getNestedSubcategoriesByParentId(subcategory.id)
                            .then(nested => {
                                // Filter nested subcategories based on the current subcategory type
                                const filteredNested = filterSubcategoriesByType(nested, subcategory)
                                setRelatedSubcategories(filteredNested)
                            })
                    )

                    // Get related categories
                    promises.push(
                        getRelatedCategoriesForSubcategory(subcategory.id, true)
                            .then(response => {
                                if (response) {
                                    // Convert the simplified category objects to full Category objects
                                    const fullCategories: Category[] = response.relatedCategories.map(relatedCat => ({
                                        ...relatedCat,
                                        description: null,
                                        image: null,
                                        is_active: true,
                                        sort_order: 0,
                                        created_at: new Date().toISOString(),
                                        updated_at: new Date().toISOString()
                                    }))
                                    setRelatedCategories(fullCategories)
                                }
                            })
                    )
                } else if (category) {
                    // We're in a category page
                    // Get subcategories of this category
                    promises.push(
                        getSubcategoriesByCategoryId(category.id)
                            .then(subcategories => {
                                setRelatedSubcategories(subcategories)
                            })
                    )

                    // Get related categories
                    promises.push(
                        getRelatedCategories(category.id, 6, true)
                            .then(categories => {
                                setRelatedCategories(categories)
                            })
                    )
                }

                await Promise.all(promises)
            } catch (error) {
                console.error('Error fetching related categories:', error)
            } finally {
                setLoading(false)
            }
        }

        if (category || subcategory || subSubcategory) {
            fetchRelatedData()
        }
    }, [category, subcategory, subSubcategory])

    if (loading) {
        return (
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
                <div className="animate-pulse">
                    <div className="h-6 bg-gray-200 rounded mb-4"></div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="h-20 bg-gray-200 rounded-lg"></div>
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    const hasAnyRelatedContent = relatedCategories.length > 0 || 
                                relatedSubcategories.length > 0 || 
                                siblingSubcategories.length > 0

    if (!hasAnyRelatedContent) {
        return null
    }

    return (
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Related Pages</h3>
            
            {/* Related Categories */}
            {relatedCategories.length > 0 && (
                <div className="mb-6">
                    <h4 className="text-lg font-semibold text-gray-800 mb-3">Related Categories</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {relatedCategories.map((relatedCat) => (
                            <Link
                                key={relatedCat.id}
                                to={`/category/${relatedCat.slug}`}
                                className="block p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg hover:from-blue-100 hover:to-indigo-100 transition-all duration-200 hover:shadow-md group"
                            >
                                <div className="text-sm font-medium text-blue-900 group-hover:text-blue-700 text-center">
                                    {translateCategory(relatedCat)}
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* Related Subcategories */}
            {relatedSubcategories.length > 0 && (
                <div className="mb-6">
                    <h4 className="text-lg font-semibold text-gray-800 mb-3">
                        {subSubcategory ? 'Other Subcategories' : 
                         subcategory ? 'Nested Subcategories' : 
                         'Subcategories'}
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {relatedSubcategories.map((relatedSub) => (
                            <Link
                                key={relatedSub.id}
                                to={`/category/${category?.slug}/${relatedSub.slug}`}
                                className="block p-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg hover:from-green-100 hover:to-emerald-100 transition-all duration-200 hover:shadow-md group"
                            >
                                <div className="text-sm font-medium text-green-900 group-hover:text-green-700 text-center">
                                    {translateCategory(relatedSub)}
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* Sibling Subcategories */}
            {siblingSubcategories.length > 0 && (
                <div className="mb-6">
                    <h4 className="text-lg font-semibold text-gray-800 mb-3">
                        {subSubcategory ? 'Other Sub-subcategories' : 'Other Subcategories'}
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {siblingSubcategories.map((sibling) => (
                            <Link
                                key={sibling.id}
                                to={
                                    subSubcategory 
                                        ? `/category/${category?.slug}/${subcategory?.slug}/${sibling.slug}`
                                        : `/category/${category?.slug}/${sibling.slug}`
                                }
                                className="block p-3 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg hover:from-purple-100 hover:to-pink-100 transition-all duration-200 hover:shadow-md group"
                            >
                                <div className="text-sm font-medium text-purple-900 group-hover:text-purple-700 text-center">
                                    {translateCategory(sibling)}
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* Special handling for astigmatism */}
            {(subcategory?.slug?.includes('astigmatism') || subSubcategory?.slug?.includes('astigmatism')) && (
                <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <h4 className="text-lg font-semibold text-yellow-900 mb-2">Astigmatism Resources</h4>
                    <p className="text-sm text-yellow-800 mb-3">
                        Find specialized products and information for astigmatism correction.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Link
                            to="/category/contact-lenses/toric"
                            className="block p-3 bg-yellow-100 border border-yellow-300 rounded-lg hover:bg-yellow-200 transition-colors"
                        >
                            <div className="text-sm font-medium text-yellow-900 text-center">
                                Toric Contact Lenses
                            </div>
                        </Link>
                        <Link
                            to="/shop/product/astigmatism-lenses"
                            className="block p-3 bg-yellow-100 border border-yellow-300 rounded-lg hover:bg-yellow-200 transition-colors"
                        >
                            <div className="text-sm font-medium text-yellow-900 text-center">
                                Astigmatism Products
                            </div>
                        </Link>
                    </div>
                </div>
            )}
        </div>
    )
}

export default RelatedCategories
