import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'

interface ExpertiseCard {
    id: number
    title: string
    description: string
    image: string
    accentColor: string
    path: string
}

const ExpertiseSection: React.FC = () => {
    const navigate = useNavigate()
    const [currentIndex, setCurrentIndex] = useState(0)
    const [isMobile, setIsMobile] = useState(false)

    const expertiseCards: ExpertiseCard[] = [
        {
            id: 1,
            title: 'Virtual Test',
            description: 'Available for: Website - Instore - Social Media - Advertising',
            image: '/assets/images/virtual.webp',
            accentColor: 'bg-red-500',
            path: '/virtual-test'
        },
        {
            id: 2,
            title: 'Digitalized frames',
            description: 'Photographic Studio - 3D Studio - Model Studio - Database',
            image: '/assets/images/DSC1777_square.webp',
            accentColor: 'bg-yellow-500',
            path: '/digital-frames'
        },
        {
            id: 3,
            title: 'Optical instruments',
            description: 'Lens Simulator',
            image: '/assets/images/Microsoft.webp',
            accentColor: 'bg-teal-500',
            path: '/optical-instruments'
        }
    ]

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768)
        }
        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    const nextSlide = () => {
        setCurrentIndex((prev) => (prev + 1) % expertiseCards.length)
    }

    const prevSlide = () => {
        setCurrentIndex((prev) => (prev - 1 + expertiseCards.length) % expertiseCards.length)
    }

    const goToSlide = (index: number) => {
        setCurrentIndex(index)
    }

    return (
        <section className="bg-white py-16 md:py-24">
            <div className="w-[90%] mx-auto">
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-800 text-center mb-12 md:mb-16">
                    Our other areas of expertise
                </h2>

                <div className="relative">
                    {/* Slider Container */}
                    <div className="overflow-hidden">
                        <div
                            className="flex transition-transform duration-500 ease-in-out"
                            style={{
                                transform: isMobile
                                    ? `translateX(-${currentIndex * 100}%)`
                                    : `translateX(-${currentIndex * (100 / 3)}%)`,
                                width: isMobile ? `${expertiseCards.length * 100}%` : '100%'
                            }}
                        >
                            {expertiseCards.map((card) => (
                                <div
                                    key={card.id}
                                    className={`${isMobile ? 'w-full' : 'w-1/3'} flex-shrink-0 px-4`}
                                >
                                    <Link to={card.path} className="block">
                                        <div className="relative rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
                                            {/* Image */}
                                            <div className="relative w-full h-[400px] md:h-[500px] overflow-hidden">
                                                <img
                                                    src={card.image}
                                                    alt={card.title}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        const target = e.target as HTMLImageElement
                                                        target.src = '/assets/images/frame1.png'
                                                    }}
                                                />

                                                {/* Blue Overlay */}
                                                <div className="absolute inset-0 bg-blue-900/30"></div>

                                                {/* Content Overlay - Text only, no dark background */}
                                                <div className="absolute inset-0 flex flex-col justify-between p-6 md:p-8 z-10">
                                                    <div className="text-white drop-shadow-lg">
                                                        <h3 className="text-2xl md:text-3xl font-bold mb-3 md:mb-4">
                                                            {card.title}
                                                        </h3>
                                                        <p className="text-sm md:text-base drop-shadow-md">
                                                            {card.description}
                                                        </p>
                                                    </div>

                                                    <div className="pt-4">
                                                        <button
                                                            onClick={(e) => {
                                                                e.preventDefault()
                                                                e.stopPropagation()
                                                                navigate('/digital-frames')
                                                            }}
                                                            className="px-6 md:px-8 py-2.5 md:py-3 bg-white text-slate-800 border-2 border-slate-800 font-semibold rounded-full hover:bg-slate-100 transition-colors duration-300 cursor-pointer"
                                                        >
                                                            You discover
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Accent Line */}
                                                <div className={`absolute bottom-0 left-0 right-0 h-1 ${card.accentColor}`}></div>
                                            </div>
                                        </div>
                                    </Link>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Navigation Arrows */}
                    <button
                        onClick={prevSlide}
                        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 md:-translate-x-8 bg-white rounded-full p-3 shadow-lg hover:bg-gray-100 transition-colors z-10"
                        aria-label="Previous slide"
                    >
                        <svg className="w-6 h-6 text-slate-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <button
                        onClick={nextSlide}
                        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 md:translate-x-8 bg-white rounded-full p-3 shadow-lg hover:bg-gray-100 transition-colors z-10"
                        aria-label="Next slide"
                    >
                        <svg className="w-6 h-6 text-slate-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                </div>

                {/* Pagination Dots */}
                <div className="flex justify-center gap-2 mt-8">
                    {expertiseCards.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => goToSlide(index)}
                            className={`w-2 h-2 rounded-full transition-colors ${index === currentIndex ? 'bg-slate-800' : 'bg-gray-300'
                                }`}
                            aria-label={`Go to slide ${index + 1}`}
                        />
                    ))}
                </div>
            </div>
        </section>
    )
}

export default ExpertiseSection

