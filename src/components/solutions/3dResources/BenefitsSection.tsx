import React from 'react'
import { useNavigate } from 'react-router-dom'

const BenefitsSection: React.FC = () => {
    const navigate = useNavigate()

    const handleLearnMore = () => {
        navigate('/digital-frames')
    }

    const benefits = [
        {
            icon: '😎',
            gradient: 'from-purple-500 to-pink-500',
            title: 'Ensure a faithful rendering to reality',
            description: 'The 3D rendering is exceptionally faithful to reality thanks to an internal technology designed to process textures, materials and lighting effects on both the frame and the lenses.',
        },
        {
            icon: '💬',
            gradient: 'from-orange-500 to-yellow-500',
            title: 'A reliable quality for the sector',
            description: 'Fittingbox\'s efficient, patented digitalization process guarantees the same level of quality for all your collections. Trusted by Marchon, Eschenbach, De Rigo, Charmant...',
        },
        {
            icon: '💰',
            gradient: 'from-green-500 to-blue-500',
            title: 'A reliable and economical solution',
            description: 'Our digitization technology is specifically designed to process high volumes: over 4,000 frames per month. Over 195,000 glasses from major brands are already available in 3D.',
        },
    ]

    return (
        <section className="bg-gray-100 py-12 md:py-16 lg:py-20 px-4 sm:px-6">
            <div className="w-[90%] mx-auto max-w-7xl">
                {/* Heading */}
                <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-center mb-12 md:mb-16 text-gray-800">
                    Benefit from extensive experience to accurately digitize your 3D glasses collections.
                </h2>

                {/* Benefits Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                    {benefits.map((benefit, index) => (
                        <div
                            key={index}
                            className="bg-white rounded-lg shadow-md p-6 md:p-8 hover:shadow-xl transition-shadow duration-300"
                        >
                            {/* Icon */}
                            <div className={`w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br ${benefit.gradient} flex items-center justify-center text-2xl md:text-3xl mb-4 md:mb-6`}>
                                <span>{benefit.icon}</span>
                            </div>

                            {/* Title */}
                            <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-3 md:mb-4">
                                {benefit.title}
                            </h3>

                            {/* Description */}
                            <p className="text-sm md:text-base text-gray-600 leading-relaxed mb-4 md:mb-6">
                                {benefit.description}
                            </p>

                            {/* Learn More Link */}
                            <button 
                                onClick={handleLearnMore}
                                className="text-teal-600 hover:text-teal-700 font-semibold text-sm md:text-base transition-colors cursor-pointer"
                            >
                                Learn more
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}

export default BenefitsSection

