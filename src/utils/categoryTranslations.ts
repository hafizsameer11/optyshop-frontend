import { useTranslation } from 'react-i18next'

/**
 * Maps category slugs to translation keys
 * This allows dynamic categories from the API to be translated
 */
const categorySlugToTranslationKey: Record<string, string> = {
  'eye-glasses': 'navbar.eyeglasses',
  'eyeglasses': 'navbar.eyeglasses',
  'sun-glasses': 'navbar.sunglasses',
  'sunglasses': 'navbar.sunglasses',
  'contact-lenses': 'navbar.contactLenses',
  'eye-hygiene': 'navbar.eyeHygiene',
  'opty-kids': 'navbar.optyKids',
  'optykids': 'navbar.optyKids',
  'opty_kids': 'navbar.optyKids',
  'optykids-kids': 'navbar.optyKids',
  'optikids': 'navbar.optyKids',
}

/**
 * Common subcategory slug mappings - these are known subcategory slugs that should map to translation keys
 * This helps when subcategory slugs match known patterns
 */
const subcategorySlugToTranslationKey: Record<string, string> = {
  // Opty Kids subcategories
  'baby-girl': 'subcategories.babyGirl',
  'baby_girl': 'subcategories.babyGirl',
  'babygirl': 'subcategories.babyGirl',
  'baby-boy': 'subcategories.babyBoy',
  'baby_boy': 'subcategories.babyBoy',
  'babyboy': 'subcategories.babyBoy',
}

/**
 * Normalize slug to handle various formats and edge cases
 * This ensures translations work regardless of how slugs are formatted
 */
const normalizeSlug = (slug: string): string[] => {
  if (!slug) return []
  
  let normalized = slug.toLowerCase().trim()
  
  // Remove special characters that might interfere
  normalized = normalized.replace(/[^\w\s-]/g, '')
  
  // Generate multiple variations to match different slug formats
  const variations = new Set<string>([
    normalized, // Original normalized
    normalized.replace(/\s+/g, '-'), // Spaces to hyphens
    normalized.replace(/\s+/g, '_'), // Spaces to underscores
    normalized.replace(/[-_]+/g, '-'), // Multiple hyphens/underscores to single hyphen
    normalized.replace(/[-_]+/g, '_'), // Multiple hyphens/underscores to single underscore
    normalized.replace(/[-_]/g, ''), // Remove all separators
  ])
  
  // Also try with common prefixes/suffixes removed
  const withoutPrefixes = normalized.replace(/^(category|subcategory|sub-?subcategory)[-_]?/i, '')
  if (withoutPrefixes !== normalized) {
    variations.add(withoutPrefixes)
    variations.add(withoutPrefixes.replace(/\s+/g, '-'))
    variations.add(withoutPrefixes.replace(/\s+/g, '_'))
  }
  
  return Array.from(variations).filter(s => s.length > 0)
}

/**
 * Hook to translate category names based on their slug
 * Falls back to the original name if no translation is found
 * Supports:
 * - Main categories (via categorySlugToTranslationKey mapping)
 * - Subcategories (via subcategories.{slug})
 * - Sub-subcategories (via subcategories.{slug} - uses unique slug)
 */
export const useCategoryTranslation = () => {
  const { t } = useTranslation()

  const translateCategory = (category: { name: string; slug: string } | null | undefined): string => {
    if (!category) return ''
    
    // Generate all possible slug variations
    const normalizedSlugs = normalizeSlug(category.slug)
    
    // Try normalized variations
    for (const normalizedSlug of normalizedSlugs) {
      // First, check for subcategory/sub-subcategory translation (subcategories.{slug})
      // This works for ALL subcategories and sub-subcategories
      const subcategoryKey = `subcategories.${normalizedSlug}`
      const subcategoryTranslation = t(subcategoryKey)
      if (subcategoryTranslation && subcategoryTranslation !== subcategoryKey) {
        return subcategoryTranslation
      }
      
      // Check if there's a known subcategory slug mapping
      const knownSubcategoryKey = subcategorySlugToTranslationKey[normalizedSlug]
      if (knownSubcategoryKey) {
        const translated = t(knownSubcategoryKey)
        if (translated && translated !== knownSubcategoryKey) {
          return translated
        }
      }
      
      // Check the main category mapping
      const translationKey = categorySlugToTranslationKey[normalizedSlug]
      if (translationKey) {
        const translated = t(translationKey)
        if (translated && translated !== translationKey) {
          return translated
        }
      }
    }
    
    // Debug: Log untranslated categories in development
    if (import.meta.env.DEV) {
      const primarySlug = normalizeSlug(category.slug)[0]
      console.log(`⚠️ [Translation] No translation found for: "${category.name}" (slug: "${category.slug}")`)
      console.log(`   Tried ${normalizedSlugs.length} slug variations:`, normalizedSlugs.slice(0, 5))
      console.log(`   Please add translation to "subcategories.${primarySlug}" in locale files`)
      console.log(`   Add this to all locale files (en.json, it.json, es.json, fr.json, de.json, pt.json):`)
      console.log(`   "subcategories": {`)
      console.log(`     "${primarySlug}": "${category.name}" // TODO: Translate`)
      console.log(`   }`)
    }
    
    // Fallback to original name if no translation mapping exists
    return category.name
  }

  return { translateCategory }
}

/**
 * Standalone function to translate category names (for use outside React components)
 * Supports:
 * - Main categories (via categorySlugToTranslationKey mapping)
 * - Subcategories (via subcategories.{slug})
 * - Sub-subcategories (via subcategories.{slug} - uses unique slug)
 */
export const translateCategoryName = (category: { name: string; slug: string } | null | undefined, t: (key: string) => string): string => {
  if (!category) return ''
  
  // Generate all possible slug variations
  const normalizedSlugs = normalizeSlug(category.slug)
  
  // Try normalized variations
  for (const normalizedSlug of normalizedSlugs) {
    // First, check for subcategory/sub-subcategory translation (subcategories.{slug})
    // This works for ALL subcategories and sub-subcategories
    const subcategoryKey = `subcategories.${normalizedSlug}`
    const subcategoryTranslation = t(subcategoryKey)
    if (subcategoryTranslation && subcategoryTranslation !== subcategoryKey) {
      return subcategoryTranslation
    }
    
    // Check if there's a known subcategory slug mapping
    const knownSubcategoryKey = subcategorySlugToTranslationKey[normalizedSlug]
    if (knownSubcategoryKey) {
      const translated = t(knownSubcategoryKey)
      if (translated && translated !== knownSubcategoryKey) {
        return translated
      }
    }
    
    // Check the main category mapping
    const translationKey = categorySlugToTranslationKey[normalizedSlug]
    if (translationKey) {
      const translated = t(translationKey)
      if (translated && translated !== translationKey) {
        return translated
      }
    }
  }
  
  // Fallback to original name if no translation mapping exists
  return category.name
}

