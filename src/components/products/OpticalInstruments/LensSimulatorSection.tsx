import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

const LensSimulatorSection: React.FC = () => {
    const navigate = useNavigate()
    const location = useLocation()

    const handleNavigateToDemo = () => {
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

    return (
        <section className="bg-white py-16 md:py-24">
            <div className="w-[90%] mx-auto">
                <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                    {/* Left - Image */}
                    <div className="flex justify-center lg:justify-start order-2 lg:order-1">
                        <div className="w-full max-w-xl lg:max-w-2xl">
                            <img
                                src="/assets/images/DSC1613_M-1.webp"
                                alt="Lens Simulator - Smartphone demonstration"
                                className="w-full h-auto rounded-2xl shadow-2xl object-contain"
                                onError={(e) => {
                                    // Fallback if image doesn't load
                                    const target = e.target as HTMLImageElement
                                    target.src = '/assets/images/mobile1.png'
                                }}
                            />
                        </div>
                    </div>

                    {/* Right - Text Content */}
                    <div className="space-y-6 order-1 lg:order-2">
                        <div>
                            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-2">
                                <span className="text-teal-500 underline">Lens</span>{' '}
                                <span className="text-teal-500">Simulator</span>
                            </h2>
                        </div>

                        <div className="space-y-4 text-slate-700 text-base md:text-lg leading-relaxed">
                            <p>
                                The Lens Simulator allows patients to virtually try on <strong className="text-slate-900 font-bold">different tints, coatings, and photochromic lenses</strong>.
                            </p>
                            <p>
                                It's a great add-on that gives patients the opportunity to find the right lenses and frames.
                            </p>
                            <p>
                                Lens Simulator is an add-on that <strong className="text-slate-900 font-bold">must be paired with our virtual try-on solutions</strong>.
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 pt-4">
                            <button
                                onClick={handleNavigateToDemo}
                                className="px-8 py-3 border-2 border-teal-500 rounded-full text-teal-500 bg-white font-semibold hover:bg-teal-50 transition-colors duration-300 cursor-pointer"
                            >
                                Discover the lens simulator
                            </button>
                            <button
                                onClick={handleNavigateToDemo}
                                className="px-8 py-3 rounded-full bg-teal-500 text-white font-semibold hover:bg-teal-600 transition-colors duration-300 cursor-pointer"
                            >
                                Try it now
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default LensSimulatorSection

