/**
 * Search Service
 * Handles unified search across products, categories, subcategories, and sub-subcategories
 */

import { getProducts, type Product } from './productsService'
import { getCategories, getAllSubcategories, type Category } from './categoriesService'

export interface SearchResult {
  type: 'product' | 'category' | 'subcategory' | 'sub_subcategory' | 'message'
  id: number
  name: string
  slug: string
  url: string
  description?: string
  image?: string
  price?: string | number
  category?: {
    id: number
    name: string
    slug: string
  }
  parent?: {
    id: number
    name: string
    slug: string
  }
}

export interface SearchResponse {
  success: boolean
  message: string
  data: {
    results: SearchResult[]
    total: number
    products: number
    categories: number
    subcategories: number
    sub_subcategories: number
  }
}

/**
 * Unified search across the full product catalogue plus categories / subcategories.
 * Intentionally does NOT accept or apply category/page filters — results are always global.
 * @param query - Search query string
 * @param limit - Maximum number of results per type (default: 10)
 */
export const searchAll = async (
  query: string,
  limit: number = 10
): Promise<SearchResponse['data'] | null> => {
  if (!query || query.trim().length < 2) {
    return {
      results: [],
      total: 0,
      products: 0,
      categories: 0,
      subcategories: 0,
      sub_subcategories: 0
    }
  }

  try {
    const searchQuery = query.trim()
    const results: SearchResult[] = []

    // Search products across the entire catalogue (no category / subcategory / gender scope)
    try {
      const productsResponse = await getProducts({
        search: searchQuery,
        limit: limit,
        page: 1
        // Do not pass category, subcategory, gender, or section — keep results global
      })

      if (productsResponse && productsResponse.products) {
        productsResponse.products.forEach((product: Product) => {
          results.push({
            type: 'product',
            id: product.id,
            name: product.name,
            slug: product.slug,
            url: `/shop/product/${product.slug}`,
            description: product.short_description || product.description,
            image: product.image || (product.images && product.images[0]),
            price: product.sale_price && Number(product.sale_price) < Number(product.price)
              ? product.sale_price
              : product.price,
            category: product.category ? {
              id: product.category.id,
              name: product.category.name,
              slug: product.category.slug
            } : undefined
          })
        })
      }
    } catch (error) {
      console.error('Error searching products:', error)
    }

    // Search categories
    try {
      const categories = await getCategories({
        includeSubcategories: true
      })

      if (categories) {
        const matchingCategories = categories
          .filter((cat: Category) => 
            cat.is_active === true &&
            (cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
             cat.slug.toLowerCase().includes(searchQuery.toLowerCase()))
          )
          .slice(0, limit)

        matchingCategories.forEach((category: Category) => {
          results.push({
            type: 'category',
            id: category.id,
            name: category.name,
            slug: category.slug,
            url: `/category/${category.slug}`,
            description: category.description || undefined
          })
        })
      }
    } catch (error) {
      console.error('Error searching categories:', error)
    }

    // Search subcategories (including sub-subcategories)
    try {
      const allSubcategories = await getAllSubcategories({
        page: 1,
        limit: 100, // Get more to search through
        search: searchQuery
      })

      if (allSubcategories && allSubcategories.subcategories) {
        // Filter and process subcategories
        const matchingSubcategories = allSubcategories.subcategories
          .filter((sub: Category) => 
            sub.is_active === true &&
            (sub.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
             sub.slug.toLowerCase().includes(searchQuery.toLowerCase()))
          )
          .slice(0, limit)

        matchingSubcategories.forEach((subcategory: Category) => {
          // Determine if it's a subcategory or sub-subcategory
          const isSubSubcategory = subcategory.parent_id !== null && subcategory.parent_id !== undefined
          
          results.push({
            type: isSubSubcategory ? 'sub_subcategory' : 'subcategory',
            id: subcategory.id,
            name: subcategory.name,
            slug: subcategory.slug,
            url: subcategory.category && subcategory.parent
              ? `/category/${subcategory.category.slug}/${subcategory.parent.slug}/${subcategory.slug}`
              : subcategory.category
              ? `/category/${subcategory.category.slug}/${subcategory.slug}`
              : `/category/${subcategory.slug}`,
            description: subcategory.description || undefined,
            category: subcategory.category ? {
              id: subcategory.category.id,
              name: subcategory.category.name,
              slug: subcategory.category.slug
            } : undefined,
            parent: subcategory.parent ? {
              id: subcategory.parent.id,
              name: subcategory.parent.name,
              slug: subcategory.parent.slug
            } : undefined
          })

          // Also search through children (sub-subcategories) if they exist
          if (subcategory.children && subcategory.children.length > 0) {
            subcategory.children
              .filter((child: Category) => 
                child.is_active === true &&
                (child.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                 child.slug.toLowerCase().includes(searchQuery.toLowerCase()))
              )
              .slice(0, limit)
              .forEach((child: Category) => {
                results.push({
                  type: 'sub_subcategory',
                  id: child.id,
                  name: child.name,
                  slug: child.slug,
                  url: subcategory.category
                    ? `/category/${subcategory.category.slug}/${subcategory.slug}/${child.slug}`
                    : `/category/${child.slug}`,
                  description: child.description || undefined,
                  category: subcategory.category ? {
                    id: subcategory.category.id,
                    name: subcategory.category.name,
                    slug: subcategory.category.slug
                  } : undefined,
                  parent: {
                    id: subcategory.id,
                    name: subcategory.name,
                    slug: subcategory.slug
                  }
                })
              })
          }
        })
      }
    } catch (error) {
      console.error('Error searching subcategories:', error)
    }

    // Count results by type
    const products = results.filter(r => r.type === 'product').length
    const categories = results.filter(r => r.type === 'category').length
    const subcategories = results.filter(r => r.type === 'subcategory').length
    const sub_subcategories = results.filter(r => r.type === 'sub_subcategory').length

    return {
      results,
      total: results.length,
      products,
      categories,
      subcategories,
      sub_subcategories
    }
  } catch (error) {
    console.error('Error in unified search:', error)
    return null
  }
}

