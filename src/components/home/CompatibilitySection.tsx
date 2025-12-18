import React from 'react'
import { useTranslation } from 'react-i18next'

const CompatibilitySection: React.FC = () => {
    const { t } = useTranslation()
    const ecommercePlatforms = [
        { name: 'Magento', logo: '/assets/images/Magento-logo-web.webp' },
        { name: 'WooCommerce', logo: '/assets/images/Woocomerce-logo-web.webp' },
        { name: 'Shopify', logo: '/assets/images/Shopify-logo-web.webp' },
        { name: 'PrestaShop', logo: '/assets/images/Prestashop-logo-web.webp' },
        { name: 'Drupal', logo: '/assets/images/Drupal-logo-web.webp' },
    ]

    return (
        <section className="bg-slate-50 py-20 px-4">
            <div className="w-[90%] max-w-6xl mx-auto space-y-16">
                {/* Top Section: E-commerce Platforms */}
                <div>
                    <h2 className="text-center text-2xl sm:text-3xl font-semibold text-blue-900 mb-10">
                        {t('home.compatibility.ecommercePlatforms')}
                    </h2>
                    <div className="flex flex-wrap justify-center items-center gap-8 sm:gap-12">
                        {ecommercePlatforms.map((platform) => (
                            <div
                                key={platform.name}
                                className="flex items-center justify-center h-12 sm:h-16 opacity-80 hover:opacity-100 transition-opacity"
                            >
                                <img
                                    src={platform.logo}
                                    alt={platform.name}
                                    className="h-full w-auto object-contain"
                                    onError={(e) => {
                                        const target = e.target as HTMLImageElement
                                        target.style.display = 'none'
                                    }}
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Divider */}
                <div className="border-t border-slate-300"></div>

                {/* Bottom Section: Systems and Devices */}
                <div>
                    <h2 className="text-center text-2xl sm:text-3xl font-semibold text-blue-900 mb-10">
                        {t('home.compatibility.worksOnAnyDevice')}
                    </h2>
                    <div className="flex justify-center">
                        <img
                            src="/assets/images/browser-os-device.svg"
                            alt="Browser, OS, and Device compatibility"
                            className="w-full max-w-4xl h-auto object-contain"
                            onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.style.display = 'none'
                            }}
                        />
                    </div>
                </div>
            </div>
        </section>
    )
}

export default CompatibilitySection

