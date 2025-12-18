import React, { useEffect, useState, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import CartIcon from './CartIcon'
import LanguageSwitcher from './LanguageSwitcher'
import { getCategoriesWithSubcategories, getSubcategoriesByCategoryId, getNestedSubcategories, type Category } from '../services/categoriesService'

const Navbar: React.FC = () => {
    const { t } = useTranslation()
    const [categories, setCategories] = useState<Category[]>([])
    const [hoveredCategory, setHoveredCategory] = useState<number | null>(null)
    const [clickedCategory, setClickedCategory] = useState<number | null>(null)
    const [categorySubcategories, setCategorySubcategories] = useState<Map<number, Category[]>>(new Map())
    const [nestedSubcategories, setNestedSubcategories] = useState<Map<number, Category[]>>(new Map())
    const [loadingSubcategories, setLoadingSubcategories] = useState<Set<number>>(new Set())
    const [loadingNestedSubcategories, setLoadingNestedSubcategories] = useState<Set<number>>(new Set())
    const [hoveredSubcategory, setHoveredSubcategory] = useState<number | null>(null)
    const dropdownTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const nestedDropdownTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const dropdownRef = useRef<HTMLDivElement>(null)
    const nestedDropdownRef = useRef<HTMLDivElement>(null)
    const location = useLocation()
    const [isMobileOpen, setIsMobileOpen] = useState(false)
    const [isScrolled, setIsScrolled] = useState(false)

    // Fetch categories on mount
    useEffect(() => {
        let isCancelled = false
        
        const fetchCategories = async () => {
            try {
                const fetchedCategories = await getCategoriesWithSubcategories()
                if (!isCancelled) {
                    setCategories(fetchedCategories)
                }
            } catch (error) {
                if (!isCancelled) {
                    console.error('Error fetching categories:', error)
                }
            }
        }
        fetchCategories()
        
        return () => {
            isCancelled = true
        }
    }, [])

    // Fetch subcategories when hovering over a category
    const fetchSubcategories = async (categoryId: number) => {
        // If already loaded, don't fetch again
        if (categorySubcategories.has(categoryId) || loadingSubcategories.has(categoryId)) {
            return
        }

        setLoadingSubcategories(prev => new Set(prev).add(categoryId))
        
        try {
            const subcategories = await getSubcategoriesByCategoryId(categoryId)
            setCategorySubcategories(prev => {
                const newMap = new Map(prev)
                newMap.set(categoryId, subcategories)
                return newMap
            })
        } catch (error) {
            console.error(`Error fetching subcategories for category ${categoryId}:`, error)
        } finally {
            setLoadingSubcategories(prev => {
                const newSet = new Set(prev)
                newSet.delete(categoryId)
                return newSet
            })
        }
    }

    // Fetch nested subcategories when hovering over a subcategory
    const fetchNestedSubcategories = async (subcategoryId: number) => {
        // If already loaded, don't fetch again
        if (nestedSubcategories.has(subcategoryId) || loadingNestedSubcategories.has(subcategoryId)) {
            return
        }

        setLoadingNestedSubcategories(prev => new Set(prev).add(subcategoryId))
        
        try {
            const nested = await getNestedSubcategories(subcategoryId)
            setNestedSubcategories(prev => {
                const newMap = new Map(prev)
                newMap.set(subcategoryId, nested)
                return newMap
            })
        } catch (error) {
            console.error(`Error fetching nested subcategories for subcategory ${subcategoryId}:`, error)
        } finally {
            setLoadingNestedSubcategories(prev => {
                const newSet = new Set(prev)
                newSet.delete(subcategoryId)
                return newSet
            })
        }
    }

    // Format category name for display (correct capitalization and spelling)
    const formatCategoryName = (name: string): string => {
        if (!name) return name
        
        // Common corrections for category names
        const corrections: Record<string, string> = {
            'eye glasses': 'Eyeglasses',
            'eyeglasses': 'Eyeglasses',
            'sun glasses': 'Sunglasses',
            'sunglasses': 'Sunglasses',
            'opti kids': 'Opty Kids',
            'opty kids': 'Opty Kids',
            'eye heigene': 'Eye Hygiene',
            'eye hygiene': 'Eye Hygiene',
            'contact-lenses': 'Contact Lenses',
            'contact lenses': 'Contact Lenses'
        }
        
        const lowerName = name.toLowerCase().trim()
        if (corrections[lowerName]) {
            return corrections[lowerName]
        }
        
        // If no correction found, capitalize properly (Title Case)
        return name
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ')
    }

    // Check if current path matches link
    const isActive = (path: string) => {
        if (path === '/') {
            return location.pathname === '/'
        }
        // For category paths, check if current path starts with the category path
        if (path.startsWith('/category/')) {
            return location.pathname.startsWith(path)
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
            if (dropdownTimeoutRef.current) {
                clearTimeout(dropdownTimeoutRef.current)
            }
        }
    }, [])

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setClickedCategory(null)
            }
        }

        if (clickedCategory !== null) {
            document.addEventListener('mousedown', handleClickOutside)
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [clickedCategory])

    return (
        <header
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
                isScrolled 
                    ? 'bg-blue-950/98 backdrop-blur-xl shadow-xl border-b border-blue-500/20' 
                    : 'bg-blue-950/95 backdrop-blur-md'
                }`}
            style={{ 
                backgroundColor: isScrolled ? 'rgba(7, 29, 73, 0.98)' : 'rgba(7, 29, 73, 0.95)',
                overflow: 'visible'
            }}
        >
            <div className="flex items-center w-full max-w-[1920px] mx-auto py-3 md:py-4 px-2 md:px-4 lg:px-6 gap-2 md:gap-3" style={{ overflow: 'visible' }}>
                {/* Logo */}
                <Link to="/" className="flex items-center space-x-2.5 flex-shrink-0 group">
                    <div className="h-10 w-10 rounded-lg flex items-center justify-center bg-cyan-400 group-hover:bg-cyan-300 transition-all duration-300 shadow-md">
                        <span className="text-white font-bold text-sm">OS</span>
                    </div>
                    <span className="text-lg md:text-xl font-bold tracking-[0.35em] uppercase text-white group-hover:text-cyan-200 transition-colors">
                        OPTISHOP
                    </span>
                </Link>

                {/* Desktop navigation - dynamic categories from API */}
                <nav className="hidden md:flex items-center justify-center flex-1 space-x-1 md:space-x-1.5 lg:space-x-2 mx-1 md:mx-2 lg:mx-4 overflow-visible">
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
                    
                    {/* Dynamic Categories from API */}
                    {categories.length > 0 ? (
                        categories.map((category) => {
                            const isDropdownOpen = clickedCategory === category.id || hoveredCategory === category.id
                            const fetchedSubcategories = categorySubcategories.get(category.id)
                            const subcategories = fetchedSubcategories || category.subcategories || []
                            const isLoading = loadingSubcategories.has(category.id)
                            const hasSubcategories = subcategories.length > 0 || isLoading
                            
                            // Debug: Log dropdown state
                            if (isDropdownOpen) {
                                console.log(`[NAVBAR DEBUG] Dropdown open for ${category.name}:`, {
                                    isDropdownOpen,
                                    clickedCategory,
                                    hoveredCategory: hoveredCategory,
                                    categoryId: category.id,
                                    subcategoriesCount: subcategories.length,
                                    isLoading,
                                    hasSubcategories,
                                    fetchedSubcategories: fetchedSubcategories?.length || 0
                                })
                            }
                            
                            return (
                            <div
                                key={category.id}
                                className="relative group"
                                ref={isDropdownOpen ? dropdownRef : null}
                                style={{ position: 'relative', zIndex: isDropdownOpen ? 99999 : 'auto' }}
                                onMouseEnter={() => {
                                    if (dropdownTimeoutRef.current) {
                                        clearTimeout(dropdownTimeoutRef.current)
                                        dropdownTimeoutRef.current = null
                                    }
                                    setHoveredCategory(category.id)
                                    // Fetch subcategories immediately on hover
                                        fetchSubcategories(category.id)
                                }}
                                onMouseLeave={() => {
                                    // Only close on hover leave if not clicked open
                                    if (clickedCategory !== category.id) {
                                        dropdownTimeoutRef.current = setTimeout(() => {
                                            setHoveredCategory(null)
                                        }, 150)
                                    }
                                }}
                            >
                                <div className="flex items-center relative">
                                    <Link
                                        to={`/category/${category.slug}`}
                                        className={`h-10 px-2.5 py-2 rounded-lg text-xs font-medium text-white transition-all duration-200 flex items-center justify-center whitespace-nowrap ${
                                            isActive(`/category/${category.slug}`) 
                                                ? 'bg-blue-800/50 text-blue-100' 
                                                : 'bg-blue-950/60 hover:bg-blue-900/70 hover:text-cyan-200'
                                        }`}
                                        onClick={(e) => {
                                            // Always allow dropdown toggle on click if category might have subcategories
                                            const currentSubs = categorySubcategories.get(category.id) || category.subcategories || []
                                            const mightHaveSubs = currentSubs.length > 0 || loadingSubcategories.has(category.id)
                                            
                                            if (mightHaveSubs || !categorySubcategories.has(category.id)) {
                                                e.preventDefault()
                                                const newState = clickedCategory === category.id ? null : category.id
                                                setClickedCategory(newState)
                                                if (newState !== null) {
                                                    fetchSubcategories(category.id)
                                                }
                                            }
                                        }}
                                    >
                                        {formatCategoryName(category.name)}
                                        {hasSubcategories && (
                                            <svg 
                                                className={`ml-1 w-3 h-3 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}
                                                fill="none" 
                                                stroke="currentColor" 
                                                viewBox="0 0 24 24"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        )}
                                    </Link>
                                </div>
                                
                                {/* Subcategories Dropdown */}
                                {isDropdownOpen && (
                                        <div 
                                            className="absolute left-0 top-full mt-1.5 min-w-[240px] max-w-[300px] rounded-xl bg-white shadow-2xl border-2 border-gray-300 py-2"
                                            style={{ 
                                                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.1)',
                                                display: 'block',
                                                position: 'absolute',
                                                visibility: 'visible',
                                                opacity: 1,
                                                zIndex: 99999,
                                                top: 'calc(100% + 6px)',
                                                left: 0,
                                                backgroundColor: 'white',
                                                pointerEvents: 'auto'
                                            }}
                                            onMouseEnter={() => {
                                                if (dropdownTimeoutRef.current) {
                                                    clearTimeout(dropdownTimeoutRef.current)
                                                    dropdownTimeoutRef.current = null
                                                }
                                                setHoveredCategory(category.id)
                                            }}
                                            onMouseLeave={() => {
                                                if (clickedCategory !== category.id) {
                                                    dropdownTimeoutRef.current = setTimeout(() => {
                                                        setHoveredCategory(null)
                                                    }, 150)
                                                }
                                            }}
                                        >
                                            <div className="py-1">
                                                {/* View All Category Link */}
                                                <Link
                                                    to={`/category/${category.slug}`}
                                                    onClick={() => {
                                                        setClickedCategory(null)
                                                        setHoveredCategory(null)
                                                    }}
                                                    className="block px-4 py-2.5 text-sm font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-all duration-150 mx-1 rounded-md border-b border-gray-200 mb-1"
                                                >
                                                    {t('navbar.viewAll')} {formatCategoryName(category.name)}
                                                </Link>
                                                
                                                {isLoading ? (
                                                    <div className="px-4 py-3 text-sm text-gray-500 text-center flex items-center justify-center gap-2">
                                                        <svg className="animate-spin h-4 w-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                        </svg>
                                                        <span>{t('navbar.loading')}</span>
                                                    </div>
                                                ) : subcategories.length > 0 ? (
                                                    subcategories.map((subcategory) => {
                                                        const nestedSubs = nestedSubcategories.get(subcategory.id) || []
                                                        const isLoadingNested = loadingNestedSubcategories.has(subcategory.id)
                                                        const hasNested = nestedSubs.length > 0 || isLoadingNested
                                                        const isSubcategoryHovered = hoveredSubcategory === subcategory.id
                                                        
                                                        return (
                                                            <div
                                                                key={subcategory.id}
                                                                className="relative group/subcategory"
                                                                onMouseEnter={() => {
                                                                    if (nestedDropdownTimeoutRef.current) {
                                                                        clearTimeout(nestedDropdownTimeoutRef.current)
                                                                        nestedDropdownTimeoutRef.current = null
                                                                    }
                                                                    setHoveredSubcategory(subcategory.id)
                                                                    // Fetch nested subcategories when hovering
                                                                    const timeoutId = setTimeout(() => {
                                                                        fetchNestedSubcategories(subcategory.id)
                                                                    }, 200)
                                                                    nestedDropdownTimeoutRef.current = timeoutId
                                                                }}
                                                                onMouseLeave={() => {
                                                                    nestedDropdownTimeoutRef.current = setTimeout(() => {
                                                                        setHoveredSubcategory(null)
                                                                    }, 150)
                                                                }}
                                                            >
                                                                <Link
                                                                    to={`/category/${category.slug}/${subcategory.slug}`}
                                                                    onClick={() => {
                                                                        setClickedCategory(null)
                                                                        setHoveredCategory(null)
                                                                        setHoveredSubcategory(null)
                                                                    }}
                                                                    className="block px-4 py-2.5 text-sm font-medium text-gray-800 hover:text-blue-600 hover:bg-blue-50 transition-all duration-150 mx-1 rounded-md flex items-center justify-between"
                                                                >
                                                                    <span>{subcategory.name}</span>
                                                                    {hasNested && (
                                                                        <svg 
                                                                            className={`ml-2 w-3 h-3 transition-transform duration-200 ${isSubcategoryHovered ? 'rotate-90' : ''}`}
                                                                            fill="none" 
                                                                            stroke="currentColor" 
                                                                            viewBox="0 0 24 24"
                                                                        >
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                                        </svg>
                                                                    )}
                                                                </Link>
                                                                
                                                                {/* Nested Subcategories Dropdown */}
                                                                {isSubcategoryHovered && hasNested && (
                                                                    <div 
                                                                        className="absolute left-full top-0 ml-1 min-w-[220px] rounded-xl bg-white shadow-2xl border border-gray-200 py-2 z-[10000] opacity-100 transform transition-all duration-200 ease-out"
                                                                        style={{ 
                                                                            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.1)'
                                                                        }}
                                                                        onMouseEnter={() => {
                                                                            if (nestedDropdownTimeoutRef.current) {
                                                                                clearTimeout(nestedDropdownTimeoutRef.current)
                                                                                nestedDropdownTimeoutRef.current = null
                                                                            }
                                                                            setHoveredSubcategory(subcategory.id)
                                                                        }}
                                                                        onMouseLeave={() => {
                                                                            nestedDropdownTimeoutRef.current = setTimeout(() => {
                                                                                setHoveredSubcategory(null)
                                                                            }, 150)
                                                                        }}
                                                                    >
                                                                        <div className="py-1">
                                                        <Link
                                                            to={`/category/${category.slug}/${subcategory.slug}`}
                                                            onClick={() => {
                                                                setClickedCategory(null)
                                                                setHoveredCategory(null)
                                                                                    setHoveredSubcategory(null)
                                                                                }}
                                                                                className="block px-4 py-2.5 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-all duration-150 mx-1 rounded-md border-b border-gray-200 mb-1"
                                                                            >
                                                                                {t('navbar.viewAll')} {subcategory.name}
                                                                            </Link>
                                                                            
                                                                            {isLoadingNested ? (
                                                                                <div className="px-4 py-2 text-xs text-gray-500 text-center flex items-center justify-center gap-2">
                                                                                    <svg className="animate-spin h-3 w-3 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                                                    </svg>
                                                                                    <span>{t('navbar.loading')}</span>
                                                                                </div>
                                                                            ) : nestedSubs.length > 0 ? (
                                                                                nestedSubs.map((nestedSub) => (
                                                                                    <Link
                                                                                        key={nestedSub.id}
                                                                                        to={`/category/${category.slug}/${subcategory.slug}/${nestedSub.slug}`}
                                                                                        onClick={() => {
                                                                                            setClickedCategory(null)
                                                                                            setHoveredCategory(null)
                                                                                            setHoveredSubcategory(null)
                                                                                        }}
                                                                                        className="block px-4 py-2 text-xs font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-all duration-150 mx-1 rounded-md"
                                                                                    >
                                                                                        {nestedSub.name}
                                                        </Link>
                                                    ))
                                                                            ) : (
                                                                                <div className="px-4 py-2 text-xs text-gray-400 text-center">
                                                                                    {t('navbar.noNestedSubcategories')}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )
                                                    })
                                                ) : (
                                                    <div className="px-4 py-3 text-sm text-gray-400 text-center">
                                                        {t('navbar.noSubcategories')}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                )}
                            </div>
                            )
                        })
                    ) : (
                        // Fallback to default categories while loading
                        <>
                            <Link
                                to="/shop"
                                className={`h-10 px-2 md:px-3 py-2 rounded-lg text-xs font-medium text-white transition-all duration-200 flex items-center justify-center whitespace-nowrap ${
                                    isActive('/shop') 
                                        ? 'bg-blue-800/50 text-blue-100' 
                                        : 'bg-blue-950/60 hover:bg-blue-900/70 hover:text-cyan-200'
                                }`}
                            >
                                {t('navbar.eyeglasses')}
                            </Link>
                            <Link
                                to="/shop"
                                className={`h-10 px-2 md:px-3 py-2 rounded-lg text-xs font-medium text-white transition-all duration-200 flex items-center justify-center whitespace-nowrap ${
                                    isActive('/shop') 
                                        ? 'bg-blue-800/50 text-blue-100' 
                                        : 'bg-blue-950/60 hover:bg-blue-900/70 hover:text-cyan-200'
                                }`}
                            >
                                {t('navbar.sunglasses')}
                            </Link>
                        </>
                    )}
                    
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
                    {/* Cart Icon - Right side, first in the group */}
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

                    {/* Desktop CTAs */}
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
                    {/* Shop Categories */}
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
                        
                        {/* Dynamic Categories from API */}
                        {categories.length > 0 ? (
                            categories.map((category) => {
                                const subcategories = categorySubcategories.get(category.id) || category.subcategories || []
                                const hasSubcategories = subcategories.length > 0
                                const isLoading = loadingSubcategories.has(category.id)
                                
                                return (
                                    <div key={category.id}>
                                        {hasSubcategories || isLoading ? (
                                            <>
                                                <div className="flex items-center gap-2">
                                                    <Link
                                                        to={`/category/${category.slug}`}
                                                        onClick={() => setIsMobileOpen(false)}
                                                        className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-all ${
                                                            isActive(`/category/${category.slug}`) ? 'bg-blue-800/50 text-blue-100' : 'bg-blue-950/60 hover:bg-blue-900/70'
                                                        }`}
                                                    >
                                                        {formatCategoryName(category.name)}
                                                    </Link>
                                                    <button
                                                        onClick={() => {
                                                            const isOpen = hoveredCategory === category.id
                                                            setHoveredCategory(isOpen ? null : category.id)
                                                            // Fetch subcategories when opening
                                                            if (!isOpen) {
                                                                fetchSubcategories(category.id)
                                                            }
                                                        }}
                                                        className={`px-3 py-2.5 rounded-lg font-medium transition-all ${
                                                            isActive(`/category/${category.slug}`) ? 'bg-blue-800/50 text-blue-100' : 'bg-blue-950/60 hover:bg-blue-900/70'
                                                        }`}
                                                        aria-label="Toggle subcategories"
                                                    >
                                                        <svg 
                                                            className={`w-4 h-4 transition-transform duration-200 ${hoveredCategory === category.id ? 'rotate-180' : ''}`}
                                                            fill="none" 
                                                            stroke="currentColor" 
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                        </svg>
                                                    </button>
                                                </div>
                                                {hoveredCategory === category.id && (
                                                    <div className="ml-4 mt-1 space-y-1 bg-blue-900/40 rounded-lg p-2 border border-blue-700/30">
                                                        <Link
                                                            to={`/category/${category.slug}`}
                                                            onClick={() => {
                                                                setIsMobileOpen(false)
                                                                setHoveredCategory(null)
                                                            }}
                                                            className="block px-4 py-2.5 rounded-md text-sm font-semibold bg-blue-950/60 hover:bg-blue-800/70 hover:text-cyan-200 transition-all duration-150 border-b border-blue-700/30 mb-1"
                                                        >
                                                            {t('navbar.viewAll')} {formatCategoryName(category.name)}
                                                        </Link>
                                                        {isLoading ? (
                                                            <div className="px-4 py-3 text-sm text-cyan-200/70 text-center flex items-center justify-center gap-2">
                                                                <svg className="animate-spin h-4 w-4 text-cyan-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                                </svg>
                                                                <span>{t('navbar.loading')}</span>
                                                            </div>
                                                        ) : subcategories.length > 0 ? (
                                                            subcategories.map((subcategory) => (
                                                                <Link
                                                                    key={subcategory.id}
                                                                    to={`/category/${category.slug}/${subcategory.slug}`}
                                                                    onClick={() => {
                                                                        setIsMobileOpen(false)
                                                                        setHoveredCategory(null)
                                                                    }}
                                                                    className="block px-4 py-2.5 rounded-md text-sm font-medium bg-blue-950/60 hover:bg-blue-800/70 hover:text-cyan-200 transition-all duration-150"
                                                                >
                                                                    {subcategory.name}
                                                                </Link>
                                                            ))
                                                        ) : (
                                                            <div className="px-4 py-3 text-sm text-cyan-200/50 text-center">
                                                                {t('navbar.noSubcategories')}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            <Link
                                                to={`/category/${category.slug}`}
                                                onClick={() => setIsMobileOpen(false)}
                                                className={`block px-4 py-2.5 rounded-lg font-medium transition-all ${
                                                    isActive(`/category/${category.slug}`) ? 'bg-blue-800/50 text-blue-100' : 'bg-blue-950/60 hover:bg-blue-900/70'
                                                }`}
                                            >
                                                {formatCategoryName(category.name)}
                                            </Link>
                                        )}
                                    </div>
                                )
                            })
                        ) : (
                            // Fallback while loading
                            <>
                                <Link
                                    to="/shop"
                                    onClick={() => setIsMobileOpen(false)}
                                    className={`block px-4 py-2.5 rounded-lg font-medium transition-all ${
                                        isActive('/shop') ? 'bg-blue-800/50 text-blue-100' : 'bg-blue-950/60 hover:bg-blue-900/70'
                                    }`}
                                >
                                    {t('navbar.eyeglasses')}
                                </Link>
                                <Link
                                    to="/shop"
                                    onClick={() => setIsMobileOpen(false)}
                                    className={`block px-4 py-2.5 rounded-lg font-medium transition-all ${
                                        isActive('/shop') ? 'bg-blue-800/50 text-blue-100' : 'bg-blue-950/60 hover:bg-blue-900/70'
                                    }`}
                                >
                                    {t('navbar.sunglasses')}
                                </Link>
                            </>
                        )}
                        
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


