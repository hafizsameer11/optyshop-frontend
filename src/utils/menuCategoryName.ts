/**
 * Label for shop menu / category navigation.
 * Italian prefers admin `name_it` when set; all locales then use i18n slug maps,
 * then fall back to the catalog `name`.
 */
export function getMenuCategoryLabel(
  category: { name: string; slug: string; name_it?: string | null },
  lang: string | undefined,
  translateBySlug: (c: { name: string; slug: string }) => string
): string {
  const code = (lang || 'en').split('-')[0].toLowerCase()
  if (code === 'it') {
    const it = category.name_it?.trim()
    if (it) return it
  }
  const translated = translateBySlug(category)
  if (translated && translated.trim()) return translated
  return category.name || ''
}
