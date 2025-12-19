import React, { useEffect, useState, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import CartIcon from './CartIcon'
import LanguageSwitcher from './LanguageSwitcher'
import { useCategories } from '../hooks/useCategories'
import type { Category } from '../services/categoriesService'

const Navbar: React.FC = () => {
    const { t } = useTranslation()
    const location = useLocation()
    const [isMobileOpen, setIsMobileOpen] = useState(false)
    const [isScrolled, setIsScrolled] = useState(false)
    const [openDropdown, setOpenDropdown] = useState<number | null>(null)
    const [openSubDropdown, setOpenSubDropdown] = useState<number | null>(null)
    const [mobileOpenCategory, setMobileOpenCategory] = useState<number | null>(null)
    const [mobileOpenSubcategory, setMobileOpenSubcategory] = useState<number | null>(null)
    const dropdownRef = useRef<HTMLDivElement>(null)
    const { categories, loading } = useCategories()

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
        return () => {
            window.removeEventListener('scroll', handleScroll)
        }
    }, [])

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setOpenDropdown(null)
                setOpenSubDropdown(null)
            }
        }

        if (openDropdown !== null) {
            document.addEventListener('mousedown', handleClickOutside)
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [openDropdown])

    // Helper function to check if path matches category/subcategory
    const isCategoryActive = (category: Category) => {
        const categoryPath = `/category/${category.slug}`
        if (location.pathname === categoryPath || location.pathname.startsWith(categoryPath + '/')) {
            return true
        }
        // Check if any subcategory is active
        if (category.subcategories) {
            return category.subcategories.some(sub => {
                const subPath = `/category/${category.slug}/${sub.slug}`
                if (location.pathname === subPath || location.pathname.startsWith(subPath + '/')) {
                    return true
                }
                // Check sub-subcategories
                if (sub.children) {
                    return sub.children.some(child => {
                        const childPath = `/category/${category.slug}/${sub.slug}/${child.slug}`
                        return location.pathname === childPath || location.pathname.startsWith(childPath + '/')
                    })
                }
                return false
            })
        }
        return false
    }

    return (
        <header
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
                isScrolled 
                    ? 'bg-blue-950/98 backdrop-blur-xl shadow-xl border-b border-blue-500/20' 
                    : 'bg-blue-950/95 backdrop-blur-md'
                }`}
            style={{ 
                backgroundColor: isScrolled ? 'rgba(7, 29, 73, 0.98)' : 'rgba(7, 29, 73, 0.95)',
            }}
        >
            <div className="flex items-center w-full max-w-[1920px] mx-auto py-3 md:py-4 px-2 md:px-4 lg:px-6 gap-2 md:gap-3">
                {/* Logo */}
                <Link to="/" className="flex items-center space-x-2.5 flex-shrink-0 group">
                    <div className="h-10 w-10 rounded-lg flex items-center justify-center bg-cyan-400 group-hover:bg-cyan-300 transition-all duration-300 shadow-md">
                        <span className="text-white font-bold text-sm">OS</span>
                    </div>
                    <span className="text-lg md:text-xl font-bold tracking-[0.35em] uppercase text-white group-hover:text-cyan-200 transition-colors">
                        OPTISHOP
                    </span>
                </Link>

                {/* Desktop navigation */}
                <nav className="hidden md:flex items-center justify-center flex-1 space-x-1 md:space-x-1.5 lg:space-x-2 mx-1 md:mx-2 lg:mx-4" ref={dropdownRef}>
                    <Link
                        to="/"
                        className={`h-10 px-2.5 py-2 rounded-lg text-xs font-medium text-white transition-all duration-200 flex items-center justify-center whitespace-nowrap ${
                            isActive('/') 
                                ? 'bg-blue-800/50 text-blue-100' 
                                : 'bg-blue-950/60 hover:bg-blue-900/70 hover:text-cyan-200'
                        }`}
                    >
                        {t('navbar.home')}
                    </Link>
                    
                    {/* Categories with dropdowns */}
                    {!loading && categories.map((category) => (
                        <div
                            key={category.id}
                            className="relative"
                            onMouseEnter={() => category.subcategories && category.subcategories.length > 0 && setOpenDropdown(category.id)}
                            onMouseLeave={() => setOpenDropdown(null)}
                        >
                            <Link
                                to={`/category/${category.slug}`}
                                className={`h-10 px-2.5 py-2 rounded-lg text-xs font-medium text-white transition-all duration-200 flex items-center justify-center whitespace-nowrap ${
                                    isCategoryActive(category)
                                        ? 'bg-blue-800/50 text-blue-100' 
                                        : 'bg-blue-950/60 hover:bg-blue-900/70 hover:text-cyan-200'
                                }`}
                            >
                                {category.name}
                                {category.subcategories && category.subcategories.length > 0 && (
                                    <svg className="ml-1 w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                )}
                            </Link>
                            
                            {/* Subcategories dropdown */}
                            {openDropdown === category.id && category.subcategories && category.subcategories.length > 0 && (
                                <div className="absolute top-full left-0 mt-1 w-56 bg-blue-950/98 backdrop-blur-xl border border-cyan-400/30 rounded-lg shadow-2xl py-2 z-50">
                                    {category.subcategories.map((subcategory) => (
                                        <div
                                            key={subcategory.id}
                                            className="relative"
                                            onMouseEnter={() => subcategory.children && subcategory.children.length > 0 && setOpenSubDropdown(subcategory.id)}
                                            onMouseLeave={() => setOpenSubDropdown(null)}
                                        >
                                            <Link
                                                to={`/category/${category.slug}/${subcategory.slug}`}
                                                className="block px-4 py-2 text-sm text-white hover:bg-blue-900/70 transition-colors flex items-center justify-between"
                                                onClick={() => setOpenDropdown(null)}
                                            >
                                                <span>{subcategory.name}</span>
                                                {subcategory.children && subcategory.children.length > 0 && (
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                    </svg>
                                                )}
                                            </Link>
                                            
                                            {/* Sub-subcategories nested dropdown */}
                                            {openSubDropdown === subcategory.id && subcategory.children && subcategory.children.length > 0 && (
                                                <div className="absolute left-full top-0 ml-1 w-56 bg-blue-950/98 backdrop-blur-xl border border-cyan-400/30 rounded-lg shadow-2xl py-2 z-50">
                                                    {subcategory.children.map((child) => (
                                                        <Link
                                                            key={child.id}
                                                            to={`/category/${category.slug}/${subcategory.slug}/${child.slug}`}
                                                            className="block px-4 py-2 text-sm text-white hover:bg-blue-900/70 transition-colors"
                                                            onClick={() => {
                                                                setOpenDropdown(null)
                                                                setOpenSubDropdown(null)
                                                            }}
                                                        >
                                                            {child.name}
                                                        </Link>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                    
                    <Link
                        to="/virtual-test"
                        className="h-9 inline-flex items-center justify-center gap-1 rounded-full bg-gradient-to-r from-cyan-400 to-cyan-500 text-white px-2.5 py-1.5 text-[10px] font-bold shadow-lg hover:from-cyan-300 hover:to-cyan-400 hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer whitespace-nowrap border border-cyan-300/50"
                        title={t('navbar.virtualTryOn')}
                    >
                        <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        <span className="hidden lg:inline">{t('navbar.virtualTryOn')}</span>
                        <span className="lg:hidden">Try On</span>
                    </Link>
                </nav>

                {/* Right side actions */}
                <div className="flex items-center gap-2 md:gap-2 flex-shrink-0 ml-auto pr-2 md:pr-4">
                    {/* Cart Icon */}
                    <div className="hidden md:flex items-center justify-center flex-shrink-0">
                        <CartIcon />
                    </div>
                    
                    {/* Language Switcher */}
                    <div className="hidden md:block flex-shrink-0">
                        <LanguageSwitcher variant="navbar" />
                    </div>
                    
                    {/* Mobile menu toggle */}
                    <button
                        className="relative inline-flex flex-col items-center justify-center md:hidden h-10 w-10 rounded-full border border-cyan-400 bg-blue-950/60 hover:bg-blue-900/70 transition-all duration-200 cursor-pointer flex-shrink-0"
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

                    {/* Login Button */}
                    <Link
                        to="/login"
                        className="hidden md:inline-flex items-center justify-center h-10 min-w-[70px] rounded-full border border-cyan-400 bg-blue-950/60 hover:bg-blue-900/70 px-3 py-2 text-xs font-semibold text-white transition-all duration-200 cursor-pointer whitespace-nowrap flex-shrink-0"
                    >
                        {t('navbar.login')}
                    </Link>
                </div>
            </div>

            {/* Mobile menu */}
            {isMobileOpen && (
                <div className="mt-2 md:hidden rounded-2xl bg-blue-950/98 backdrop-blur-xl border border-cyan-400/30 shadow-2xl mx-4 mb-4 px-5 py-6 space-y-3 text-sm text-white">
                    <div className="space-y-2">
                        <Link
                            to="/"
                            onClick={() => setIsMobileOpen(false)}
                            className={`block px-4 py-2.5 rounded-lg font-medium transition-all ${
                                isActive('/') ? 'bg-blue-800/50 text-blue-100' : 'bg-blue-950/60 hover:bg-blue-900/70'
                            }`}
                        >
                            {t('navbar.home')}
                        </Link>
                        
                        {/* Categories in mobile menu */}
                        {!loading && categories.map((category) => (
                            <div key={category.id} className="space-y-1">
                                <div className="flex items-center justify-between">
                                    <Link
                                        to={`/category/${category.slug}`}
                                        onClick={() => setIsMobileOpen(false)}
                                        className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-all ${
                                            isCategoryActive(category) ? 'bg-blue-800/50 text-blue-100' : 'bg-blue-950/60 hover:bg-blue-900/70'
                                        }`}
                                    >
                                        {category.name}
                                    </Link>
                                    {category.subcategories && category.subcategories.length > 0 && (
                                        <button
                                            onClick={() => setMobileOpenCategory(mobileOpenCategory === category.id ? null : category.id)}
                                            className="px-2 py-2.5 text-cyan-400 hover:text-cyan-300 transition-colors"
                                            aria-label="Toggle subcategories"
                                        >
                                            <svg
                                                className={`w-5 h-5 transition-transform ${mobileOpenCategory === category.id ? 'rotate-180' : ''}`}
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                                
                                {/* Subcategories */}
                                {mobileOpenCategory === category.id && category.subcategories && category.subcategories.length > 0 && (
                                    <div className="ml-4 space-y-1 border-l-2 border-cyan-400/30 pl-2">
                                        {category.subcategories.map((subcategory) => (
                                            <div key={subcategory.id} className="space-y-1">
                                                <div className="flex items-center justify-between">
                                                    <Link
                                                        to={`/category/${category.slug}/${subcategory.slug}`}
                                                        onClick={() => setIsMobileOpen(false)}
                                                        className="flex-1 px-4 py-2 rounded-lg text-sm bg-blue-950/80 hover:bg-blue-900/70 transition-colors"
                                                    >
                                                        {subcategory.name}
                                                    </Link>
                                                    {subcategory.children && subcategory.children.length > 0 && (
                                                        <button
                                                            onClick={() => setMobileOpenSubcategory(mobileOpenSubcategory === subcategory.id ? null : subcategory.id)}
                                                            className="px-2 py-2 text-cyan-400 hover:text-cyan-300 transition-colors"
                                                            aria-label="Toggle sub-subcategories"
                                                        >
                                                            <svg
                                                                className={`w-4 h-4 transition-transform ${mobileOpenSubcategory === subcategory.id ? 'rotate-180' : ''}`}
                                                                fill="none"
                                                                stroke="currentColor"
                                                                viewBox="0 0 24 24"
                                                            >
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                            </svg>
                                                        </button>
                                                    )}
                                                </div>
                                                
                                                {/* Sub-subcategories */}
                                                {mobileOpenSubcategory === subcategory.id && subcategory.children && subcategory.children.length > 0 && (
                                                    <div className="ml-4 space-y-1 border-l-2 border-cyan-400/20 pl-2">
                                                        {subcategory.children.map((child) => (
                                                            <Link
                                                                key={child.id}
                                                                to={`/category/${category.slug}/${subcategory.slug}/${child.slug}`}
                                                                onClick={() => setIsMobileOpen(false)}
                                                                className="block px-4 py-2 rounded-lg text-sm bg-blue-950/70 hover:bg-blue-900/70 transition-colors"
                                                            >
                                                                {child.name}
                                                            </Link>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                        
                        <Link
                            to="/virtual-test"
                            onClick={() => setIsMobileOpen(false)}
                            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-bold bg-gradient-to-r from-cyan-400 to-cyan-500 hover:from-cyan-300 hover:to-cyan-400 transition-all text-center shadow-lg border border-cyan-300/50"
                        >
                            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            <span>{t('navbar.virtualTryOn')}</span>
                        </Link>
                    </div>

                    <div className="pt-4 border-t border-cyan-400/30 space-y-3">
                        <div className="flex justify-center">
                            <LanguageSwitcher variant="navbar" />
                        </div>
                        <Link
                            to="/login"
                            onClick={() => {
                                setIsMobileOpen(false)
                            }}
                            className="w-full rounded-full border border-cyan-400 bg-blue-950/60 hover:bg-blue-900/70 px-5 py-2.5 text-sm font-semibold text-white transition-all duration-200 cursor-pointer text-center block"
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
