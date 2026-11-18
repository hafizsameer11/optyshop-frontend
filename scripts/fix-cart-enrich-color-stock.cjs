const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'src', 'context', 'CartContext.tsx');
const raw = fs.readFileSync(file, 'utf8');
const hadCrlf = raw.includes('\r\n');
let t = raw.replace(/\r\n/g, '\n');

const oldHelper = `/** Max qty allowed for a cart line (color stock wins over product stock). */
function getCartItemMaxQuantity(item: CartItem | CartProduct | any): number | null {
    const custom = item?.customization || null
    if (custom?.color_stock_quantity != null && custom.color_stock_quantity !== '') {
        const n = Number(custom.color_stock_quantity)
        if (!Number.isNaN(n)) return Math.max(0, Math.floor(n))
    }
    if (custom?.stock_quantity != null && custom.stock_quantity !== '') {
        const n = Number(custom.stock_quantity)
        if (!Number.isNaN(n)) return Math.max(0, Math.floor(n))
    }
    const productStock = (item as any)?.product?.stock_quantity ?? (item as any)?.stock_quantity
    if (productStock != null && productStock !== '') {
        const n = Number(productStock)
        if (!Number.isNaN(n)) return Math.max(0, Math.floor(n))
    }
    return null
}`;

const newHelper = `function normColorKey(v: unknown): string {
    const s = String(v ?? '').trim().toLowerCase()
    return s.startsWith('#') ? s.slice(1) : s
}

function resolveColorStockFromProduct(product: any, selectedColor: unknown): number | null {
    if (!product || selectedColor == null || String(selectedColor).trim() === '') return null
    let colorImages = product.color_images
    if (typeof colorImages === 'string') {
        try { colorImages = JSON.parse(colorImages) } catch { colorImages = [] }
    }
    if (!Array.isArray(colorImages)) colorImages = colorImages ? [colorImages] : []
    const selectedKey = normColorKey(selectedColor)
    const match = colorImages.find((c: any) => {
        const hex = c.hexCode || c.hex_code || null
        return (hex && normColorKey(hex) === selectedKey) ||
            (c.color && normColorKey(c.color) === selectedKey) ||
            (c.name && normColorKey(c.name) === selectedKey) ||
            (c.value && normColorKey(c.value) === selectedKey) ||
            (c.display_name && normColorKey(c.display_name) === selectedKey)
    })
    if (!match) return null
    if (match.stock_status === 'out_of_stock') return 0
    if (match.stock_quantity != null && match.stock_quantity !== '') {
        const n = Number(match.stock_quantity)
        if (!Number.isNaN(n)) return Math.max(0, Math.floor(n))
    }
    return null
}

/** Max qty allowed for a cart line (color stock wins over product stock). */
function getCartItemMaxQuantity(item: CartItem | CartProduct | any): number | null {
    const custom = item?.customization || null
    if (custom?.color_stock_quantity != null && custom.color_stock_quantity !== '') {
        const n = Number(custom.color_stock_quantity)
        if (!Number.isNaN(n)) return Math.max(0, Math.floor(n))
    }
    const fromColor = resolveColorStockFromProduct(
        (item as any)?.product,
        custom?.selected_color || custom?.hex_code || custom?.color_name
    )
    if (fromColor != null) return fromColor
    if (custom?.stock_quantity != null && custom.stock_quantity !== '') {
        const n = Number(custom.stock_quantity)
        if (!Number.isNaN(n)) return Math.max(0, Math.floor(n))
    }
    const productStock = (item as any)?.product?.stock_quantity ?? (item as any)?.stock_quantity
    if (productStock != null && productStock !== '') {
        const n = Number(productStock)
        if (!Number.isNaN(n)) return Math.max(0, Math.floor(n))
    }
    return null
}`;

if (!t.includes(oldHelper)) {
  if (t.includes('resolveColorStockFromProduct')) {
    console.log('enrich helper already');
  } else {
    console.error('MISSING helper to replace');
    process.exit(1);
  }
} else {
  t = t.replace(oldHelper, newHelper);
}

// Enrich customization.color_stock_quantity during sync
const oldMap = `                    return {
                    id: item.id,
                    name: item.is_gift ? \`FREE GIFT: \${item.gift_product?.name || item.product?.name}\` : (item.product?.name || 'Unknown Product'),
                    brand: variantSubtitle || (item.product as any)?.brand || '',
                    category: categorySlug,
                    product_type: productType || undefined,
                    price: item.unit_price,
                    image: item.display_image || item.product?.image || '',
                    description: (item.product as any)?.description || '',
                    inStock: true,
                    quantity: item.quantity,
                    isGift: item.is_gift,
                    gift_product: item.gift_product,
                    customization,`;

const newMap = `                    const enrichedCustomization = customization
                        ? { ...customization }
                        : null
                    if (enrichedCustomization && enrichedCustomization.color_stock_quantity == null) {
                        const resolved = resolveColorStockFromProduct(
                            item.product,
                            enrichedCustomization.selected_color || enrichedCustomization.hex_code || enrichedCustomization.color_name
                        )
                        if (resolved != null) enrichedCustomization.color_stock_quantity = resolved
                    }
                    const maxStock = getCartItemMaxQuantity({
                        customization: enrichedCustomization,
                        product: item.product,
                        stock_quantity: (item.product as any)?.stock_quantity,
                    } as any)
                    const safeQty = maxStock != null ? Math.min(Number(item.quantity) || 1, maxStock) : item.quantity

                    return {
                    id: item.id,
                    name: item.is_gift ? \`FREE GIFT: \${item.gift_product?.name || item.product?.name}\` : (item.product?.name || 'Unknown Product'),
                    brand: variantSubtitle || (item.product as any)?.brand || '',
                    category: categorySlug,
                    product_type: productType || undefined,
                    price: item.unit_price,
                    image: item.display_image || item.product?.image || '',
                    description: (item.product as any)?.description || '',
                    inStock: true,
                    quantity: safeQty,
                    isGift: item.is_gift,
                    gift_product: item.gift_product,
                    customization: enrichedCustomization,`;

if (!t.includes(oldMap)) {
  if (t.includes('enrichedCustomization')) {
    console.log('sync enrich already');
  } else {
    console.error('MISSING sync map');
    process.exit(1);
  }
} else {
  t = t.replace(oldMap, newMap);
}

fs.writeFileSync(file, hadCrlf ? t.replace(/\n/g, '\r\n') : t);
console.log('OK enrich color stock on sync');
