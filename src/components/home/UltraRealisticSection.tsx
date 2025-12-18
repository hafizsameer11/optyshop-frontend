import React from 'react'
import { useTranslation } from 'react-i18next'

const UltraRealisticSection: React.FC = () => {
    const { t } = useTranslation()
    
    return (
        <section className="bg-white py-20 px-4">
            <div className="w-[90%] max-w-6xl mx-auto">
                {/* Main content: Text left, Tablet image right */}
                <div className="grid gap-12 lg:grid-cols-2 items-center">
                    {/* Left: Text content */}
                    <div className="space-y-6 text-slate-900">
                        <h2 className="text-3xl sm:text-4xl font-semibold text-blue-900">
                            {t('home.ultraRealistic.titlePart1')}{' '}
                            <span className="underline">{t('home.ultraRealistic.titlePart2')}</span>
                        </h2>

                        <p className="text-base sm:text-lg text-slate-700 leading-relaxed">
                            {t('home.ultraRealistic.description1Part1')} <span className="font-bold">{t('home.ultraRealistic.description1Part2')}</span> {t('home.ultraRealistic.description1Part3')}
                        </p>

                        <p className="text-base sm:text-lg text-slate-700 leading-relaxed">
                            {t('home.ultraRealistic.description2Part1')}{' '}
                            <span className="font-bold">{t('home.ultraRealistic.description2Part2')}</span> {t('home.ultraRealistic.description2Part3')}
                        </p>
                    </div>

                    {/* Right: Tablet mockup */}
                    <div className="flex justify-center lg:justify-end">
                        <div className="relative w-full max-w-[400px]">
                            <img
                                src="/assets/images/image.png"
                                alt="Ultra-realistic virtual try-on on tablet"
                                className="w-full h-auto object-cover rounded-2xl shadow-xl"
                                onError={(e) => {
                                    // Fallback to virtual-try.jpg if image.png doesn't load
                                    const target = e.target as HTMLImageElement
                                    target.src = '/assets/images/virtual-try.jpg'
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default UltraRealisticSection

