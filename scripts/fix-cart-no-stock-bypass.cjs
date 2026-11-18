const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'src', 'context', 'CartContext.tsx');
const raw = fs.readFileSync(file, 'utf8');
const hadCrlf = raw.includes('\r\n');
let t = raw.replace(/\r\n/g, '\n');

const old = `            } catch (error) {
                console.error('Error adding item to backend cart:', error)
                // Fallback to local storage
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
            } finally {
                setIsLoading(false)
            }
        } else {
            // Use local storage for non-authenticated users
            setCartItems(prevItems => {
                const existingItem = prevItems.find(item => item.id === product.id)
                if (existingItem) {
                    const max = getCartItemMaxQuantity(existingItem)`;

const neu = `            } catch (error: any) {
                console.error('Error adding item to backend cart:', error)
                const msg = error?.message || 'Impossibile aggiungere al carrello'
                alert(msg)
                // Do not locally bump qty on API stock/auth failures
            } finally {
                setIsLoading(false)
            }
        } else {
            // Use local storage for non-authenticated users
            setCartItems(prevItems => {
                const existingItem = prevItems.find(item => item.id === product.id)
                if (existingItem) {
                    const max = getCartItemMaxQuantity(existingItem)`;

if (!t.includes(old)) {
  if (t.includes('Do not locally bump qty')) {
    console.log('already fixed add bypass');
  } else {
    console.error('MISSING add catch block');
    process.exit(1);
  }
} else {
  t = t.replace(old, neu);
}

const oldUpd = `            } catch (error) {
                console.error('Error updating cart item in backend:', error)
                // Fallback to local storage
                setCartItems(prevItems =>
                    prevItems.map(item =>
                        item.id === productId ? { ...item, quantity } : item
                    )
                )
            } finally {
                setIsLoading(false)
            }`;

const neuUpd = `            } catch (error: any) {
                console.error('Error updating cart item in backend:', error)
                const msg = error?.message || 'Impossibile aggiornare la quantità'
                alert(msg)
                await syncCart()
            } finally {
                setIsLoading(false)
            }`;

if (!t.includes(oldUpd)) {
  if (t.includes('Impossibile aggiornare la quantità')) {
    console.log('already fixed update bypass');
  } else {
    console.error('MISSING update catch');
    process.exit(1);
  }
} else {
  t = t.replace(oldUpd, neuUpd);
}

fs.writeFileSync(file, hadCrlf ? t.replace(/\n/g, '\r\n') : t);
console.log('OK no stock bypass');
