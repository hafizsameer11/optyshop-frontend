import React from 'react'
import { useTranslation } from 'react-i18next'

const StatsHighlight: React.FC = () => {
    const { t } = useTranslation()
    
    const stats = [
        {
            value: '4x',
            title: t('home.stats.visitsTitle'),
            caption: t('home.stats.caption'),
            icon: '👉',
        },
        {
            value: '3x',
            title: t('home.stats.conversionTitle'),
            caption: t('home.stats.caption'),
            icon: '🛒',
        },
        {
            value: '2.5x',
            title: t('home.stats.visitorsTitle'),
            caption: t('home.stats.caption'),
            icon: '🏬',
        },
    ]
    return (
        <section className="bg-[#f8f3ed] py-16 px-4">
            <div className="w-[90%] mx-auto text-center space-y-4">
                <p className="text-sm uppercase tracking-[0.4em] text-slate-500">{t('home.stats.impact')}</p>
                <h2 className="text-2xl md:text-3xl font-semibold text-slate-800 pb-12">
                    {t('home.stats.title')} <span className="text-blue-700">{t('home.stats.titleHighlight')}</span>
                </h2>
            </div>

            <div className="mt-12 grid gap-8 md:grid-cols-3 w-[90%] mx-auto">
                {stats.map((stat) => (
                    <div
                        key={stat.title}
                        className="relative bg-white rounded-3xl shadow-[0_20px_45px_rgba(14,30,37,0.08)] px-6 pt-16 pb-8 text-center"
                    >
                        <div className="absolute -top-10 left-1/2 -translate-x-1/2">
                            <div className="h-20 w-20 rounded-3xl bg-gradient-to-b from-orange-400 to-pink-500 flex items-center justify-center text-3xl text-white shadow-lg">
                                {stat.icon}
                            </div>
                        </div>

                        <p className="text-5xl font-bold text-blue-900">{stat.value}</p>
                        <p className="mt-4 text-lg font-semibold text-slate-800">{stat.title}</p>
                        <p className="mt-4 text-sm text-slate-500 leading-relaxed">{stat.caption}</p>
                    </div>
                ))}
            </div>
        </section>
    )
}

export default StatsHighlight


