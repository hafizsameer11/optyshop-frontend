import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

const products = [
    { label: 'Virtual test', icon: '👓', path: '/virtual-test' },
    { label: 'Digitalized frames', icon: '🖼️', path: '/digital-frames' },
    { label: "Opticians' instruments", icon: '🔧', path: '/optical-instruments' },
    { label: '3D viewer', icon: '🌀', path: '/3d-viewer' },
    { label: 'Measurement of DP', icon: '📏', path: '/pd-measurement' },
    { label: 'Open innovation', icon: '💡', path: '/open-innovation' },
]

const solutions = [
    {
        label: 'ONLINE',
        description: 'enrich my user experience',
        gradient: 'from-orange-500 to-red-500',
        icon: '🖱️',
        path: '/online'
    },
    {
        label: '3D RESOURCES',
        description: 'Digitize my products',
        gradient: 'from-green-500 to-blue-500',
        icon: '💾',
        path: '/3d-resources'
    },
    {
        label: 'IN STORE',
        description: 'enrich my consumer experience',
        gradient: 'from-orange-500 to-yellow-500',
        icon: '🏪',
        path: '/in-store'
    },
    {
        label: 'E-COMMERCE',
        description: 'Increase my conversion rate',
        gradient: 'from-orange-500 to-yellow-500',
        icon: '🛒',
        path: '/ecommerce'
    },
    {
        label: 'PUPIL DISTANCE',
        description: 'Get accurate results online',
        gradient: 'from-blue-400 to-green-500',
        icon: '👁️',
        path: '/pupil-distance'
    },
    {
        label: 'DRIVE-TO-STORE',
        description: 'driving traffic to my stores',
        gradient: 'from-orange-500 to-yellow-500',
        icon: '📍',
        path: '/drive-to-store'
    },
]

const Navbar: React.FC = () => {
    const [isMobileOpen, setIsMobileOpen] = useState(false)
    const [isProductsOpen, setIsProductsOpen] = useState(false)
    const [isSolutionsOpen, setIsSolutionsOpen] = useState(false)
    const [isMobileProductsOpen, setIsMobileProductsOpen] = useState(true)
    const [isMobileSolutionsOpen, setIsMobileSolutionsOpen] = useState(false)
    const [isScrolled, setIsScrolled] = useState(false)

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
            <div className="flex items-center justify-between w-[90%] mx-auto py-4 md:py-5">
                {/* Logo */}
                <Link to="/" className="flex items-center space-x-2">
                    <div className="h-9 text-white w-9 border-2 border-blue-400 rounded-md flex items-center justify-center text-xs tracking-widest bg-white/5">
                        OS
                    </div>
                    <span className="text-base md:text-lg font-bold tracking-[0.35em] uppercase text-white">
                        OptiShop
                    </span>
                </Link>

                {/* Desktop navigation */}
                <nav className="hidden md:flex items-center space-x-10 text-sm md:text-base font-semibold text-white">
                    {/* Products with dropdown */}
                    <div
                        className="relative"
                        onMouseEnter={() => setIsProductsOpen(true)}
                        onMouseLeave={() => setIsProductsOpen(false)}
                    >
                        <button className="inline-flex items-center gap-1 pb-1 border-b-2 border-transparent hover:border-blue-400 hover:text-blue-300 transition-colors">
                            Products
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
                        <button className="inline-flex items-center gap-1 pb-1 border-b-2 border-transparent hover:border-blue-400 hover:text-blue-300 transition-colors">
                            Solutions
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
                    <button className="pb-1 border-b-2 border-transparent hover:border-blue-400 hover:text-blue-300 transition-colors">
                        Resources
                    </button>
                    <button className="pb-1 border-b-2 border-transparent hover:border-blue-400 hover:text-blue-300 transition-colors">
                        Who we are
                    </button>
                </nav>

                {/* Right side actions */}
                <div className="flex items-center space-x-3">
                    {/* Mobile menu toggle */}
                    <button
                        className="relative inline-flex flex-col items-center  justify-center md:hidden h-9 w-9 rounded-full border border-blue-400 bg-white/5 hover:bg-blue-500/20 transition-colors"
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
                    <button className="hidden sm:inline-flex rounded-full border border-blue-400 px-5 py-2 text-sm font-semibold text-blue-100 hover:bg-blue-500/10 transition-colors">
                        Try on glasses
                    </button>
                    <button className="hidden md:inline-flex rounded-full bg-blue-500 text-white px-5 py-2 text-sm font-semibold shadow-lg hover:bg-blue-600 transition-colors">
                        Get a demo
                    </button>
                </div>
            </div>

            {/* Mobile menu */}
            {isMobileOpen && (
                <div className="mt-4 md:hidden rounded-3xl bg-slate-950/90 border border-blue-500/40 px-5 py-4 space-y-4 text-sm text-white">
                    {/* Products section with items */}
                    <div>
                        <button
                            className="flex w-full items-center justify-between font-semibold"
                            onClick={() => setIsMobileProductsOpen((prev) => !prev)}
                        >
                            <span>Products</span>
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
                            className="flex w-full items-center justify-between font-semibold"
                            onClick={() => setIsMobileSolutionsOpen((prev) => !prev)}
                        >
                            <span>Solutions</span>
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
                    <button className="block w-full text-left font-semibold hover:text-blue-300 transition-colors">
                        Resources
                    </button>
                    <button className="block w-full text-left font-semibold hover:text-blue-300 transition-colors">
                        Who we are
                    </button>

                    <div className="pt-2 space-y-3">
                        <button className="w-full rounded-full border border-blue-400 px-5 py-2 text-sm font-semibold text-blue-100 hover:bg-blue-500/10 transition-colors">
                            Try on glasses
                        </button>
                        <button className="w-full rounded-full bg-blue-500 text-white px-5 py-2 text-sm font-semibold shadow-lg hover:bg-blue-600 transition-colors">
                            Get a demo
                        </button>
                    </div>
                </div>
            )}
        </header>
    )
}

export default Navbar


