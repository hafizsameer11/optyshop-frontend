import React, { useState, useMemo, useEffect } from 'react'
import { useTestimonials } from '../../hooks/useTestimonials'

// Local type for component display
type DisplayTestimonial = {
    avatar: string | null
    quote: string
    name: string
    rating?: number
}

const Testimonials: React.FC = () => {
    const { testimonials, loading, error } = useTestimonials()
    const [activeIndex, setActiveIndex] = useState(0)

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

    // Ensure activeIndex is valid when testimonials change
    useEffect(() => {
        if (displayTestimonials.length > 0 && activeIndex >= displayTestimonials.length) {
            setActiveIndex(0)
        }
    }, [displayTestimonials.length, activeIndex])

    const current = displayTestimonials[activeIndex] || displayTestimonials[0]

    // Show loading state
    if (loading) {
        return (
            <section className="bg-gradient-to-b from-blue-950 to-blue-950 py-20 px-4">
                <div className="w-[92%] max-w-7xl mx-auto">
                    <h2 className="text-center text-3xl sm:text-4xl font-semibold mb-16">
                        <span className="text-slate-200">What do they think of</span>{' '}
                        <span className="text-blue-300">Virtual Glasses Try‑On?</span>
                    </h2>
                    <div className="text-center py-12">
                        <p className="text-slate-300">Loading testimonials...</p>
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
                        <span className="text-slate-200">What do they think of</span>{' '}
                        <span className="text-blue-300">Virtual Glasses Try‑On?</span>
                    </h2>
                    <div className="text-center py-12">
                        <p className="text-red-300">Error loading testimonials: {error}</p>
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
                        <span className="text-slate-200">What do they think of</span>{' '}
                        <span className="text-blue-300">Virtual Glasses Try‑On?</span>
                    </h2>
                    <div className="text-center py-12">
                        <p className="text-slate-300">No testimonials available at the moment.</p>
                    </div>
                </div>
            </section>
        )
    }

    return (
        <section className="bg-gradient-to-b from-blue-950 to-blue-950 py-20 px-4">
            <div className="w-[92%] max-w-7xl mx-auto">
                <h2 className="text-center text-3xl sm:text-4xl font-semibold mb-16">
                    <span className="text-slate-200">What do they think of</span>{' '}
                    <span className="text-blue-300">Virtual Glasses Try‑On?</span>
                </h2>

                {/* Desktop / tablet: 4 cards in a row (no slider, matches reference design) */}
                <div className="hidden md:grid md:grid-cols-4 gap-8">
                    {displayTestimonials.map((item, index) => (
                        <article
                            key={`${item.name}-${index}`}
                            className="bg-white rounded-3xl px-8 py-10 text-slate-900 h-full flex flex-col items-center text-center shadow-[0_24px_60px_rgba(15,23,42,0.5)]"
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

                {/* Mobile: slider with dots, one card at a time */}
                {current && (
                    <div className="md:hidden">
                        <article className="bg-white rounded-3xl px-8 py-12 text-slate-900 flex flex-col items-center text-center shadow-[0_24px_60px_rgba(15,23,42,0.5)]">
                            <p className="text-sm leading-relaxed text-slate-700 mb-8">{current.quote}</p>
                            {current.avatar && (
                                <img
                                    src={current.avatar}
                                    alt={current.name}
                                    className="h-20 w-20 rounded-full object-cover mb-3"
                                />
                            )}
                            <div className="mt-1">
                                <p className="text-base font-semibold text-slate-900">{current.name}</p>
                                {current.rating !== undefined && (
                                    <div className="flex items-center justify-center gap-1 mt-2">
                                        {[...Array(5)].map((_, i) => (
                                            <svg
                                                key={i}
                                                className={`w-4 h-4 ${i < current.rating! ? 'text-yellow-400' : 'text-gray-300'}`}
                                                fill="currentColor"
                                                viewBox="0 0 20 20"
                                            >
                                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                            </svg>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </article>

                        <div className="mt-6 flex justify-center gap-3">
                            {displayTestimonials.map((_t, idx) => (
                                <button
                                    key={idx}
                                    type="button"
                                    onClick={() => setActiveIndex(idx)}
                                    className={`h-3 w-3 rounded-full border border-blue-300 transition-colors ${idx === activeIndex ? 'bg-blue-400' : 'bg-transparent'
                                        }`}
                                    aria-label={`Go to testimonial ${idx + 1}`}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </section>
    )
}

export default Testimonials

