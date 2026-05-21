import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getBanners, type GetBannersOptions } from '../../services/bannersService'
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

/** Legacy inline height (desktop); prefer `HOME_HERO_BANNER_HEIGHT_CLASS` for responsive layout */
export const HOME_HERO_BANNER_HEIGHT = '70vh'

/**
 * Mobile: aspect-ratio box + object-contain shows the full banner (no crop).
 * Desktop: fixed viewport height + object-cover fills the hero.
 */
export const HOME_HERO_BANNER_HEIGHT_CLASS =
    'h-auto w-full aspect-[5/4] min-h-[13rem] sm:aspect-[2/1] sm:min-h-[15rem] md:aspect-auto md:min-h-0 md:h-[min(70vh,32rem)]'

/** Hero image fit per breakpoint */
const HERO_IMAGE_FIT_CLASS =
    'object-contain object-center md:object-cover md:object-center'

interface BannerComponentProps {
    pageType?: 'home' | 'category' | 'subcategory' | 'sub_subcategory' | null;
    categoryId?: number | null;
    subCategoryId?: number | null;
    showNavbar?: boolean; // Whether to show navbar (default: true for home page)
    autoSlideInterval?: number; // Auto-slide interval in milliseconds (default: 5000)
    height?: string; // Optional fixed height override (prefer responsive default)
    heightClassName?: string; // Tailwind height classes (default: HOME_HERO_BANNER_HEIGHT_CLASS)
}

const BannerComponent: React.FC<BannerComponentProps> = ({
    pageType = 'home',
    categoryId = null,
    subCategoryId = null,
    showNavbar = false,
    autoSlideInterval = 5000,
    height,
    heightClassName = HOME_HERO_BANNER_HEIGHT_CLASS,
}) => {
    const useInlineHeight = Boolean(height)
    const slideHeightStyle = useInlineHeight ? { height } : undefined
    const slideHeightClass = useInlineHeight ? '' : heightClassName
    const { t } = useTranslation()
    const navigate = useNavigate()
    const [banners, setBanners] = useState<Banner[]>([])
    const [loading, setLoading] = useState(true)
    const [currentIndex, setCurrentIndex] = useState(0)

    useEffect(() => {
        let isCancelled = false

        const fetchBanners = async () => {
            try {
                setLoading(true)

                // Build fetch options based on props
                const options: GetBannersOptions = {
                    page_type: pageType || null,
                    category_id: categoryId || null,
                    sub_category_id: subCategoryId || null
                }

                // Fetch banners based on page context
                const data = await getBanners(options)

                if (isCancelled) return

                setBanners(data)

                // Reset to first banner when banners change
                setCurrentIndex(0)

                // Log for debugging
                if (data.length > 0) {
                    console.log(`Loaded ${data.length} banner(s) for page_type=${pageType}, category_id=${categoryId}, sub_category_id=${subCategoryId}`)
                } else {
                    if (import.meta.env.DEV) {
                        console.warn(`No active banners found for page_type=${pageType}, category_id=${categoryId}, sub_category_id=${subCategoryId}`)
                    }
                }
            } catch (error) {
                if (!isCancelled) {
                    console.error('Error loading banners:', error)
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
    }, [pageType, categoryId, subCategoryId])

    // Auto-rotate banners if there are multiple
    useEffect(() => {
        if (banners.length <= 1) return

        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % banners.length)
        }, autoSlideInterval) // Auto-slide interval

        return () => clearInterval(interval)
    }, [banners.length, autoSlideInterval])

    if (loading) {
        return (
            <div
                className={`relative w-full max-w-[100vw] overflow-hidden text-slate-800 ${slideHeightClass}`}
                style={slideHeightStyle}
            >
                {showNavbar && (
                    <div className="absolute top-0 left-0 right-0 z-30">
                        <Navbar />
                    </div>
                )}
                <div
                    className={`flex w-full items-center justify-center bg-gray-200 animate-pulse ${slideHeightClass}`}
                    style={slideHeightStyle}
                >
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





    return (
        <section
            className={`relative w-full max-w-[100vw] overflow-hidden text-slate-800 ${!showNavbar ? 'pt-16' : ''}`}
        >
            <div
                className={`relative w-full overflow-hidden ${slideHeightClass}`}
                style={slideHeightStyle}
            >
                {showNavbar && (
                    <div className="absolute top-0 left-0 right-0 z-30">
                        <Navbar />
                    </div>
                )}

                <div
                    className="flex h-full w-full transition-transform duration-700 ease-in-out"
                    style={{ transform: `translateX(-${currentIndex * 100}%)` }}
                >
                    {banners.map((banner, index) => {
                        const imageUrl = getImageUrl(banner.image_url)
                        return (
                            <div
                                key={banner.id || index}
                                className="relative h-full min-h-0 w-full min-w-full shrink-0 grow-0 basis-full cursor-pointer bg-slate-950"
                                onClick={() => {
                                    const meta = parseMeta(banner.meta)
                                    if (banner.link_url && !meta?.button1 && !meta?.button2) {
                                        if (banner.link_url.startsWith('http')) {
                                            window.open(banner.link_url, '_blank', 'noopener,noreferrer')
                                        } else {
                                            navigate(banner.link_url)
                                        }
                                    }
                                }}
                            >
                                <img
                                    src={imageUrl}
                                    alt={banner.title || 'Banner'}
                                    className={`absolute inset-0 z-[1] h-full w-full ${HERO_IMAGE_FIT_CLASS}`}
                                    loading={index === 0 ? 'eager' : 'lazy'}
                                    decoding="async"
                                    onError={(e) => {
                                        const target = e.target as HTMLImageElement
                                        target.style.display = 'none'
                                    }}
                                />

                                <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-b from-black/15 via-transparent to-black/15 md:from-black/25 md:to-black/25" />
                            </div>
                        )
                    })}
                </div>

                {banners.length > 1 && (
                    <div className="absolute bottom-3 left-1/2 z-30 flex -translate-x-1/2 gap-1.5 rounded-full bg-black/25 px-2 py-1 backdrop-blur-sm">
                        {banners.map((_, index) => (
                            <button
                                key={index}
                                type="button"
                                aria-label={`Go to slide ${index + 1}`}
                                onClick={(e) => {
                                    e.stopPropagation()
                                    setCurrentIndex(index)
                                }}
                                className={`rounded-full transition-all ${
                                    index === currentIndex
                                        ? 'h-2 w-5 bg-white'
                                        : 'h-2 w-2 bg-white/60 hover:bg-white/90'
                                }`}
                            />
                        ))}
                    </div>
                )}
            </div>
        </section>
    )
}

export default BannerComponent

