import React from 'react'

const customers = [
    { name: 'Fielmann', src: '/assets/images/Logo Fielmann.webp' },
    { name: 'J!NS', src: '/assets/images/Logo JINS BW.webp' },
    { name: 'Specsavers', src: '/assets/images/Specsavers-Logo.webp' },
    { name: 'pair', src: '/assets/images/Logo-Pair-Eyewear-nb.webp' },
    { name: 'MARCHON', src: '/assets/images/Logo Marchon-3.webp' },
    { name: 'ZEISS', src: '/assets/images/logo_zeiss.webp' },
    { name: 'ZENNI™', src: '/assets/images/Zenni-Logo.webp' },
    { name: 'LVMH', src: '/assets/images/LVMH-logo.webp' },
    { name: 'KITS', src: '/assets/images/kits.webp' },
    { name: 'Transitions', src: '/assets/images/Logo Transitions BW.webp' },
    { name: 'HANS ANDERS', src: '/assets/images/hans-anders-logo.webp' },
    { name: 'ESCHENBACH', src: '/assets/images/logo_eschenbach_800x300.webp' },
    { name: 'eyerim', src: '/assets/images/multiopticas.webp' },
    { name: 'ALAIN AFFLELOU', src: '/assets/images/alain-afflelou-logo.webp' },
    { name: 'Le Petit Lunetier', src: '/assets/images/le-petit-lunetier-logo.webp' },
]

const CustomerShowcaseSection: React.FC = () => {
    // Duplicate the array for seamless infinite scroll
    const track = [...customers, ...customers]

    return (
        <section className="bg-white py-12 md:py-16 lg:py-20">
            <div className="w-[90%] mx-auto max-w-7xl">
                {/* Title */}
                <h2 className="text-center text-2xl sm:text-3xl md:text-4xl font-bold text-blue-900 mb-12 md:mb-16">
                    Among <span className="uppercase">FITTINGBOX</span> customers
                </h2>

                {/* Auto-sliding Logo Carousel */}
                <div className="overflow-hidden">
                    <div className="flex gap-12 md:gap-16 px-8 items-center marquee-track">
                        {track.map((customer, index) => (
                            <div
                                key={`${customer.name}-${index}`}
                                className="flex-shrink-0 flex items-center justify-center"
                            >
                                <img
                                    src={customer.src}
                                    alt={customer.name}
                                    className="h-8 sm:h-10 md:h-12 lg:h-14 object-contain opacity-70 hover:opacity-100 transition-opacity grayscale hover:grayscale-0"
                                    onError={(e) => {
                                        const target = e.target as HTMLImageElement
                                        target.style.display = 'none'
                                    }}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    )
}

export default CustomerShowcaseSection

