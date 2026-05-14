/**
 * Human-readable labels for contact-lens tint hexes when API omits display_name / name.
 * Keep in sync with admin `PRESET_VARIANT_COLORS` / hex map where possible.
 */
const HEX_TO_LABEL: Record<string, string> = {
    '#000000': 'Black',
    '#FFFFFF': 'White',
    '#8B4513': 'Brown',
    '#4A3728': 'Brown',
    '#0000FF': 'Blue',
    '#1E3A5F': 'Blue',
    '#FF0000': 'Red',
    '#008000': 'Green',
    '#2D5016': 'Green',
    '#808080': 'Gray',
    '#708090': 'Gray',
    '#FFD700': 'Gold',
    '#C0C0C0': 'Silver',
    '#000080': 'Navy',
    '#800020': 'Burgundy',
    '#5C4033': 'Hazel',
    '#C9A961': 'Honey',
    '#8B4789': 'Amethyst',
    '#2F4F4F': 'Sterling Gray',
    '#1B4D3E': 'Gemstone Green',
    '#4A6741': 'Pure Hazel',
    '#1E3A8A': 'Brilliant Blue',
    '#0F172A': 'True Sapphire',
    '#7C2D12': 'Brown',
    '#B45309': 'Honey',
    '#1E40AF': 'Brilliant Blue',
    '#831843': 'Vivid Plum',
    '#0D9488': 'Sea Green',
    '#A16207': 'Amber',
    '#E11D48': 'Rose',
    '#4C1D95': 'Violet',
}

export function normalizeHexKey(raw: string | null | undefined): string | null {
    if (!raw || typeof raw !== 'string') return null
    const t = raw.trim()
    if (/^#([A-Fa-f0-9]{6})$/.test(t)) return t.toUpperCase()
    if (/^[A-Fa-f0-9]{6}$/.test(t)) return `#${t}`.toUpperCase()
    return null
}

export function isLikelyHexColorToken(s: string): boolean {
    return normalizeHexKey(s) !== null
}

/** Prefer API label; if missing or looks like raw hex, map known hexes to a friendly name. */
export function contactLensColorDisplayLabel(
    apiLabel: string | null | undefined,
    hexFallback: string | null | undefined
): string {
    const label = (apiLabel ?? '').trim()
    const H = normalizeHexKey(hexFallback || (isLikelyHexColorToken(label) ? label : ''))
    if (label && !isLikelyHexColorToken(label)) return label
    if (H && HEX_TO_LABEL[H]) return HEX_TO_LABEL[H]
    if (label) return label
    if (H) return HEX_TO_LABEL[H] || H
    return 'Color'
}
