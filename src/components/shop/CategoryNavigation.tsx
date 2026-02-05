import React from 'react'

interface CategoryNavigationProps {
    category: any | null
    subcategory: any | null
    subSubcategory: any | null
    onFilterChange?: (filters: {
        gender?: string
        minPrice?: number
        maxPrice?: number
        sortBy?: string
    }) => void
}

const CategoryNavigation: React.FC<CategoryNavigationProps> = () => {
    // Component disabled - no navigation buttons shown
    return null
}

export default CategoryNavigation
