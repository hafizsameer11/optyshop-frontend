import React, { useState } from 'react'

type Testimonial = {
    logo: string
    quote: string
    name: string
    role: string
}

const testimonials: Testimonial[] = [
    {
        logo: '/assets/images/Logo Fielmann.webp',
        quote: 'After virtually trying on a pair of glasses, we observed that users are twice more likely to book an appointment in one of our shops.',
        name: 'Stefan WOLK',
        role: 'E-commerce Director at Fielmann Group',
    },
    {
        logo: '/assets/images/Logo Fielmann.webp',
        quote: 'Virtual try‑ons are definitely a huge boost for our online sales. With a virtual try‑on experience, sunglasses purchase conversions are 2 to 3 times higher than for those without a virtual try‑on.',
        name: 'Stefan WOLK',
        role: 'E‑Commerce Director at Fielmann',
    },
]

const TestimonialsSection: React.FC = () => {
    const [currentIndex, setCurrentIndex] = useState(0)

    const current = testimonials[currentIndex]

    const nextSlide = () => {
        setCurrentIndex((prev) => (prev + 1) % testimonials.length)
    }

    const prevSlide = () => {
        setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length)
    }

    return (
        <section className="bg-blue-950 py-16 md:py-20 px-4 sm:px-6">
            <div className="w-[90%] mx-auto max-w-6xl">
                {/* Logo */}
                <div className="flex flex-col items-center mb-8">
                    <img
                        src={current.logo}
                        alt="Company logo"
                        className="h-12 md:h-16 object-contain mb-4"
                        onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.style.display = 'none'
                        }}
                    />
                    <div className="w-16 h-px bg-white"></div>
                </div>

                {/* Testimonial Content */}
                <div className="relative">
                    {/* Navigation Arrows */}
                    <button
                        onClick={prevSlide}
                        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 text-white hover:text-blue-300 transition-colors"
                        aria-label="Previous testimonial"
                    >
                        <svg className="w-8 h-8 md:w-10 md:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>

                    <button
                        onClick={nextSlide}
                        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 text-white hover:text-blue-300 transition-colors"
                        aria-label="Next testimonial"
                    >
                        <svg className="w-8 h-8 md:w-10 md:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>

                    {/* Quote */}
                    <div className="px-12 md:px-16 lg:px-20 text-center">
                        <div className="relative">
                            {/* Large opening quotation mark */}
                            <div className="absolute -left-8 md:-left-12 top-0 text-6xl md:text-8xl text-gray-400 font-serif leading-none">
                                "
                            </div>
                            <p className="text-white italic text-lg md:text-xl lg:text-2xl leading-relaxed">
                                {current.quote}
                            </p>
                        </div>

                        {/* Attribution */}
                        <div className="mt-8 md:mt-10">
                            <p className="text-white text-base md:text-lg font-semibold">{current.name}</p>
                            <p className="text-white/80 text-sm md:text-base mt-1">{current.role}</p>
                        </div>
                    </div>
                </div>

                {/* Pagination Dots */}
                <div className="flex justify-center gap-2 mt-8 md:mt-10">
                    {testimonials.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => setCurrentIndex(index)}
                            className={`h-2 w-2 rounded-full transition-all ${index === currentIndex ? 'bg-white' : 'bg-gray-400'
                                }`}
                            aria-label={`Go to testimonial ${index + 1}`}
                        />
                    ))}
                </div>
            </div>
        </section>
    )
}

export default TestimonialsSection

