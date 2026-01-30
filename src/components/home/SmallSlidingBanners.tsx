import React, { useEffect, useState } from 'react'
import { getCampaigns } from '../../services/campaignsService'
import type { Campaign } from '../../services/campaignsService'

const SmallSlidingBanners: React.FC = () => {
    const [campaigns, setCampaigns] = useState<Campaign[]>([])
    const [loading, setLoading] = useState(true)


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

    // Duplicate the campaigns array for seamless infinite scroll
    const track = [...campaigns, ...campaigns]

    return (
        <section 
            className="w-full py-6 md:py-8 bg-slate-950"
        >
            <div className="w-[90%] mx-auto max-w-7xl">
                {/* Auto-moving banners carousel - continuous scroll like brands */}
                <div className="overflow-hidden py-2">
                    <div className="flex gap-4 items-center marquee-track">
                        {track.map((campaign, index) => {
                            const imageUrl = getImageUrl(campaign.image_url)
                            return (
                                <div
                                    key={`${campaign.id}-${index}`}
                                    className="flex-shrink-0 w-72 md:w-80"
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
                                                {/* Removed gradient overlay for clean image display */}
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
                                        
                                        {/* Content Overlay - Removed for clean image display */}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        </section>
    )
}

export default SmallSlidingBanners
