import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

interface ExpertiseItem {
    id: number
    title: string
    description: string
    image: string
    accentColor: string
}

const ExpertiseSection: React.FC = () => {
    const navigate = useNavigate()
    const [currentIndex, setCurrentIndex] = useState(0)
    const [isMobile, setIsMobile] = useState(false)

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768) // md breakpoint
        }

        checkMobile()
        window.addEventListener('resize', checkMobile)

        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    const expertise: ExpertiseItem[] = [
        {
            id: 1,
            title: "Virtual Test",
            description: "Available for: Website - Instore - Social Media - Advertising",
            image: "/assets/images/mobile1.png",
            accentColor: "bg-red-500"
        },
        {
            id: 2,
            title: "Instruments for opticians",
            description: "Lens Simulator",
            image: "/assets/images/DSC1777_square.webp",
            accentColor: "bg-teal-500"
        },
        {
            id: 3,
            title: "Open innovation",
            description: "R&D Capability - Co-creation Opportunities",
            image: "/assets/images/DSC0763.webp",
            accentColor: "bg-purple-500"
        }
    ]

    const nextSlide = () => {
        setCurrentIndex((prev) => (prev + 1) % expertise.length)
    }

    const prevSlide = () => {
        setCurrentIndex((prev) => (prev - 1 + expertise.length) % expertise.length)
    }

    return (
        <section className="bg-white py-16 md:py-24 px-4">
            <div className="w-[90%] max-w-7xl mx-auto">
                <h2 className="text-3xl md:text-4xl font-bold text-center text-[#0f172a] mb-16">
                    Our other areas of <span className="font-bold">expertise</span>
                </h2>

                <div className="relative">
                    {/* Slider Container */}
                    <div className="overflow-hidden">
                        <div className="flex transition-transform duration-500 ease-out" style={{
                            transform: `translateX(-${currentIndex * (isMobile ? 100 : 100 / 3)}%)`,
                            width: `${isMobile ? expertise.length * 100 : (expertise.length / 3) * 100}%`
                        }}>
                            {expertise.map((item) => (
                                <div key={item.id} className="w-full md:w-1/3 flex-shrink-0 px-3">
                                    <div className="relative h-80 md:h-96 rounded-2xl overflow-hidden group">
                                        <img
                                            src={item.image}
                                            alt={item.title}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                const target = e.target as HTMLImageElement
                                                if (item.id === 1) target.src = '/assets/images/mobile1.jpg'
                                                else if (item.id === 2) target.src = '/assets/images/image.png'
                                                else target.src = '/assets/images/Microsoft.webp'
                                            }}
                                        />
                                        {/* Dark Overlay */}
                                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60" />

                                        {/* Accent Color Line */}
                                        <div className={`absolute bottom-0 left-0 right-0 h-1 ${item.accentColor}`} />

                                        {/* Content Overlay */}
                                        <div className="absolute inset-0 flex flex-col items-center justify-end pb-8 px-4 text-white text-center space-y-3">
                                            <h3 className="text-xl md:text-2xl font-bold">
                                                {item.title}
                                            </h3>
                                            <p className="text-xs md:text-sm max-w-xs">
                                                {item.description}
                                            </p>
                                            <button
                                                onClick={() => navigate('/optical-instruments')}
                                                className="px-6 py-2 border-2 border-white text-white rounded-full font-semibold hover:bg-white/10 transition-colors text-sm cursor-pointer"
                                            >
                                                You discover
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Navigation Arrows */}
                    <button
                        onClick={prevSlide}
                        className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-slate-400 hover:border-slate-600 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-all bg-white/80"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>

                    <button
                        onClick={nextSlide}
                        className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-slate-400 hover:border-slate-600 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-all bg-white/80"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>

                    {/* Indicators */}
                    <div className="flex justify-center gap-2 mt-8">
                        {expertise.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrentIndex(index)}
                                className={`h-2 rounded-full transition-all ${index === currentIndex ? 'bg-[#0f172a] w-8' : 'bg-slate-300 w-2'
                                    }`}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    )
}

export default ExpertiseSection

