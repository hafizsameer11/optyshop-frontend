import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getBrands } from '../../services/brandsService'
import { getProxiedImageUrl, convertToDataUrl } from '../../services/imageProxyService'
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
                if (Array.isArray(data) && data.length > 0) {
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
                            /unity gallegos/i  // Matches "Unity Gallegos"
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
                            /unity gallegos/i  // Matches "Unity Gallegos"
                        ]
                        
                        const isPlaceholder = placeholderPatterns.some(pattern => 
                            pattern.test(brand.name.toLowerCase().trim())
                        )
                        
                        console.log(`🔍 Checking brand: "${brand.name}" - isPlaceholder: ${isPlaceholder}, hasImage: ${!!brand.logo_image}`)
                        console.log(`📸 Original logo_image URL: ${brand.logo_image}`)
                        const processedUrl = getImageUrl(brand.logo_image || brand.logo_url, brand.name)
                        console.log(`🔄 Processed image URL: ${processedUrl}`)
                        
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
                    
                    if (Array.isArray(processedBrands) && processedBrands.length > 0) {
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
                
                setBrands(Array.isArray(data) ? data : [])
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

    // Helper function to handle image URLs (use proxy service)
    const getImageUrl = (imageUrl: string | null | undefined, brandName?: string): string => {
        // Use the proxy service for external images
        const proxiedUrl = getProxiedImageUrl(imageUrl);
        
        if (proxiedUrl) {
            console.log(`🖼️ Using proxied URL: ${proxiedUrl}`)
            return proxiedUrl;
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

    const handleCorsFallback = async (target: HTMLImageElement, brand: Brand) => {
        console.error(`🔄 Trying data URL conversion for: ${brand.name}`)
        try {
            const originalUrl = brand.logo_image || brand.logo_url || ''
            if (originalUrl) {
                const dataUrl = await convertToDataUrl(originalUrl)
                if (dataUrl !== originalUrl) {
                    console.log(`✅ Successfully converted to data URL: ${brand.name}`)
                    target.src = dataUrl
                    return
                }
            }
        } catch (error) {
            console.error(`❌ Data URL conversion failed for: ${brand.name}`, error)
        }
        
        // Final fallback: hide the image
        console.error(`🚫 All fallbacks failed for: ${brand.name}. Hiding image.`)
        target.style.display = 'none'
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

    if (!Array.isArray(brands) || brands.length === 0) {
        return null // Don't render anything if no brands
    }

    // Duplicate brands for seamless marquee effect (only 2 copies total)
    const duplicatedTrack = Array.isArray(brands) && brands.length > 0 ? [...brands, ...brands] : []

    return (
        <section className="bg-white text-slate-900">
            <div className="h-1 bg-gradient-to-r from-orange-400 via-teal-400 to-purple-600" />

            <div className="max-w-6xl mx-auto px-6 py-6 text-center space-y-2">
                <h2 className="text-lg sm:text-xl font-semibold text-slate-700 tracking-wide">
                    {t('home.trustedBrands.titlePart1')} <span className="text-blue-700">{t('home.trustedBrands.titlePart2')}</span>
                </h2>
            </div>

            <div className="overflow-hidden pb-6 relative bg-slate-50">
                <div 
                    className="flex items-center animate-scroll"
                    style={{
                        animation: 'scroll 15s linear infinite 2s',
                        width: `${duplicatedTrack.length * 200}px` // Give each brand more space
                    }}
                >
                    {duplicatedTrack.map((brand: Brand, index: number) => {
                        const imageUrl = getImageUrl(brand.logo_image || brand.logo_url, brand.name)
                        const hasLink = !!brand.website_url
                        const displayName = (brand as any).displayName || brand.name
                        const showImageOnly = (brand as any).showImageOnly || false
                        
                        console.log(`Rendering brand: ${brand.name}, imageUrl: ${imageUrl}, displayName: ${displayName}, showImageOnly: ${showImageOnly}`)
                        console.log(`🖼️ Final image src: ${imageUrl}`)
                        
                        return (
                            <div
                                key={`${brand.id}-${index}`}
                                className={`flex-shrink-0 flex items-center justify-center px-4 ${hasLink ? 'cursor-pointer' : ''}`}
                                style={{ width: '200px' }} // Fixed width like campaign section
                                onClick={() => hasLink && handleBrandClick(brand)}
                            >
                                {imageUrl ? (
                                    <img
                                        src={imageUrl}
                                        alt={brand.name}
                                        className="h-16 sm:h-20 md:h-24 lg:h-32 object-contain opacity-80 hover:opacity-100 transition-opacity"
                                        onLoad={() => {
                                            console.log(`✅ Image loaded successfully: ${brand.name} -> ${imageUrl}`)
                                        }}
                                        onError={async (e) => {
                                            const target = e.target as HTMLImageElement
                                            console.error(`❌ Brand image failed to load: ${brand.name} -> ${imageUrl}`)
                                            console.error(`🔍 Image element src: ${target.src}`)
                                            
                                            // Try the original URL as fallback
                                            const originalUrl = brand.logo_image || brand.logo_url || ''
                                            if (originalUrl && target.src !== originalUrl) {
                                                console.error(`🌐 Trying original URL as fallback...`)
                                                target.src = originalUrl
                                                target.onerror = () => {
                                                    console.error(`❌ Original URL also failed for: ${brand.name}`)
                                                    // Try to convert to data URL as last resort
                                                    handleCorsFallback(target, brand)
                                                }
                                            } else {
                                                // Try to convert to data URL as last resort
                                                handleCorsFallback(target, brand)
                                            }
                                        }}
                                    />
                                ) : (
                                    // Show a placeholder div when no image is available to maintain spacing
                                    <div className="h-16 sm:h-20 md:h-24 lg:h-32 w-24 sm:w-32 md:w-40 lg:w-48 bg-slate-100 rounded flex items-center justify-center">
                                        <span className="text-xs text-slate-400 text-center px-2">
                                            {showImageOnly ? '' : displayName}
                                        </span>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>
            
            {/* Add CSS for continuous scrolling animation */}
            <style>{`
                @keyframes scroll {
                    0% {
                        transform: translateX(0);
                    }
                    10% {
                        transform: translateX(0);
                    }
                    100% {
                        transform: translateX(-50%);
                    }
                }
                
                .animate-scroll {
                    display: flex;
                    transition: transform 0.3s ease-out;
                }
                
                .animate-scroll:hover {
                    animation-play-state: paused;
                    transform: translateX(var(--scroll-position, 0));
                }
            `}</style>
        </section>
    )
}

export default TrustedBrands


