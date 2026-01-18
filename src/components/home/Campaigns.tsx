import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getCampaigns } from '../../services/campaignsService'
import type { Campaign } from '../../services/campaignsService'

interface CampaignsComponentProps {
    position?: string | null; // Optional position filter (e.g., 'home', 'shop')
    variant?: 'full' | 'compact'; // Display variant: full (homepage) or compact (shop page)
}

const CampaignsComponent: React.FC<CampaignsComponentProps> = ({ position = null, variant = 'full' }) => {
    const { t } = useTranslation()
    const [campaigns, setCampaigns] = useState<Campaign[]>([])
    const [loading, setLoading] = useState(true)
    const [currentIndex, setCurrentIndex] = useState(0)
    const [isAutoPlaying, setIsAutoPlaying] = useState(true)

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

    // Auto-rotate campaigns if there are multiple
    // This hook must be called before any early returns to maintain hook order
    useEffect(() => {
        if (campaigns.length <= 1 || !isAutoPlaying) return

        const interval = setInterval(() => {
            setCurrentIndex((prev) => {
                // Smooth infinite loop - automatically wraps to 0 when reaching the end
                return (prev + 1) % campaigns.length
            })
        }, 5000) // Change campaign every 5 seconds

        return () => clearInterval(interval)
    }, [campaigns.length, isAutoPlaying])

    // Reset to first slide when campaigns change or are loaded
    useEffect(() => {
        if (campaigns.length > 0) {
            setCurrentIndex(0)
            setIsAutoPlaying(true) // Ensure auto-play is enabled when campaigns load
        }
    }, [campaigns.length])

    if (loading) {
        return (
            <section className="w-full py-8 md:py-12 bg-slate-950">
                <div className="w-[90%] mx-auto max-w-7xl">
                    <div className="h-64 md:h-96 bg-slate-800 animate-pulse rounded-lg"></div>
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

    const goToSlide = (index: number) => {
        setCurrentIndex(index)
        setIsAutoPlaying(false) // Pause auto-play when user manually navigates
        // Resume auto-play after 10 seconds
        setTimeout(() => setIsAutoPlaying(true), 10000)
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

    // Hero banner style for current campaign, grid for others
    const currentCampaign = campaigns[currentIndex]
    const otherCampaigns = campaigns.filter((_, index) => index !== currentIndex)

    // Compact variant for shop page with auto-scroll
    if (variant === 'compact' && campaigns.length > 0) {
        return (
            <section
                className="w-full py-6 md:py-8 bg-white relative overflow-hidden"
                onMouseEnter={() => setIsAutoPlaying(false)}
                onMouseLeave={() => setIsAutoPlaying(true)}
            >
                <div className="w-[90%] mx-auto max-w-7xl relative overflow-hidden">
                    {/* Auto-scrolling container */}
                    <div
                        className="flex transition-transform duration-700 ease-in-out"
                        style={{
                            transform: `translateX(-${currentIndex * 100}%)`
                        }}
                    >
                        {campaigns.map((campaign) => {
                            const imageUrl = getImageUrl(campaign.image_url)
                            return (
                                <div
                                    key={campaign.id}
                                    className={`flex-shrink-0 w-full rounded-lg overflow-hidden transition-all duration-300 ${campaign.link_url ? 'cursor-pointer hover:shadow-xl hover:scale-[1.01]' : ''
                                        }`}
                                    onClick={() => handleCampaignClick(campaign)}
                                >
                                    {imageUrl ? (
                                        <div className="relative w-full h-64 md:h-80 lg:h-96 bg-white overflow-hidden">
                                            <img
                                                src={imageUrl}
                                                alt={campaign.name}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    const target = e.target as HTMLImageElement
                                                    target.style.display = 'none'
                                                }}
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
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
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                handleCampaignClick(campaign)
                                                            }}
                                                            className="inline-flex items-center bg-blue-950 text-white px-4 py-1.5 rounded-full font-semibold hover:bg-black transition-colors text-xs md:text-sm"
                                                        >
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
                                        <div className="bg-gradient-to-r from-blue-900 to-blue-800 p-4 md:p-6 rounded-lg">
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
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        handleCampaignClick(campaign)
                                                    }}
                                                    className="inline-flex items-center bg-white text-blue-950 px-4 py-1.5 rounded-full font-semibold hover:bg-blue-50 transition-colors text-xs md:text-sm"
                                                >
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

                    {/* Navigation arrows */}
                    {campaigns.length > 1 && (
                        <>
                            <button
                                onClick={goToPrevious}
                                className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-2 rounded-full transition-all z-10"
                                aria-label="Previous campaign"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <button
                                onClick={goToNext}
                                className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-2 rounded-full transition-all z-10"
                                aria-label="Next campaign"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </>
                    )}

                    {/* Dots indicator */}
                    {campaigns.length > 1 && (
                        <div className="flex justify-center gap-2 mt-4">
                            {campaigns.map((_, index) => (
                                <button
                                    key={index}
                                    onClick={() => goToSlide(index)}
                                    className={`h-2 rounded-full transition-all ${index === currentIndex
                                        ? 'bg-white w-8'
                                        : 'bg-white/40 w-2 hover:bg-white/60'
                                        }`}
                                    aria-label={`Go to campaign ${index + 1}`}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </section>
        )
    }

    // Full variant for homepage with auto-scroll
    return (
        <section
            className="w-full py-8 md:py-12 bg-white"
            onMouseEnter={() => setIsAutoPlaying(false)}
            onMouseLeave={() => setIsAutoPlaying(true)}
        >
            <div className="w-[90%] mx-auto max-w-7xl">
                {/* Hero Banner for Current Campaign */}
                {currentCampaign && (
                    <div className="mb-8 md:mb-12 relative">
                        <div className="relative overflow-hidden rounded-lg">
                            <div
                                className="flex transition-transform duration-700 ease-in-out will-change-transform"
                                style={{
                                    transform: `translateX(-${currentIndex * 100}%)`
                                }}
                            >
                                {campaigns.map((campaign) => (
                                    <div
                                        key={campaign.id}
                                        className="flex-shrink-0 w-full"
                                    >
                                        {campaign.image_url ? (
                                            <div
                                                className={`relative w-full rounded-lg overflow-hidden transition-all duration-300 ${campaign.link_url ? 'cursor-pointer hover:shadow-2xl' : ''
                                                    }`}
                                                style={{ minHeight: '300px', maxHeight: '400px' }}
                                                onClick={() => handleCampaignClick(campaign)}
                                            >
                                                {/* Background Image */}
                                                <div
                                                    className="absolute inset-0 w-full h-full bg-slate-900"
                                                    style={{
                                                        backgroundImage: `url(${getImageUrl(campaign.image_url)})`,
                                                        backgroundSize: 'cover',
                                                        backgroundPosition: 'center',
                                                        backgroundRepeat: 'no-repeat',
                                                    }}
                                                />

                                                {/* Fallback Image Tag */}
                                                <img
                                                    src={getImageUrl(campaign.image_url)}
                                                    alt={campaign.name}
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
                                                <div className="relative z-20 flex flex-col justify-center items-center text-center px-6 py-8 md:py-10 h-full min-h-[300px]">
                                                    <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-3">
                                                        {campaign.name}
                                                    </h2>

                                                    {campaign.description && (
                                                        <p className="text-base md:text-lg text-slate-100/90 mb-4 max-w-2xl">
                                                            {campaign.description}
                                                        </p>
                                                    )}

                                                    {/* Date Range */}
                                                    {(campaign.starts_at || campaign.ends_at) && (
                                                        <div className="flex items-center justify-center gap-2 mb-4 text-sm text-white/80">
                                                            {campaign.starts_at && (
                                                                <span className="bg-black/40 px-3 py-1 rounded-full">
                                                                    Start: {new Date(campaign.starts_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                                </span>
                                                            )}
                                                            {campaign.starts_at && campaign.ends_at && (
                                                                <span className="text-white/60">-</span>
                                                            )}
                                                            {campaign.ends_at && (
                                                                <span className="bg-black/40 px-3 py-1 rounded-full">
                                                                    End: {new Date(campaign.ends_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}

                                                    {campaign.link_url && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                handleCampaignClick(campaign)
                                                            }}
                                                            className="inline-flex items-center justify-center rounded-full bg-white text-slate-900 px-6 py-2 text-sm md:text-base font-semibold shadow-lg hover:bg-slate-100 transition-all duration-300 hover:scale-105"
                                                        >
                                                            Shop Now
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
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
                                            // Fallback card style if no image
                                            <div
                                                className={`bg-slate-800 rounded-lg p-6 md:p-8 text-center transition-all duration-300 ${campaign.link_url ? 'cursor-pointer hover:shadow-xl' : ''
                                                    }`}
                                                style={{ minHeight: '300px' }}
                                                onClick={() => handleCampaignClick(campaign)}
                                            >
                                                <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
                                                    {campaign.name}
                                                </h2>

                                                {campaign.description && (
                                                    <p className="text-base md:text-lg text-slate-300 mb-4 max-w-2xl mx-auto">
                                                        {campaign.description}
                                                    </p>
                                                )}

                                                {/* Date Range */}
                                                {(campaign.starts_at || campaign.ends_at) && (
                                                    <div className="flex items-center justify-center gap-2 mb-4 text-sm text-white/80">
                                                        {campaign.starts_at && (
                                                            <span className="bg-slate-700/60 px-3 py-1 rounded-full">
                                                                Start: {new Date(campaign.starts_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                            </span>
                                                        )}
                                                        {campaign.starts_at && campaign.ends_at && (
                                                            <span className="text-white/60">-</span>
                                                        )}
                                                        {campaign.ends_at && (
                                                            <span className="bg-slate-700/60 px-3 py-1 rounded-full">
                                                                End: {new Date(campaign.ends_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}

                                                {campaign.link_url && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            handleCampaignClick(campaign)
                                                        }}
                                                        className="inline-flex items-center justify-center rounded-full bg-white text-slate-900 px-6 py-2 text-sm md:text-base font-semibold shadow-lg hover:bg-slate-100 transition-all duration-300 hover:scale-105"
                                                    >
                                                        Shop Now
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
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Navigation arrows */}
                            {campaigns.length > 1 && (
                                <>
                                    <button
                                        onClick={goToPrevious}
                                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-3 rounded-full transition-all z-20"
                                        aria-label="Previous campaign"
                                    >
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={goToNext}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-3 rounded-full transition-all z-20"
                                        aria-label="Next campaign"
                                    >
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </button>
                                </>
                            )}

                            {/* Dots indicator */}
                            {campaigns.length > 1 && (
                                <div className="flex justify-center gap-2 mt-6">
                                    {campaigns.map((_, index) => (
                                        <button
                                            key={index}
                                            onClick={() => goToSlide(index)}
                                            className={`h-2 rounded-full transition-all ${index === currentIndex
                                                ? 'bg-white w-8'
                                                : 'bg-white/40 w-2 hover:bg-white/60'
                                                }`}
                                            aria-label={`Go to campaign ${index + 1}`}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Grid Layout for Additional Campaigns */}
                {otherCampaigns.length > 0 && (
                    <>
                        <h2 className="text-2xl md:text-3xl font-bold text-blue-950 mb-6 md:mb-8 text-center">
                            {t('home.campaigns.title', { defaultValue: 'More Campaigns' })}
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {otherCampaigns.map((campaign) => {
                                const imageUrl = getImageUrl(campaign.image_url)

                                return (
                                    <div
                                        key={campaign.id}
                                        className={`bg-slate-800 rounded-lg overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-[1.02] ${campaign.link_url ? 'cursor-pointer' : ''
                                            }`}
                                        onClick={() => handleCampaignClick(campaign)}
                                    >
                                        {imageUrl ? (
                                            <div className="relative h-32 bg-slate-700 overflow-hidden">
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
                                            <div className="relative h-32 bg-slate-700 flex items-center justify-center">
                                                <span className="text-slate-400 text-xs">No Image</span>
                                            </div>
                                        )}

                                        <div className="p-4">
                                            <h3 className="text-lg font-semibold text-white mb-2">
                                                {campaign.name}
                                            </h3>

                                            {campaign.description && (
                                                <p className="text-slate-300 text-xs mb-3 line-clamp-2">
                                                    {campaign.description}
                                                </p>
                                            )}

                                            {/* Date Range */}
                                            {(campaign.starts_at || campaign.ends_at) && (
                                                <div className="flex flex-wrap items-center gap-1.5 mb-3 text-xs text-white/70">
                                                    {campaign.starts_at && (
                                                        <span className="bg-slate-700/60 px-2 py-0.5 rounded">
                                                            {new Date(campaign.starts_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                        </span>
                                                    )}
                                                    {campaign.starts_at && campaign.ends_at && (
                                                        <span className="text-white/50">-</span>
                                                    )}
                                                    {campaign.ends_at && (
                                                        <span className="bg-slate-700/60 px-2 py-0.5 rounded">
                                                            {new Date(campaign.ends_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                        </span>
                                                    )}
                                                </div>
                                            )}

                                            {campaign.link_url && (
                                                <div className="flex items-center text-blue-400 font-medium text-xs hover:text-blue-300 transition-colors">
                                                    <span>Learn More</span>
                                                    <svg
                                                        className="w-3 h-3 ml-1.5"
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

