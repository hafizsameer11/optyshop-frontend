import { apiClient } from '../utils/api'
import { API_ROUTES } from '../config/apiRoutes'

export type SocialPlatform =
  | 'linkedin'
  | 'facebook'
  | 'instagram'
  | 'youtube'
  | 'twitter'
  | 'tiktok'
  | 'whatsapp'
  | 'other'

export interface SocialLink {
  id: number
  platform: SocialPlatform | string
  url: string
  label?: string | null
  sort_order: number
  is_active: boolean
}

export async function getSocialLinks(): Promise<SocialLink[]> {
  try {
    const response = await apiClient.get(API_ROUTES.SOCIAL_LINKS.LIST)
    const links = response.data?.data?.links || response.data?.links || []
    return Array.isArray(links) ? links.filter((l: SocialLink) => l?.url) : []
  } catch {
    return []
  }
}
