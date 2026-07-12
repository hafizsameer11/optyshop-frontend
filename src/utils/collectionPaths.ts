/** Shopify-style collection URLs (alias for category shop pages). */

export const COLLECTIONS_ALL_PATH = '/collections/all'

export function collectionCategoryPath(
  categorySlug: string,
  subcategorySlug?: string,
  subSubcategorySlug?: string
): string {
  if (subcategorySlug && subSubcategorySlug) {
    return `/collections/${categorySlug}/${subcategorySlug}/${subSubcategorySlug}`
  }
  if (subcategorySlug) {
    return `/collections/${categorySlug}/${subcategorySlug}`
  }
  return `/collections/${categorySlug}`
}

/** Match legacy `/category/...` and `/collections/...` routes. */
export function isCollectionListingPath(pathname: string): boolean {
  return pathname.startsWith('/collections') || pathname.startsWith('/category')
}

export function isCollectionsAllPath(pathname: string): boolean {
  return pathname === COLLECTIONS_ALL_PATH || pathname === '/shop'
}
