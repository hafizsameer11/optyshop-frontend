import React, { useMemo, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useTestimonials } from '../../hooks/useTestimonials'

// Local type for component display
type DisplayTestimonial = {
    avatar: string | null
    quote: string
    name: string
    rating?: number
}

const Testimonials: React.FC = () => {
    const { t } = useTranslation()
    const { testimonials, loading, error } = useTestimonials()

    // Map API testimonials to display format
    const displayTestimonials: DisplayTestimonial[] = useMemo(() => {
        return testimonials
            .map((testimonial) => {
                // Validate avatar_url - only use if it's a valid URL or image path
                let avatar: string | null = null;
                if (testimonial.avatar_url) {
                    const avatarUrl = testimonial.avatar_url.trim();
                    // Check if it looks like a URL or image path
                    if (avatarUrl && (avatarUrl.startsWith('http') || avatarUrl.startsWith('/') || avatarUrl.includes('.'))) {
                        avatar = avatarUrl;
                    }
                }
                
                return {
                    avatar,
                    quote: testimonial.text || '',
                    name: testimonial.customer_name || '',
                    rating: testimonial.rating,
                };
            })
            .filter((t) => t.quote && t.name) // Only show testimonials with required fields
    }, [testimonials])


    // Show loading state
    if (loading) {
        return (
            <section className="bg-gradient-to-b from-blue-950 to-blue-950 py-20 px-4">
                <div className="w-[92%] max-w-7xl mx-auto">
                    <h2 className="text-center text-3xl sm:text-4xl font-semibold mb-16">
                        <span className="text-slate-200">{t('home.testimonials.titlePart1')}</span>{' '}
                        <span className="text-blue-300">{t('home.testimonials.titlePart2')}</span>
                    </h2>
                    <div className="text-center py-12">
                        <p className="text-slate-300">{t('home.testimonials.loading')}</p>
                    </div>
                </div>
            </section>
        )
    }

    // Show error state
    if (error) {
        return (
            <section className="bg-gradient-to-b from-blue-950 to-blue-950 py-20 px-4">
                <div className="w-[92%] max-w-7xl mx-auto">
                    <h2 className="text-center text-3xl sm:text-4xl font-semibold mb-16">
                        <span className="text-slate-200">{t('home.testimonials.titlePart1')}</span>{' '}
                        <span className="text-blue-300">{t('home.testimonials.titlePart2')}</span>
                    </h2>
                    <div className="text-center py-12">
                        <p className="text-red-300">{t('home.testimonials.error')}: {error}</p>
                    </div>
                </div>
            </section>
        )
    }

    // Show empty state
    if (displayTestimonials.length === 0) {
        return (
            <section className="bg-gradient-to-b from-blue-950 to-blue-950 py-20 px-4">
                <div className="w-[92%] max-w-7xl mx-auto">
                    <h2 className="text-center text-3xl sm:text-4xl font-semibold mb-16">
                        <span className="text-slate-200">{t('home.testimonials.titlePart1')}</span>{' '}
                        <span className="text-blue-300">{t('home.testimonials.titlePart2')}</span>
                    </h2>
                    <div className="text-center py-12">
                        <p className="text-slate-300">{t('home.testimonials.noTestimonials')}</p>
                    </div>
                </div>
            </section>
        )
    }

    return (
        <section className="bg-gradient-to-b from-blue-950 to-blue-950 py-20 px-4">
            <div className="w-[92%] max-w-7xl mx-auto">
                <h2 className="text-center text-3xl sm:text-4xl font-semibold mb-16">
                    <span className="text-slate-200">{t('home.testimonials.titlePart1')}</span>{' '}
                    <span className="text-blue-300">{t('home.testimonials.titlePart2')}</span>
                </h2>

                {/* Auto-moving testimonials carousel - continuous scroll like brands */}
                {displayTestimonials.length > 0 && (
                    <div className="overflow-hidden py-4">
                        <div className="flex gap-8 px-4 items-center marquee-track">
                            {[...displayTestimonials, ...displayTestimonials].map((item, index) => (
                                <article
                                    key={`${item.name}-${index}`}
                                    className="flex-shrink-0 bg-white rounded-3xl px-8 py-10 text-slate-900 w-80 flex flex-col items-center text-center shadow-[0_24px_60px_rgba(15,23,42,0.5)]"
                                >
                                    <div className="flex-1 flex flex-col justify-between">
                                        <p className="text-sm leading-relaxed text-slate-700 mb-8">
                                            {item.quote}
                                        </p>
                                        <div className="mt-2 flex flex-col items-center">
                                            {item.avatar && (
                                                <img
                                                    src={item.avatar}
                                                    alt={item.name}
                                                    className="h-20 w-20 rounded-full object-cover mb-3"
                                                />
                                            )}
                                            <p className="text-base font-semibold text-slate-900">{item.name}</p>
                                            {item.rating !== undefined && (
                                                <div className="flex items-center gap-1 mt-2">
                                                    {[...Array(5)].map((_, i) => (
                                                        <svg
                                                            key={i}
                                                            className={`w-4 h-4 ${i < item.rating! ? 'text-yellow-400' : 'text-gray-300'}`}
                                                            fill="currentColor"
                                                            viewBox="0 0 20 20"
                                                        >
                                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                        </svg>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </section>
    )
}

export default Testimonials

