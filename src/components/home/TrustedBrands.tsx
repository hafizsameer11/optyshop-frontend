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
                } else {
                    console.warn('⚠️ No active brands found. Make sure admin has created brands with is_active=true')
                }
                
                setBrands(data)
            } catch (error) {
                if (!isCancelled) {
                    console.error('❌ Error loading brands:', error)
                    setBrands([])
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
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement
                                            target.style.display = 'none'
                                        }}
                                    />
                                ) : (
                                    <div className="h-8 sm:h-12 flex items-center justify-center text-slate-400 text-xs sm:text-sm">
                                        {brand.name}
                                    </div>
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


