import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import CartIcon from './CartIcon'
import LanguageSwitcher from './LanguageSwitcher'

const Navbar: React.FC = () => {
    const { t } = useTranslation()
    
    const products = [
        { label: t('products.virtualTest'), icon: '👓', path: '/virtual-test' },
        { label: t('products.digitalizedFrames'), icon: '🖼️', path: '/digital-frames' },
        { label: t('products.opticiansInstruments'), icon: '🔧', path: '/optical-instruments' },
        { label: t('products.3dViewer'), icon: '🌀', path: '/3d-viewer' },
        { label: t('products.measurementOfDP'), icon: '📏', path: '/pd-measurement' },
        { label: t('products.openInnovation'), icon: '💡', path: '/open-innovation' },
    ]

    const solutions = [
        {
            label: t('solutions.online'),
            description: t('solutions.onlineDesc'),
            gradient: 'from-orange-500 to-red-500',
            icon: '🖱️',
            path: '/online'
        },
        {
            label: t('solutions.3dResources'),
            description: t('solutions.3dResourcesDesc'),
            gradient: 'from-green-500 to-blue-500',
            icon: '💾',
            path: '/3d-resources'
        },
        {
            label: t('solutions.inStore'),
            description: t('solutions.inStoreDesc'),
            gradient: 'from-orange-500 to-yellow-500',
            icon: '🏪',
            path: '/in-store'
        },
        {
            label: t('solutions.ecommerce'),
            description: t('solutions.ecommerceDesc'),
            gradient: 'from-orange-500 to-yellow-500',
            icon: '🛒',
            path: '/ecommerce'
        },
        {
            label: t('solutions.pupilDistance'),
            description: t('solutions.pupilDistanceDesc'),
            gradient: 'from-blue-400 to-green-500',
            icon: '👁️',
            path: '/pupil-distance'
        },
        {
            label: t('solutions.driveToStore'),
            description: t('solutions.driveToStoreDesc'),
            gradient: 'from-orange-500 to-yellow-500',
            icon: '📍',
            path: '/drive-to-store'
        },
    ]

    const resources = [
        {
            label: t('resources.caseStudies'),
            gradient: 'from-orange-500 to-orange-600',
            icon: '📣',
            path: '/case-studies',
            column: 'left'
        },
        {
            label: t('resources.hqPackshots'),
            gradient: 'from-cyan-400 to-teal-500',
            icon: '📸',
            path: '/hq-packshots',
            column: 'left'
        },
        {
            label: t('resources.support'),
            gradient: 'from-purple-500 via-pink-500 to-purple-600',
            icon: '❓',
            path: '/support',
            column: 'left'
        },
        {
            label: t('resources.guidesAndWebinars'),
            gradient: 'from-purple-600 to-purple-700',
            icon: '✅',
            path: '/guides-and-webinars',
            column: 'right'
        },
        {
            label: t('resources.blog'),
            gradient: 'from-orange-400 to-orange-500',
            icon: '📝',
            path: '/blog',
            column: 'right'
        },
    ]

    const whoWeAre = [
        {
            label: t('whoWeAre.ourHistory'),
            gradient: 'from-orange-500 to-red-500',
            icon: '✍️',
            path: '/our-history'
        },
        {
            label: t('whoWeAre.ourTechnology'),
            gradient: 'from-blue-500 to-green-500',
            icon: '💡',
            path: '/our-technology'
        },
        {
            label: t('whoWeAre.joinUs'),
            gradient: 'from-purple-500 to-pink-500',
            icon: '👥',
            path: '/join-us'
        },
    ]

    const navigate = useNavigate()
    const location = useLocation()
    const [isMobileOpen, setIsMobileOpen] = useState(false)
    const [isProductsOpen, setIsProductsOpen] = useState(false)
    const [isSolutionsOpen, setIsSolutionsOpen] = useState(false)
    const [isResourcesOpen, setIsResourcesOpen] = useState(false)
    const [isWhoWeAreOpen, setIsWhoWeAreOpen] = useState(false)
    const [isMobileProductsOpen, setIsMobileProductsOpen] = useState(true)
    const [isMobileSolutionsOpen, setIsMobileSolutionsOpen] = useState(false)
    const [isMobileResourcesOpen, setIsMobileResourcesOpen] = useState(false)
    const [isMobileWhoWeAreOpen, setIsMobileWhoWeAreOpen] = useState(false)
    const [isScrolled, setIsScrolled] = useState(false)

    const handleScrollToLiveDemo = () => {
        if (location.pathname === '/') {
            // Already on home page, just scroll
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
        } else {
            // Navigate to home page with hash
            navigate('/#live-demo')
        }
    }

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20)
        }

        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    return (
        <header
            className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-300 ${isScrolled ? 'bg-blue-950/95 backdrop-blur-xl shadow-lg border-b border-white/5' : 'bg-transparent'
                }`}
        >
            <div className="flex items-center justify-between w-[90%] max-w-7xl mx-auto py-4 md:py-5">
                {/* Logo */}
                <Link to="/" className="flex items-center space-x-2 flex-shrink-0">
                    <div className="h-9 text-white w-9 border-2 border-blue-400 rounded-md flex items-center justify-center text-xs tracking-widest bg-white/5">
                        OS
                    </div>
                    <span className="text-base md:text-lg font-bold tracking-[0.35em] uppercase text-white">
                        OptiShop
                    </span>
                </Link>

                {/* Desktop navigation */}
                <nav className="hidden md:flex items-center space-x-8 lg:space-x-10 text-sm md:text-base font-semibold text-white flex-1 justify-center">
                    {/* Products with dropdown */}
                    <div
                        className="relative"
                        onMouseEnter={() => setIsProductsOpen(true)}
                        onMouseLeave={() => setIsProductsOpen(false)}
                    >
                        <button className="inline-flex items-center gap-1 pb-1 border-b-2 border-transparent hover:border-blue-400 hover:text-blue-300 transition-colors cursor-pointer">
                            {t('navbar.products')}
                            <span className="text-xs">▾</span>
                        </button>

                        {isProductsOpen && (
                            <div className="absolute left-0 top-full pt-2 w-[520px] rounded-3xl bg-white/95 shadow-2xl px-8 py-6 text-slate-900 backdrop-blur-sm">
                                <div className="grid grid-cols-2 gap-x-10 gap-y-5">
                                    {products.map((item) => (
                                        <Link
                                            key={item.label}
                                            to={item.path}
                                            onClick={() => setIsProductsOpen(false)}
                                            className="flex items-center gap-3 text-left hover:translate-y-0.5 hover:scale-[1.01] transition-transform cursor-pointer"
                                        >
                                            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 flex items-center justify-center text-xl text-white shadow-md">
                                                <span>{item.icon}</span>
                                            </div>
                                            <span className="text-xs sm:text-sm font-semibold uppercase tracking-wide">
                                                {item.label}
                                            </span>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Solutions with dropdown */}
                    <div
                        className="relative"
                        onMouseEnter={() => setIsSolutionsOpen(true)}
                        onMouseLeave={() => setIsSolutionsOpen(false)}
                    >
                        <button className="inline-flex items-center gap-1 pb-1 border-b-2 border-transparent hover:border-blue-400 hover:text-blue-300 transition-colors cursor-pointer">
                            {t('navbar.solutions')}
                            <span className="text-xs">▾</span>
                        </button>

                        {isSolutionsOpen && (
                            <div className="absolute left-0 top-full pt-2 w-[520px] rounded-3xl bg-white/95 shadow-2xl px-8 py-6 text-slate-900 backdrop-blur-sm">
                                <div className="grid grid-cols-2 gap-x-10 gap-y-5">
                                    {solutions.map((item) => (
                                        <Link
                                            key={item.label}
                                            to={item.path}
                                            onClick={() => setIsSolutionsOpen(false)}
                                            className="flex items-start gap-3 text-left hover:translate-y-0.5 hover:scale-[1.01] transition-transform cursor-pointer"
                                        >
                                            <div className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${item.gradient} flex items-center justify-center text-xl text-white shadow-md flex-shrink-0`}>
                                                <span>{item.icon}</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-xs sm:text-sm font-semibold uppercase tracking-wide">
                                                    {item.label}
                                                </span>
                                                <span className="text-xs text-slate-600 mt-0.5">
                                                    {item.description}
                                                </span>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                    {/* Resources with dropdown */}
                    <div
                        className="relative"
                        onMouseEnter={() => setIsResourcesOpen(true)}
                        onMouseLeave={() => setIsResourcesOpen(false)}
                    >
                        <button className="inline-flex items-center gap-1 pb-1 border-b-2 border-transparent hover:border-blue-400 hover:text-blue-300 transition-colors cursor-pointer">
                            {t('navbar.resources')}
                            <span className="text-xs">▾</span>
                        </button>

                        {isResourcesOpen && (
                            <div className="absolute left-0 top-full pt-2 w-[520px] rounded-3xl bg-white/95 shadow-2xl px-8 py-6 text-slate-900 backdrop-blur-sm">
                                <div className="grid grid-cols-2 gap-x-10 gap-y-5">
                                    {/* Left column */}
                                    <div className="flex flex-col gap-5">
                                        {resources.filter(item => item.column === 'left').map((item) => (
                                            <Link
                                                key={item.label}
                                                to={item.path}
                                                onClick={() => setIsResourcesOpen(false)}
                                                className="flex items-center gap-3 text-left hover:translate-y-0.5 hover:scale-[1.01] transition-transform cursor-pointer"
                                            >
                                                <div className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${item.gradient} flex items-center justify-center text-xl text-white shadow-md`}>
                                                    <span>{item.icon}</span>
                                                </div>
                                                <span className="text-xs sm:text-sm font-semibold uppercase tracking-wide">
                                                    {item.label}
                                                </span>
                                            </Link>
                                        ))}
                                    </div>
                                    {/* Right column */}
                                    <div className="flex flex-col gap-5">
                                        {resources.filter(item => item.column === 'right').map((item) => (
                                            <Link
                                                key={item.label}
                                                to={item.path}
                                                onClick={() => setIsResourcesOpen(false)}
                                                className="flex items-center gap-3 text-left hover:translate-y-0.5 hover:scale-[1.01] transition-transform cursor-pointer"
                                            >
                                                <div className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${item.gradient} flex items-center justify-center text-xl text-white shadow-md`}>
                                                    <span>{item.icon}</span>
                                                </div>
                                                <span className="text-xs sm:text-sm font-semibold uppercase tracking-wide">
                                                    {item.label}
                                                </span>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                    {/* Who We Are with dropdown */}
                    <div
                        className="relative"
                        onMouseEnter={() => setIsWhoWeAreOpen(true)}
                        onMouseLeave={() => setIsWhoWeAreOpen(false)}
                    >
                        <button className="inline-flex items-center gap-1 pb-1 border-b-2 border-transparent hover:border-blue-400 hover:text-blue-300 transition-colors cursor-pointer">
                            {t('navbar.whoWeAre')}
                            <span className="text-xs">▾</span>
                        </button>

                        {isWhoWeAreOpen && (
                            <div className="absolute left-0 top-full pt-2 w-[380px] rounded-2xl bg-white shadow-2xl px-6 py-6 text-slate-900 backdrop-blur-sm">
                                <div className="grid grid-cols-2 gap-5">
                                    {whoWeAre.map((item) => (
                                        <Link
                                            key={item.label}
                                            to={item.path}
                                            onClick={() => setIsWhoWeAreOpen(false)}
                                            className="flex items-center gap-3 text-left hover:translate-y-0.5 hover:scale-[1.01] transition-transform cursor-pointer"
                                        >
                                            <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center text-xl text-white shadow-md flex-shrink-0`}>
                                                <span>{item.icon}</span>
                                            </div>
                                            <span className="text-xs sm:text-sm font-semibold uppercase tracking-wide">
                                                {item.label}
                                            </span>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Shop Link */}
                    <Link
                        to="/shop"
                        className="inline-flex items-center gap-1 pb-1 border-b-2 border-transparent hover:border-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
                    >
                        {t('navbar.shop')}
                    </Link>
                </nav>

                {/* Right side actions */}
                <div className="flex items-center space-x-2 md:space-x-3 flex-shrink-0">
                    {/* Language Switcher */}
                    <LanguageSwitcher variant="navbar" />
                    {/* Mobile menu toggle */}
                    <button
                        className="relative inline-flex flex-col items-center justify-center md:hidden h-9 w-9 rounded-full border border-blue-400 bg-white/5 hover:bg-blue-500/20 transition-colors cursor-pointer"
                        aria-label="Toggle navigation"
                        onClick={() => setIsMobileOpen((prev) => !prev)}
                    >
                        {/* Hamburger / close icon */}
                        <span
                            className={`block w-4 h-[1.5px] bg-white rounded-sm transition-transform duration-200 ${isMobileOpen ? 'rotate-45 translate-y-[3px]' : ''
                                }`}
                        />
                        <span
                            className={`block w-4 h-[1.5px] bg-white rounded-sm my-[3px] transition-opacity duration-200 ${isMobileOpen ? 'opacity-0' : 'opacity-100'
                                }`}
                        />
                        <span
                            className={`block w-4 h-[1.5px] bg-white rounded-sm transition-transform duration-200 ${isMobileOpen ? '-rotate-45 -translate-y-[3px]' : ''
                                }`}
                        />
                    </button>

                    {/* Desktop CTAs */}
                    <Link
                        to="/login"
                        className="hidden md:inline-flex items-center rounded-full border border-blue-400 px-4 lg:px-5 py-2 text-sm font-semibold text-blue-100 hover:bg-blue-500/10 transition-colors cursor-pointer whitespace-nowrap"
                    >
                        {t('navbar.login')}
                    </Link>
                    <button
                        type="button"
                        onClick={handleScrollToLiveDemo}
                        className="hidden md:inline-flex items-center rounded-full bg-blue-500 text-white px-4 lg:px-5 py-2 text-sm font-semibold shadow-lg hover:bg-blue-600 transition-colors cursor-pointer whitespace-nowrap"
                    >
                        {t('navbar.getDemo')}
                    </button>

                    {/* Cart Icon */}
                    <div className="hidden md:block">
                        <CartIcon />
                    </div>
                </div>
            </div>

            {/* Mobile menu */}
            {isMobileOpen && (
                <div className="mt-4 md:hidden rounded-3xl bg-slate-950/90 border border-blue-500/40 px-5 py-4 space-y-4 text-sm text-white">
                    {/* Products section with items */}
                    <div>
                        <button
                            className="flex w-full items-center justify-between font-semibold cursor-pointer"
                            onClick={() => setIsMobileProductsOpen((prev) => !prev)}
                        >
                            <span>{t('navbar.products')}</span>
                            <span
                                className={`text-xs transition-transform ${isMobileProductsOpen ? 'rotate-180' : ''
                                    }`}
                            >
                                ▾
                            </span>
                        </button>
                        {isMobileProductsOpen && (
                            <div className="mt-3 grid grid-cols-1 gap-3">
                                {products.map((item) => (
                                    <Link
                                        key={item.label}
                                        to={item.path}
                                        onClick={() => setIsMobileOpen(false)}
                                        className="flex items-center gap-3 text-left rounded-2xl bg-white/5 px-3 py-2 hover:bg-white/10 transition-colors"
                                    >
                                        <div className="h-9 w-9 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 flex items-center justify-center text-sm text-white">
                                            <span>{item.icon}</span>
                                        </div>
                                        <span className="text-xs font-semibold uppercase tracking-wide">
                                            {item.label}
                                        </span>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Solutions section with items */}
                    <div>
                        <button
                            className="flex w-full items-center justify-between font-semibold cursor-pointer"
                            onClick={() => setIsMobileSolutionsOpen((prev) => !prev)}
                        >
                            <span>{t('navbar.solutions')}</span>
                            <span
                                className={`text-xs transition-transform ${isMobileSolutionsOpen ? 'rotate-180' : ''
                                    }`}
                            >
                                ▾
                            </span>
                        </button>
                        {isMobileSolutionsOpen && (
                            <div className="mt-3 grid grid-cols-1 gap-3">
                                {solutions.map((item) => (
                                    <Link
                                        key={item.label}
                                        to={item.path}
                                        onClick={() => setIsMobileOpen(false)}
                                        className="flex items-start gap-3 text-left rounded-2xl bg-white/5 px-3 py-2 hover:bg-white/10 transition-colors"
                                    >
                                        <div className={`h-9 w-9 rounded-2xl bg-gradient-to-br ${item.gradient} flex items-center justify-center text-sm text-white flex-shrink-0`}>
                                            <span>{item.icon}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-xs font-semibold uppercase tracking-wide">
                                                {item.label}
                                            </span>
                                            <span className="text-xs text-slate-400 mt-0.5">
                                                {item.description}
                                            </span>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                    {/* Shop Link */}
                    <Link
                        to="/shop"
                        onClick={() => setIsMobileOpen(false)}
                        className="flex items-center gap-3 rounded-2xl bg-white/5 px-3 py-2 hover:bg-white/10 transition-colors font-semibold cursor-pointer"
                    >
                        <div className="h-9 w-9 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-sm text-white">
                            <span>🛍️</span>
                        </div>
                        <span>{t('navbar.shop')}</span>
                    </Link>

                    {/* Resources section with items */}
                    <div>
                        <button
                            className="flex w-full items-center justify-between font-semibold cursor-pointer"
                            onClick={() => setIsMobileResourcesOpen((prev) => !prev)}
                        >
                            <span>{t('navbar.resources')}</span>
                            <span
                                className={`text-xs transition-transform ${isMobileResourcesOpen ? 'rotate-180' : ''
                                    }`}
                            >
                                ▾
                            </span>
                        </button>
                        {isMobileResourcesOpen && (
                            <div className="mt-3 grid grid-cols-1 gap-3">
                                {resources.map((item) => (
                                    <Link
                                        key={item.label}
                                        to={item.path}
                                        onClick={() => setIsMobileOpen(false)}
                                        className="flex items-center gap-3 text-left rounded-2xl bg-white/5 px-3 py-2 hover:bg-white/10 transition-colors"
                                    >
                                        <div className={`h-9 w-9 rounded-2xl bg-gradient-to-br ${item.gradient} flex items-center justify-center text-sm text-white flex-shrink-0`}>
                                            <span>{item.icon}</span>
                                        </div>
                                        <span className="text-xs font-semibold uppercase tracking-wide">
                                            {item.label}
                                        </span>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                    {/* Who We Are section with items */}
                    <div>
                        <button
                            className="flex w-full items-center justify-between font-semibold cursor-pointer"
                            onClick={() => setIsMobileWhoWeAreOpen((prev) => !prev)}
                        >
                            <span>{t('navbar.whoWeAre')}</span>
                            <span
                                className={`text-xs transition-transform ${isMobileWhoWeAreOpen ? 'rotate-180' : ''
                                    }`}
                            >
                                ▾
                            </span>
                        </button>
                        {isMobileWhoWeAreOpen && (
                            <div className="mt-3 grid grid-cols-1 gap-3">
                                {whoWeAre.map((item) => (
                                    <Link
                                        key={item.label}
                                        to={item.path}
                                        onClick={() => setIsMobileOpen(false)}
                                        className="flex items-center gap-3 text-left rounded-2xl bg-white/5 px-3 py-2 hover:bg-white/10 transition-colors"
                                    >
                                        <div className={`h-9 w-9 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center text-sm text-white flex-shrink-0`}>
                                            <span>{item.icon}</span>
                                        </div>
                                        <span className="text-xs font-semibold uppercase tracking-wide">
                                            {item.label}
                                        </span>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="pt-2 space-y-3">
                        <div className="flex justify-center pb-2">
                            <LanguageSwitcher variant="navbar" />
                        </div>
                        <Link
                            to="/login"
                            onClick={() => {
                                setIsMobileOpen(false)
                            }}
                            className="w-full rounded-full border border-blue-400 px-5 py-2 text-sm font-semibold text-blue-100 hover:bg-blue-500/10 transition-colors cursor-pointer text-center block"
                        >
                            {t('navbar.login')}
                        </Link>
                        <button
                            onClick={() => {
                                setIsMobileOpen(false)
                                handleScrollToLiveDemo()
                            }}
                            className="w-full rounded-full bg-blue-500 text-white px-5 py-2 text-sm font-semibold shadow-lg hover:bg-blue-600 transition-colors cursor-pointer"
                        >
                            {t('navbar.getDemo')}
                        </button>
                        <div className="flex justify-center pt-2">
                            <CartIcon />
                        </div>
                    </div>
                </div>
            )}
        </header>
    )
}

export default Navbar


