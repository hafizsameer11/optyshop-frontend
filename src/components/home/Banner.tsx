import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getBanners } from '../../services/bannersService'
import type { Banner } from '../../services/bannersService'
import Navbar from '../Navbar'

interface BannerMeta {
    description?: string
    button1?: {
        text: string
        link?: string
        action?: 'scroll' | 'navigate' | 'link'
    }
    button2?: {
        text: string
        link?: string
        action?: 'scroll' | 'navigate' | 'link'
    }
}

const BannerComponent: React.FC = () => {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const [banners, setBanners] = useState<Banner[]>([])
    const [loading, setLoading] = useState(true)
    const [currentIndex, setCurrentIndex] = useState(0)
    const [isAutoPlaying, setIsAutoPlaying] = useState(true)

    useEffect(() => {
        let isCancelled = false
        
        const fetchBanners = async () => {
            try {
                setLoading(true)
                // Fetch all active banners from admin panel
                // Pass undefined to get all active banners regardless of position
                const data = await getBanners(undefined)
                
                if (isCancelled) return
                
                setBanners(data)
                
                // Log for debugging
                if (data.length > 0) {
                    console.log(`Loaded ${data.length} banner(s) from admin panel`)
                } else {
                    console.warn('No active banners found in admin panel')
                }
            } catch (error) {
                if (!isCancelled) {
                    console.error('Error loading banners from admin panel:', error)
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
    }, [])

    // Auto-rotate banners if there are multiple
    useEffect(() => {
        if (banners.length <= 1 || !isAutoPlaying) return

        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % banners.length)
        }, 5000) // Change banner every 5 seconds

        return () => clearInterval(interval)
    }, [banners.length, isAutoPlaying])

    if (loading) {
        return (
            <div className="relative text-white" style={{ height: '469px' }}>
                <Navbar />
                <div className="w-full bg-gray-200 animate-pulse flex items-center justify-center" style={{ height: '469px' }}>
                <div className="text-gray-400">{t('home.banner.loading')}</div>
                </div>
            </div>
        )
    }

    if (banners.length === 0) {
        return null // Don't render anything if no banners
    }

    // Helper function to handle image URLs (convert full URLs to relative paths for proxy)
    const getImageUrl = (imageUrl: string | null | undefined): string => {
        // Fallback to a default hero image if none is provided by admin
        const fallback = '/assets/images/banner CES-Frame Removal-desktop.webp'

        if (!imageUrl || imageUrl.trim() === '') return fallback

        // Clean up the URL - remove any whitespace
        const cleanedUrl = imageUrl.trim()

        // If it's a full URL with localhost:5000, convert to relative path (dev environment)
        if (cleanedUrl.includes('http://localhost:5000') || cleanedUrl.includes('http://127.0.0.1:5000')) {
            try {
                const url = new URL(cleanedUrl)
                return url.pathname || fallback
            } catch {
                // If URL parsing fails, try to extract path manually
                const pathMatch = cleanedUrl.match(/\/\/[^\/]+(\/.*)/)
                if (pathMatch && pathMatch[1]) {
                    return pathMatch[1]
                }
                return fallback
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
                return fallback
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
        return cleanedUrl || fallback
    }

    // Parse meta field for banner metadata (description, buttons, etc.)
    const parseMeta = (meta: unknown): BannerMeta | null => {
        if (!meta) return null

        // If meta is already an object, assume it matches BannerMeta shape
        if (typeof meta === 'object') {
            return meta as BannerMeta
        }

        if (typeof meta === 'string') {
            try {
                // Try to parse JSON string
                return JSON.parse(meta) as BannerMeta
            } catch {
                // If meta is not JSON, treat it as description text
                return { description: meta }
            }
        }

        return null
    }

    // Handle button click
    const handleButtonClick = (button: BannerMeta['button1'] | BannerMeta['button2']) => {
        if (!button || !button.link) return

        const action = button.action || 'link'
        
        if (action === 'scroll') {
            // Scroll to element (e.g., #live-demo)
            setTimeout(() => {
                const element = document.getElementById(button.link!.replace('#', ''))
                if (element) {
                    const offset = 100
                    const elementPosition = element.getBoundingClientRect().top
                    const offsetPosition = elementPosition + window.pageYOffset - offset
                    window.scrollTo({
                        top: offsetPosition,
                        behavior: 'smooth'
                    })
                }
            }, 50)
        } else if (action === 'navigate') {
            // Navigate using React Router
            navigate(button.link)
        } else {
            // External link or default
            if (button.link.startsWith('http')) {
                window.open(button.link, '_blank', 'noopener,noreferrer')
            } else {
                window.location.href = button.link
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
        setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length)
        setIsAutoPlaying(false)
        setTimeout(() => setIsAutoPlaying(true), 10000)
    }

    const goToNext = () => {
        setCurrentIndex((prev) => (prev + 1) % banners.length)
        setIsAutoPlaying(false)
        setTimeout(() => setIsAutoPlaying(true), 10000)
    }

    return (
        <div className="relative text-white w-full" style={{ height: '469px', maxWidth: '1300px', margin: '0 auto' }}>
            {/* Content */}
            <div className="relative z-10 flex flex-col w-full" style={{ height: '469px' }}>
                <Navbar />

                {/* Banner Slider Container */}
                <div className="relative flex-1 overflow-hidden w-full" style={{ height: '469px' }}>
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
                            className="min-w-full h-full relative cursor-pointer flex-shrink-0 w-full"
                            onClick={() => {
                                // Only handle banner click if there's a link_url and no buttons
                                const meta = parseMeta(banner.meta)
                                if (banner.link_url && !meta?.button1 && !meta?.button2) {
                                    if (banner.link_url.startsWith('http')) {
                                        window.open(banner.link_url, '_blank', 'noopener,noreferrer')
                                    } else {
                                        navigate(banner.link_url)
                                    }
                                }
                            }}
                            style={{
                                height: '469px',
                                width: '100%',
                                maxWidth: '1300px',
                                margin: '0 auto',
                            }}
                        >
                            {/* Background Image - Primary method */}
                            <div
                                className="absolute inset-0 w-full h-full bg-slate-900"
                                style={{
                                    backgroundImage: `url(${imageUrl})`,
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
                                    backgroundRepeat: 'no-repeat',
                                }}
                            />
                            
                            {/* Fallback Image Tag - Ensures display even if background-image fails */}
                            <img
                                src={imageUrl}
                                alt={banner.title || 'Banner'}
                                className="absolute inset-0 w-full h-full object-cover"
                                style={{
                                    objectFit: 'cover',
                                    objectPosition: 'center',
                                }}
                                onError={(e) => {
                                    // If image fails to load, hide the img tag and rely on background
                                    const target = e.target as HTMLImageElement
                                    target.style.display = 'none'
                                }}
                            />
                            
                            {/* Overlay for better text readability */}
                                    <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-black/80 z-10" />

                            {/* Banner Content */}
                                    <main className="relative z-20 flex-1 flex items-center justify-center px-6 lg:px-20 h-full" style={{ height: '469px' }}>
                                        <div className="max-w-3xl text-center">
                            {banner.title && (
                                                <h1 className="text-3xl sm:text-4xl lg:text-6xl font-semibold leading-tight">
                                                    <span className="block">{banner.title}</span>
                                                    {bannerMeta?.description && (
                                                        <span className="block font-light italic mt-1 text-2xl sm:text-3xl lg:text-5xl">
                                                            {bannerMeta.description}
                                                        </span>
                                                    )}
                                                </h1>
                                            )}

                                            {bannerMeta?.description && !banner.title && (
                                                <p className="mt-6 text-sm sm:text-base lg:text-lg text-slate-100/90">
                                                    {bannerMeta.description}
                                                </p>
                                            )}

                                            {/* Buttons - Always display */}
                                            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
                                                {/* Button 1 - Primary button */}
                                                {bannerMeta?.button1 ? (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            handleButtonClick(bannerMeta.button1)
                                                        }}
                                                        className="inline-flex justify-center rounded-full bg-white text-slate-900 px-8 py-3 text-sm sm:text-base font-semibold shadow-lg hover:bg-slate-100 transition-colors cursor-pointer"
                                                    >
                                                        {bannerMeta.button1.text}
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            // Default action: scroll to live demo
                                                            setTimeout(() => {
                                                                const element = document.getElementById('live-demo')
                                                                if (element) {
                                                                    const offset = 100
                                                                    const elementPosition = element.getBoundingClientRect().top
                                                                    const offsetPosition = elementPosition + window.pageYOffset - offset
                                                                    window.scrollTo({
                                                                        top: offsetPosition,
                                                                        behavior: 'smooth'
                                                                    })
                                                                }
                                                            }, 50)
                                                        }}
                                                        className="inline-flex justify-center rounded-full bg-white text-slate-900 px-8 py-3 text-sm sm:text-base font-semibold shadow-lg hover:bg-slate-100 transition-colors cursor-pointer"
                                                    >
                                                        Try on the glasses
                                                    </button>
                                                )}

                                                {/* Button 2 - Secondary button */}
                                                {bannerMeta?.button2 ? (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            handleButtonClick(bannerMeta.button2)
                                                        }}
                                                        className="inline-flex justify-center rounded-full border border-white/60 px-8 py-3 text-sm sm:text-base font-semibold hover:bg-white/10 transition-colors cursor-pointer"
                                                    >
                                                        {bannerMeta.button2.text}
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            // Default action: scroll to live demo (same as button 1)
                                                            setTimeout(() => {
                                                                const element = document.getElementById('live-demo')
                                                                if (element) {
                                                                    const offset = 100
                                                                    const elementPosition = element.getBoundingClientRect().top
                                                                    const offsetPosition = elementPosition + window.pageYOffset - offset
                                                                    window.scrollTo({
                                                                        top: offsetPosition,
                                                                        behavior: 'smooth'
                                                                    })
                                                                }
                                                            }, 50)
                                                        }}
                                                        className="inline-flex justify-center rounded-full border border-white/60 px-8 py-3 text-sm sm:text-base font-semibold hover:bg-white/10 transition-colors cursor-pointer"
                                                    >
                                                        Request a demo
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </main>
                                </div>
                            )
                        })}
                </div>

                {/* Navigation Arrows - Always show if there are multiple banners */}
                {banners.length > 1 && (
                    <>
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                goToPrevious()
                            }}
                            className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-30 bg-white hover:bg-gray-50 text-gray-900 rounded-full p-2.5 md:p-3.5 shadow-xl border-2 border-gray-200 transition-all hover:scale-110 active:scale-95"
                            aria-label="Previous banner"
                            type="button"
                        >
                            <svg
                                className="w-5 h-5 md:w-6 md:h-6"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={3}
                                    d="M15 19l-7-7 7-7"
                                />
                            </svg>
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                goToNext()
                            }}
                            className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-30 bg-white hover:bg-gray-50 text-gray-900 rounded-full p-2.5 md:p-3.5 shadow-xl border-2 border-gray-200 transition-all hover:scale-110 active:scale-95"
                            aria-label="Next banner"
                            type="button"
                        >
                            <svg
                                className="w-5 h-5 md:w-6 md:h-6"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={3}
                                    d="M9 5l7 7-7 7"
                                />
                            </svg>
                        </button>
                    </>
                )}

                {/* Dots Indicator - Always show if there are multiple banners */}
                {banners.length > 1 && (
                    <div className="absolute bottom-3 md:bottom-4 left-1/2 -translate-x-1/2 z-30 flex gap-2 px-2 py-1 bg-black/20 rounded-full backdrop-blur-sm">
                        {banners.map((_, index) => (
                            <button
                                key={index}
                                onClick={(e) => {
                                    e.stopPropagation()
                                    goToSlide(index)
                                }}
                                className={`rounded-full transition-all duration-300 ${
                                    index === currentIndex
                                        ? 'w-8 md:w-10 h-2.5 md:h-3 bg-white shadow-lg'
                                        : 'w-2.5 md:w-3 h-2.5 md:h-3 bg-white/70 hover:bg-white/90'
                                }`}
                                aria-label={`Go to banner ${index + 1}`}
                                type="button"
                            />
                        ))}
                    </div>
                )}
            </div>
            </div>
        </div>
    )
}

export default BannerComponent

