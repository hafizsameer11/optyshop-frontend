import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

interface Packshot {
    id: number
    title: string
    category: 'eyeglass' | 'sunglass'
    description: string
    image: string
    brands: string[]
}

const packshots: Packshot[] = [
    {
        id: 1,
        title: '[HQ Packshots] - HD Glasses (vol. 1)',
        category: 'eyeglass',
        description: 'HQ eyeglass frame images from renowned eyewear brands: Ray-Ban / Police / Diesel / -',
        image: '/assets/images/Diesel - DL5177 - Quarter.webp',
        brands: ['Ray-Ban', 'Police', 'Diesel']
    },
    {
        id: 2,
        title: '[HQ Packshots] - HD Glasses (vol. 2)',
        category: 'eyeglass',
        description: 'HQ eyeglass frame images from popular eyewear brands: Ray-Ban / Marc Jacobs / Guess / -',
        image: '/assets/images/Marc Jacobs - MARC 283 - Quarter.webp',
        brands: ['Ray-Ban', 'Marc Jacobs', 'Guess']
    },
    {
        id: 3,
        title: '[HQ Packshots] - HD Glasses (vol. 3)',
        category: 'eyeglass',
        description: 'HQ eyeglass frame images from popular eyewear brands: Burberry / Ray-Ban / Police / Guess / -',
        image: '/assets/images/Tommy Hilfiger - TH 1018 - Quarter.webp',
        brands: ['Burberry', 'Ray-Ban', 'Police', 'Guess']
    },
    {
        id: 4,
        title: '[HQ Packshots] - HD Sunglasses (vol. 1)',
        category: 'sunglass',
        description: 'HQ sunglass frame images from famous eyewear brands: Dior / Gucci / -',
        image: '/assets/images/Dior - DIOR HYPNOTIC 1 - Quarter.webp',
        brands: ['Dior', 'Gucci']
    },
    {
        id: 5,
        title: '[HQ Packshots] - HD Sunglasses (vol. 2)',
        category: 'sunglass',
        description: 'HQ sunglass frame images from popular eyewear brands: Ray-Ban / Ralph Lauren / Prada / Gucci / -',
        image: '/assets/images/Gucci - GG0113S - Quarter.webp',
        brands: ['Ray-Ban', 'Ralph Lauren', 'Prada', 'Gucci']
    },
    {
        id: 6,
        title: '[HQ Packshots] - HD Sunglasses (vol. 3)',
        category: 'sunglass',
        description: 'HQ sunglass frame images from popular eyewear brands: Ray-Ban / Ralph Lauren / Gucci / Timberland / -',
        image: '/assets/images/Gucci - GG0113S - Quarter.webp',
        brands: ['Ray-Ban', 'Ralph Lauren', 'Gucci', 'Timberland']
    }
]

const PackshotsGrid: React.FC = () => {
    const navigate = useNavigate()
    const [activeTab, setActiveTab] = useState<'all' | 'eyeglass' | 'sunglass'>('all')

    const filteredPackshots = activeTab === 'all'
        ? packshots
        : packshots.filter(p => p.category === activeTab)

    const handleDownload = (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault()
        navigate('/pricing-request')
    }

    return (
        <section className="bg-white py-12 md:py-16 lg:py-20 px-4 sm:px-6">
            <div className="w-[90%] mx-auto max-w-7xl">
                {/* Tab Navigation */}
                <div className="flex flex-wrap items-center gap-4 md:gap-6 mb-8 md:mb-12 border-b border-gray-200 pb-4">
                    <button
                        onClick={() => setActiveTab('all')}
                        className={`px-4 py-2 text-sm md:text-base font-semibold transition-colors cursor-pointer ${activeTab === 'all'
                            ? 'text-blue-900 border-b-2 border-blue-900'
                            : 'text-gray-600 hover:text-blue-700'
                            }`}
                    >
                        Show all
                    </button>
                    <button
                        onClick={() => setActiveTab('eyeglass')}
                        className={`px-4 py-2 text-sm md:text-base font-semibold transition-colors cursor-pointer ${activeTab === 'eyeglass'
                            ? 'text-blue-900 border-b-2 border-blue-900'
                            : 'text-gray-600 hover:text-blue-700'
                            }`}
                    >
                        Eyeglasses
                    </button>
                    <button
                        onClick={() => setActiveTab('sunglass')}
                        className={`px-4 py-2 text-sm md:text-base font-semibold transition-colors cursor-pointer ${activeTab === 'sunglass'
                            ? 'text-blue-900 border-b-2 border-blue-900'
                            : 'text-gray-600 hover:text-blue-700'
                            }`}
                    >
                        Sunglasses
                    </button>
                </div>

                {/* Product Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                    {filteredPackshots.map((packshot) => (
                        <article
                            key={packshot.id}
                            className="bg-white rounded-lg border-2 border-solid border-gray-300 p-6 hover:border-blue-500 transition-colors flex flex-col"
                        >
                            {/* Image */}
                            <div className="relative w-full h-48 md:h-56 mb-4 overflow-hidden rounded-lg bg-gray-100">
                                <img
                                    src={packshot.image}
                                    alt={packshot.title}
                                    className="w-full h-full object-contain"
                                    onError={(e) => {
                                        const target = e.target as HTMLImageElement
                                        target.style.display = 'none'
                                    }}
                                />
                            </div>

                            {/* Content */}
                            <div className="flex flex-col flex-grow">
                                {/* Category Tag */}
                                <span className="text-xs md:text-sm text-gray-600 font-semibold uppercase tracking-wide mb-2">
                                    {packshot.category}
                                </span>

                                {/* Title */}
                                <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-3 leading-tight">
                                    {packshot.title}
                                </h3>

                                {/* Description */}
                                <p className="text-sm md:text-base text-gray-600 mb-4 flex-grow leading-relaxed">
                                    {packshot.description}
                                </p>

                                {/* Download Link */}
                                <a
                                    href="#"
                                    onClick={handleDownload}
                                    className="text-blue-600 hover:text-blue-700 font-semibold text-sm md:text-base transition-colors inline-flex items-center gap-2 group cursor-pointer"
                                >
                                    Download now
                                    <svg
                                        className="w-4 h-4 group-hover:translate-x-1 transition-transform"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M9 5l7 7-7 7"
                                        />
                                    </svg>
                                </a>
                            </div>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    )
}

export default PackshotsGrid

