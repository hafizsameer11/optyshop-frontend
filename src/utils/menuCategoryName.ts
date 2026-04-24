/**
 * Label for shop menu / category navigation.
 * Italian: optional admin `name_it`, else i18n slug map, else default `name`.
 * Other locales: primary `name` from admin (English catalog title).
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
    const t = translateBySlug(category)
    if (t && t !== category.name) return t
  }
  return category.name || ''
}
