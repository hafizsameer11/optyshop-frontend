import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import CartIcon from './CartIcon'
import LanguageSwitcher from './LanguageSwitcher'
import { getCategoriesWithSubcategories, type Category } from '../services/categoriesService'

const Navbar: React.FC = () => {
    const { t } = useTranslation()
    const [categories, setCategories] = useState<Category[]>([])
    const [hoveredCategory, setHoveredCategory] = useState<number | null>(null)
    
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

    // Fetch categories on mount
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const fetchedCategories = await getCategoriesWithSubcategories()
                setCategories(fetchedCategories)
            } catch (error) {
                console.error('Error fetching categories:', error)
            }
        }
        fetchCategories()
    }, [])

    // Check if current path matches link
    const isActive = (path: string) => {
        if (path === '/') {
            return location.pathname === '/'
        }
        return location.pathname.startsWith(path)
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
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-blue-950/98 backdrop-blur-xl shadow-xl border-b border-blue-500/20' : 'bg-transparent'
                }`}
        >
            <div className="flex items-center w-[90%] max-w-7xl mx-auto py-3 md:py-4 pl-4 md:pl-6">
                {/* Logo */}
                <Link to="/" className="flex items-center space-x-2.5 flex-shrink-0 group">
                    <div className="h-10 w-10 border-2 border-blue-400 rounded-lg flex items-center justify-center text-xs tracking-widest bg-white/5 group-hover:bg-blue-500/20 group-hover:border-blue-300 transition-all duration-300">
                        <span className="text-white font-bold">OS</span>
                    </div>
                    <span className="text-lg md:text-xl font-bold tracking-[0.35em] uppercase text-white group-hover:text-blue-300 transition-colors">
                        OPTISHOP
                    </span>
                </Link>

                {/* Desktop navigation - dynamic categories from API */}
                <nav className="hidden md:flex items-center justify-center flex-1 space-x-1.5 mx-4 lg:mx-6">
                    <Link
                        to="/"
                        className={`w-[85px] h-10 px-2 py-2 rounded-lg text-xs font-medium text-white transition-all duration-200 flex items-center justify-center whitespace-nowrap ${
                            isActive('/') 
                                ? 'bg-blue-500/30 text-blue-200' 
                                : 'hover:bg-white/10 hover:text-blue-300'
                        }`}
                    >
                        {t('navbar.home')}
                    </Link>
                    
                    {/* Dynamic Categories from API */}
                    {categories.length > 0 ? (
                        categories.slice(0, 6).map((category) => (
                            <div
                                key={category.id}
                                className="relative"
                                onMouseEnter={() => setHoveredCategory(category.id)}
                                onMouseLeave={() => setHoveredCategory(null)}
                            >
                                <Link
                                    to={`/shop?category=${category.slug}`}
                                    className={`w-[85px] h-10 px-2 py-2 rounded-lg text-xs font-medium text-white transition-all duration-200 flex items-center justify-center whitespace-nowrap ${
                                        isActive('/shop') 
                                            ? 'bg-blue-500/30 text-blue-200' 
                                            : 'hover:bg-white/10 hover:text-blue-300'
                                    }`}
                                >
                                    {category.name}
                                </Link>
                                
                                {/* Subcategories Dropdown */}
                                {category.subcategories && category.subcategories.length > 0 && hoveredCategory === category.id && (
                                    <div className="absolute left-0 top-full mt-2 w-48 rounded-lg bg-white/95 backdrop-blur-sm shadow-xl border border-blue-500/20 py-2 z-50">
                                        {category.subcategories.map((subcategory) => (
                                            <Link
                                                key={subcategory.id}
                                                to={`/shop?category=${category.slug}&subcategory=${subcategory.slug}`}
                                                onClick={() => setHoveredCategory(null)}
                                                className="block px-4 py-2 text-xs text-slate-900 hover:bg-blue-500/10 hover:text-blue-600 transition-colors"
                                            >
                                                {subcategory.name}
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))
                    ) : (
                        // Fallback to default categories while loading
                        <>
                            <Link
                                to="/shop"
                                className={`w-[85px] h-10 px-2 py-2 rounded-lg text-xs font-medium text-white transition-all duration-200 flex items-center justify-center whitespace-nowrap ${
                                    isActive('/shop') 
                                        ? 'bg-blue-500/30 text-blue-200' 
                                        : 'hover:bg-white/10 hover:text-blue-300'
                                }`}
                            >
                                {t('navbar.eyeglasses')}
                            </Link>
                            <Link
                                to="/shop"
                                className={`w-[85px] h-10 px-2 py-2 rounded-lg text-xs font-medium text-white transition-all duration-200 flex items-center justify-center whitespace-nowrap ${
                                    isActive('/shop') 
                                        ? 'bg-blue-500/30 text-blue-200' 
                                        : 'hover:bg-white/10 hover:text-blue-300'
                                }`}
                            >
                                {t('navbar.sunglasses')}
                            </Link>
                        </>
                    )}
                    
                    <Link
                        to="/virtual-test"
                        className="ml-2 w-[125px] h-10 inline-flex items-center justify-center rounded-full bg-blue-500 text-white px-3 py-2 text-xs font-semibold shadow-lg hover:bg-blue-600 hover:shadow-xl hover:scale-105 transition-all duration-200 cursor-pointer whitespace-nowrap"
                    >
                        {t('navbar.virtualTryOn')}
                    </Link>
                </nav>

                {/* Right side actions */}
                <div className="flex items-center space-x-2 md:space-x-2 flex-shrink-0 ml-auto pr-2 md:pr-4">
                    {/* Language Switcher */}
                    <div className="hidden md:block">
                        <LanguageSwitcher variant="navbar" />
                    </div>
                    
                    {/* Mobile menu toggle */}
                    <button
                        className="relative inline-flex flex-col items-center justify-center md:hidden h-10 w-10 rounded-full border border-blue-400 bg-white/5 hover:bg-blue-500/20 transition-all duration-200 cursor-pointer"
                        aria-label="Toggle navigation"
                        onClick={() => setIsMobileOpen((prev) => !prev)}
                    >
                        {/* Hamburger / close icon */}
                        <span
                            className={`block w-4 h-[1.5px] bg-white rounded-sm transition-all duration-300 ${isMobileOpen ? 'rotate-45 translate-y-[3px]' : ''
                                }`}
                        />
                        <span
                            className={`block w-4 h-[1.5px] bg-white rounded-sm my-[3px] transition-opacity duration-300 ${isMobileOpen ? 'opacity-0' : 'opacity-100'
                                }`}
                        />
                        <span
                            className={`block w-4 h-[1.5px] bg-white rounded-sm transition-all duration-300 ${isMobileOpen ? '-rotate-45 -translate-y-[3px]' : ''
                                }`}
                        />
                    </button>

                    {/* Desktop CTAs */}
                    <Link
                        to="/login"
                        className="hidden md:inline-flex items-center justify-center h-10 min-w-[70px] rounded-full border border-blue-400 bg-white/5 hover:bg-blue-500/20 px-3 py-2 text-xs font-semibold text-white transition-all duration-200 cursor-pointer whitespace-nowrap"
                    >
                        {t('navbar.login')}
                    </Link>

                    {/* Cart Icon */}
                    <div className="hidden md:block">
                        <CartIcon />
                    </div>
                </div>
            </div>

            {/* Mobile menu */}
            {isMobileOpen && (
                <div className="mt-2 md:hidden rounded-2xl bg-blue-950/98 backdrop-blur-xl border border-blue-500/30 shadow-2xl mx-4 mb-4 px-5 py-6 space-y-3 text-sm text-white">
                    {/* Shop Categories */}
                    <div className="space-y-2">
                        <Link
                            to="/"
                            onClick={() => setIsMobileOpen(false)}
                            className={`block px-4 py-2.5 rounded-lg font-medium transition-all ${
                                isActive('/') ? 'bg-blue-500/30 text-blue-200' : 'hover:bg-white/10'
                            }`}
                        >
                            {t('navbar.home')}
                        </Link>
                        
                        {/* Dynamic Categories from API */}
                        {categories.length > 0 ? (
                            categories.map((category) => (
                                <div key={category.id}>
                                    {category.subcategories && category.subcategories.length > 0 ? (
                                        <>
                                            <button
                                                onClick={() => {
                                                    const isOpen = hoveredCategory === category.id
                                                    setHoveredCategory(isOpen ? null : category.id)
                                                }}
                                                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg font-medium transition-all ${
                                                    isActive('/shop') ? 'bg-blue-500/30 text-blue-200' : 'hover:bg-white/10'
                                                }`}
                                            >
                                                <span>{category.name}</span>
                                                <span className={`text-xs transition-transform ${hoveredCategory === category.id ? 'rotate-180' : ''}`}>
                                                    ▾
                                                </span>
                                            </button>
                                            {hoveredCategory === category.id && (
                                                <div className="ml-4 mt-1 space-y-1">
                                                    {category.subcategories.map((subcategory) => (
                                                        <Link
                                                            key={subcategory.id}
                                                            to={`/shop?category=${category.slug}&subcategory=${subcategory.slug}`}
                                                            onClick={() => {
                                                                setIsMobileOpen(false)
                                                                setHoveredCategory(null)
                                                            }}
                                                            className="block px-4 py-2 rounded-lg text-sm bg-white/5 hover:bg-white/10 transition-colors"
                                                        >
                                                            {subcategory.name}
                                                        </Link>
                                                    ))}
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <Link
                                            to={`/shop?category=${category.slug}`}
                                            onClick={() => setIsMobileOpen(false)}
                                            className={`block px-4 py-2.5 rounded-lg font-medium transition-all ${
                                                isActive('/shop') ? 'bg-blue-500/30 text-blue-200' : 'hover:bg-white/10'
                                            }`}
                                        >
                                            {category.name}
                                        </Link>
                                    )}
                                </div>
                            ))
                        ) : (
                            // Fallback while loading
                            <>
                                <Link
                                    to="/shop"
                                    onClick={() => setIsMobileOpen(false)}
                                    className={`block px-4 py-2.5 rounded-lg font-medium transition-all ${
                                        isActive('/shop') ? 'bg-blue-500/30 text-blue-200' : 'hover:bg-white/10'
                                    }`}
                                >
                                    {t('navbar.eyeglasses')}
                                </Link>
                                <Link
                                    to="/shop"
                                    onClick={() => setIsMobileOpen(false)}
                                    className={`block px-4 py-2.5 rounded-lg font-medium transition-all ${
                                        isActive('/shop') ? 'bg-blue-500/30 text-blue-200' : 'hover:bg-white/10'
                                    }`}
                                >
                                    {t('navbar.sunglasses')}
                                </Link>
                            </>
                        )}
                        
                        <Link
                            to="/virtual-test"
                            onClick={() => setIsMobileOpen(false)}
                            className="block px-4 py-2.5 rounded-lg font-semibold bg-blue-500 hover:bg-blue-600 transition-colors text-center"
                        >
                            {t('navbar.virtualTryOn')}
                        </Link>
                    </div>

                    <div className="pt-4 border-t border-blue-500/30 space-y-3">
                        <div className="flex justify-center">
                            <LanguageSwitcher variant="navbar" />
                        </div>
                        <Link
                            to="/login"
                            onClick={() => {
                                setIsMobileOpen(false)
                            }}
                            className="w-full rounded-full border border-blue-400 bg-white/5 hover:bg-blue-500/20 px-5 py-2.5 text-sm font-semibold text-white transition-all duration-200 cursor-pointer text-center block"
                        >
                            {t('navbar.login')}
                        </Link>
                        <div className="flex justify-center">
                            <CartIcon />
                        </div>
                    </div>
                </div>
            )}
        </header>
    )
}

export default Navbar


