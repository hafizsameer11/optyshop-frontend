import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getBrands } from '../../services/brandsService'
import type { Brand } from '../../services/brandsService'

// Brand logo mapping for fallback when backend doesn't provide logo images
const BRAND_LOGO_MAP: { [key: string]: string } = {
    'charmant': '/assets/images/Logo Charmant2-1.webp',
    'de rigo': '/assets/images/Logo De Rigo-1.webp',
    'derigo': '/assets/images/Logo De Rigo-1.webp',
    'eyerim': '/assets/images/Logo Eyerim.webp',
    'fielmann': '/assets/images/Logo Fielmann.webp',
    'jins': '/assets/images/Logo JINS BW.webp',
    'marchon': '/assets/images/Logo Marchon-3.webp',
    'transitions': '/assets/images/Logo Transitions BW.webp',
    'pair eyewear': '/assets/images/Logo-Pair-Eyewear-nb.webp',
    'rodenstock': '/assets/images/Rodenstock.webp',
    'specsavers': '/assets/images/Specsavers-Logo.webp',
    'zenni': '/assets/images/Zenni-Logo.webp',
    'eschenbach': '/assets/images/logo_eschenbach_800x300.webp',
    'peepers': '/assets/images/logo_peepers_nb.webp',
    'zeiss': '/assets/images/logo_zeiss.webp',
    'multiopticas': '/assets/images/multiopticas.webp'
}

const TrustedBrands: React.FC = () => {
    const { t } = useTranslation()
    const [brands, setBrands] = useState<Brand[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let isCancelled = false
        
        const fetchBrands = async () => {
            try {
                setLoading(true)
                const data = await getBrands(true) // Get only active brands
                
                if (isCancelled) return
                
                // Log for debugging
                if (data.length > 0) {
                    console.log(`✅ Loaded ${data.length} active brand(s) from API`)
                    console.log('Brand data:', data)
                    data.forEach(brand => {
                        console.log(`Brand: ${brand.name}, logo_image: ${brand.logo_image}`)
                    })
                    
                    // Check if all brands are placeholders without images (then use fallback)
                    const hasOnlyPlaceholdersWithoutImages = data.every(brand => {
                        const placeholderPatterns = [
                            /^lkj/i,  // Matches "lkjkljkljkj"
                            /test/i,
                            /demo/i,
                            /placeholder/i,
                            /sample/i,
                            /unity gallegos/i,  // Matches "Unity Gallegos"
                            /^nm$/i  // Matches exactly "nm"
                        ]
                        const isPlaceholder = placeholderPatterns.some(pattern => 
                            pattern.test(brand.name.toLowerCase().trim())
                        )
                        return isPlaceholder && !brand.logo_image
                    })
                    
                    if (hasOnlyPlaceholdersWithoutImages) {
                        console.warn('⚠️ All brands are placeholders without images. Using fallback brands instead.')
                        // Use fallback brands immediately when placeholders are detected
                        const fallbackBrands = [
                            { id: 1, name: 'Charmant', slug: 'charmant', logo_url: '/assets/images/Logo Charmant2-1.webp', logo_image: '/assets/images/Logo Charmant2-1.webp', website_url: '', sort_order: 1, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
                            { id: 2, name: 'De Rigo', slug: 'de-rigo', logo_url: '/assets/images/Logo De Rigo-1.webp', logo_image: '/assets/images/Logo De Rigo-1.webp', website_url: '', sort_order: 2, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
                            { id: 3, name: 'Eyerim', slug: 'eyerim', logo_url: '/assets/images/Logo Eyerim.webp', logo_image: '/assets/images/Logo Eyerim.webp', website_url: '', sort_order: 3, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
                            { id: 4, name: 'Fielmann', slug: 'fielmann', logo_url: '/assets/images/Logo Fielmann.webp', logo_image: '/assets/images/Logo Fielmann.webp', website_url: '', sort_order: 4, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
                            { id: 5, name: 'JINS', slug: 'jins', logo_url: '/assets/images/Logo JINS BW.webp', logo_image: '/assets/images/Logo JINS BW.webp', website_url: '', sort_order: 5, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
                            { id: 6, name: 'Marchon', slug: 'marchon', logo_url: '/assets/images/Logo Marchon-3.webp', logo_image: '/assets/images/Logo Marchon-3.webp', website_url: '', sort_order: 6, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
                            { id: 7, name: 'Transitions', slug: 'transitions', logo_url: '/assets/images/Logo Transitions BW.webp', logo_image: '/assets/images/Logo Transitions BW.webp', website_url: '', sort_order: 7, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
                            { id: 8, name: 'Zeiss', slug: 'zeiss', logo_url: '/assets/images/logo_zeiss.webp', logo_image: '/assets/images/logo_zeiss.webp', website_url: '', sort_order: 8, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
                        ]
                        console.log(`✅ Using ${fallbackBrands.length} fallback brands (no placeholders)`)
                        setBrands(fallbackBrands)
                        return
                    }
                    
                    // Process brands - keep those with images even if names are placeholders
                    const processedBrands = data.map(brand => {
                        // Check if this is a placeholder brand name
                        const placeholderPatterns = [
                            /^lkj/i,  // Matches "lkjkljkljkj"
                            /test/i,
                            /demo/i,
                            /placeholder/i,
                            /sample/i,
                            /unity gallegos/i,  // Matches "Unity Gallegos"
                            /^nm$/i  // Matches exactly "nm"
                        ]
                        
                        const isPlaceholder = placeholderPatterns.some(pattern => 
                            pattern.test(brand.name.toLowerCase().trim())
                        )
                        
                        console.log(`🔍 Checking brand: "${brand.name}" - isPlaceholder: ${isPlaceholder}, hasImage: ${!!brand.logo_image}`)
                        
                        // If it's a placeholder but has an image, hide the name but keep the image
                        if (isPlaceholder && brand.logo_image) {
                            console.log(`✅ Using placeholder brand with image: ${brand.name}`)
                            return {
                                ...brand,
                                displayName: '', // Hide the placeholder name completely
                                showImageOnly: true
                            }
                        }
                        
                        // If it's a placeholder without an image, filter it out
                        if (isPlaceholder && !brand.logo_image) {
                            console.warn(`⚠️ Filtering out placeholder brand without image: ${brand.name}`)
                            return null
                        }
                        
                        // Normal brand - keep as is
                        return {
                            ...brand,
                            displayName: brand.name,
                            showImageOnly: false
                        }
                    }).filter(brand => brand !== null) // Remove filtered out brands
                    
                    if (processedBrands.length > 0) {
                        console.log(`✅ Using ${processedBrands.length} valid brands from API`)
                        setBrands(processedBrands)
                    } else {
                        console.warn('⚠️ No brands with images found in API response. Using fallback brands for display')
                        // Add fallback brands with proper names and available logos
                        const fallbackBrands = [
                            { id: 1, name: 'Charmant', slug: 'charmant', logo_url: '/assets/images/Logo Charmant2-1.webp', logo_image: '/assets/images/Logo Charmant2-1.webp', website_url: '', sort_order: 1, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
                            { id: 2, name: 'De Rigo', slug: 'de-rigo', logo_url: '/assets/images/Logo De Rigo-1.webp', logo_image: '/assets/images/Logo De Rigo-1.webp', website_url: '', sort_order: 2, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
                            { id: 3, name: 'Eyerim', slug: 'eyerim', logo_url: '/assets/images/Logo Eyerim.webp', logo_image: '/assets/images/Logo Eyerim.webp', website_url: '', sort_order: 3, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
                            { id: 4, name: 'Fielmann', slug: 'fielmann', logo_url: '/assets/images/Logo Fielmann.webp', logo_image: '/assets/images/Logo Fielmann.webp', website_url: '', sort_order: 4, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
                            { id: 5, name: 'JINS', slug: 'jins', logo_url: '/assets/images/Logo JINS BW.webp', logo_image: '/assets/images/Logo JINS BW.webp', website_url: '', sort_order: 5, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
                            { id: 6, name: 'Marchon', slug: 'marchon', logo_url: '/assets/images/Logo Marchon-3.webp', logo_image: '/assets/images/Logo Marchon-3.webp', website_url: '', sort_order: 6, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
                            { id: 7, name: 'Transitions', slug: 'transitions', logo_url: '/assets/images/Logo Transitions BW.webp', logo_image: '/assets/images/Logo Transitions BW.webp', website_url: '', sort_order: 7, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
                            { id: 8, name: 'Zeiss', slug: 'zeiss', logo_url: '/assets/images/logo_zeiss.webp', logo_image: '/assets/images/logo_zeiss.webp', website_url: '', sort_order: 8, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
                        ]
                        setBrands(fallbackBrands)
                        return
                    }
                } else {
                    console.warn('⚠️ No active brands found. Using fallback brands for display')
                    // Add fallback brands with proper names and available logos
                    const fallbackBrands = [
                        { id: 1, name: 'Charmant', slug: 'charmant', logo_url: '/assets/images/Logo Charmant2-1.webp', logo_image: '/assets/images/Logo Charmant2-1.webp', website_url: '', sort_order: 1, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
                        { id: 2, name: 'De Rigo', slug: 'de-rigo', logo_url: '/assets/images/Logo De Rigo-1.webp', logo_image: '/assets/images/Logo De Rigo-1.webp', website_url: '', sort_order: 2, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
                        { id: 3, name: 'Eyerim', slug: 'eyerim', logo_url: '/assets/images/Logo Eyerim.webp', logo_image: '/assets/images/Logo Eyerim.webp', website_url: '', sort_order: 3, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
                        { id: 4, name: 'Fielmann', slug: 'fielmann', logo_url: '/assets/images/Logo Fielmann.webp', logo_image: '/assets/images/Logo Fielmann.webp', website_url: '', sort_order: 4, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
                        { id: 5, name: 'JINS', slug: 'jins', logo_url: '/assets/images/Logo JINS BW.webp', logo_image: '/assets/images/Logo JINS BW.webp', website_url: '', sort_order: 5, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
                        { id: 6, name: 'Marchon', slug: 'marchon', logo_url: '/assets/images/Logo Marchon-3.webp', logo_image: '/assets/images/Logo Marchon-3.webp', website_url: '', sort_order: 6, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
                        { id: 7, name: 'Transitions', slug: 'transitions', logo_url: '/assets/images/Logo Transitions BW.webp', logo_image: '/assets/images/Logo Transitions BW.webp', website_url: '', sort_order: 7, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
                        { id: 8, name: 'Zeiss', slug: 'zeiss', logo_url: '/assets/images/logo_zeiss.webp', logo_image: '/assets/images/logo_zeiss.webp', website_url: '', sort_order: 8, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
                    ]
                    setBrands(fallbackBrands)
                    return
                }
                
                setBrands(data)
            } catch (error) {
                if (!isCancelled) {
                    console.error('❌ Error loading brands:', error)
                    // Add fallback brands on error
                    const fallbackBrands = [
                        { id: 1, name: 'Charmant', slug: 'charmant', logo_url: '/assets/images/Logo Charmant2-1.webp', logo_image: '/assets/images/Logo Charmant2-1.webp', website_url: '', sort_order: 1, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
                        { id: 2, name: 'De Rigo', slug: 'de-rigo', logo_url: '/assets/images/Logo De Rigo-1.webp', logo_image: '/assets/images/Logo De Rigo-1.webp', website_url: '', sort_order: 2, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
                        { id: 3, name: 'Eyerim', slug: 'eyerim', logo_url: '/assets/images/Logo Eyerim.webp', logo_image: '/assets/images/Logo Eyerim.webp', website_url: '', sort_order: 3, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
                        { id: 4, name: 'Fielmann', slug: 'fielmann', logo_url: '/assets/images/Logo Fielmann.webp', logo_image: '/assets/images/Logo Fielmann.webp', website_url: '', sort_order: 4, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
                        { id: 5, name: 'JINS', slug: 'jins', logo_url: '/assets/images/Logo JINS BW.webp', logo_image: '/assets/images/Logo JINS BW.webp', website_url: '', sort_order: 5, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
                        { id: 6, name: 'Marchon', slug: 'marchon', logo_url: '/assets/images/Logo Marchon-3.webp', logo_image: '/assets/images/Logo Marchon-3.webp', website_url: '', sort_order: 6, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
                        { id: 7, name: 'Transitions', slug: 'transitions', logo_url: '/assets/images/Logo Transitions BW.webp', logo_image: '/assets/images/Logo Transitions BW.webp', website_url: '', sort_order: 7, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
                        { id: 8, name: 'Zeiss', slug: 'zeiss', logo_url: '/assets/images/logo_zeiss.webp', logo_image: '/assets/images/logo_zeiss.webp', website_url: '', sort_order: 8, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
                    ]
                    setBrands(fallbackBrands)
                }
            } finally {
                if (!isCancelled) {
                    setLoading(false)
                }
            }
        }

        fetchBrands()
        
        return () => {
            isCancelled = true
        }
    }, [])

    // Helper function to handle image URLs (convert full URLs to relative paths for proxy)
    const getImageUrl = (imageUrl: string | null | undefined, brandName?: string): string => {
        // First try the provided image URL
        if (imageUrl && imageUrl.trim() !== '') {
            const cleanedUrl = imageUrl.trim()

            // If it's a full URL with localhost:5000, convert to relative path (dev environment)
            if (cleanedUrl.includes('http://localhost:5000') || cleanedUrl.includes('http://127.0.0.1:5000')) {
                try {
                    const url = new URL(cleanedUrl)
                    return url.pathname || ''
                } catch {
                    // If URL parsing fails, try to extract path manually
                    const pathMatch = cleanedUrl.match(/\/\/[^\/]+(\/.*)/)
                    if (pathMatch && pathMatch[1]) {
                        return pathMatch[1]
                    }
                    return ''
                }
            }

            // If it's an external HTTPS URL (like optyshop-frontend.hmstech.org), use the proxy
            if (cleanedUrl.startsWith('https://optyshop-frontend.hmstech.org')) {
                try {
                    const url = new URL(cleanedUrl)
                    return `/external-images${url.pathname}`
                } catch {
                    // If URL parsing fails, try to extract path manually
                    const pathMatch = cleanedUrl.match(/\/\/[^\/]+(\/.*)/)
                    if (pathMatch && pathMatch[1]) {
                        return `/external-images${pathMatch[1]}`
                    }
                    return ''
                }
            }

            // If backend returned an insecure http URL on a https site, upgrade to https
            if (cleanedUrl.startsWith('http://')) {
                try {
                    const url = new URL(cleanedUrl)
                    url.protocol = 'https:'
                    return url.toString()
                } catch {
                    // If parsing fails, try to manually convert
                    if (cleanedUrl.startsWith('http://')) {
                        return cleanedUrl.replace('http://', 'https://')
                    }
                    return ''
                }
            }

            // If it's already a relative path, return as is
            if (cleanedUrl.startsWith('/')) {
                return cleanedUrl
            }

            // If it's a data URL, return as is
            if (cleanedUrl.startsWith('data:')) {
                return cleanedUrl
            }

            // If it starts with https://, return as is
            if (cleanedUrl.startsWith('https://')) {
                return cleanedUrl
            }

            // If it's a relative path without leading slash, add it
            if (!cleanedUrl.startsWith('http') && !cleanedUrl.startsWith('/')) {
                return '/' + cleanedUrl
            }

            // Otherwise return the full URL or cleaned URL
            return cleanedUrl || ''
        }

        // If no image URL provided, try to find a fallback logo based on brand name
        if (brandName) {
            const normalizedName = brandName.toLowerCase().trim()
            const fallbackLogo = BRAND_LOGO_MAP[normalizedName]
            if (fallbackLogo) {
                return fallbackLogo
            }
        }

        return ''
    }

    const handleBrandClick = (brand: Brand) => {
        if (brand.website_url) {
            if (brand.website_url.startsWith('http')) {
                window.open(brand.website_url, '_blank', 'noopener,noreferrer')
            } else {
                window.location.href = brand.website_url
            }
        }
    }

    if (loading) {
        return (
            <section className="bg-white text-slate-900">
                <div className="h-1 bg-gradient-to-r from-orange-400 via-teal-400 to-purple-600" />
                <div className="max-w-6xl mx-auto px-6 py-6">
                    <div className="h-12 bg-slate-200 animate-pulse rounded"></div>
                </div>
            </section>
        )
    }

    if (brands.length === 0) {
        return null // Don't render anything if no brands
    }

    // Duplicate the array for seamless infinite scroll (only if we have brands)
    const track = brands.length > 0 ? [...brands, ...brands] : brands

    return (
        <section className="bg-white text-slate-900">
            <div className="h-1 bg-gradient-to-r from-orange-400 via-teal-400 to-purple-600" />

            <div className="max-w-6xl mx-auto px-6 py-6 text-center space-y-2">
                <h2 className="text-lg sm:text-xl font-semibold text-slate-700 tracking-wide">
                    {t('home.trustedBrands.titlePart1')} <span className="text-blue-700">{t('home.trustedBrands.titlePart2')}</span>
                </h2>
            </div>

            <div className="overflow-hidden pb-6">
                <div className="flex gap-16 px-8 items-center marquee-track">
                    {track.map((brand, index) => {
                        const imageUrl = getImageUrl(brand.logo_image || brand.logo_url, brand.name)
                        const hasLink = !!brand.website_url
                        const displayName = (brand as any).displayName || brand.name
                        const showImageOnly = (brand as any).showImageOnly || false
                        
                        console.log(`Rendering brand: ${brand.name}, imageUrl: ${imageUrl}, displayName: ${displayName}, showImageOnly: ${showImageOnly}`)
                        
                        return (
                            <div
                                key={`${brand.id}-${index}`}
                                className={`flex-shrink-0 flex items-center justify-center ${hasLink ? 'cursor-pointer' : ''}`}
                                onClick={() => hasLink && handleBrandClick(brand)}
                            >
                                {imageUrl ? (
                                    <img
                                        src={imageUrl}
                                        alt={brand.name}
                                        className="h-8 sm:h-12 object-contain opacity-80 hover:opacity-100 transition-opacity"
                                        crossOrigin="anonymous"
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement
                                            console.error(`❌ Brand image failed to load: ${brand.name} -> ${imageUrl}`)
                                            target.style.display = 'none'
                                            // Don't show any fallback text - just hide the failed image
                                        }}
                                    />
                                ) : (
                                    // Don't show any fallback text when no image is available
                                    null
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>
        </section>
    )
}

export default TrustedBrands


