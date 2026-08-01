/**
 * Shared stock / availability helpers for the storefront.
 * Rule: quantity 0 or stock_status "out_of_stock" means not purchasable.
 * Products still remain visible on the site.
 */

export type StockLike = {
  stock_quantity?: number | null
  stock_status?: string | null
  in_stock?: boolean | null
}

/** True when this SKU/row must not be sold. */
export function isOutOfStock(item?: StockLike | null): boolean {
  if (!item) return false

  if (item.stock_status === 'out_of_stock') return true

  if (item.stock_quantity !== undefined && item.stock_quantity !== null) {
    const qty = Number(item.stock_quantity)
    if (!Number.isNaN(qty) && qty <= 0) return true
  }

  if (item.in_stock === false) return true

  return false
}

/** True when stock allows at least one unit to be sold. */
export function isInStock(item?: StockLike | null): boolean {
  return !isOutOfStock(item)
}
