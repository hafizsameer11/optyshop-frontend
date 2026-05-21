import React, { useEffect, useState } from 'react'
import { getCampaigns } from '../../services/campaignsService'
import type { Campaign } from '../../services/campaignsService'

const DEFAULT_POSITION_PRIORITY = ['small-banners', 'home'] as const

/** Stable reference for `/shop` — pass as `positionPriority` so the effect does not re-run every render. */
export const SHOP_SLIDING_BANNER_POSITION_PRIORITY: readonly string[] = ['shop', 'small-banners', 'home']

const MAX_BANNERS = 6

type SmallSlidingBannersProps = {
    /** Try these `position` values in order; first non-empty list wins (max 6 items). */
    positionPriority?: readonly string[]
}

const SmallSlidingBanners: React.FC<SmallSlidingBannersProps> = ({
    positionPriority = DEFAULT_POSITION_PRIORITY,
}) => {
    const [campaigns, setCampaigns] = useState<Campaign[]>([])
    const [loading, setLoading] = useState(true)


    // Fetch campaigns
    useEffect(() => {
        let isCancelled = false
        
        const fetchBanners = async () => {
            try {
                setLoading(true)
                let bannersToShow: Campaign[] = []
                for (const pos of positionPriority) {
                    const data = await getCampaigns(true, pos)
                    if (data.length > 0) {
                        bannersToShow = data.slice(0, MAX_BANNERS)
                        break
                    }
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
    }, [positionPriority])


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


    const renderBannerCard = (campaign: Campaign, key: string) => {
        const imageUrl = getImageUrl(campaign.image_url)
        return (
            <div key={key} className="w-[min(280px,78vw)] shrink-0 snap-center sm:w-64 md:w-72 lg:w-80">
                <div
                    className={`relative h-28 overflow-hidden rounded-lg shadow-md transition-all duration-300 sm:h-32 md:h-36 ${
                        campaign.link_url ? 'cursor-pointer hover:shadow-lg active:scale-[0.99]' : ''
                    }`}
                    onClick={() => handleBannerClick(campaign)}
                >
                    {imageUrl ? (
                        <img
                            src={imageUrl}
                            alt={campaign.name}
                            className="h-full w-full object-cover object-center"
                            loading="lazy"
                            decoding="async"
                            onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.style.display = 'none'
                            }}
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-100 to-blue-200 px-3">
                            <div className="text-center">
                                <h3 className="mb-1 text-sm font-bold text-gray-800 md:text-base">
                                    {campaign.name}
                                </h3>
                                {campaign.description && (
                                    <p className="line-clamp-2 text-xs text-gray-600">{campaign.description}</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        )
    }

    if (loading) {
        return (
            <section className="w-full bg-white py-5 md:py-8">
                <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:w-[90%] lg:px-0">
                    <div className="flex gap-3 overflow-hidden">
                        {[1, 2, 3].map((i) => (
                            <div
                                key={i}
                                className="h-28 w-[min(280px,78vw)] shrink-0 animate-pulse rounded-lg bg-gray-200 sm:h-32"
                            />
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
        <section className="w-full max-w-[100vw] overflow-hidden bg-white py-5 md:py-8">
            <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:w-[90%] lg:px-0">
                {/* Mobile / tablet: horizontal swipe (reliable on small screens) */}
                <div className="-mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto overflow-y-hidden pb-2 scrollbar-hide md:hidden">
                    {campaigns.map((campaign) => renderBannerCard(campaign, `mobile-${campaign.id}`))}
                </div>

                {/* Desktop: continuous marquee */}
                <div className="hidden overflow-x-hidden py-2 md:block">
                    <div className="marquee-track flex items-center gap-4">
                        {track.map((campaign, index) =>
                            renderBannerCard(campaign, `desk-${campaign.id}-${index}`)
                        )}
                    </div>
                </div>
            </div>
        </section>
    )
}

export default SmallSlidingBanners
