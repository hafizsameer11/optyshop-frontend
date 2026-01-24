import React, { useEffect, useState } from 'react'
import { getCampaigns } from '../../services/campaignsService'
import type { Campaign } from '../../services/campaignsService'

interface CampaignsComponentProps {
    position?: string | null; // Optional position filter (e.g., 'home', 'shop')
    variant?: 'full' | 'compact'; // Display variant: full (homepage) or compact (shop page)
}

const CampaignsComponent: React.FC<CampaignsComponentProps> = ({ position = null, variant = 'full' }) => {
    const [campaigns, setCampaigns] = useState<Campaign[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let isCancelled = false

        const fetchCampaigns = async () => {
            try {
                setLoading(true)
                const data = await getCampaigns(true, position) // Get active campaigns with optional position filter

                if (isCancelled) return

                // Log for debugging
                if (data.length > 0) {
                    console.log(`✅ [Campaigns Component] Loaded ${data.length} active campaign(s) from API (position filter: ${position || 'all'})`)
                    console.log('Campaigns data:', data)
                    data.forEach((campaign, index) => {
                        console.log(`  Campaign ${index + 1}:`, {
                            id: campaign.id,
                            name: campaign.name,
                            position: campaign.position === null ? 'null' : campaign.position === undefined ? 'undefined' : campaign.position,
                            is_active: campaign.is_active,
                            image_url: campaign.image_url ? 'present' : 'missing',
                            link_url: campaign.link_url || 'none',
                            starts_at: campaign.starts_at,
                            ends_at: campaign.ends_at
                        })
                    })
                } else {
                    // Try fetching without position filter to see if campaigns exist
                    const allCampaignsTest = await getCampaigns(true, null)
                    console.warn(`⚠️ [Campaigns Component] No active campaigns found (position filter: ${position || 'all'})`)
                    console.warn(`   All campaigns without position filter: ${allCampaignsTest.length}`)
                    if (allCampaignsTest.length > 0) {
                        console.warn(`   Campaigns exist but filtered out. Their positions:`,
                            allCampaignsTest.map(c => ({
                                id: c.id,
                                name: c.name,
                                position: c.position === null ? 'null' : c.position === undefined ? 'undefined (missing)' : `"${c.position}"`
                            }))
                        )
                        console.warn(`   Position filter: "${position || 'none'}"`)
                    }
                    console.warn(`   Make sure admin has created campaigns with:`)
                    console.warn(`   - is_active=true`)
                    if (position) {
                        console.warn(`   - position="${position}" OR position=null OR no position field (missing/undefined)`)
                    }
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
    }, [position])

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

    // Reset auto-play when campaigns change or are loaded
    useEffect(() => {
        if (campaigns.length > 0) {
            // Auto-play is handled by CSS animation
        }
    }, [campaigns.length])

    if (loading) {
        return (
            <section className="w-full py-8 md:py-12 bg-white">
                <div className="w-[90%] mx-auto max-w-7xl">
                    <div className="h-64 md:h-96 bg-slate-200 animate-pulse rounded-lg shadow-lg"></div>
                </div>
            </section>
        )
    }

    // Debug: Show message if no campaigns (only in dev mode)
    if (campaigns.length === 0) {
        if (import.meta.env.DEV) {
            return (
                <section className="w-full py-4 bg-yellow-50 border-2 border-yellow-300">
                    <div className="w-[90%] mx-auto max-w-7xl text-center">
                        <p className="text-yellow-800 font-semibold">
                            ⚠️ No campaigns to display (position filter: {position || 'all'})
                        </p>
                        <p className="text-yellow-600 text-sm mt-2">
                            Check browser console for detailed logs
                        </p>
                    </div>
                </section>
            )
        }
        return null // Don't render anything if no campaigns (production)
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

    // Continuous scrolling strip implementation

    // Compact variant for shop page with continuous scrolling
    if (variant === 'compact' && campaigns.length > 0) {
        return (
            <section
                className="w-full py-6 md:py-8 bg-white relative overflow-hidden shadow-inner"
            >
                <div className="w-[90%] mx-auto max-w-7xl">
                    {/* Continuous Scrolling Campaign Strip */}
                    <div className="relative overflow-hidden">
                        <div 
                            className="flex animate-scroll"
                            style={{
                                animation: 'scroll 25s linear infinite',
                                width: `${campaigns.length * 100}%`
                            }}
                        >
                            {/* Render campaigns twice for seamless loop */}
                            {[...campaigns, ...campaigns].map((campaign, index) => {
                                const imageUrl = getImageUrl(campaign.image_url)
                                return (
                                    <div
                                        key={`${campaign.id}-${index}`}
                                        className={`flex-shrink-0 w-full px-2 ${campaign.link_url ? 'cursor-pointer' : ''}`}
                                        style={{ width: `${100 / campaigns.length}%` }}
                                        onClick={() => handleCampaignClick(campaign)}
                                    >
                                        {imageUrl ? (
                                            <div className="relative w-full h-48 md:h-60 lg:h-72 bg-gray-100 rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow">
                                                <img
                                                    src={imageUrl}
                                                    alt={campaign.name}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        const target = e.target as HTMLImageElement
                                                        target.style.display = 'none'
                                                    }}
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-r from-slate-800/80 via-slate-800/50 to-transparent" />
                                                <div className="absolute inset-0 flex items-center px-4 md:px-6">
                                                    <div className="max-w-xl w-full">
                                                        <h3 className="text-lg md:text-xl font-bold text-white mb-1">
                                                            {campaign.name}
                                                        </h3>
                                                        {campaign.description && (
                                                            <p className="text-white/90 text-xs md:text-sm line-clamp-1 mb-2">
                                                                {campaign.description}
                                                            </p>
                                                        )}
                                                        {/* Date Range for Compact */}
                                                        {(campaign.starts_at || campaign.ends_at) && (
                                                            <div className="flex items-center gap-1.5 mb-2 text-xs text-white/80">
                                                                {campaign.starts_at && (
                                                                    <span className="bg-black/40 px-2 py-0.5 rounded">
                                                                        {new Date(campaign.starts_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                                                                    </span>
                                                                )}
                                                                {campaign.starts_at && campaign.ends_at && (
                                                                    <span className="text-white/60">-</span>
                                                                )}
                                                                {campaign.ends_at && (
                                                                    <span className="bg-black/40 px-2 py-0.5 rounded">
                                                                        {new Date(campaign.ends_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        )}
                                                        {campaign.link_url && (
                                                            <button className="inline-flex items-center bg-slate-800 text-white px-4 py-1.5 rounded-full font-semibold hover:bg-slate-900 transition-colors text-xs md:text-sm shadow-md">
                                                                Shop Now
                                                                <svg className="w-3 h-3 ml-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                                </svg>
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="bg-gradient-to-r from-slate-700 to-slate-600 p-4 md:p-6 rounded-lg shadow-lg">
                                                <h3 className="text-lg md:text-xl font-bold text-white mb-2">
                                                    {campaign.name}
                                                </h3>
                                                {campaign.description && (
                                                    <p className="text-white/90 text-xs md:text-sm mb-3">{campaign.description}</p>
                                                )}
                                                {/* Date Range for Compact (no image) */}
                                                {(campaign.starts_at || campaign.ends_at) && (
                                                    <div className="flex flex-wrap items-center gap-1.5 mb-3 text-xs text-white/80">
                                                        {campaign.starts_at && (
                                                            <span className="bg-black/40 px-2 py-0.5 rounded">
                                                                {new Date(campaign.starts_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                                                            </span>
                                                        )}
                                                        {campaign.starts_at && campaign.ends_at && (
                                                            <span className="text-white/60">-</span>
                                                        )}
                                                        {campaign.ends_at && (
                                                            <span className="bg-black/40 px-2 py-0.5 rounded">
                                                                {new Date(campaign.ends_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                                {campaign.link_url && (
                                                    <button className="inline-flex items-center bg-white text-slate-800 px-4 py-1.5 rounded-full font-semibold hover:bg-slate-100 transition-colors text-xs md:text-sm shadow-md">
                                                        Shop Now
                                                        <svg className="w-3 h-3 ml-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                        </svg>
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
                
                {/* Add CSS for continuous scrolling animation */}
                <style>{`
                    @keyframes scroll {
                        0% {
                            transform: translateX(0);
                        }
                        100% {
                            transform: translateX(-50%);
                        }
                    }
                    
                    .animate-scroll {
                        display: flex;
                    }
                    
                    .animate-scroll:hover {
                        animation-play-state: paused;
                    }
                `}</style>
            </section>
        )
    }

    // Continuous scrolling strip implementation
    return (
        <section
            className="w-full py-8 md:py-12 bg-white shadow-inner"
        >
            <div className="w-[90%] mx-auto max-w-7xl">
                {/* Continuous Scrolling Campaign Strip */}
                <div className="relative overflow-hidden">
                    <div 
                        className="flex animate-scroll"
                        style={{
                            animation: 'scroll 30s linear infinite',
                            width: `${campaigns.length * 100}%`
                        }}
                    >
                        {/* Render campaigns twice for seamless loop */}
                        {[...campaigns, ...campaigns].map((campaign, index) => {
                            const imageUrl = getImageUrl(campaign.image_url)
                            return (
                                <div
                                    key={`${campaign.id}-${index}`}
                                    className={`flex-shrink-0 w-full px-2 ${campaign.link_url ? 'cursor-pointer' : ''}`}
                                    style={{ width: `${100 / campaigns.length}%` }}
                                    onClick={() => handleCampaignClick(campaign)}
                                >
                                    {imageUrl ? (
                                        <div className="relative w-full h-48 md:h-64 lg:h-80 bg-gray-100 rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow">
                                            <img
                                                src={imageUrl}
                                                alt={campaign.name}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    const target = e.target as HTMLImageElement
                                                    target.style.display = 'none'
                                                }}
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                                            <div className="absolute bottom-0 left-0 right-0 p-4">
                                                <h3 className="text-white font-bold text-lg md:text-xl mb-1">
                                                    {campaign.name}
                                                </h3>
                                                {campaign.description && (
                                                    <p className="text-white/90 text-sm mb-2 line-clamp-2">
                                                        {campaign.description}
                                                    </p>
                                                )}
                                                {campaign.link_url && (
                                                    <button className="inline-flex items-center bg-white text-gray-900 px-3 py-1 rounded-full text-sm font-semibold hover:bg-gray-100 transition-colors">
                                                        Shop Now
                                                        <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                        </svg>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="bg-gray-200 rounded-lg p-6 text-center h-48 md:h-64 lg:h-80 flex flex-col justify-center">
                                            <h3 className="text-gray-800 font-bold text-lg md:text-xl mb-2">
                                                {campaign.name}
                                            </h3>
                                            {campaign.description && (
                                                <p className="text-gray-600 text-sm mb-3">
                                                    {campaign.description}
                                                </p>
                                            )}
                                            {campaign.link_url && (
                                                <button className="inline-flex items-center bg-gray-800 text-white px-3 py-1 rounded-full text-sm font-semibold hover:bg-gray-900 transition-colors">
                                                    Shop Now
                                                    <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                    </svg>
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
            
            {/* Add CSS for continuous scrolling animation */}
            <style>{`
                @keyframes scroll {
                    0% {
                        transform: translateX(0);
                    }
                    100% {
                        transform: translateX(-50%);
                    }
                }
                
                .animate-scroll {
                    display: flex;
                }
                
                .animate-scroll:hover {
                    animation-play-state: paused;
                }
            `}</style>
        </section>
    )
}

export default CampaignsComponent

