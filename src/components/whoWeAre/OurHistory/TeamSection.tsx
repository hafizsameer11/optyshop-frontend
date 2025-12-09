import React, { useState, useEffect, useCallback } from 'react'

interface TeamMember {
    name: string
    title: string
    image: string
}

const teamMembers: TeamMember[] = [
    {
        name: 'Sandrine GEFFROY',
        title: 'Product Manager',
        image: '/assets/images/Portrait-rond-sandrine.webp'
    },
    {
        name: 'Matthieu MONTPELLIER',
        title: 'Sales and Customer Success Manager',
        image: '/assets/images/Portrait-rond-matthieu.webp'
    },
    {
        name: 'Dominique BAZIN',
        title: 'Head of Sales, Marketing and Customer Success',
        image: '/assets/images/Portrait-rond-Dominique.webp'
    },
    {
        name: 'Ariel CHOUKROUN',
        title: 'Co-Founder',
        image: '/assets/images/Portrait-rond-ariel.webp'
    },
    {
        name: 'Elodie',
        title: 'Team Member',
        image: '/assets/images/Portrait-rond-elodie-f.webp'
    }
]

const TeamSection: React.FC = () => {
    const [currentIndex, setCurrentIndex] = useState(0)
    const itemsToShow = 3 // Number of items to show at once

    const nextSlide = useCallback(() => {
        setCurrentIndex((prevIndex) => {
            const nextIndex = prevIndex + itemsToShow
            return nextIndex >= teamMembers.length ? 0 : nextIndex
        })
    }, [itemsToShow])

    const prevSlide = () => {
        setCurrentIndex((prevIndex) => {
            if (prevIndex === 0) {
                // Go to the last slide
                const lastSlideStart = Math.max(0, teamMembers.length - itemsToShow)
                return lastSlideStart
            }
            return prevIndex - itemsToShow
        })
    }

    // Auto-slide functionality
    useEffect(() => {
        const interval = setInterval(() => {
            nextSlide()
        }, 4000) // Change slide every 4 seconds

        return () => clearInterval(interval)
    }, [nextSlide])

    const visibleMembers = teamMembers.slice(currentIndex, currentIndex + itemsToShow)

    return (
        <section className="bg-white py-12 md:py-16 lg:py-20 px-4 sm:px-6">
            <div className="w-[90%] mx-auto max-w-7xl">
                <div className="space-y-8 md:space-y-12">
                    {/* Section Titles */}
                    <div className="text-center space-y-2">
                        <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-blue-950">
                            A talented team of over 100 members
                        </h2>
                        <h3 className="text-xl md:text-2xl font-semibold text-gray-700">
                            Fittingbox Executive Committee
                        </h3>
                    </div>

                    {/* Team Carousel */}
                    <div className="relative">
                        {/* Navigation Arrows */}
                        <button
                            onClick={prevSlide}
                            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 md:-translate-x-8 z-10 w-10 h-10 md:w-12 md:h-12 rounded-full bg-blue-950 text-white hover:bg-blue-900 transition-colors flex items-center justify-center shadow-lg cursor-pointer"
                            aria-label="Previous team members"
                        >
                            <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>

                        <button
                            onClick={nextSlide}
                            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 md:translate-x-8 z-10 w-10 h-10 md:w-12 md:h-12 rounded-full bg-blue-950 text-white hover:bg-blue-900 transition-colors flex items-center justify-center shadow-lg cursor-pointer"
                            aria-label="Next team members"
                        >
                            <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>

                        {/* Team Members Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12 px-8 md:px-16">
                            {visibleMembers.map((member, index) => (
                                <div key={index} className="text-center">
                                    {/* Circular Profile Picture */}
                                    <div className="mb-4 md:mb-6 flex justify-center">
                                        <img
                                            src={member.image}
                                            alt={member.name}
                                            className="w-40 h-40 md:w-48 md:h-48 lg:w-56 lg:h-56 rounded-full object-cover shadow-lg"
                                        />
                                    </div>
                                    {/* Name */}
                                    <h4 className="text-lg md:text-xl lg:text-2xl font-bold text-blue-950 mb-2">
                                        {member.name}
                                    </h4>
                                    {/* Title */}
                                    <p className="text-sm md:text-base text-gray-600">
                                        {member.title}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Pagination Dots */}
                    <div className="flex justify-center gap-2 mt-8">
                        {Array.from({ length: Math.ceil(teamMembers.length / itemsToShow) }).map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrentIndex(index * itemsToShow)}
                                className={`h-2 rounded-full transition-all cursor-pointer ${Math.floor(currentIndex / itemsToShow) === index
                                    ? 'bg-blue-950 w-8'
                                    : 'bg-gray-300 w-2'
                                    }`}
                                aria-label={`Go to slide ${index + 1}`}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    )
}

export default TeamSection

