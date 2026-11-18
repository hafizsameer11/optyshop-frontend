const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'src', 'pages', 'shop', 'ProductDetail.tsx');
const raw = fs.readFileSync(file, 'utf8');
const hadCrlf = raw.includes('\r\n');
let t = raw.replace(/\r\n/g, '\n');

const old1 = `                                                                    onClick={() => {
                                                                        setSelectedColor(colorValue)
                                                                        setSelectedImageIndex(0) // Reset to first image of selected color
                                                                        setIsManuallySelectingImage(false) // Reset manual selection flag

                                                                        // Update URL without page reload
                                                                        const url = new URL(window.location.href)
                                                                        url.searchParams.set('color', colorValue)
                                                                        window.history.pushState({}, '', url)
                                                                    }}`;

const new1 = `                                                                    onClick={() => {
                                                                        const already =
                                                                            selectedColor &&
                                                                            String(selectedColor).toLowerCase() === String(colorValue).toLowerCase()
                                                                        const next = already ? null : colorValue
                                                                        setSelectedColor(next)
                                                                        setSelectedImageIndex(0)
                                                                        setIsManuallySelectingImage(false)
                                                                        const url = new URL(window.location.href)
                                                                        if (next) url.searchParams.set('color', String(next))
                                                                        else url.searchParams.delete('color')
                                                                        window.history.pushState({}, '', url)
                                                                    }}`;

const old2 = `                                                                            onClick={(e) => {
                                                                                e.preventDefault()
                                                                                e.stopPropagation()
                                                                                const newColor = colorValue
                                                                                setSelectedColor(newColor)
                                                                                setSelectedImageIndex(0) // Reset to first image of selected color
                                                                                setIsManuallySelectingImage(false) // Reset manual selection flag

                                                                                // Update URL without page reload
                                                                                const url = new URL(window.location.href)
                                                                                url.searchParams.set('color', newColor)
                                                                                window.history.pushState({}, '', url)
                                                                            }}`;

const new2 = `                                                                            onClick={(e) => {
                                                                                e.preventDefault()
                                                                                e.stopPropagation()
                                                                                const already =
                                                                                    selectedColor &&
                                                                                    String(selectedColor).toLowerCase() === String(colorValue).toLowerCase()
                                                                                const next = already ? null : colorValue
                                                                                setSelectedColor(next)
                                                                                setSelectedImageIndex(0)
                                                                                setIsManuallySelectingImage(false)
                                                                                const url = new URL(window.location.href)
                                                                                if (next) url.searchParams.set('color', String(next))
                                                                                else url.searchParams.delete('color')
                                                                                window.history.pushState({}, '', url)
                                                                            }}`;

if (!t.includes(old1)) {
  console.error('MISSING click handler 1');
  process.exit(1);
}
if (!t.includes(old2)) {
  console.error('MISSING click handler 2');
  process.exit(1);
}
t = t.replace(old1, new1);
t = t.replace(old2, new2);
fs.writeFileSync(file, hadCrlf ? t.replace(/\n/g, '\r\n') : t);
console.log('OK color toggle both pickers');
