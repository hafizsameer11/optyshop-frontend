import React from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

/**
 * Short trust / site-info strip before the home contact form (secure shopping, help links).
 */
const HomeShoppingInfoSection: React.FC = () => {
    const { t } = useTranslation()

    const items = [
        {
            icon: (
                <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-1.061-1.764l-6-3.333a2 2 0 00-1.878 0l-6 3.333A2 2 0 004 13v6a2 2 0 002 2z"
                    />
                </svg>
            ),
            title: t('home.shoppingInfo.secureTitle'),
            body: t('home.shoppingInfo.secureDesc'),
        },
        {
            icon: (
                <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                    />
                </svg>
            ),
            title: t('home.shoppingInfo.deliveryTitle'),
            body: t('home.shoppingInfo.deliveryDesc'),
        },
        {
            icon: (
                <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                </svg>
            ),
            title: t('home.shoppingInfo.helpTitle'),
            body: t('home.shoppingInfo.helpDesc'),
            links: (
                <div className="mt-3 flex flex-wrap gap-3 text-sm font-semibold">
                    <Link to="/help-center" className="text-blue-700 hover:text-blue-900 underline-offset-2 hover:underline">
                        {t('home.shoppingInfo.helpLink')}
                    </Link>
                    <span className="text-slate-300" aria-hidden>
                        ·
                    </span>
                    <Link to="/contact" className="text-blue-700 hover:text-blue-900 underline-offset-2 hover:underline">
                        {t('home.shoppingInfo.contactLink')}
                    </Link>
                </div>
            ),
        },
    ]

    return (
        <section className="border-t border-slate-200 bg-white px-4 py-10 text-slate-900 sm:px-6 md:py-16">
            <div className="mx-auto w-[90%] max-w-6xl">
                <h2 className="mb-6 text-center text-xl font-semibold text-blue-900 sm:mb-10 sm:text-2xl md:mb-12 md:text-3xl">
                    {t('home.shoppingInfo.title')}
                </h2>
                <div className="grid gap-5 md:grid-cols-3 md:gap-10">
                    {items.map((item) => (
                        <div
                            key={item.title}
                            className="rounded-2xl border border-slate-200/90 bg-slate-50/80 p-6 text-center shadow-sm transition-shadow hover:shadow-md"
                        >
                            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-800">
                                {item.icon}
                            </div>
                            <h3 className="text-lg font-semibold text-slate-900">{item.title}</h3>
                            <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.body}</p>
                            {'links' in item && item.links}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}

export default HomeShoppingInfoSection
