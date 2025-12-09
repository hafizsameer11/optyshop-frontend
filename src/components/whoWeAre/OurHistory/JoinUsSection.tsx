import React from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'

const JoinUsSection: React.FC = () => {
    const navigate = useNavigate()
    const location = useLocation()

    const handleFindOutMore = () => {
        if (location.pathname === '/') {
            const element = document.getElementById('live-demo')
            if (element) {
                const offset = 100
                const elementPosition = element.getBoundingClientRect().top
                const offsetPosition = elementPosition + window.pageYOffset - offset
                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                })
            }
        } else {
            navigate('/#live-demo')
        }
    }

    return (
        <>
            <section className="bg-white py-12 md:py-16 lg:py-20 px-4 sm:px-6">
                <div className="w-[90%] mx-auto max-w-7xl">
                    <div className="grid lg:grid-cols-2 gap-8 md:gap-12 items-center">
                        {/* Left - Text Content */}
                        <div className="space-y-6 md:space-y-8">
                            <div>
                                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-blue-950 mb-4">
                                    <span className="underline">Join us!</span>
                                </h2>
                                <h3 className="text-xl md:text-2xl font-semibold text-gray-700">
                                    We are always looking for talent.
                                </h3>
                            </div>

                            <div className="space-y-4 text-base md:text-lg text-gray-700 leading-relaxed">
                                <p>
                                    Our team is growing: we need talented people to join the Fittingbox adventure.
                                </p>
                                <p>
                                    Do you want to face new challenges, contribute to creating and promoting tomorrow's technological tools?
                                </p>
                            </div>

                            {/* Buttons */}
                            <div className="flex flex-col sm:flex-row gap-4 pt-4">
                                <button
                                    onClick={handleFindOutMore}
                                    className="px-6 md:px-8 py-3 md:py-4 rounded-lg bg-blue-950 text-white font-semibold hover:bg-blue-900 transition-colors duration-300 text-center text-sm md:text-base cursor-pointer"
                                >
                                    Find out more about Fittingbox
                                </button>
                                <Link
                                    to="/join-us"
                                    className="px-6 md:px-8 py-3 md:py-4 rounded-lg border-2 border-blue-950 text-blue-950 font-semibold hover:bg-blue-50 transition-colors duration-300 text-center text-sm md:text-base cursor-pointer"
                                >
                                    See job offers
                                </Link>
                            </div>
                        </div>

                        {/* Right - Image */}
                        <div className="flex justify-center lg:justify-end order-first lg:order-last">
                            <div className="relative w-full max-w-lg lg:max-w-xl">
                                <img
                                    src="/assets/images/Fittingbox-salle-de-pause.webp"
                                    alt="Fittingbox team members in office"
                                    className="w-full h-auto rounded-lg shadow-lg object-cover"
                                    onError={(e) => {
                                        const target = e.target as HTMLImageElement
                                        target.style.display = 'none'
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Bottom Title Section */}
            <section className="bg-white py-8 md:py-12 px-4 sm:px-6">
                <div className="w-[90%] mx-auto max-w-7xl">
                    <h2 className="text-2xl md:text-3xl lg:text-3xl font-bold text-blue-950 text-center">
                        The <strong>story</strong> of Fittingbox
                    </h2>
                </div>
            </section>
        </>
    )
}

export default JoinUsSection

