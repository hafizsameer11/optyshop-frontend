import React from 'react'

const brands = [
    { name: 'KITS', src: '/assets/images/kits.webp' },
    { name: 'Transitions', src: '/assets/images/Logo Transitions BW.webp' },
    { name: 'pair', src: '/assets/images/Logo-Pair-Eyewear-nb.webp' },
    { name: 'JINS', src: '/assets/images/Logo JINS BW.webp' },
    { name: 'ZENNI', src: '/assets/images/Zenni-Logo.webp' },
    { name: 'ZEISS', src: '/assets/images/logo_zeiss.webp' },
    { name: 'Specsavers', src: '/assets/images/Specsavers-Logo.webp' },
    { name: 'peepers', src: '/assets/images/logo_peepers_nb.webp' },
    { name: 'fielmann', src: '/assets/images/Logo Fielmann.webp' },
    { name: 'MULTIÓPTICAS', src: '/assets/images/multiopticas.webp' },
]

const TrustedBrands: React.FC = () => {
    const track = [...brands, ...brands]

    return (
        <section className="bg-white text-slate-900">
            <div className="h-1 bg-gradient-to-r from-orange-400 via-teal-400 to-purple-600" />

            <div className="max-w-6xl mx-auto px-6 py-6 text-center space-y-2">
                <h2 className="text-lg sm:text-xl font-semibold text-slate-700 tracking-wide">
                    They already <span className="text-blue-700">trust us</span>
                </h2>
            </div>

            <div className="overflow-hidden pb-6">
                <div className="flex gap-16 px-8 items-center marquee-track">
                    {track.map((brand, index) => (
                        <img
                            key={`${brand.name}-${index}`}
                            src={brand.src}
                            alt={brand.name}
                            className="h-8 sm:h-12 object-contain opacity-80 hover:opacity-100 transition-opacity"
                        />
                    ))}
                </div>
            </div>
        </section>
    )
}

export default TrustedBrands


