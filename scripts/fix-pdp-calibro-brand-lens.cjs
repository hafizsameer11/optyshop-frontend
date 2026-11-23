/**
 * PDP: three Calibro/Ponte/Asta selects under title + Brand/Lens Type in specs (docx layout).
 */
const fs = require('fs')
const path = require('path')

const file = path.join(__dirname, '..', 'src', 'pages', 'shop', 'ProductDetail.tsx')
let s = fs.readFileSync(file, 'utf8')

const stateMarker = `    const [selectedCaliber, setSelectedCaliber] = useState<MMCaliber | null>(null)`
const stateInsert = `    const [selectedCaliber, setSelectedCaliber] = useState<MMCaliber | null>(null)
    // Frame measurements (Calibro / Ponte / Asta) — from frameSizes + mm calibers
    const [selectedCalibro, setSelectedCalibro] = useState<string>('')
    const [selectedPonte, setSelectedPonte] = useState<string>('')
    const [selectedAsta, setSelectedAsta] = useState<string>('')`

if (!s.includes('selectedCalibro')) {
  if (!s.includes(stateMarker)) {
    console.error('state marker missing')
    process.exit(1)
  }
  s = s.replace(stateMarker, stateInsert)
  console.log('OK: state')
} else {
  console.log('SKIP: state')
}

const helperMarker = `    // Helper function to determine if calibers should be shown
    const shouldShowCalibers = useMemo(() => {`
const helperBlock = `    // Unique measurement options from frameSizes (+ mm calibers for calibro)
    const frameMeasurementOptions = useMemo(() => {
        const p = product as any
        const frames: any[] = Array.isArray(p?.frameSizes) ? p.frameSizes : []
        const uniq = (vals: Array<string | number | null | undefined>) =>
            Array.from(
                new Set(
                    vals
                        .map((v) => (v == null || v === '' ? '' : String(v).trim()))
                        .filter(Boolean)
                )
            ).sort((a, b) => {
                const na = Number(a)
                const nb = Number(b)
                if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb
                return a.localeCompare(b)
            })

        const calibroFromFrames = frames.map((f) => f.lens_width)
        const calibroFromMm = (productCalibers || [])
            .filter((c) => c.is_active !== false)
            .map((c) => c.mm)
        return {
            calibro: uniq([...calibroFromFrames, ...calibroFromMm]),
            ponte: uniq(frames.map((f) => f.bridge_width)),
            asta: uniq(frames.map((f) => f.temple_length)),
        }
    }, [product, productCalibers])

    const shouldShowFrameMeasurements = useMemo(() => {
        if (!product || isEyeHygiene || isContactLens) return false
        const p = product as any
        const productType = String(p.product_type || '').toLowerCase()
        if (productType === 'accessory') return false
        const frameTypes = ['sunglasses', 'eyeglasses', 'glasses', 'frames', 'eyewear', 'frame', 'prescription_glasses']
        const isFrame = frameTypes.includes(productType) || !!(p.frame_shape || p.frame_material)
        if (!isFrame) return false
        const o = frameMeasurementOptions
        return o.calibro.length > 0 || o.ponte.length > 0 || o.asta.length > 0
    }, [product, isEyeHygiene, isContactLens, frameMeasurementOptions])

    // Helper function to determine if calibers should be shown
    const shouldShowCalibers = useMemo(() => {`

if (!s.includes('shouldShowFrameMeasurements')) {
  if (!s.includes(helperMarker)) {
    console.error('helper marker missing')
    process.exit(1)
  }
  s = s.replace(helperMarker, helperBlock)
  console.log('OK: measurement helpers')
} else {
  console.log('SKIP: measurement helpers')
}

// Replace under-title single Frame size block with 3 selects
const oldTitleSize = `                                    {/* Frame size — compact, directly under model name */}
                                    {shouldShowCalibers && (
                                        <div className="mb-4">
                                            <label className="mb-1.5 block text-xs font-medium text-gray-500">
                                                {t('shop.frameSize', 'Frame size')}
                                            </label>
                                            <div className="relative max-w-xs">
                                                <select
                                                    value={selectedCaliber?.mm?.toString() || ''}
                                                    onChange={(e) => {
                                                        const mmValue = e.target.value
                                                        if (mmValue) {
                                                            handleCaliberChange(mmValue)
                                                        }
                                                    }}
                                                    className="w-full cursor-pointer appearance-none rounded-lg border border-gray-300 bg-white py-2 pl-3 pr-8 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                >
                                                    <option value="" disabled>
                                                        {t('shop.selectFrameSize', 'Select frame size...')}
                                                    </option>
                                                    {productCalibers
                                                        .filter((c) => c.is_active !== false)
                                                        .sort((a, b) => Number(a.mm) - Number(b.mm))
                                                        .map((caliber) => (
                                                            <option
                                                                key={caliber.mm}
                                                                value={caliber.mm.toString()}
                                                                disabled={
                                                                    caliber.stock_quantity != null &&
                                                                    Number(caliber.stock_quantity) <= 0
                                                                }
                                                            >
                                                                {caliber.mm}mm
                                                                {caliber.price ? \` (+€\${caliber.price})\` : ''}
                                                                {caliber.stock_quantity != null &&
                                                                Number(caliber.stock_quantity) <= 0
                                                                    ? \` — \${t('shop.outOfStock', 'Out of Stock')}\`
                                                                    : ''}
                                                            </option>
                                                        ))}
                                                </select>
                                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5">
                                                    <svg
                                                        className="h-4 w-4 text-gray-400"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M19 9l-7 7-7-7"
                                                        />
                                                    </svg>
                                                </div>
                                            </div>
                                        </div>
                                    )}`

const newTitleSize = `                                    {/* Calibro / Ponte / Asta — under model name (frame products) */}
                                    {shouldShowFrameMeasurements && (
                                        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                                            {frameMeasurementOptions.calibro.length > 0 && (
                                                <div>
                                                    <label className="mb-1.5 block text-xs font-medium text-gray-500">
                                                        {t('shop.filters.caliber', 'Calibro')}
                                                    </label>
                                                    <select
                                                        value={selectedCalibro}
                                                        onChange={(e) => {
                                                            const v = e.target.value
                                                            setSelectedCalibro(v)
                                                            if (v) handleCaliberChange(v)
                                                            else setSelectedCaliber(null)
                                                        }}
                                                        className="w-full cursor-pointer appearance-none rounded-lg border border-gray-300 bg-white py-2 pl-3 pr-8 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                    >
                                                        <option value="">
                                                            {t('shop.selectCaliber', 'Seleziona calibro')}
                                                        </option>
                                                        {frameMeasurementOptions.calibro.map((mm) => (
                                                            <option key={mm} value={mm}>
                                                                {mm} mm
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            )}
                                            {frameMeasurementOptions.ponte.length > 0 && (
                                                <div>
                                                    <label className="mb-1.5 block text-xs font-medium text-gray-500">
                                                        {t('shop.filters.bridge', 'Ponte')}
                                                    </label>
                                                    <select
                                                        value={selectedPonte}
                                                        onChange={(e) => setSelectedPonte(e.target.value)}
                                                        className="w-full cursor-pointer appearance-none rounded-lg border border-gray-300 bg-white py-2 pl-3 pr-8 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                    >
                                                        <option value="">
                                                            {t('shop.selectBridge', 'Seleziona ponte')}
                                                        </option>
                                                        {frameMeasurementOptions.ponte.map((mm) => (
                                                            <option key={mm} value={mm}>
                                                                {mm} mm
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            )}
                                            {frameMeasurementOptions.asta.length > 0 && (
                                                <div>
                                                    <label className="mb-1.5 block text-xs font-medium text-gray-500">
                                                        {t('shop.filters.temples', 'Asta')}
                                                    </label>
                                                    <select
                                                        value={selectedAsta}
                                                        onChange={(e) => setSelectedAsta(e.target.value)}
                                                        className="w-full cursor-pointer appearance-none rounded-lg border border-gray-300 bg-white py-2 pl-3 pr-8 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                    >
                                                        <option value="">
                                                            {t('shop.selectTemple', 'Seleziona asta')}
                                                        </option>
                                                        {frameMeasurementOptions.asta.map((mm) => (
                                                            <option key={mm} value={mm}>
                                                                {mm} mm
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            )}
                                        </div>
                                    )}`

if (s.includes('Calibro / Ponte / Asta — under model name')) {
  console.log('SKIP: title size UI already patched')
} else if (s.includes('Frame size — compact, directly under model name')) {
  // Match flexibly with regex
  const re = /\{\/\* Frame size — compact, directly under model name \*\/\}[\s\S]*?\{shouldShowCalibers && \([\s\S]*?<\/div>\s*\)}/
  if (!re.test(s)) {
    console.error('title size block regex failed')
    process.exit(1)
  }
  s = s.replace(re, newTitleSize)
  console.log('OK: title size UI')
} else {
  console.error('title size block not found')
  process.exit(1)
}

// Hide duplicate left-column caliber when frame measurements UI is shown
const leftCaliber = `{shouldShowCalibers && (`
const leftCaliberNew = `{shouldShowCalibers && !shouldShowFrameMeasurements && (`
if (s.includes('shouldShowCalibers && !shouldShowFrameMeasurements')) {
  console.log('SKIP: left caliber guard')
} else {
  // Only first occurrence after color swatches (gallery column) — replace both gallery and keep one for eye hygiene? 
  // There are multiple shouldShowCalibers - replace the MM Caliber Selection comment one
  if (s.includes('{/* MM Caliber Selection - Dropdown */}\n                                        {shouldShowCalibers && (')) {
    s = s.replace(
      '{/* MM Caliber Selection - Dropdown */}\n                                        {shouldShowCalibers && (',
      '{/* MM Caliber Selection - Dropdown */}\n                                        {shouldShowCalibers && !shouldShowFrameMeasurements && ('
    )
    console.log('OK: left caliber guard')
  } else if (s.includes(leftCaliber)) {
    // fallback: replace first only carefully
    console.log('WARN: left caliber comment pattern missing, trying first shouldShowCalibers in gallery')
  }
}

// Specs grid: put Brand + Lens Type first; remove static Calibro/Ponte/Asta (now selectors above)
const oldSpecsStart = `                                        <div className="mb-8 grid grid-cols-2 gap-y-4 gap-x-8 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                                            {product.frame_shape && (
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold text-gray-400 uppercase mb-1">Frame Shape</span>
                                                    <span className="text-gray-700 font-semibold capitalize">{product.frame_shape.replace('_', ' ')}</span>
                                                </div>
                                            )}
                                            {product.frame_material && (
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold text-gray-400 uppercase mb-1">Material</span>
                                                    <span className="text-gray-700 font-semibold capitalize">{product.frame_material}</span>
                                                </div>
                                            )}
                                            {product.gender && !isEyeHygiene && (
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold text-gray-400 uppercase mb-1">Gender</span>
                                                    <span className="text-gray-700 font-semibold capitalize">{product.gender}</span>
                                                </div>
                                            )}
                                            {productBrandEyebrow && (
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold text-gray-400 uppercase mb-1">Brand</span>
                                                    <span className="text-gray-700 font-semibold">{productBrandEyebrow}</span>
                                                </div>
                                            )}`

const newSpecsStart = `                                        <div className="mb-8 grid grid-cols-2 gap-y-4 gap-x-8 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                                            {productBrandEyebrow && (
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold text-gray-400 uppercase mb-1">{t('shop.brand', 'Marca')}</span>
                                                    <span className="text-gray-700 font-semibold">{productBrandEyebrow}</span>
                                                </div>
                                            )}
                                            {((product as any).lens_type || selectedLensType) && (
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold text-gray-400 uppercase mb-1">{t('shop.lensType', 'Tipo di lente')}</span>
                                                    <span className="text-gray-700 font-semibold capitalize">
                                                        {String((product as any).lens_type || selectedLensType).replace(/_/g, ' ')}
                                                    </span>
                                                </div>
                                            )}
                                            {product.frame_shape && (
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold text-gray-400 uppercase mb-1">{t('shop.frameShape', 'Forma della montatura')}</span>
                                                    <span className="text-gray-700 font-semibold capitalize">{product.frame_shape.replace('_', ' ')}</span>
                                                </div>
                                            )}
                                            {product.frame_material && (
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold text-gray-400 uppercase mb-1">{t('shop.material', 'Materiale')}</span>
                                                    <span className="text-gray-700 font-semibold capitalize">{product.frame_material}</span>
                                                </div>
                                            )}
                                            {product.gender && !isEyeHygiene && (
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold text-gray-400 uppercase mb-1">{t('shop.gender', 'Genere')}</span>
                                                    <span className="text-gray-700 font-semibold capitalize">{product.gender}</span>
                                                </div>
                                            )}`

if (s.includes("t('shop.brand', 'Marca')")) {
  console.log('SKIP: specs brand/lens already')
} else if (s.includes(oldSpecsStart)) {
  s = s.replace(oldSpecsStart, newSpecsStart)
  console.log('OK: specs brand/lens reorder')
} else {
  console.error('specs start block not found')
  process.exit(1)
}

// Remove duplicate Brand block that followed gender (already moved up)
const dupBrand = `                                            {productBrandEyebrow && (
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold text-gray-400 uppercase mb-1">Brand</span>
                                                    <span className="text-gray-700 font-semibold">{productBrandEyebrow}</span>
                                                </div>
                                            )}
`
if (s.includes(dupBrand)) {
  s = s.replace(dupBrand, '')
  console.log('OK: removed duplicate brand')
}

// Color label i18n
s = s.replace(
  `<span className="text-xs font-bold text-gray-400 uppercase mb-1">Color</span>
                                                        <span className="text-gray-700 font-semibold capitalize">{selectedProductColorLabel}</span>`,
  `<span className="text-xs font-bold text-gray-400 uppercase mb-1">{t('shop.color', 'Colore')}</span>
                                                        <span className="text-gray-700 font-semibold capitalize">{selectedProductColorLabel}</span>`
)

// Remove static Calibro/Ponte/Asta from specs (selectors are above)
const staticMeasures = `                                            {(() => {
                                                const p = product as any
                                                const frame = Array.isArray(p.frameSizes) && p.frameSizes.length > 0 ? p.frameSizes[0] : null
                                                const calibro = p.caliber ?? p.lens_width ?? frame?.lens_width ?? null
                                                return calibro != null && calibro !== '' ? (
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-bold text-gray-400 uppercase mb-1">Calibro</span>
                                                        <span className="text-gray-700 font-semibold">{calibro}</span>
                                                    </div>
                                                ) : null
                                            })()}
                                            {(() => {
                                                const p = product as any
                                                const frame = Array.isArray(p.frameSizes) && p.frameSizes.length > 0 ? p.frameSizes[0] : null
                                                const ponte = p.bridge ?? frame?.bridge_width ?? null
                                                return ponte != null && ponte !== '' ? (
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-bold text-gray-400 uppercase mb-1">Ponte</span>
                                                        <span className="text-gray-700 font-semibold">{ponte}</span>
                                                    </div>
                                                ) : null
                                            })()}
                                            {(() => {
                                                const p = product as any
                                                const frame = Array.isArray(p.frameSizes) && p.frameSizes.length > 0 ? p.frameSizes[0] : null
                                                const asta = p.temples ?? frame?.temple_length ?? null
                                                return asta != null && asta !== '' ? (
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-bold text-gray-400 uppercase mb-1">Asta</span>
                                                        <span className="text-gray-700 font-semibold">{asta}</span>
                                                    </div>
                                                ) : null
                                            })()}
`
if (s.includes('const calibro = p.caliber ?? p.lens_width ?? frame?.lens_width')) {
  s = s.replace(staticMeasures, '')
  console.log('OK: removed static calibro/ponte/asta from specs')
} else {
  console.log('SKIP: static measures already gone or pattern changed')
}

// Cart customization: pass selected measurements
const cartCaliber = `                    ...(selectedCaliber?.mm != null && {
                        selected_mm_caliber: String(selectedCaliber.mm)
                    }),`
const cartCaliberPlus = `                    ...(selectedCaliber?.mm != null && {
                        selected_mm_caliber: String(selectedCaliber.mm)
                    }),
                    ...(selectedCalibro && { lens_width: selectedCalibro, calibro: selectedCalibro }),
                    ...(selectedPonte && { bridge_width: selectedPonte, ponte: selectedPonte }),
                    ...(selectedAsta && { temple_length: selectedAsta, asta: selectedAsta }),`
if (s.includes('calibro: selectedCalibro')) {
  console.log('SKIP: cart customization')
} else if (s.includes(cartCaliber)) {
  s = s.replace(cartCaliber, cartCaliberPlus)
  console.log('OK: cart customization')
} else {
  console.warn('WARN: cart caliber block not found')
}

fs.writeFileSync(file, s)
console.log('Done:', file)
