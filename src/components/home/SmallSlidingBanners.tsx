import React, { useEffect, useState } from 'react'
import { getCampaigns } from '../../services/campaignsService'
import type { Campaign } from '../../services/campaignsService'

const SmallSlidingBanners: React.FC = () => {
    const [campaigns, setCampaigns] = useState<Campaign[]>([])
    const [loading, setLoading] = useState(true)
    const [currentIndex, setCurrentIndex] = useState(0)
    const [isAutoPlaying, setIsAutoPlaying] = useState(true)
    const [itemsPerView, setItemsPerView] = useState(3)
    const [touchStart, setTouchStart] = useState<number | null>(null)
    const [touchEnd, setTouchEnd] = useState<number | null>(null)

    // Detect screen size and calculate items per view
    useEffect(() => {
        const updateItemsPerView = () => {
            if (window.innerWidth < 768) {
                setItemsPerView(1) // Mobile: 1 item
            } else if (window.innerWidth >= 1024) {
                setItemsPerView(4) // Large desktop: 4 items
            } else {
                setItemsPerView(3) // Tablet: 3 items
            }
        }
        updateItemsPerView()
        window.addEventListener('resize', updateItemsPerView)
        return () => window.removeEventListener('resize', updateItemsPerView)
    }, [])

    // Fetch campaigns
    useEffect(() => {
        let isCancelled = false
        
        const fetchBanners = async () => {
            try {
                setLoading(true)
                // Fetch campaigns - you can filter by position='small-banners' if you create them in admin
                // For now, we'll get 'home' campaigns and limit to 6
                const data = await getCampaigns(true, 'small-banners')
                
                // If no 'small-banners' position campaigns, try 'home' and limit to 6
                let bannersToShow = data
                if (bannersToShow.length === 0) {
                    const homeCampaigns = await getCampaigns(true, 'home')
                    bannersToShow = homeCampaigns.slice(0, 6) // Limit to 6
                } else {
                    bannersToShow = bannersToShow.slice(0, 6) // Limit to 6
                }
                
                if (isCancelled) return
                
                setCampaigns(bannersToShow)
                setIsAutoPlaying(true) // Ensure auto-play is enabled when campaigns load
                
                if (import.meta.env.DEV && bannersToShow.length > 0) {
                    console.log(`✅ [Small Sliding Banners] Loaded ${bannersToShow.length} banner(s)`)
                }
            } catch (error) {
                if (!isCancelled) {
                    console.error('❌ Error loading small banners:', error)
                    setCampaigns([])
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
    }, [])

    // Auto-rotate banners - slide one item at a time like hero banner
    useEffect(() => {
        if (campaigns.length <= 1 || !isAutoPlaying) return

        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % campaigns.length)
        }, 5000) // Change every 5 seconds (matching hero banner)

        return () => clearInterval(interval)
    }, [campaigns.length, isAutoPlaying])

    // Helper function to handle image URLs
    const getImageUrl = (imageUrl: string | null | undefined): string => {
        if (!imageUrl || imageUrl.trim() === '') return ''

        const cleanedUrl = imageUrl.trim()

        if (cleanedUrl.includes('http://localhost:5000') || cleanedUrl.includes('http://127.0.0.1:5000')) {
            try {
                const url = new URL(cleanedUrl)
                return url.pathname || ''
            } catch {
                const pathMatch = cleanedUrl.match(/\/\/[^\/]+(\/.*)/)
                if (pathMatch && pathMatch[1]) {
                    return pathMatch[1]
                }
                return ''
            }
        }

        if (cleanedUrl.startsWith('http://')) {
            try {
                const url = new URL(cleanedUrl)
                url.protocol = 'https:'
                return url.toString()
            } catch {
                if (cleanedUrl.startsWith('http://')) {
                    return cleanedUrl.replace('http://', 'https://')
                }
                return ''
            }
        }

        if (cleanedUrl.startsWith('/')) {
            return cleanedUrl
        }

        if (cleanedUrl.startsWith('data:')) {
            return cleanedUrl
        }

        if (cleanedUrl.startsWith('https://')) {
            return cleanedUrl
        }

        if (!cleanedUrl.startsWith('http') && !cleanedUrl.startsWith('/')) {
            return '/' + cleanedUrl
        }

        return cleanedUrl || ''
    }

    const handleBannerClick = (campaign: Campaign) => {
        if (campaign.link_url) {
            if (campaign.link_url.startsWith('http')) {
                window.open(campaign.link_url, '_blank', 'noopener,noreferrer')
            } else {
                window.location.href = campaign.link_url
            }
        }
    }

    const goToPrevious = () => {
        setCurrentIndex((prev) => (prev - 1 + campaigns.length) % campaigns.length)
        setIsAutoPlaying(false)
        setTimeout(() => setIsAutoPlaying(true), 10000)
    }

    const goToNext = () => {
        setCurrentIndex((prev) => (prev + 1) % campaigns.length)
        setIsAutoPlaying(false)
        setTimeout(() => setIsAutoPlaying(true), 10000)
    }

    // Touch handlers for swipe
    const minSwipeDistance = 50

    const onTouchStart = (e: React.TouchEvent) => {
        setTouchEnd(null)
        setTouchStart(e.targetTouches[0].clientX)
    }

    const onTouchMove = (e: React.TouchEvent) => {
        setTouchEnd(e.targetTouches[0].clientX)
    }

    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) return
        const distance = touchStart - touchEnd
        const isLeftSwipe = distance > minSwipeDistance
        const isRightSwipe = distance < -minSwipeDistance

        if (isLeftSwipe) {
            goToNext()
        }
        if (isRightSwipe) {
            goToPrevious()
        }
    }

    if (loading) {
        return (
            <section className="w-full py-6 md:py-8 bg-slate-950">
                <div className="w-[90%] mx-auto max-w-7xl">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-32 bg-slate-800 animate-pulse rounded-lg"></div>
                        ))}
                    </div>
                </div>
            </section>
        )
    }

    if (campaigns.length === 0) {
        return null // Don't render anything if no banners
    }

    const slideWidth = 100 / itemsPerView

    return (
        <section 
            className="w-full py-6 md:py-8 bg-slate-950"
        >
            <div className="w-[90%] mx-auto max-w-7xl relative overflow-hidden">
                {/* Carousel Container */}
                <div
                    className="relative overflow-hidden"
                    onTouchStart={onTouchStart}
                    onTouchMove={onTouchMove}
                    onTouchEnd={onTouchEnd}
                >
                    <div
                        className="flex transition-transform duration-700 ease-in-out"
                        style={{
                            transform: `translateX(-${currentIndex * slideWidth}%)`,
                        }}
                    >
                        {campaigns.map((campaign) => {
                            const imageUrl = getImageUrl(campaign.image_url)
                            return (
                                <div
                                    key={campaign.id}
                                    className="flex-shrink-0 px-2"
                                    style={{ width: `${slideWidth}%` }}
                                >
                                    <div
                                        className={`relative rounded-lg overflow-hidden transition-all duration-300 h-32 md:h-40 ${
                                            campaign.link_url ? 'cursor-pointer hover:scale-[1.02] hover:shadow-xl' : ''
                                        }`}
                                        onClick={() => handleBannerClick(campaign)}
                                    >
                                        {imageUrl ? (
                                            <>
                                                <img
                                                    src={imageUrl}
                                                    alt={campaign.name}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        const target = e.target as HTMLImageElement
                                                        target.style.display = 'none'
                                                    }}
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                                            </>
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-blue-900 to-blue-800 flex items-center justify-center">
                                                <div className="text-center px-4">
                                                    <h3 className="text-white font-bold text-sm md:text-base mb-1">
                                                        {campaign.name}
                                                    </h3>
                                                    {campaign.description && (
                                                        <p className="text-white/80 text-xs line-clamp-2">
                                                            {campaign.description}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                        
                                        {/* Content Overlay */}
                                        <div className="absolute inset-0 flex flex-col justify-end p-3 md:p-4">
                                            <h3 className="text-white font-semibold text-sm md:text-base mb-1 line-clamp-1">
                                                {campaign.name}
                                            </h3>
                                            {campaign.description && (
                                                <p className="text-white/90 text-xs line-clamp-2 mb-2">
                                                    {campaign.description}
                                                </p>
                                            )}
                                            {campaign.link_url && (
                                                <span className="inline-flex items-center text-white text-xs font-medium hover:underline">
                                                    View More
                                                    <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                    </svg>
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Navigation Arrows - Always show if there are multiple campaigns */}
                {campaigns.length > 1 && (
                    <>
                        <button
                            onClick={goToPrevious}
                            className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-2 rounded-full transition-all z-10"
                            aria-label="Previous banners"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <button
                            onClick={goToNext}
                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-2 rounded-full transition-all z-10"
                            aria-label="Next banners"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </>
                )}

                {/* Dots Indicator - Always show if there are multiple campaigns */}
                {campaigns.length > 1 && (
                    <div className="flex justify-center gap-2 mt-4">
                        {campaigns.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => {
                                    setCurrentIndex(index)
                                    setIsAutoPlaying(false)
                                    setTimeout(() => setIsAutoPlaying(true), 10000)
                                }}
                                className={`h-2 rounded-full transition-all ${
                                    index === currentIndex
                                        ? 'bg-white w-8'
                                        : 'bg-white/40 w-2 hover:bg-white/60'
                                }`}
                                aria-label={`Go to slide ${index + 1}`}
                            />
                        ))}
                    </div>
                )}
            </div>
        </section>
    )
}

export default SmallSlidingBanners
