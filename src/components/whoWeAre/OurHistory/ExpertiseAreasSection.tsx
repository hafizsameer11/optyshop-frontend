import React from 'react'
import { Link } from 'react-router-dom'

interface ExpertiseArea {
    title: string
    description: string
    gradient: string
    icon: string
    path: string
}

const expertiseAreas: ExpertiseArea[] = [
    {
        title: 'Virtual try-on',
        description: 'The optimal experience to "try before you buy" in real-time and on any device.',
        gradient: 'from-orange-500 to-red-500',
        icon: '👓',
        path: '/virtual-test'
    },
    {
        title: 'Digitized frames',
        description: 'Use our experience to get exact digital copies of your glasses.',
        gradient: 'from-orange-400 to-yellow-500',
        icon: '🖼️',
        path: '/digital-frames'
    },
    {
        title: 'Tools for opticians',
        description: 'The right tools to digitize optical know-how: from lens simulator to measurements.',
        gradient: 'from-green-500 to-blue-500',
        icon: '🔧',
        path: '/optical-instruments'
    },
    {
        title: 'Open innovation',
        description: 'We create and develop solutions together that meet your specific needs.',
        gradient: 'from-purple-500 to-pink-500',
        icon: '💡',
        path: '/open-innovation'
    }
]

const ExpertiseAreasSection: React.FC = () => {
    return (
        <section className="bg-white py-12 md:py-16 lg:py-20 px-4 sm:px-6">
            <div className="w-[90%] mx-auto max-w-7xl">
                <div className="space-y-8 md:space-y-12">
                    {/* Section Title */}
                    <div className="text-center">
                        <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-blue-950">
                            The areas of expertise of Fittingbox
                        </h2>
                    </div>

                    {/* Expertise Cards Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
                        {expertiseAreas.map((area, index) => (
                            <div
                                key={index}
                                className="bg-white rounded-xl p-6 md:p-8 shadow-md hover:shadow-xl transition-shadow duration-300 flex flex-col"
                            >
                                {/* Icon */}
                                <div className={`w-16 h-16 md:w-20 md:h-20 rounded-xl bg-gradient-to-br ${area.gradient} flex items-center justify-center text-3xl md:text-4xl mb-4 md:mb-6`}>
                                    <span>{area.icon}</span>
                                </div>

                                {/* Title */}
                                <h3 className="text-xl md:text-2xl font-bold text-blue-950 mb-3 md:mb-4">
                                    {area.title}
                                </h3>

                                {/* Description */}
                                <p className="text-sm md:text-base text-gray-600 leading-relaxed mb-4 md:mb-6 flex-grow">
                                    {area.description}
                                </p>

                                {/* Discover Button */}
                                <Link
                                    to={area.path}
                                    className="text-blue-950 font-semibold hover:text-blue-700 transition-colors underline self-start cursor-pointer"
                                >
                                    Discover
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    )
}

export default ExpertiseAreasSection

