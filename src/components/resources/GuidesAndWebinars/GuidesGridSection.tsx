import React from 'react'
import { useNavigate } from 'react-router-dom'

interface GuideItem {
    title: string
    image: string
    items: Array<{
        text: string
        linkText: 'Watch' | 'View'
        path: string
    }>
    exploreAllPath: string
}

const guidesData: GuideItem[] = [
    {
        title: 'E-commerce',
        image: '/assets/images/best-practices-guides.webp',
        items: [
            {
                text: 'Webinar | Click to get a clear view: Increase eyewear sales with smart digital solutions.',
                linkText: 'Watch',
                path: '#'
            },
            {
                text: 'Webinar | Actions to maximize sales on your online store',
                linkText: 'Watch',
                path: '#'
            },
            {
                text: 'Webinar | How to Convert Undecided Buyers?',
                linkText: 'Watch',
                path: '#'
            },
            {
                text: 'Virtual Try-On: Best Practices',
                linkText: 'Watch',
                path: '#'
            },
            {
                text: 'Virtual Try-On: Key Benefits',
                linkText: 'Watch',
                path: '#'
            },
            {
                text: 'Webinar | Virtual Eyeglass Try-On: 5 Things to Keep in Mind',
                linkText: 'Watch',
                path: '#'
            }
        ],
        exploreAllPath: '#'
    },
    {
        title: 'From guide to shop',
        image: '/assets/images/drive-to-store-guides1.webp',
        items: [
            {
                text: 'Drive-to-store strategy for eyeglasses: The complete guide',
                linkText: 'View',
                path: '#'
            },
            {
                text: 'Increase eyewear sales and customer loyalty with an omnichannel strategy',
                linkText: 'View',
                path: '#'
            }
        ],
        exploreAllPath: '#'
    },
    {
        title: 'Social media',
        image: '/assets/images/social-media-guides.webp',
        items: [
            {
                text: 'Social Media Filters for Glasses: The Complete Guide',
                linkText: 'View',
                path: '#'
            },
            {
                text: 'Instagram Filters: The Complete Guide to Getting Started',
                linkText: 'View',
                path: '#'
            },
            {
                text: 'Snapchat Filters: The Complete Guide to Getting Started',
                linkText: 'View',
                path: '#'
            },
            {
                text: 'TikTok Filters: The Complete Guide to Getting Started',
                linkText: 'View',
                path: '#'
            }
        ],
        exploreAllPath: '#'
    },
    {
        title: 'Eyewear catalog',
        image: '/assets/images/eyewear-catalog-guides.webp',
        items: [
            {
                text: 'Find different inspirations for your eyewear catalog',
                linkText: 'View',
                path: '#'
            },
            {
                text: 'The different profiles of those who wear glasses',
                linkText: 'View',
                path: '#'
            },
            {
                text: 'Manage and optimize your online eyewear catalog',
                linkText: 'View',
                path: '#'
            },
            {
                text: 'Digital eyewear catalog: Where to find high-quality frame photos?',
                linkText: 'View',
                path: '#'
            }
        ],
        exploreAllPath: '#'
    }
]

const GuidesGridSection: React.FC = () => {
    const navigate = useNavigate()

    const handleWatchClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault()
        navigate('/webinar')
    }

    const handleViewClick = (e: React.MouseEvent<HTMLAnchorElement>, category: string) => {
        e.preventDefault()
        if (category === 'From guide to shop') {
            navigate('/drive-to-store')
        } else if (category === 'Eyewear catalog') {
            navigate('/digital-frames')
        } else {
            // For social media, could navigate to a relevant page or stay on current page
            navigate('/guides-and-webinars')
        }
    }

    const handleExploreAll = (e: React.MouseEvent<HTMLAnchorElement>, category: string) => {
        e.preventDefault()
        if (category === 'E-commerce') {
            navigate('/ecommerce')
        } else if (category === 'From guide to shop') {
            navigate('/drive-to-store')
        } else if (category === 'Eyewear catalog') {
            navigate('/digital-frames')
        } else {
            navigate('/guides-and-webinars')
        }
    }

    return (
        <section className="bg-white py-12 md:py-16 lg:py-20 px-4 sm:px-6">
            <div className="w-[90%] mx-auto max-w-7xl">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                    {/* E-commerce - Top Left */}
                    <div className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300">
                        <div className="relative w-full h-48 md:h-56 overflow-hidden">
                            <img
                                src={guidesData[0].image}
                                alt={guidesData[0].title}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    const target = e.target as HTMLImageElement
                                    target.style.display = 'none'
                                }}
                            />
                        </div>
                        <div className="p-6">
                            <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">
                                {guidesData[0].title}
                            </h3>
                            <ul className="space-y-3 mb-6">
                                {guidesData[0].items.map((item, index) => (
                                    <li key={index} className="flex items-start justify-between gap-2">
                                        <span className="text-sm md:text-base text-gray-700 flex-1">
                                            {item.text}
                                        </span>
                                        <a
                                            href={item.path}
                                            onClick={(e) => item.linkText === 'Watch' ? handleWatchClick(e) : handleViewClick(e, guidesData[0].title)}
                                            className="text-gray-900 hover:text-gray-700 font-semibold text-sm md:text-base whitespace-nowrap cursor-pointer"
                                        >
                                            {item.linkText}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                            <a
                                href={guidesData[0].exploreAllPath}
                                onClick={(e) => handleExploreAll(e, guidesData[0].title)}
                                className="text-gray-900 hover:text-gray-700 font-semibold text-sm md:text-base cursor-pointer"
                            >
                                Explore all
                            </a>
                        </div>
                    </div>

                    {/* From guide to shop - Top Middle */}
                    <div className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300">
                        <div className="relative w-full h-48 md:h-56 overflow-hidden">
                            <img
                                src={guidesData[1].image}
                                alt={guidesData[1].title}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    const target = e.target as HTMLImageElement
                                    target.style.display = 'none'
                                }}
                            />
                        </div>
                        <div className="p-6">
                            <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">
                                {guidesData[1].title}
                            </h3>
                            <ul className="space-y-3 mb-6">
                                {guidesData[1].items.map((item, index) => (
                                    <li key={index} className="flex items-start justify-between gap-2">
                                        <span className="text-sm md:text-base text-gray-700 flex-1">
                                            {item.text}
                                        </span>
                                        <a
                                            href={item.path}
                                            onClick={(e) => item.linkText === 'Watch' ? handleWatchClick(e) : handleViewClick(e, guidesData[1].title)}
                                            className="text-gray-900 hover:text-gray-700 font-semibold text-sm md:text-base whitespace-nowrap cursor-pointer"
                                        >
                                            {item.linkText}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                            <a
                                href={guidesData[1].exploreAllPath}
                                onClick={(e) => handleExploreAll(e, guidesData[1].title)}
                                className="text-gray-900 hover:text-gray-700 font-semibold text-sm md:text-base cursor-pointer"
                            >
                                Explore all
                            </a>
                        </div>
                    </div>

                    {/* Social media - Top Right */}
                    <div className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300">
                        <div className="relative w-full h-48 md:h-56 overflow-hidden">
                            <img
                                src={guidesData[2].image}
                                alt={guidesData[2].title}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    const target = e.target as HTMLImageElement
                                    target.style.display = 'none'
                                }}
                            />
                        </div>
                        <div className="p-6">
                            <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">
                                {guidesData[2].title}
                            </h3>
                            <ul className="space-y-3 mb-6">
                                {guidesData[2].items.map((item, index) => (
                                    <li key={index} className="flex items-start justify-between gap-2">
                                        <span className="text-sm md:text-base text-gray-700 flex-1">
                                            {item.text}
                                        </span>
                                        <a
                                            href={item.path}
                                            onClick={(e) => item.linkText === 'Watch' ? handleWatchClick(e) : handleViewClick(e, guidesData[2].title)}
                                            className="text-gray-900 hover:text-gray-700 font-semibold text-sm md:text-base whitespace-nowrap cursor-pointer"
                                        >
                                            {item.linkText}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                            <a
                                href={guidesData[2].exploreAllPath}
                                onClick={(e) => handleExploreAll(e, guidesData[2].title)}
                                className="text-gray-900 hover:text-gray-700 font-semibold text-sm md:text-base cursor-pointer"
                            >
                                Explore all
                            </a>
                        </div>
                    </div>

                    {/* Eyewear catalog - Bottom Left */}
                    <div className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300 md:col-span-1 lg:col-span-1">
                        <div className="relative w-full h-48 md:h-56 overflow-hidden">
                            <img
                                src={guidesData[3].image}
                                alt={guidesData[3].title}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    const target = e.target as HTMLImageElement
                                    target.style.display = 'none'
                                }}
                            />
                        </div>
                        <div className="p-6">
                            <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">
                                {guidesData[3].title}
                            </h3>
                            <ul className="space-y-3 mb-6">
                                {guidesData[3].items.map((item, index) => (
                                    <li key={index} className="flex items-start justify-between gap-2">
                                        <span className="text-sm md:text-base text-gray-700 flex-1">
                                            {item.text}
                                        </span>
                                        <a
                                            href={item.path}
                                            onClick={(e) => item.linkText === 'Watch' ? handleWatchClick(e) : handleViewClick(e, guidesData[3].title)}
                                            className="text-gray-900 hover:text-gray-700 font-semibold text-sm md:text-base whitespace-nowrap cursor-pointer"
                                        >
                                            {item.linkText}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                            <a
                                href={guidesData[3].exploreAllPath}
                                onClick={(e) => handleExploreAll(e, guidesData[3].title)}
                                className="text-gray-900 hover:text-gray-700 font-semibold text-sm md:text-base cursor-pointer"
                            >
                                Explore all
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default GuidesGridSection

