import React from 'react'
import { useNavigate } from 'react-router-dom'

const AdvancedVirtualTryOnSection: React.FC = () => {
    const navigate = useNavigate()

    const modules = [
        {
            icon: (
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle cx="7" cy="12" r="4" strokeWidth={2} />
                    <circle cx="17" cy="12" r="4" strokeWidth={2} />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 12h2M3 12h4M17 12h4" />
                    <circle cx="12" cy="12" r="8" strokeWidth={1.5} strokeDasharray="2 2" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 6l12 12M6 18l12-12" />
                </svg>
            ),
            title: 'Frame Removal',
            description: 'Virtual removing of the glasses the user is wearing to allow an easier virtual try-on of new frames.',
            gradient: 'from-purple-500 to-pink-500'
        },
        {
            icon: (
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v2.25m6.364.386l-1.591 1.591M21 12H18.75m-3.75-3.75H12m-3.75 3.75h3.75m-3.75 3.75h3.75M18.75 18.75V21M12 18.75v2.25M3 12h2.25m3.75-3.75H3m3.75 3.75H3m3.75 3.75H3m9.75-9.75v-2.25m0 2.25v2.25m0-2.25h2.25m-2.25 0h-2.25m2.25 0v2.25m0-2.25v-2.25" />
                    <circle cx="12" cy="12" r="9" strokeWidth={1.5} />
                </svg>
            ),
            title: 'Lens Simulator',
            description: 'Virtual try-on of different tints, coatings and photochromic lenses.',
            gradient: 'from-orange-500 to-yellow-500'
        },
        {
            icon: (
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="8" r="3" strokeWidth={2} />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11v3m0 0v3m0-3h3m-3 0H9" />
                    <ellipse cx="12" cy="15" rx="6" ry="4" strokeWidth={2} />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h8M8 14h8" strokeDasharray="2 2" />
                </svg>
            ),
            title: 'Face Shape',
            description: 'Analysis of the user\'s face shape to recommend frames matching it.',
            gradient: 'from-red-500 to-orange-500'
        }
    ]

    const handleDemoClick = () => {
        // Scroll to contact form or navigate to demo page
        const contactSection = document.getElementById('demo-form')
        if (contactSection) {
            contactSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
    }

    return (
        <section className="bg-gray-50 py-12 md:py-16 lg:py-20 px-4 sm:px-6">
            <div className="w-[90%] mx-auto max-w-7xl">
                {/* Header */}
                <div className="text-center mb-12 md:mb-16">
                    <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-4xl font-bold text-blue-950 mb-4">
                        Drive online traffic more efficiently to your stores with Virtual Try-On Advanced for website
                    </h2>
                    <p className="text-base md:text-lg text-gray-600">
                        Examples of modules that can be added to the core features
                    </p>
                </div>

                {/* Feature Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-12">
                    {modules.map((module, index) => (
                        <div
                            key={index}
                            className="bg-white rounded-2xl p-6 md:p-8 shadow-lg hover:shadow-xl transition-shadow duration-300"
                        >
                            {/* Icon with Gradient Background */}
                            <div className={`w-20 h-20 rounded-xl bg-gradient-to-br ${module.gradient} flex items-center justify-center text-white mb-6`}>
                                {module.icon}
                            </div>

                            {/* Title */}
                            <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">
                                {module.title}
                            </h3>

                            {/* Description */}
                            <p className="text-gray-600 mb-6 leading-relaxed">
                                {module.description}
                            </p>

                            {/* Discover Link */}
                            <button 
                                onClick={() => navigate('/virtual-test')}
                                className="text-gray-900 font-semibold hover:text-blue-950 transition-colors cursor-pointer"
                            >
                                Discover →
                            </button>
                        </div>
                    ))}
                </div>

                {/* Demo Request Button */}
                <div className="text-center mb-8">
                    <button
                        onClick={handleDemoClick}
                        className="px-8 md:px-12 py-4 md:py-5 bg-white border-2 border-gray-900 text-gray-900 font-semibold rounded-xl hover:bg-gray-50 transition-colors duration-300 text-base md:text-lg shadow-lg cursor-pointer"
                    >
                        Get a demo to see all available configurations
                    </button>
                </div>

                {/* Gradient Line */}
                <div className="h-1 bg-gradient-to-r from-red-500 via-green-500 to-blue-500 rounded-full"></div>
            </div>
        </section>
    )
}

export default AdvancedVirtualTryOnSection

