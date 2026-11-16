import { apiClient } from '../utils/api'
import { API_ROUTES } from '../config/apiRoutes'

export interface ContactLocation {
  id: number
  title: string
  subtitle?: string | null
  address?: string | null
  phone?: string | null
  email?: string | null
  sort_order?: number
  is_active?: boolean
}

export const getContactLocations = async (): Promise<ContactLocation[]> => {
  try {
    const response = await apiClient.get<{ locations: ContactLocation[] }>(
      API_ROUTES.CONTACT_LOCATIONS.LIST,
      false
    )

    if (response.success && response.data) {
      const data = response.data as any
      const locations = data.locations || data.data?.locations || []
      return (Array.isArray(locations) ? locations : [])
        .filter((loc: ContactLocation) => loc.is_active !== false)
        .sort((a: ContactLocation, b: ContactLocation) => (a.sort_order || 0) - (b.sort_order || 0))
    }

    return []
  } catch (error) {
    console.error('Failed to fetch contact locations:', error)
    return []
  }
}
