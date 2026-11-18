const fs = require('fs');
const path = require('path');

function patchFile(rel, apply) {
  const file = path.join(__dirname, '..', rel);
  const raw = fs.readFileSync(file, 'utf8');
  const hadCrlf = raw.includes('\r\n');
  let t = raw.replace(/\r\n/g, '\n');
  t = apply(t);
  fs.writeFileSync(file, hadCrlf ? t.replace(/\n/g, '\r\n') : t);
  console.log('OK', rel);
}

patchFile('src/context/CartContext.tsx', (t) => {
  const helper = `
/** Max qty allowed for a cart line (color stock wins over product stock). */
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
}
`;

  if (!t.includes('function getCartItemMaxQuantity')) {
    const marker = 'export interface CartItem extends CartProduct {\n    quantity: number\n}';
    if (!t.includes(marker)) throw new Error('missing CartItem interface');
    t = t.replace(marker, marker + '\n' + helper);
  }

  // Export via context? Keep internal; Cart can duplicate thin helper or we export from context.
  // Clamp updateQuantity for guest + auth optimistic paths
  const oldUpdateGuest = `        } else {
            // Use local storage for non-authenticated users
            setCartItems(prevItems =>
                prevItems.map(item =>
                    item.id === productId ? { ...item, quantity } : item
                )
            )
        }
    }

    const clearCart = async () => {`;

  const newUpdateGuest = `        } else {
            // Use local storage for non-authenticated users
            setCartItems(prevItems =>
                prevItems.map(item => {
                    if (item.id !== productId) return item
                    const max = getCartItemMaxQuantity(item)
                    const next = max != null ? Math.min(quantity, max) : quantity
                    if (max != null && quantity > max) {
                        alert(\`Disponibili solo \${max} pezzi.\`)
                    }
                    return { ...item, quantity: next }
                })
            )
        }
    }

    const clearCart = async () => {`;

  if (!t.includes(oldUpdateGuest)) {
    if (t.includes('getCartItemMaxQuantity(item)')) {
      console.log('CartContext guest clamp already');
    } else {
      throw new Error('missing updateQuantity guest block');
    }
  } else {
    t = t.replace(oldUpdateGuest, newUpdateGuest);
  }

  // Clamp authenticated update before API call
  const oldAuthUpdate = `        if (isAuthenticated) {
            try {
                setIsLoading(true)
                // Update in backend cart
                const result = await updateCartItem(productId, quantity)`;

  const newAuthUpdate = `        if (isAuthenticated) {
            try {
                setIsLoading(true)
                const current = cartItems.find(item => item.id === productId)
                const max = current ? getCartItemMaxQuantity(current) : null
                let nextQty = quantity
                if (max != null && nextQty > max) {
                    alert(\`Disponibili solo \${max} pezzi.\`)
                    nextQty = max
                }
                // Update in backend cart
                const result = await updateCartItem(productId, nextQty)`;

  if (!t.includes(oldAuthUpdate)) {
    if (t.includes('Disponibili solo') && t.includes('updateCartItem(productId, nextQty)')) {
      console.log('CartContext auth clamp already');
    } else {
      throw new Error('missing auth updateQuantity');
    }
  } else {
    t = t.replace(oldAuthUpdate, newAuthUpdate);
  }

  // Also clamp guest add-to-cart increments
  const oldGuestAdd = `        } else {
            // Use local storage for non-authenticated users
            setCartItems(prevItems => {
                const existingItem = prevItems.find(item => item.id === product.id)
                if (existingItem) {
                    return prevItems.map(item =>
                        item.id === product.id
                            ? { ...item, quantity: item.quantity + 1 }
                            : item
                    )
                }
                return [...prevItems, { ...product, quantity: 1 }]
            })
        }
    }`;

  const newGuestAdd = `        } else {
            // Use local storage for non-authenticated users
            setCartItems(prevItems => {
                const existingItem = prevItems.find(item => item.id === product.id)
                if (existingItem) {
                    const max = getCartItemMaxQuantity(existingItem)
                    if (max != null && existingItem.quantity >= max) {
                        alert(\`Disponibili solo \${max} pezzi.\`)
                        return prevItems
                    }
                    return prevItems.map(item =>
                        item.id === product.id
                            ? { ...item, quantity: item.quantity + 1 }
                            : item
                    )
                }
                const max = getCartItemMaxQuantity(product)
                const startQty = Math.max(1, Math.floor(Number(product.quantity) || 1))
                const qty = max != null ? Math.min(startQty, max) : startQty
                return [...prevItems, { ...product, quantity: qty }]
            })
        }
    }`;

  if (!t.includes(oldGuestAdd)) {
    if (t.includes('existingItem.quantity >= max')) {
      console.log('guest add clamp already');
    } else {
      throw new Error('missing guest add');
    }
  } else {
    t = t.replace(oldGuestAdd, newGuestAdd);
  }

  // Export helper for Cart page via attaching to window? Better: export function.
  if (!t.includes('export { getCartItemMaxQuantity }')) {
    t = t.replace(
      'export const useCart = () => {',
      'export { getCartItemMaxQuantity }\n\nexport const useCart = () => {'
    );
  }

  return t;
});

patchFile('src/pages/shop/Cart.tsx', (t) => {
  // import helper
  if (!t.includes('getCartItemMaxQuantity')) {
    if (t.includes("import { useCart } from '../../context/CartContext'")) {
      t = t.replace(
        "import { useCart } from '../../context/CartContext'",
        "import { useCart, getCartItemMaxQuantity } from '../../context/CartContext'"
      );
    } else if (t.includes('from \'../../context/CartContext\'')) {
      t = t.replace(
        /import \{([^}]+)\} from '\.\.\/\.\.\/context\/CartContext'/,
        (m, inner) => {
          if (inner.includes('getCartItemMaxQuantity')) return m;
          return `import {${inner}, getCartItemMaxQuantity } from '../../context/CartContext'`;
        }
      );
    } else {
      throw new Error('cannot find CartContext import in Cart.tsx');
    }
  }

  const oldBtn = `                                                    <button
                                                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                        className="px-3 py-2 hover:bg-gray-100 transition-colors"
                                                    >
                                                        +
                                                    </button>`;

  const newBtn = `                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const max = getCartItemMaxQuantity(item)
                                                            if (max != null && item.quantity >= max) {
                                                                alert(\`Disponibili solo \${max} pezzi.\`)
                                                                return
                                                            }
                                                            updateQuantity(item.id, item.quantity + 1)
                                                        }}
                                                        disabled={(() => {
                                                            const max = getCartItemMaxQuantity(item)
                                                            return max != null && item.quantity >= max
                                                        })()}
                                                        className="px-3 py-2 hover:bg-gray-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                                    >
                                                        +
                                                    </button>`;

  if (!t.includes(oldBtn)) {
    if (t.includes('getCartItemMaxQuantity(item)')) {
      console.log('Cart + button already patched');
    } else {
      throw new Error('missing + button');
    }
  } else {
    t = t.replace(oldBtn, newBtn);
  }

  return t;
});
