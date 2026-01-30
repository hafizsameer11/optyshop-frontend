import React, { useEffect, useState } from 'react'
import { getBanners, type Banner } from '../../services/bannersService'

// Simple request cache to prevent duplicate concurrent requests
const bannerRequestCache = new Map<string, Promise<Banner[]>>()
const REQUEST_THROTTLE_DELAY = 100 // 100ms between requests

interface CategoryBannerProps {
    categoryName: string
    categoryId: number
    subcategoryId?: number
    position?: string
}

const CategoryBanner: React.FC<CategoryBannerProps> = ({ 
    categoryName, 
    categoryId, 
    subcategoryId,
    position = 'category_section' 
}) => {
    const [banners, setBanners] = useState<Banner[]>([])
    const [loading, setLoading] = useState(true)
    const [currentIndex, setCurrentIndex] = useState(0)

    useEffect(() => {
        let isCancelled = false
        
        const fetchBannersWithThrottle = async (options: any, cacheKey: string): Promise<Banner[]> => {
            // Check if we already have a pending request for this cache key
            if (bannerRequestCache.has(cacheKey)) {
                console.log(`🔄 CategoryBanner - Using cached request for ${categoryName}`)
                return bannerRequestCache.get(cacheKey)!
            }

            // Create new request and cache it
            const requestPromise = (async () => {
                try {
                    // Add small delay to throttle requests
                    await new Promise(resolve => setTimeout(resolve, REQUEST_THROTTLE_DELAY))
                    const result = await getBanners(options)
                    return result
                } finally {
                    // Clean up cache after request completes
                    setTimeout(() => {
                        bannerRequestCache.delete(cacheKey)
                    }, 1000) // Keep in cache for 1 second
                }
            })()

            bannerRequestCache.set(cacheKey, requestPromise)
            return requestPromise
        }

        const fetchBanners = async () => {
            try {
                setLoading(true)
                
                // Debug: Log the parameters being used
                console.log(`🔍 CategoryBanner - Fetching banners for ${categoryName} - Category ID: ${categoryId}, Subcategory ID: ${subcategoryId}, Position: ${position}`)
                
                // Fetch banners for category position
                // For different category levels, we use different strategies
                let data: Banner[] = []
                
                if (position === 'sub_subcategory_page') {
                    // For sub-subcategory pages, try to get banners specific to this level
                    console.log('Trying sub-subcategory specific banners...')
                    data = await fetchBannersWithThrottle({
                        page_type: 'sub_subcategory',
                        category_id: categoryId,
                        sub_category_id: subcategoryId
                    }, `sub_sub_${categoryId}_${subcategoryId}`)
                    console.log('Sub-subcategory specific banners result:', data?.length || 0)
                    
                    // If no specific banners found, try subcategory banners as fallback
                    if (!data || data.length === 0) {
                        console.log('Trying subcategory banners as fallback...')
                        data = await fetchBannersWithThrottle({
                            page_type: 'subcategory',
                            category_id: categoryId,
                            sub_category_id: subcategoryId
                        }, `sub_${categoryId}_${subcategoryId}`)
                        console.log('Subcategory fallback banners result:', data?.length || 0)
                    }
                    
                    // If still no banners, fallback to general category banners
                    if (!data || data.length === 0) {
                        console.log('Trying general category banners as final fallback...')
                        data = await fetchBannersWithThrottle({
                            page_type: 'category',
                            category_id: categoryId
                        }, `cat_${categoryId}`)
                        console.log('General category fallback banners result:', data?.length || 0)
                    }
                } else if (position === 'subcategory_page') {
                    // For subcategory pages, try to get banners specific to this level
                    console.log('Trying subcategory specific banners...')
                    data = await fetchBannersWithThrottle({
                        page_type: 'subcategory',
                        category_id: categoryId,
                        sub_category_id: subcategoryId
                    }, `sub_${categoryId}_${subcategoryId}`)
                    console.log('Subcategory specific banners result:', data?.length || 0)
                    
                    // If no specific banners found, fallback to general category banners
                    if (!data || data.length === 0) {
                        console.log('Trying general category banners as fallback...')
                        data = await fetchBannersWithThrottle({
                            page_type: 'category',
                            category_id: categoryId
                        }, `cat_${categoryId}`)
                        console.log('General category fallback banners result:', data?.length || 0)
                    }
                } else {
                    // For main category pages, get general category banners
                    console.log('Trying main category page banners...')
                    data = await fetchBannersWithThrottle({
                        page_type: 'category',
                        category_id: categoryId
                    }, `cat_${categoryId}`)
                    console.log('Main category page banners result:', data?.length || 0)
                }
                
                if (isCancelled) return
                
                setBanners(data || [])
                
                if (data && data.length > 0) {
                    console.log(`✅ CategoryBanner - Loaded ${data.length} banner(s) for ${categoryName} (${position}) - Category ID: ${categoryId}`)
                    console.log('🎯 CategoryBanner - Banner details:', data.map(b => ({ id: b.id, title: b.title, category_id: b.category_id, page_type: b.page_type })))
                } else {
                    console.log(`⚠️ CategoryBanner - No banners found for ${categoryName} (${position}) - Category ID: ${categoryId}`)
                }
            } catch (error) {
                if (!isCancelled) {
                    console.error('Error loading category banners:', error)
                    setBanners([])
                }
            } finally {
                if (!isCancelled) {
                    setLoading(false)
                }
            }
        }

        fetchBanners()
        
        return () => {
            isCancelled = true
        }
    }, [categoryName, categoryId, subcategoryId, position])

    // Auto-rotate banners if there are multiple
    useEffect(() => {
        if (banners.length <= 1) return

        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % banners.length)
        }, 4000) // 4 seconds interval

        return () => clearInterval(interval)
    }, [banners.length])

    if (loading) {
        return (
            <div className="w-full h-48 md:h-64 lg:h-80 bg-gray-200 animate-pulse rounded-lg mb-8">
                <div className="text-gray-400 text-center py-8">Loading banner...</div>
            </div>
        )
    }

    if (banners.length === 0) {
        return null // Don't render anything if no banners
    }

    // Helper function to handle image URLs
    const getImageUrl = (imageUrl: string | null | undefined): string => {
        if (!imageUrl || imageUrl.trim() === '') {
            return '/assets/images/Banner-join-us-tewt-2.webp'
        }

        const cleanedUrl = imageUrl.trim()

        // If it's a full URL with localhost:5000, convert to relative path
        if (cleanedUrl.includes('http://localhost:5000') || cleanedUrl.includes('http://127.0.0.1:5000')) {
            try {
                const url = new URL(cleanedUrl)
                return url.pathname || '/assets/images/Banner-join-us-tewt-2.webp'
            } catch {
                const pathMatch = cleanedUrl.match(/\/\/[^\/]+(\/.*)/)
                if (pathMatch && pathMatch[1]) {
                    return pathMatch[1]
                }
                return '/assets/images/Banner-join-us-tewt-2.webp'
            }
        }

        // If backend returned an insecure http URL on a https site, upgrade to https
        if (cleanedUrl.startsWith('http://')) {
            try {
                const url = new URL(cleanedUrl)
                url.protocol = 'https:'
                return url.toString()
            } catch {
                return cleanedUrl.replace('http://', 'https://')
            }
        }

        // Handle external-images URLs - ensure they work with proxy
        if (cleanedUrl.startsWith('/external-images/')) {
            // In development, Vite proxy should handle this
            // In production, these might need to be converted to full URLs
            if (import.meta.env.PROD) {
                // In production, try to use the full URL to the server
                return `https://optyshop-frontend.hmstech.org${cleanedUrl}`
            }
            return cleanedUrl
        }

        // If it's already a relative path, return as is
        if (cleanedUrl.startsWith('/')) {
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

        return cleanedUrl || '/assets/images/Banner-join-us-tewt-2.webp'
    }

    const handleBannerClick = (banner: Banner) => {
        if (banner.link_url) {
            if (banner.link_url.startsWith('http')) {
                window.open(banner.link_url, '_blank', 'noopener,noreferrer')
            } else {
                window.location.href = banner.link_url
            }
        }
    }

    const goToSlide = (index: number) => {
        setCurrentIndex(index)
    }

    const goToPrevious = () => {
        setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length)
    }

    const goToNext = () => {
        setCurrentIndex((prev) => (prev + 1) % banners.length)
    }

    return (
        <div className="relative w-full mb-8 rounded-lg overflow-hidden shadow-md">
            {/* Banner Slider Container */}
            <div className="relative overflow-hidden w-full h-48 md:h-64 lg:h-80">
                {/* Slides Container */}
                <div
                    className="flex transition-transform duration-700 ease-in-out h-full"
                    style={{
                        transform: `translateX(-${currentIndex * 100}%)`,
                        height: '100%',
                    }}
                >
                    {banners.map((banner, index) => {
                        const imageUrl = getImageUrl(banner.image_url)
                        
                        // Debug: Log image URL information
                        if (import.meta.env.DEV) {
                            console.log(`🖼️ Banner ${index + 1} image info:`, {
                                originalUrl: banner.image_url,
                                processedUrl: imageUrl,
                                bannerId: banner.id,
                                bannerTitle: banner.title
                            })
                        }
                        
                        return (
                            <div
                                key={banner.id || index}
                                className="min-w-full h-full relative cursor-pointer flex-shrink-0"
                                onClick={() => handleBannerClick(banner)}
                            >
                                {/* Background Image */}
                                <div
                                    className="absolute inset-0 w-full h-full bg-gradient-to-r from-blue-600 to-purple-600"
                                    style={{
                                        backgroundImage: `url(${imageUrl})`,
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center',
                                        backgroundRepeat: 'no-repeat',
                                    }}
                                />
                                
                                {/* Fallback Image */}
                                <img
                                    src={imageUrl}
                                    alt={banner.title || 'Category Banner'}
                                    className="absolute inset-0 w-full h-full object-cover"
                                    onError={(e) => {
                                        const target = e.target as HTMLImageElement
                                        // Try fallback images in order of preference
                                        if (!target.dataset.fallbackTried) {
                                            target.dataset.fallbackTried = '1'
                                            // First try a generic banner placeholder
                                            target.src = '/assets/images/Banner-join-us-tewt-2.webp'
                                        } else if (!target.dataset.secondFallback) {
                                            target.dataset.secondFallback = '1'
                                            // Try another banner
                                            target.src = '/assets/images/banner-mobile-footwear-blog.webp'
                                        } else if (!target.dataset.thirdFallback) {
                                            target.dataset.thirdFallback = '1'
                                            // Finally try a hero image
                                            target.src = '/assets/images/hero3.avif'
                                        } else {
                                            // If all fail, hide the image and show gradient background
                                            target.style.display = 'none'
                                        }
                                    }}
                                />
                                
                                {/* Overlay for better text readability */}
                                <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-black/60 z-10" />

                                {/* Banner Content - Removed text overlay for clean image display */}
                                <div className="relative z-20 flex items-center justify-center h-full px-6">
                                </div>
                            </div>
                        )
                    })}
                </div>

                {/* Navigation Arrows - Only show if there are multiple banners */}
                {banners.length > 1 && (
                    <>
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                goToPrevious()
                            }}
                            className="absolute left-2 top-1/2 -translate-y-1/2 z-30 bg-white/80 hover:bg-white text-gray-900 rounded-full p-1.5 shadow-lg transition-all hover:scale-110"
                            aria-label="Previous banner"
                            type="button"
                        >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                goToNext()
                            }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 z-30 bg-white/80 hover:bg-white text-gray-900 rounded-full p-1.5 shadow-lg transition-all hover:scale-110"
                            aria-label="Next banner"
                            type="button"
                        >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </>
                )}

                {/* Dots Indicator - Only show if there are multiple banners */}
                {banners.length > 1 && (
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-30 flex gap-1 px-2 py-1 bg-black/20 rounded-full backdrop-blur-sm">
                        {banners.map((_, index) => (
                            <button
                                key={index}
                                onClick={(e) => {
                                    e.stopPropagation()
                                    goToSlide(index)
                                }}
                                className={`rounded-full transition-all duration-300 ${
                                    index === currentIndex
                                        ? 'w-4 h-1.5 bg-white shadow-lg'
                                        : 'w-1.5 h-1.5 bg-white/70 hover:bg-white/90'
                                }`}
                                aria-label={`Go to banner ${index + 1}`}
                                type="button"
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default CategoryBanner
