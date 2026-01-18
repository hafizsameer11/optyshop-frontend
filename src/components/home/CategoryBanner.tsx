import React, { useEffect, useState } from 'react'
import { getBanners, type Banner } from '../../services/bannersService'

interface CategoryBannerProps {
    categoryName: string
    categoryId: number
    position?: string
}

const CategoryBanner: React.FC<CategoryBannerProps> = ({ 
    categoryName, 
    categoryId, 
    position = 'category_section' 
}) => {
    const [banners, setBanners] = useState<Banner[]>([])
    const [loading, setLoading] = useState(true)
    const [currentIndex, setCurrentIndex] = useState(0)

    useEffect(() => {
        let isCancelled = false
        
        const fetchBanners = async () => {
            try {
                setLoading(true)
                
                // Fetch banners for category position
                // For different category levels, we use different strategies
                let data
                
                if (position === 'sub_subcategory_page') {
                    // For sub-subcategory pages, try to get banners specific to this level
                    data = await getBanners({
                        page_type: 'category',
                        category_id: categoryId,
                        position: 'sub_subcategory_page'
                    })
                    
                    // If no specific banners found, fallback to general category banners
                    if (!data || data.length === 0) {
                        data = await getBanners({
                            page_type: 'category',
                            category_id: categoryId
                        })
                    }
                } else if (position === 'subcategory_page') {
                    // For subcategory pages, try to get banners specific to this level
                    data = await getBanners({
                        page_type: 'category',
                        category_id: categoryId,
                        position: 'subcategory_page'
                    })
                    
                    // If no specific banners found, fallback to general category banners
                    if (!data || data.length === 0) {
                        data = await getBanners({
                            page_type: 'category',
                            category_id: categoryId
                        })
                    }
                } else {
                    // For main category pages, get general category banners
                    data = await getBanners({
                        page_type: 'category',
                        category_id: categoryId,
                        position: 'category_page'
                    })
                    
                    // If no specific category page banners found, try without position filter
                    if (!data || data.length === 0) {
                        data = await getBanners({
                            page_type: 'category',
                            category_id: categoryId
                        })
                    }
                }
                
                if (isCancelled) return
                
                setBanners(data || [])
                
                if (data && data.length > 0) {
                    console.log(`Loaded ${data.length} banner(s) for ${categoryName} (${position}) - Category ID: ${categoryId}`)
                } else {
                    console.log(`No banners found for ${categoryName} (${position}) - Category ID: ${categoryId}`)
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
    }, [categoryName, categoryId, position])

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
            return '/assets/images/banner-placeholder.jpg'
        }

        const cleanedUrl = imageUrl.trim()

        // If it's a full URL with localhost:5000, convert to relative path
        if (cleanedUrl.includes('http://localhost:5000') || cleanedUrl.includes('http://127.0.0.1:5000')) {
            try {
                const url = new URL(cleanedUrl)
                return url.pathname || '/assets/images/banner-placeholder.jpg'
            } catch {
                const pathMatch = cleanedUrl.match(/\/\/[^\/]+(\/.*)/)
                if (pathMatch && pathMatch[1]) {
                    return pathMatch[1]
                }
                return '/assets/images/banner-placeholder.jpg'
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

        return cleanedUrl || '/assets/images/banner-placeholder.jpg'
    }

    // Parse meta field for banner metadata
    const parseMeta = (meta: unknown) => {
        if (!meta) return null

        if (typeof meta === 'object') {
            return meta
        }

        if (typeof meta === 'string') {
            try {
                return JSON.parse(meta)
            } catch {
                return { description: meta }
            }
        }

        return null
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
                        const bannerMeta = parseMeta(banner.meta)
                        const imageUrl = getImageUrl(banner.image_url)
                        
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
                                        target.style.display = 'none'
                                    }}
                                />
                                
                                {/* Overlay for better text readability */}
                                <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-black/60 z-10" />

                                {/* Banner Content */}
                                <div className="relative z-20 flex items-center justify-center h-full px-6">
                                    <div className="text-center">
                                        {banner.title && (
                                            <h3 className="text-lg md:text-xl font-bold text-white mb-1">
                                                {banner.title}
                                            </h3>
                                        )}
                                        {bannerMeta?.description && (
                                            <p className="text-sm md:text-base text-white/90">
                                                {bannerMeta.description}
                                            </p>
                                        )}
                                    </div>
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
