import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

const DigitalExperiencesSection: React.FC = () => {
    const navigate = useNavigate()
    const location = useLocation()

    const handleLearnMore = () => {
        navigate('/virtual-test')
    }

    const handleDiscoverViewer = () => {
        navigate('/3d-viewer')
    }

    const handleDiscoverStudio = () => {
        if (location.pathname === '/') {
            // Already on home page, just scroll
            setTimeout(() => {
                const element = document.getElementById('live-demo')
                if (element) {
                    const offset = 100 // Account for fixed navbar
                    const elementPosition = element.getBoundingClientRect().top
                    const offsetPosition = elementPosition + window.pageYOffset - offset
                    window.scrollTo({
                        top: offsetPosition,
                        behavior: 'smooth'
                    })
                }
            }, 50)
        } else {
            // Navigate to home page with hash - Home component's useEffect will handle scrolling
            navigate('/#live-demo')
        }
    }

    const solutions = [
        {
            icon: '👓',
            gradient: 'from-orange-500 to-red-500',
            title: 'Virtual Fittingbox Test Drive',
            description: 'Advanced rendering and precise frame positioning with the best virtual glasses try-on.',
            link: 'Learn more',
        },
        {
            icon: '📹',
            gradient: 'from-orange-500 to-red-500',
            title: 'Other online testing solutions',
            description: 'Fittingbox\'s digitized frames can be converted to gltf or glb formats for compatibility with other solutions.',
            link: null,
        },
        {
            icon: '📦',
            gradient: 'from-orange-400 to-orange-500',
            title: '3D Viewer',
            description: 'Deliver an immersive 3D experience with 3D Viewer. Users can rotate, zoom, and explore a frame from any angle.',
            link: 'You discover',
        },
    ]

    return (
        <section className="bg-blue-950 py-12 md:py-16 lg:py-20 px-4 sm:px-6">
            <div className="w-[90%] mx-auto max-w-7xl">
                {/* Main Title */}
                <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-center mb-12 md:mb-16 text-white">
                    3D assets to display in <span className="font-bold">various</span> digital experiences
                </h2>

                {/* Solution Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-12 md:mb-16">
                    {solutions.map((solution, index) => (
                        <div
                            key={index}
                            className="bg-white rounded-lg shadow-md p-6 md:p-8 hover:shadow-xl transition-shadow duration-300"
                        >
                            {/* Icon */}
                            <div className={`w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br ${solution.gradient} flex items-center justify-center text-2xl md:text-3xl mb-4 md:mb-6`}>
                                <span>{solution.icon}</span>
                            </div>

                            {/* Title */}
                            <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-3 md:mb-4">
                                {solution.title}
                            </h3>

                            {/* Description */}
                            <p className="text-sm md:text-base text-gray-600 leading-relaxed mb-4 md:mb-6">
                                {solution.description}
                            </p>

                            {/* Link */}
                            {solution.link && (
                                <button 
                                    onClick={solution.link === 'Learn more' ? handleLearnMore : handleDiscoverViewer}
                                    className="text-teal-600 hover:text-teal-700 font-semibold text-sm md:text-base transition-colors underline cursor-pointer"
                                >
                                    {solution.link}
                                </button>
                            )}
                        </div>
                    ))}
                </div>

                {/* Call to Action Button */}
                <div className="text-center">
                    <button 
                        onClick={handleDiscoverStudio}
                        className="px-8 md:px-12 py-3 md:py-4 bg-transparent border-2 border-white text-white font-semibold rounded-full hover:bg-white/10 transition-colors duration-300 text-base md:text-lg cursor-pointer"
                    >
                        Discover Fittingbox 3D Studio
                    </button>
                </div>
            </div>
        </section>
    )
}

export default DigitalExperiencesSection

