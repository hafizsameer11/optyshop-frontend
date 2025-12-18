import React from 'react'
import { useTranslation } from 'react-i18next'

const Viewer3DSection: React.FC = () => {
    const { t } = useTranslation()
    
    const handleScrollToLiveDemo = () => {
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
    }

    return (
        <section className="bg-white py-16 px-4">
            <div className="w-[90%] max-w-6xl mx-auto">
                {/* Main content: Phone mockup left, Text right */}
                <div className="grid gap-8 lg:grid-cols-2 items-center">
                    {/* Left: Phone mockup */}
                    <div className="flex justify-center lg:justify-start">
                        <div className="relative w-[280px] sm:w-[320px]">
                            <img
                                src="/assets/images/image3.png"
                                alt="3D viewer for glasses on mobile"
                                className="w-full h-auto object-cover rounded-2xl shadow-xl"
                                onError={(e) => {
                                    // Fallback to mobile1.png if image3.png doesn't load
                                    const target = e.target as HTMLImageElement
                                    target.src = '/assets/images/mobile1.png'
                                }}
                            />
                        </div>
                    </div>

                    {/* Right: Text content */}
                    <div className="space-y-4 text-slate-900">
                        <h2 className="text-3xl sm:text-4xl font-semibold">
                            <span className="underline text-blue-700">{t('home.viewer3D.title')}</span>
                        </h2>

                        <p className="text-base sm:text-lg text-slate-700 leading-relaxed">
                            {t('home.viewer3D.description1')}
                        </p>

                        <p className="text-base sm:text-lg text-slate-700 leading-relaxed">
                            {t('home.viewer3D.description2')}
                        </p>
                    </div>
                </div>

                {/* Bottom CTA Button */}
                <div className="mt-12 flex justify-center">
                    <button
                        onClick={handleScrollToLiveDemo}
                        className="rounded-full bg-blue-900 text-white px-10 py-4 text-base sm:text-lg font-semibold shadow-lg hover:bg-blue-800 transition-colors cursor-pointer"
                    >
                        {t('common.getDemo')}
                    </button>
                </div>
            </div>
        </section>
    )
}

export default Viewer3DSection

