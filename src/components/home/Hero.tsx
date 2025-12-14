import React from 'react'
import { useTranslation } from 'react-i18next'
import Navbar from '../Navbar'

const Hero: React.FC = () => {
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
        <div className="relative min-h-screen text-white">
            {/* Background image / video placeholder */}
            <div
                className="absolute inset-0 bg-cover bg-center"
                style={{
                    // Local hero image from public/assets/images/hero.jpg
                    backgroundImage: "url('/assets/images/hero3.avif')",
                }}
            />
            {/* Dark overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-black/80" />

            {/* Content */}
            <div className="relative z-10 flex flex-col min-h-screen">
                <Navbar />

                {/* Hero center content */}
                <main className="flex-1 flex items-center justify-center px-6 lg:px-20 pb-16">
                    <div className="max-w-3xl text-center">
                        <h1 className="text-3xl sm:text-4xl lg:text-6xl font-semibold leading-tight">
                            <span className="block">{t('home.hero.title')}</span>
                            <span className="block font-light italic mt-1 text-2xl sm:text-3xl lg:text-5xl">
                                {t('home.hero.subtitle')}
                            </span>
                        </h1>

                        <p className="mt-6 text-sm sm:text-base lg:text-lg text-slate-100/90">
                            {t('home.hero.description')}
                        </p>

                        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
                            <button
                                onClick={handleScrollToLiveDemo}
                                className="inline-flex justify-center rounded-full bg-white text-slate-900 px-8 py-3 text-sm sm:text-base font-semibold shadow-lg hover:bg-slate-100 transition-colors cursor-pointer"
                            >
                                {t('home.hero.tryOnButton')}
                            </button>
                            <button
                                onClick={handleScrollToLiveDemo}
                                className="inline-flex justify-center rounded-full border border-white/60 px-8 py-3 text-sm sm:text-base font-semibold hover:bg-white/10 transition-colors cursor-pointer"
                            >
                                {t('home.hero.requestDemoButton')}
                            </button>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    )
}

export default Hero

