import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getCategoriesWithSubcategories, type Category } from '../../services/categoriesService'
import { useTranslation } from 'react-i18next'

const ShopCategories: React.FC = () => {
    const { t } = useTranslation()
    const [categories, setCategories] = useState<Category[]>([])

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const fetchedCategories = await getCategoriesWithSubcategories()
                setCategories(fetchedCategories)
            } catch (error) {
                console.error('Error fetching categories:', error)
            }
        }
        fetchCategories()
    }, [])

    return (
        <section className="bg-white py-12 md:py-16 px-4 sm:px-6">
            <div className="w-[90%] mx-auto max-w-7xl">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 text-center">
                    Shop Categories
                </h2>
                <div className="flex flex-wrap justify-center gap-4 md:gap-6">
                    {categories.length > 0 ? (
                        categories.slice(0, 5).map((category) => (
                            <Link
                                key={category.id}
                                to={`/shop?category=${category.slug}`}
                                className="px-6 py-3 bg-blue-950 text-white rounded-lg font-medium hover:bg-blue-900 transition-colors duration-200 text-sm md:text-base"
                            >
                                {category.name}
                            </Link>
                        ))
                    ) : (
                        // Fallback categories
                        <>
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
                        </>
                    )}
                </div>
            </div>
        </section>
    )
}

export default ShopCategories

