import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

const WebsiteSection: React.FC = () => {
    const navigate = useNavigate()
    const location = useLocation()

    const handleAdvancedVirtualTrial = () => {
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

    const handleStandardVirtualTest = () => {
        navigate('/shop')
    }

    return (
        <section className="bg-white text-[#0f172a] py-16 md:py-24">
            <div className="w-[90%] max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-8">

                {/* Left - Text */}
                <div className="w-full lg:w-1/2 order-2 lg:order-1">
                    <h2 className="text-3xl md:text-4xl font-semibold mb-6">
                        For the <span className="text-orange-500">website</span>
                    </h2>

                    <p className="text-base md:text-lg text-slate-700 mb-6 max-w-xl">
                        Encourage your customers to <strong className="text-[#0f172a]">virtually try on glasses</strong> on your website with an interactive and engaging solution.
                    </p>

                    <p className="text-sm text-slate-600 mb-6 max-w-xl">
                        There are <strong className="text-[#0f172a]">2 types of solutions</strong> available based on your integration capabilities and needs: Standard or Advanced.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4">
                        <button
                            onClick={handleAdvancedVirtualTrial}
                            className="px-6 py-3 bg-orange-500 text-white rounded-full shadow-md hover:bg-orange-600 transition cursor-pointer"
                        >
                            Advanced Virtual Trial
                        </button>
                        <button
                            onClick={handleStandardVirtualTest}
                            className="px-6 py-3 border-2 border-orange-300 text-orange-600 rounded-full hover:bg-orange-50 transition cursor-pointer"
                        >
                            Standard Virtual Test
                        </button>
                    </div>
                </div>

                {/* Right - Image */}
                <div className="w-full lg:w-1/2 flex justify-center lg:justify-end order-1 lg:order-2">
                    <div className="w-[320px] md:w-[520px] lg:w-[640px] rounded-xl overflow-hidden">
                        <img src="/assets/images/image4.png" alt="Virtual test preview" className="w-full h-auto block" />
                    </div>
                </div>

            </div>
        </section>
    )
}

export default WebsiteSection
