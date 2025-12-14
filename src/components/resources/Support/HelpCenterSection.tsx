import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import FAQSection from './FAQSection'

const helpCenterCards = [
    {
        id: 1,
        title: 'Virtual Try-On Advanced',
        icon: '👓',
        gradient: 'from-orange-500 to-red-500',
        path: '/virtual-test'
    },
    {
        id: 2,
        title: 'Eyewear Digitization',
        subtitle: '3D Digitization of Frames',
        icon: '📐',
        gradient: 'from-green-500 to-blue-500',
        path: '/digital-frames'
    },
    {
        id: 3,
        title: 'PD Measurement',
        icon: '📏',
        gradient: 'from-green-500 to-purple-500',
        path: '/pd-measurement'
    },
    {
        id: 4,
        title: '3D Viewer',
        icon: '🎯',
        gradient: 'from-orange-500 to-yellow-500',
        path: '/3d-viewer'
    },
    {
        id: 5,
        title: 'Virtual Try-On Standard',
        icon: '👓',
        gradient: 'from-orange-500 to-red-500',
        path: '/in-store'
    }
]

const HelpCenterSection: React.FC = () => {
    const navigate = useNavigate()
    const [searchQuery, setSearchQuery] = useState('')

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        console.log('Searching for:', searchQuery)
        // Implement search functionality here
    }

    const handleCardClick = (path: string) => {
        navigate(path)
    }

    return (
        <section className="bg-gray-50 min-h-screen">
            {/* Header Section with Search */}
            <div className="bg-blue-950 py-12 md:py-16 lg:py-20 px-4 sm:px-6">
                <div className="w-[90%] mx-auto max-w-4xl text-center">
                    <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-8 md:mb-10">
                        How can we help?
                    </h1>
                    <form onSubmit={handleSearch} className="flex items-center gap-2 max-w-2xl mx-auto">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search for answers and documentation"
                            className="flex-1 px-6 py-4 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-300 text-base md:text-lg"
                        />
                        <button
                            type="submit"
                            className="bg-blue-900 text-white p-4 rounded-lg hover:bg-blue-800 transition-colors flex items-center justify-center cursor-pointer"
                            aria-label="Search"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </button>
                    </form>
                </div>
            </div>

            {/* Cards Grid Section */}
            <div className="py-12 md:py-16 lg:py-20 px-4 sm:px-6">
                <div className="w-[90%] mx-auto max-w-6xl">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                        {helpCenterCards.map((card) => (
                            <div
                                key={card.id}
                                onClick={() => handleCardClick(card.path)}
                                className="bg-white rounded-lg p-6 md:p-8 shadow-md hover:shadow-xl transition-shadow duration-300 cursor-pointer"
                            >
                                {/* Icon */}
                                <div className={`w-16 h-16 md:w-20 md:h-20 rounded-lg bg-gradient-to-br ${card.gradient} flex items-center justify-center text-3xl md:text-4xl mb-4 md:mb-6`}>
                                    <span>{card.icon}</span>
                                </div>

                                {/* Title */}
                                <h3 className="text-xl md:text-2xl font-bold text-blue-900 mb-2">
                                    {card.title}
                                </h3>

                                {/* Subtitle (if exists) */}
                                {card.subtitle && (
                                    <p className="text-sm md:text-base text-gray-600">
                                        {card.subtitle}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* FAQ Section */}
            <FAQSection />
        </section>
    )
}

export default HelpCenterSection

