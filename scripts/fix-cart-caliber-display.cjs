const fs = require('fs');
const path = require('path');

function patch(abs, apply) {
  const raw = fs.readFileSync(abs, 'utf8');
  const hadCrlf = raw.includes('\r\n');
  let t = raw.replace(/\r\n/g, '\n');
  t = apply(t);
  fs.writeFileSync(abs, hadCrlf ? t.replace(/\n/g, '\r\n') : t);
  console.log('OK', abs);
}

const frontendRoot = path.join(__dirname, '..');
const backendCart = path.join(__dirname, '..', '..', 'optyshop-backend', 'controllers', 'cartController.js');

patch(path.join(frontendRoot, 'src/pages/shop/ProductDetail.tsx'), (t) => {
  const a = 'selected_mm_caliber: selectedCaliber?.toString() || undefined,';
  const a2 = 'selected_mm_caliber: selectedCaliber?.mm != null ? String(selectedCaliber.mm) : undefined,';
  if (!t.includes(a) && !t.includes(a2)) throw new Error('missing request caliber field');
  t = t.split(a).join(a2);

  const b = `                    ...(selectedCaliber && {
                        selected_mm_caliber: selectedCaliber.toString()
                    }),`;
  const b2 = `                    ...(selectedCaliber?.mm != null && {
                        selected_mm_caliber: String(selectedCaliber.mm)
                    }),`;
  if (!t.includes(b) && !t.includes(b2)) throw new Error('missing customization caliber');
  t = t.split(b).join(b2);

  t = t.split('selectedCaliber.toString()').join('String(selectedCaliber.mm)');
  t = t.split('selectedCaliber?.toString()').join('(selectedCaliber?.mm != null ? String(selectedCaliber.mm) : undefined)');
  return t;
});

patch(path.join(frontendRoot, 'src/pages/shop/Cart.tsx'), (t) => {
  if (!t.includes('function formatCartCaliberLabel')) {
    const markers = ['\nconst Cart', '\nfunction Cart', '\nexport default function Cart', '\nconst CartPage'];
    let idx = -1;
    for (const m of markers) {
      idx = t.indexOf(m);
      if (idx >= 0) break;
    }
    if (idx < 0) {
      // fallback: after last import
      const lastImport = t.lastIndexOf('\nimport ');
      const nl = t.indexOf('\n', lastImport + 1);
      idx = nl;
    }
    if (idx < 0) throw new Error('cannot insert helper');
    const helper = `

/** Normalize frame size / caliber for display (never render raw objects). */
function formatCartCaliberLabel(raw: unknown): string | null {
    if (raw == null || raw === '') return null
    if (typeof raw === 'number' || typeof raw === 'string' || typeof raw === 'boolean') {
        const s = String(raw).trim()
        if (!s || s === '[object Object]') return null
        return s.replace(/mm$/i, '').trim()
    }
    if (typeof raw === 'object') {
        const o = raw as Record<string, unknown>
        const mm = o.mm ?? o.value ?? o.size ?? o.caliber ?? o.label
        if (mm != null && (typeof mm === 'string' || typeof mm === 'number')) {
            return String(mm).replace(/mm$/i, '').trim()
        }
    }
    return null
}
`;
    t = t.slice(0, idx) + helper + t.slice(idx);
  }

  const oldBadge = `                                        {(item.customization as any)?.selected_mm_caliber && (
                                            <div className="absolute top-2 left-2 bg-blue-950 text-white text-xs px-2 py-1 rounded-full font-semibold">
                                                {(item.customization as any).selected_mm_caliber}mm
                                            </div>
                                        )}`;
  const newBadge = `                                        {formatCartCaliberLabel((item.customization as any)?.selected_mm_caliber) && (
                                            <div className="absolute top-2 left-2 bg-blue-950 text-white text-xs px-2 py-1 rounded-full font-semibold">
                                                {formatCartCaliberLabel((item.customization as any)?.selected_mm_caliber)}mm
                                            </div>
                                        )}`;
  if (t.includes(oldBadge)) t = t.split(oldBadge).join(newBadge);
  else if (!t.includes('formatCartCaliberLabel((item.customization as any)?.selected_mm_caliber) &&')) {
    throw new Error('badge block missing');
  }

  const oldSize = `                                            {(item.customization as any)?.selected_mm_caliber && (
                                                <p className="text-xs text-blue-950 font-medium mt-1">
                                                    Size: {(item.customization as any).selected_mm_caliber}mm
                                                </p>
                                            )}`;
  const newSize = `                                            {formatCartCaliberLabel((item.customization as any)?.selected_mm_caliber) && (
                                                <p className="text-xs text-blue-950 font-medium mt-1">
                                                    Size: {formatCartCaliberLabel((item.customization as any)?.selected_mm_caliber)}mm
                                                </p>
                                            )}`;
  if (t.includes(oldSize)) t = t.split(oldSize).join(newSize);
  else if (!t.includes('Size: {formatCartCaliberLabel')) {
    throw new Error('size text block missing');
  }

  return t;
});

if (fs.existsSync(backendCart)) {
  patch(backendCart, (t) => {
    const old = `  if (selected_mm_caliber) {
    // Parse mm_calibers to find matching caliber
    let mmCalibers = product.mm_calibers;`;
    const neu = `  // Coerce object calibers (e.g. { mm: 52 }) / "[object Object]" to plain mm
  let resolvedMmCaliber = selected_mm_caliber;
  if (resolvedMmCaliber && typeof resolvedMmCaliber === 'object') {
    resolvedMmCaliber = resolvedMmCaliber.mm ?? resolvedMmCaliber.value ?? resolvedMmCaliber.size ?? null;
  }
  if (typeof resolvedMmCaliber === 'string' && resolvedMmCaliber === '[object Object]') {
    resolvedMmCaliber = null;
  }

  if (resolvedMmCaliber) {
    // Parse mm_calibers to find matching caliber
    let mmCalibers = product.mm_calibers;`;
    if (!t.includes(old)) {
      if (t.includes('resolvedMmCaliber')) console.log('backend already');
      else throw new Error('backend caliber block missing');
    } else {
      t = t.replace(old, neu);
      // Use resolved value in the find/store within this block
      t = t.replace(
        `(caliber) => String(caliber.mm) === String(selected_mm_caliber)`,
        `(caliber) => String(caliber.mm) === String(resolvedMmCaliber)`
      );
      t = t.replace(
        `customizationData.selected_mm_caliber = selected_mm_caliber;`,
        `customizationData.selected_mm_caliber = String(resolvedMmCaliber);`
      );
      t = t.replace(
        `console.warn(\`MM caliber "\${selected_mm_caliber}" not found for product \${product_id}\`);`,
        `console.warn(\`MM caliber "\${resolvedMmCaliber}" not found for product \${product_id}\`);`
      );
    }
    return t;
  });
}
