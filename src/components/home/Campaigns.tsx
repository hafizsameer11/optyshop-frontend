import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getCampaigns } from '../../services/campaignsService'
import type { Campaign } from '../../services/campaignsService'

const CampaignsComponent: React.FC = () => {
    const { t } = useTranslation()
    const [campaigns, setCampaigns] = useState<Campaign[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let isCancelled = false
        
        const fetchCampaigns = async () => {
            try {
                setLoading(true)
                const data = await getCampaigns(true) // Get only active campaigns
                
                if (isCancelled) return
                
                // Log for debugging
                if (data.length > 0) {
                    console.log(`✅ Loaded ${data.length} active campaign(s) from API`)
                    console.log('Campaigns data:', data)
                } else {
                    console.warn('⚠️ No active campaigns found. Make sure admin has created campaigns with is_active=true')
                }
                
                setCampaigns(data)
            } catch (error) {
                if (!isCancelled) {
                    console.error('❌ Error loading campaigns:', error)
                    setCampaigns([])
                }
            } finally {
                if (!isCancelled) {
                    setLoading(false)
                }
            }
        }

        fetchCampaigns()
        
        return () => {
            isCancelled = true
        }
    }, [])

    // Helper function to handle image URLs (convert full URLs to relative paths for proxy)
    const getImageUrl = (imageUrl: string | null | undefined): string => {
        if (!imageUrl || imageUrl.trim() === '') return ''

        // Clean up the URL - remove any whitespace
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

    if (loading) {
        return (
            <section className="w-full py-8 md:py-12 bg-slate-950">
                <div className="w-[90%] mx-auto max-w-7xl">
                    <div className="h-64 md:h-96 bg-slate-800 animate-pulse rounded-lg"></div>
                </div>
            </section>
        )
    }

    if (campaigns.length === 0) {
        return null // Don't render anything if no campaigns
    }

    const handleCampaignClick = (campaign: Campaign) => {
        if (campaign.link_url) {
            if (campaign.link_url.startsWith('http')) {
            window.open(campaign.link_url, '_blank', 'noopener,noreferrer')
            } else {
                window.location.href = campaign.link_url
            }
        }
    }

    // Hero banner style for first campaign, grid for others
    const firstCampaign = campaigns[0]
    const otherCampaigns = campaigns.slice(1)

    return (
        <section className="w-full py-8 md:py-12 bg-slate-950">
            <div className="w-[90%] mx-auto max-w-7xl">
                {/* Hero Banner for First Campaign */}
                {firstCampaign && (
                    <div className="mb-8 md:mb-12">
                        {firstCampaign.image_url ? (
                            <div
                                className={`relative w-full rounded-lg overflow-hidden transition-all duration-300 ${
                                    firstCampaign.link_url ? 'cursor-pointer hover:shadow-2xl' : ''
                                }`}
                                style={{ minHeight: '400px', maxHeight: '600px' }}
                                onClick={() => handleCampaignClick(firstCampaign)}
                            >
                                {/* Background Image */}
                                <div
                                    className="absolute inset-0 w-full h-full bg-slate-900"
                                    style={{
                                        backgroundImage: `url(${getImageUrl(firstCampaign.image_url)})`,
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center',
                                        backgroundRepeat: 'no-repeat',
                                    }}
                                />
                                
                                {/* Fallback Image Tag */}
                                <img
                                    src={getImageUrl(firstCampaign.image_url)}
                                    alt={firstCampaign.name}
                                    className="absolute inset-0 w-full h-full object-cover"
                                    style={{
                                        objectFit: 'cover',
                                        objectPosition: 'center',
                                    }}
                                    onError={(e) => {
                                        const target = e.target as HTMLImageElement
                                        target.style.display = 'none'
                                    }}
                                />
                                
                                {/* Gradient Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70 z-10" />
                                
                                {/* Content Overlay */}
                                <div className="relative z-20 flex flex-col justify-center items-center text-center px-6 py-12 md:py-16 h-full min-h-[400px]">
                                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
                                        {firstCampaign.name}
                                    </h2>
                                    
                                    {firstCampaign.description && (
                                        <p className="text-lg md:text-xl text-slate-100/90 mb-6 max-w-2xl">
                                            {firstCampaign.description}
                                        </p>
                                    )}
                                    
                                    {firstCampaign.link_url && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                handleCampaignClick(firstCampaign)
                                            }}
                                            className="inline-flex items-center justify-center rounded-full bg-white text-slate-900 px-8 py-3 text-base md:text-lg font-semibold shadow-lg hover:bg-slate-100 transition-all duration-300 hover:scale-105"
                                        >
                                            Shop Now
                                            <svg
                                                className="w-5 h-5 ml-2"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M9 5l7 7-7 7"
                                                />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                            </div>
                        ) : (
                            // Fallback card style if no image
                            <div
                                className={`bg-slate-800 rounded-lg p-8 md:p-12 text-center transition-all duration-300 ${
                                    firstCampaign.link_url ? 'cursor-pointer hover:shadow-xl' : ''
                                }`}
                                onClick={() => handleCampaignClick(firstCampaign)}
                            >
                                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                                    {firstCampaign.name}
                                </h2>
                                
                                {firstCampaign.description && (
                                    <p className="text-lg md:text-xl text-slate-300 mb-6 max-w-2xl mx-auto">
                                        {firstCampaign.description}
                                    </p>
                                )}
                                
                                {firstCampaign.link_url && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            handleCampaignClick(firstCampaign)
                                        }}
                                        className="inline-flex items-center justify-center rounded-full bg-white text-slate-900 px-8 py-3 text-base md:text-lg font-semibold shadow-lg hover:bg-slate-100 transition-all duration-300 hover:scale-105"
                                    >
                                        Shop Now
                                        <svg
                                            className="w-5 h-5 ml-2"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M9 5l7 7-7 7"
                                            />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Grid Layout for Additional Campaigns */}
                {otherCampaigns.length > 0 && (
                    <>
                        <h2 className="text-2xl md:text-3xl font-bold text-white mb-6 md:mb-8 text-center">
                            {t('home.campaigns.title', { defaultValue: 'More Campaigns' })}
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {otherCampaigns.map((campaign) => {
                                const imageUrl = getImageUrl(campaign.image_url)
                                
                                return (
                        <div
                            key={campaign.id}
                                        className={`bg-slate-800 rounded-lg overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-105 ${
                                campaign.link_url ? 'cursor-pointer' : ''
                            }`}
                            onClick={() => handleCampaignClick(campaign)}
                        >
                                        {imageUrl ? (
                                            <div className="relative h-48 bg-slate-700 overflow-hidden">
                                                <img
                                                    src={imageUrl}
                                                    alt={campaign.name}
                                                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                                        onError={(e) => {
                                                        const target = e.target as HTMLImageElement
                                                        target.style.display = 'none'
                                        }}
                                    />
                                </div>
                                        ) : (
                                            <div className="relative h-48 bg-slate-700 flex items-center justify-center">
                                                <span className="text-slate-400 text-sm">No Image</span>
                                </div>
                            )}
                            
                            <div className="p-6">
                                            <h3 className="text-xl font-semibold text-white mb-2">
                                                {campaign.name}
                                </h3>
                                
                                {campaign.description && (
                                                <p className="text-slate-300 text-sm mb-4 line-clamp-3">
                                        {campaign.description}
                                    </p>
                                )}
                                
                                {campaign.link_url && (
                                                <div className="flex items-center text-blue-400 font-medium text-sm hover:text-blue-300 transition-colors">
                                        <span>Learn More</span>
                                        <svg
                                            className="w-4 h-4 ml-2"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M9 5l7 7-7 7"
                                            />
                                        </svg>
                                    </div>
                                )}
                            </div>
                        </div>
                                )
                            })}
                </div>
                    </>
                )}
            </div>
        </section>
    )
}

export default CampaignsComponent

