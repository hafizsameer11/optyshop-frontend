import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

const EasyToUseSection: React.FC = () => {
    const navigate = useNavigate()
    const location = useLocation()

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
        <section className="bg-white pt-0 pb-16 md:pb-24">
            <div className="w-[90%] mx-auto">
                <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                    {/* Left - Image */}
                    <div className="flex justify-center lg:justify-start order-first lg:order-first">
                        <div className="relative w-full max-w-xl lg:max-w-2xl">
                            <img
                                src="/assets/images/MicrosoftTeams-image (32).webp"
                                alt="Easy-to-use PD measurement solution"
                                className="w-full h-auto object-contain rounded-2xl shadow-lg"
                                onError={(e) => {
                                    const target = e.target as HTMLImageElement
                                    target.src = '/assets/images/mobile1.png'
                                }}
                            />
                        </div>
                    </div>

                    {/* Right - Text Content */}
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-teal-600 mb-4">
                                <span className="underline decoration-teal-600 decoration-2 underline-offset-4">
                                    An easy-to-use
                                </span>{' '}
                                solution
                            </h2>
                        </div>

                        <div className="space-y-4 text-base md:text-lg text-slate-700 leading-relaxed">
                            <p>
                                Fittingbox PD Measurement offers a{' '}
                                <strong className="text-slate-900">step-by-step experience</strong> thanks to an{' '}
                                <strong className="text-slate-900">intuitive protocol</strong>, which{' '}
                                <strong className="text-slate-900">requires a card</strong>.
                            </p>
                            <p>
                                The interface was designed to be{' '}
                                <strong className="text-slate-900">user-centric</strong>, making this solution{' '}
                                <strong className="text-slate-900">user-friendly</strong>. It features easy-to-follow instructions, positioning guidelines, and a tutorial that{' '}
                                <strong className="text-slate-900">walks the user</strong> through the entire measurement process.
                            </p>
                            <p>
                                <strong className="text-slate-900">PD Measurement is a mobile-first solution, with no app to download. It works on any device, including desktops and tablets</strong>.
                            </p>
                        </div>

                        <div className="pt-4">
                            <button
                                onClick={handleRequestDemo}
                                className="px-8 py-3 border-2 border-teal-600 text-teal-600 font-semibold rounded-full hover:bg-teal-600 hover:text-white transition-colors duration-300 cursor-pointer"
                            >
                                Request a demo
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default EasyToUseSection

