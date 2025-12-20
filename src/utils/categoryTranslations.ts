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
}

/**
 * Hook to translate category names based on their slug
 * Falls back to the original name if no translation is found
 */
export const useCategoryTranslation = () => {
  const { t } = useTranslation()

  const translateCategory = (category: { name: string; slug: string } | null | undefined): string => {
    if (!category) return ''
    
    const translationKey = categorySlugToTranslationKey[category.slug.toLowerCase()]
    if (translationKey) {
      const translated = t(translationKey)
      // If translation returns the key itself, it means translation doesn't exist, use original name
      return translated !== translationKey ? translated : category.name
    }
    
    // Fallback to original name if no translation mapping exists
    return category.name
  }

  return { translateCategory }
}

/**
 * Standalone function to translate category names (for use outside React components)
 */
export const translateCategoryName = (category: { name: string; slug: string } | null | undefined, t: (key: string) => string): string => {
  if (!category) return ''
  
  const translationKey = categorySlugToTranslationKey[category.slug.toLowerCase()]
  if (translationKey) {
    const translated = t(translationKey)
    // If translation returns the key itself, it means translation doesn't exist, use original name
    return translated !== translationKey ? translated : category.name
  }
  
  // Fallback to original name if no translation mapping exists
  return category.name
}

