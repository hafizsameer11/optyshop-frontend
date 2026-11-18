const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'src', 'pages', 'shop', 'ProductDetail.tsx');
const raw = fs.readFileSync(file, 'utf8');
const hadCrlf = raw.includes('\r\n');
let t = raw.replace(/\r\n/g, '\n');

const blocks = [
`                                                        {selectedColorVariant && (selectedColorVariant as any).stock_quantity != null && (
                                                            <span className={\`ml-2 text-xs font-medium \${Number((selectedColorVariant as any).stock_quantity) > 0 ? 'text-green-600' : 'text-red-600'}\`}>
                                                                {Number((selectedColorVariant as any).stock_quantity) > 0
                                                                    ? \`\${Number((selectedColorVariant as any).stock_quantity)} disponibili\`
                                                                    : t('shop.outOfStock', 'Esaurito')}
                                                            </span>
                                                        )}`,
`                                                                {selectedColorVariant && (selectedColorVariant as any).stock_quantity != null && (
                                                                    <span className={\`ml-2 text-xs font-medium \${Number((selectedColorVariant as any).stock_quantity) > 0 ? 'text-green-600' : 'text-red-600'}\`}>
                                                                        {Number((selectedColorVariant as any).stock_quantity) > 0
                                                                            ? \`\${Number((selectedColorVariant as any).stock_quantity)} disponibili\`
                                                                            : t('shop.outOfStock', 'Esaurito')}
                                                                    </span>
                                                                )}`,
`                                                                    {isSelected && color.stock_quantity != null && (
                                                                        <span className={\`text-[10px] font-medium \${Number(color.stock_quantity) > 0 ? 'text-green-600' : 'text-red-600'}\`}>
                                                                            {Number(color.stock_quantity) > 0 ? \`\${Number(color.stock_quantity)} pz\` : '0'}
                                                                        </span>
                                                                    )}`,
];

let removed = 0;
for (const b of blocks) {
  if (!t.includes(b)) {
    console.error('MISSING block:\n', b.slice(0, 80));
    process.exit(1);
  }
  t = t.split(b).join('');
  removed += 1;
}

fs.writeFileSync(file, hadCrlf ? t.replace(/\n/g, '\r\n') : t);
console.log('OK removed', removed, 'stock UI blocks; disponibili left:', (t.match(/disponibili/g) || []).length);
