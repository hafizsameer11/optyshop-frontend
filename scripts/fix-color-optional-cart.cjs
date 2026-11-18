const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'src', 'pages', 'shop', 'ProductDetail.tsx');
const raw = fs.readFileSync(file, 'utf8');
const hadCrlf = raw.includes('\r\n');
let t = raw.replace(/\r\n/g, '\n');

const old = `        if (hasColorVariants && !isContactLens && !isEyeHygiene && !isAccessory) {
            if (!selectedColor) {
                alert(t('shop.selectColorFirst', 'Seleziona un colore prima di aggiungere al carrello.'))
                return
            }
            const colorStock = (selectedColorVariant as any)?.stock_quantity
            if (colorStock != null && Number(colorStock) <= 0) {
                alert(t('shop.colorOutOfStock', 'Il colore selezionato è esaurito.'))
                return
            }
            if ((selectedColorVariant as any)?.stock_status === 'out_of_stock') {
                alert(t('shop.colorOutOfStock', 'Il colore selezionato è esaurito.'))
                return
            }
            const qtyWanted = Math.max(1, Math.floor(Number(quantity) || 1))
            if (colorStock != null && qtyWanted > Number(colorStock)) {
                alert(
                    t('shop.colorStockLimit', 'Disponibili solo {{count}} pezzi per questo colore.', {
                        count: Number(colorStock),
                    })
                )
                return
            }
        }`;

const neu = `        // Color is optional (click again to clear). When selected, enforce that colour's stock.
        if (hasColorVariants && selectedColor && !isContactLens && !isEyeHygiene && !isAccessory) {
            const colorStock = (selectedColorVariant as any)?.stock_quantity
            if (colorStock != null && Number(colorStock) <= 0) {
                alert(t('shop.colorOutOfStock', 'Il colore selezionato è esaurito.'))
                return
            }
            if ((selectedColorVariant as any)?.stock_status === 'out_of_stock') {
                alert(t('shop.colorOutOfStock', 'Il colore selezionato è esaurito.'))
                return
            }
            const qtyWanted = Math.max(1, Math.floor(Number(quantity) || 1))
            if (colorStock != null && qtyWanted > Number(colorStock)) {
                alert(
                    t('shop.colorStockLimit', 'Disponibili solo {{count}} pezzi per questo colore.', {
                        count: Number(colorStock),
                    })
                )
                return
            }
        }`;

if (!t.includes(old)) {
  console.error('MISSING color cart require block');
  process.exit(1);
}
t = t.replace(old, neu);
fs.writeFileSync(file, hadCrlf ? t.replace(/\n/g, '\r\n') : t);
console.log('OK color optional for cart');
