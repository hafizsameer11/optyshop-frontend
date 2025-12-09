import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

const CustomizableSection: React.FC = () => {
    const navigate = useNavigate()
    const location = useLocation()

    const handleLearnMore = () => {
        navigate('/virtual-test')
    }

    const handleRequestDemo = () => {
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
        <section className="bg-white py-12 md:py-16 lg:py-20 px-4 sm:px-6">
            <div className="w-[90%] mx-auto max-w-7xl">
                {/* Main Content Grid */}
                <div className="grid lg:grid-cols-2 gap-8 md:gap-12 items-center">
                    {/* Left Side - Text Content */}
                    <div className="space-y-6 md:space-y-8">
                        <div>
                            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-blue-950 mb-6">
                                A customizable <span className="underline">function</span>
                            </h2>
                        </div>

                        <div className="space-y-4 text-base md:text-lg text-gray-700 leading-relaxed">
                            <p>
                                Fittingbox&apos;s virtual try-on is 100% customizable to adapt to your strategy and needs.
                            </p>
                            <p>
                                You can customize your solution and go further with the integration of a carousel or by allowing the addition of frames to a wish list.
                            </p>
                            <p>
                                You can also add a 3D viewer to your product pages to increase engagement:{' '}
                                <strong className="text-blue-950 font-semibold">
                                    88% of users ready to buy online find the 3D viewer combined with virtual try-on useful.
                                </strong>
                            </p>
                            <p>
                                It&apos;s up to you to build your experience!
                            </p>
                        </div>

                        {/* Call to Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-4 pt-4">
                            <button 
                                onClick={handleLearnMore}
                                className="px-8 py-3 bg-blue-950 text-white font-semibold rounded-lg hover:bg-blue-900 transition-colors duration-300 shadow-md cursor-pointer"
                            >
                                Learn more
                            </button>
                            <button 
                                onClick={handleRequestDemo}
                                className="px-8 py-3 bg-white border-2 border-blue-950 text-blue-950 font-semibold rounded-lg hover:bg-blue-50 transition-colors duration-300 cursor-pointer"
                            >
                                Request a demo
                            </button>
                        </div>
                    </div>

                    {/* Right Side - Smartphone Image */}
                    <div className="relative flex justify-center lg:justify-end">
                        <img
                            src="/assets/images/image7.png"
                            alt="Customizable virtual try-on on smartphone"
                            className="w-full max-w-md h-auto max-h-[400px] md:max-h-[500px] lg:max-h-[450px] object-contain rounded-lg"
                        />
                    </div>
                </div>
            </div>
        </section>
    )
}

export default CustomizableSection

