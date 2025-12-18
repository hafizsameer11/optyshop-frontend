import React from 'react'
import { useTranslation } from 'react-i18next'

const PurchasingJourneySection: React.FC = () => {
    const { t } = useTranslation()
    
    return (
        <section className="bg-white py-16 px-4">
            <div className="w-[90%] max-w-6xl mx-auto">
                {/* Heading */}
                <h2 className="text-center text-3xl sm:text-4xl font-semibold text-slate-900 mb-12">
                    {t('home.purchasingJourney.titlePart1')}{' '}
                    <span className="text-blue-700">{t('home.purchasingJourney.titlePart2')}</span>
                </h2>

                {/* Main content: Phone mockup left, Text right */}
                <div className="grid gap-8 lg:grid-cols-2 items-center">
                    {/* Left: Phone mockup */}
                    <div className="flex justify-center lg:justify-start">
                        <div className="relative w-[280px] sm:w-[320px]">
                            <img
                                src="/assets/images/mobile1.png"
                                alt="Virtual try-on on mobile"
                                className="w-full h-auto object-cover rounded-2xl "
                                onError={(e) => {
                                    // Fallback to virtual-try.jpg if mobile1.jfif doesn't load
                                    const target = e.target as HTMLImageElement
                                    target.src = '/assets/images/virtual-try.jpg'
                                }}
                            />
                        </div>
                    </div>

                    {/* Right: Text content */}
                    <div className="space-y-4 text-slate-900">
                        <h3 className="text-2xl sm:text-3xl font-semibold">
                            {t('home.purchasingJourney.solutionPart1')} <span className="underline font-bold text-blue-700">{t('home.purchasingJourney.solutionPart2')}</span> {t('home.purchasingJourney.solutionPart3')}
                        </h3>

                        <p className="text-lg sm:text-xl font-bold text-slate-800">
                            <span className="font-bold">89%</span> {t('home.purchasingJourney.statsText')}
                        </p>

                        <p className="text-base sm:text-lg text-slate-700 leading-relaxed">
                            {t('home.purchasingJourney.description')}
                        </p>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default PurchasingJourneySection

