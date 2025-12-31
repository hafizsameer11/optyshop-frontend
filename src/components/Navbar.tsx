import React, { useEffect, useState, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import CartIcon from './CartIcon'
import WishlistIcon from './WishlistIcon'
import LanguageSwitcher from './LanguageSwitcher'
import { useCategories } from '../hooks/useCategories'
import type { Category } from '../services/categoriesService'
import { useCategoryTranslation } from '../utils/categoryTranslations'
import { searchAll, type SearchResult } from '../services/searchService'

const Navbar: React.FC = () => {
    const { t } = useTranslation()
    const { translateCategory } = useCategoryTranslation()
    const location = useLocation()
    const navigate = useNavigate()
    const [isMobileOpen, setIsMobileOpen] = useState(false)
    const [isScrolled, setIsScrolled] = useState(false)
    const [openDropdown, setOpenDropdown] = useState<number | null>(null)
    const [openSubDropdown, setOpenSubDropdown] = useState<number | null>(null)
    const [mobileOpenCategory, setMobileOpenCategory] = useState<number | null>(null)
    const [mobileOpenSubcategory, setMobileOpenSubcategory] = useState<number | null>(null)
    const [clickedDropdown, setClickedDropdown] = useState<number | null>(null) // Track which dropdown was opened by click
    const [clickedSubDropdown, setClickedSubDropdown] = useState<number | null>(null) // Track which sub-dropdown was opened by click
    const dropdownRef = useRef<HTMLDivElement>(null)
    const dropdownTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const subDropdownTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const { categories, loading } = useCategories()
    
    // Search state
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState<SearchResult[]>([])
    const [isSearchOpen, setIsSearchOpen] = useState(false)
    const [isSearching, setIsSearching] = useState(false)
    const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const searchRef = useRef<HTMLDivElement>(null)

    // Close search dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setIsSearchOpen(false)
            }
        }

        if (isSearchOpen) {
            document.addEventListener('mousedown', handleClickOutside)
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [isSearchOpen])

    // Cleanup search timeout on unmount
    useEffect(() => {
        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current)
            }
        }
    }, [])

    // Debug: Log categories structure
    useEffect(() => {
        if (!loading && categories.length > 0 && import.meta.env.DEV) {
            console.log('🔍 Navbar received categories:', categories)
            categories.forEach(cat => {
                if (cat.subcategories && cat.subcategories.length > 0) {
                    console.log(`📁 Navbar: Category "${cat.name}" (id: ${cat.id}) has ${cat.subcategories.length} subcategories`)
                    cat.subcategories.forEach(sub => {
                        const childrenCount = sub.children?.length || 0
                        const hasChildren = !!(sub.children && sub.children.length > 0)
                        console.log(`  └─ Subcategory "${sub.name}" (id: ${sub.id}, parent_id: ${sub.parent_id})`, {
                            hasChildren,
                            childrenCount,
                            children: sub.children?.map(c => ({
                                name: c.name,
                                id: c.id,
                                parent_id: c.parent_id,
                                is_active: c.is_active,
                                slug: c.slug
                            })) || [],
                            fullSubcategory: sub
                        })
                        if (!hasChildren) {
                            console.warn(`⚠️ WARNING: Subcategory "${sub.name}" has NO children in Navbar!`)
                        }
                    })
                } else {
                    console.log(`📁 Navbar: Category "${cat.name}" has NO subcategories`)
                }
            })
        }
    }, [categories, loading])

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
                setClickedDropdown(null) // Reset click state
                setClickedSubDropdown(null) // Reset sub-dropdown click state
            }
        }

        if (openDropdown !== null) {
            document.addEventListener('mousedown', handleClickOutside)
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [openDropdown])

    // Cleanup timeouts on unmount
    useEffect(() => {
        return () => {
            if (dropdownTimeoutRef.current) {
                clearTimeout(dropdownTimeoutRef.current)
            }
            if (subDropdownTimeoutRef.current) {
                clearTimeout(subDropdownTimeoutRef.current)
            }
        }
    }, [])

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
                    ? 'bg-blue-950/98 backdrop-blur-xl shadow-lg border-b border-blue-500/20' 
                    : 'bg-blue-950/95 backdrop-blur-md'
                }`}
            style={{ 
                backgroundColor: isScrolled ? 'rgba(7, 29, 73, 0.98)' : 'rgba(7, 29, 73, 0.95)',
            }}
        >
            <div className="flex items-center w-full max-w-[1920px] mx-auto py-1 md:py-1.5 px-2 md:px-3 gap-2 md:gap-3">
                {/* Logo */}
                <Link to="/" className="flex items-center space-x-1 flex-shrink-0 group">
                    <div className="h-6 w-6 md:h-7 md:w-7 rounded-md flex items-center justify-center bg-cyan-400 group-hover:bg-cyan-300 transition-all duration-300 shadow-sm">
                        <span className="text-white font-bold text-[10px] md:text-xs">OS</span>
                    </div>
                    <span className="text-xs md:text-sm font-bold tracking-wide uppercase text-white group-hover:text-cyan-200 transition-colors hidden sm:inline">
                        OPTISHOP
                    </span>
                </Link>

                {/* Search Bar - Prominent and Centered */}
                <div className="flex-1 max-w-2xl mx-auto relative" ref={searchRef}>
                    <div className="relative w-full">
                        <input
                            type="text"
                            placeholder="Search"
                            value={searchQuery}
                            onChange={(e) => {
                                const value = e.target.value
                                setSearchQuery(value)
                                
                                if (searchTimeoutRef.current) {
                                    clearTimeout(searchTimeoutRef.current)
                                }
                                
                                if (value.trim().length >= 2) {
                                    setIsSearching(true)
                                    searchTimeoutRef.current = setTimeout(async () => {
                                        try {
                                            const results = await searchAll(value.trim(), 8)
                                            if (results) {
                                                setSearchResults(results.results)
                                                setIsSearchOpen(true)
                                            } else {
                                                setSearchResults([])
                                            }
                                        } catch (error) {
                                            console.error('Search error:', error)
                                            setSearchResults([])
                                        } finally {
                                            setIsSearching(false)
                                        }
                                    }, 300)
                                } else {
                                    setSearchResults([])
                                    setIsSearchOpen(false)
                                    setIsSearching(false)
                                }
                            }}
                            onFocus={() => {
                                if (searchResults.length > 0) {
                                    setIsSearchOpen(true)
                                }
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && searchQuery.trim().length >= 2) {
                                    navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
                                    setSearchQuery('')
                                    setIsSearchOpen(false)
                                } else if (e.key === 'Escape') {
                                    setIsSearchOpen(false)
                                }
                            }}
                            className="w-full h-8 md:h-9 px-4 py-2 pr-10 text-sm bg-blue-950/70 border border-cyan-400/40 rounded-lg text-white placeholder-cyan-400/60 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400 transition-all"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            {isSearching ? (
                                <svg className="animate-spin h-4 w-4 text-cyan-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : (
                                <svg className="h-4 w-4 text-cyan-400/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            )}
                        </div>
                        
                        {/* Search Results Dropdown */}
                        {isSearchOpen && searchResults.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-blue-950/98 backdrop-blur-xl border border-cyan-400/40 rounded-xl shadow-2xl z-50 max-h-96 overflow-y-auto">
                                <div className="p-2">
                                    {searchResults.map((result, index) => (
                                        <Link
                                            key={`${result.type}-${result.id}`}
                                            to={result.url}
                                            onClick={() => {
                                                setSearchQuery('')
                                                setIsSearchOpen(false)
                                                setSearchResults([])
                                            }}
                                            className={`block px-3 py-2.5 rounded-lg hover:bg-gradient-to-r hover:from-cyan-500/20 hover:to-blue-900/50 transition-all duration-200 ${
                                                index > 0 ? 'mt-1' : ''
                                            }`}
                                        >
                                            <div className="flex items-start gap-3">
                                                {result.image && (
                                                    <img 
                                                        src={result.image} 
                                                        alt={result.name}
                                                        className="w-10 h-10 object-cover rounded"
                                                    />
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                                                            result.type === 'product' ? 'bg-green-500/20 text-green-300' :
                                                            result.type === 'category' ? 'bg-blue-500/20 text-blue-300' :
                                                            result.type === 'subcategory' ? 'bg-purple-500/20 text-purple-300' :
                                                            'bg-cyan-500/20 text-cyan-300'
                                                        }`}>
                                                            {result.type === 'product' ? 'Product' :
                                                             result.type === 'category' ? 'Category' :
                                                             result.type === 'subcategory' ? 'Subcategory' :
                                                             'Sub-Subcategory'}
                                                        </span>
                                                        <p className="text-sm font-medium text-white truncate">{result.name}</p>
                                                    </div>
                                                    {result.description && (
                                                        <p className="text-xs text-cyan-400/70 mt-1 line-clamp-1">{result.description}</p>
                                                    )}
                                                    {result.price && (
                                                        <p className="text-xs font-semibold text-cyan-300 mt-1">€{result.price}</p>
                                                    )}
                                                    {result.category && (
                                                        <p className="text-[10px] text-cyan-400/50 mt-1">in {result.category.name}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                    {searchQuery.trim().length >= 2 && (
                                        <Link
                                            to={`/search?q=${encodeURIComponent(searchQuery.trim())}`}
                                            onClick={() => {
                                                setSearchQuery('')
                                                setIsSearchOpen(false)
                                                setSearchResults([])
                                            }}
                                            className="block mt-2 px-3 py-2 text-center text-sm font-medium text-cyan-300 hover:text-cyan-200 bg-cyan-500/10 hover:bg-cyan-500/20 rounded-lg transition-all"
                                        >
                                            View all results for "{searchQuery}"
                                        </Link>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Desktop navigation - Compact */}
                <nav className="hidden lg:flex items-center space-x-1 flex-shrink-0" ref={dropdownRef}>
                    <Link
                        to="/"
                        className={`h-7 px-2 py-1 rounded-md text-xs font-medium text-white transition-all duration-200 flex items-center justify-center whitespace-nowrap ${
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
                            className="relative group"
                            onMouseEnter={() => {
                                // Clear any pending close timeout
                                if (dropdownTimeoutRef.current) {
                                    clearTimeout(dropdownTimeoutRef.current)
                                    dropdownTimeoutRef.current = null
                                }
                                if (category.subcategories && category.subcategories.length > 0) {
                                    setOpenDropdown(category.id)
                                }
                            }}
                            onMouseLeave={() => {
                                // Only close on mouse leave if not opened by click
                                if (clickedDropdown !== category.id) {
                                    // Add delay before closing to allow smooth transition
                                    dropdownTimeoutRef.current = setTimeout(() => {
                                        setOpenDropdown(null)
                                        setOpenSubDropdown(null)
                                    }, 200) // 200ms delay
                                }
                            }}
                        >
                            <div className="flex items-center">
                                <Link
                                    to={`/category/${category.slug}`}
                                    className={`h-7 px-2 py-1 rounded-md text-xs font-medium text-white transition-all duration-200 flex items-center justify-center whitespace-nowrap ${
                                        isCategoryActive(category)
                                            ? 'bg-blue-800/50 text-blue-100' 
                                            : 'bg-blue-950/60 hover:bg-blue-900/70 hover:text-cyan-200'
                                    }`}
                                >
                                    <span>{translateCategory(category)}</span>
                                </Link>
                                {category.subcategories && category.subcategories.length > 0 && (
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault()
                                            e.stopPropagation()
                                            // Toggle dropdown on click
                                            if (openDropdown === category.id && clickedDropdown === category.id) {
                                                // Close if already open and was opened by click
                                                setOpenDropdown(null)
                                                setOpenSubDropdown(null)
                                                setClickedDropdown(null)
                                            } else {
                                                // Open dropdown
                                                setOpenDropdown(category.id)
                                                setClickedDropdown(category.id)
                                                setOpenSubDropdown(null)
                                            }
                                        }}
                                        className={`h-7 px-1 flex items-center justify-center text-white transition-all duration-200 ${
                                            openDropdown === category.id
                                                ? 'text-cyan-200' 
                                                : 'hover:text-cyan-200'
                                        }`}
                                        aria-label="Toggle subcategories"
                                    >
                                        <svg className={`w-3 h-3 transition-transform duration-200 ${openDropdown === category.id ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                            
                            {/* Visual bridge to prevent gap issues */}
                            {openDropdown === category.id && category.subcategories && category.subcategories.length > 0 && (
                                <div 
                                    className="absolute top-full left-0 right-0 h-2 z-40"
                                    style={{ pointerEvents: 'none' }}
                                />
                            )}
                            
                            {/* Subcategories dropdown */}
                            {openDropdown === category.id && category.subcategories && category.subcategories.length > 0 && (
                                <div 
                                    className="absolute top-full left-0 w-64 bg-blue-950/98 backdrop-blur-xl border border-cyan-400/40 rounded-xl shadow-2xl py-3 z-50 transform transition-all duration-200 ease-out"
                                    style={{ marginTop: '2px', paddingTop: '8px' }}
                                    onMouseEnter={() => {
                                        // Clear any pending close timeout
                                        if (dropdownTimeoutRef.current) {
                                            clearTimeout(dropdownTimeoutRef.current)
                                            dropdownTimeoutRef.current = null
                                        }
                                        setOpenDropdown(category.id)
                                    }}
                                    onMouseLeave={() => {
                                        // Only close on mouse leave if not opened by click
                                        if (clickedDropdown !== category.id) {
                                            // Add delay before closing
                                            dropdownTimeoutRef.current = setTimeout(() => {
                                                setOpenDropdown(null)
                                                setOpenSubDropdown(null)
                                            }, 200)
                                        }
                                    }}
                                >
                                    <div className="px-2">
                                        {category.subcategories.map((subcategory, index) => (
                                            <div
                                                key={subcategory.id}
                                                className="relative group/subcat"
                                                onMouseEnter={() => {
                                                    // Clear any pending close timeout
                                                    if (subDropdownTimeoutRef.current) {
                                                        clearTimeout(subDropdownTimeoutRef.current)
                                                        subDropdownTimeoutRef.current = null
                                                    }
                                                    if (subcategory.children && subcategory.children.length > 0) {
                                                        setOpenSubDropdown(subcategory.id)
                                                    }
                                                }}
                                                onMouseLeave={() => {
                                                    // Only close on mouse leave if not opened by click
                                                    if (clickedSubDropdown !== subcategory.id) {
                                                        // Add delay before closing sub-dropdown
                                                        subDropdownTimeoutRef.current = setTimeout(() => {
                                                            setOpenSubDropdown(null)
                                                        }, 150)
                                                    }
                                                }}
                                            >
                                                {index > 0 && (
                                                    <div className="mx-2 my-1 h-px bg-cyan-400/20"></div>
                                                )}
                                                <div className="flex items-center justify-between w-full">
                                                    <Link
                                                        to={`/category/${category.slug}/${subcategory.slug}`}
                                                        className="flex-1 px-4 py-2.5 text-sm font-medium text-white hover:bg-gradient-to-r hover:from-cyan-500/20 hover:to-blue-900/50 hover:text-cyan-200 rounded-lg transition-all duration-200 flex items-center gap-2 group/item"
                                                        onClick={() => {
                                                            // Only close if not opened by click, or close on link click
                                                            if (clickedDropdown !== category.id) {
                                                                setOpenDropdown(null)
                                                            }
                                                        }}
                                                        onMouseEnter={() => {
                                                            // Clear any pending close timeout
                                                            if (subDropdownTimeoutRef.current) {
                                                                clearTimeout(subDropdownTimeoutRef.current)
                                                                subDropdownTimeoutRef.current = null
                                                            }
                                                            if (subcategory.children && subcategory.children.length > 0) {
                                                                setOpenSubDropdown(subcategory.id)
                                                            }
                                                        }}
                                                    >
                                                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400/60 group-hover/item:bg-cyan-400 transition-colors"></span>
                                                        <span>{translateCategory(subcategory)}</span>
                                                    </Link>
                                                    {subcategory.children && subcategory.children.length > 0 && (
                                                        <button
                                                            type="button"
                                                            className="px-2 cursor-pointer focus:outline-none"
                                                            onClick={(e) => {
                                                                e.preventDefault()
                                                                e.stopPropagation()
                                                                // Toggle sub-dropdown on click
                                                                if (openSubDropdown === subcategory.id && clickedSubDropdown === subcategory.id) {
                                                                    setOpenSubDropdown(null)
                                                                    setClickedSubDropdown(null)
                                                                } else {
                                                                    setOpenSubDropdown(subcategory.id)
                                                                    setClickedSubDropdown(subcategory.id)
                                                                }
                                                            }}
                                                            onMouseEnter={() => {
                                                                // Clear any pending close timeout
                                                                if (subDropdownTimeoutRef.current) {
                                                                    clearTimeout(subDropdownTimeoutRef.current)
                                                                    subDropdownTimeoutRef.current = null
                                                                }
                                                                setOpenSubDropdown(subcategory.id)
                                                            }}
                                                            aria-label="Toggle sub-subcategories"
                                                        >
                                                            <svg className={`w-4 h-4 text-cyan-400/70 group-hover/subcat:text-cyan-300 transition-colors ${openSubDropdown === subcategory.id ? 'text-cyan-300' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                            </svg>
                                                        </button>
                                                    )}
                                                </div>
                                                
                                                {/* Visual bridge for sub-subcategories */}
                                                {openSubDropdown === subcategory.id && subcategory.children && subcategory.children.length > 0 && (
                                                    <div 
                                                        className="absolute left-full top-0 bottom-0 w-2 z-[55]"
                                                        style={{ pointerEvents: 'none' }}
                                                    />
                                                )}
                                                
                                                {/* Sub-subcategories nested dropdown */}
                                                {openSubDropdown === subcategory.id && subcategory.children && subcategory.children.length > 0 && (
                                                    <div 
                                                        className="absolute left-full top-0 w-60 bg-blue-950/98 backdrop-blur-xl border border-cyan-400/40 rounded-xl shadow-2xl py-3 z-[60] transform transition-all duration-200 ease-out"
                                                        style={{ marginLeft: '4px' }}
                                                        onMouseEnter={() => {
                                                            // Clear any pending close timeout
                                                            if (subDropdownTimeoutRef.current) {
                                                                clearTimeout(subDropdownTimeoutRef.current)
                                                                subDropdownTimeoutRef.current = null
                                                            }
                                                            setOpenSubDropdown(subcategory.id)
                                                        }}
                                                        onMouseLeave={() => {
                                                            // Only close on mouse leave if not opened by click
                                                            if (clickedSubDropdown !== subcategory.id) {
                                                                // Add delay before closing
                                                                subDropdownTimeoutRef.current = setTimeout(() => {
                                                                    setOpenSubDropdown(null)
                                                                }, 150)
                                                            }
                                                        }}
                                                    >
                                                        <div className="px-2">
                                                            <div className="px-3 py-1.5 mb-1">
                                                                <p className="text-xs font-semibold text-cyan-400/80 uppercase tracking-wider">{translateCategory(subcategory)}</p>
                                                            </div>
                                                            {subcategory.children.map((child, childIndex) => (
                                                                <React.Fragment key={child.id}>
                                                                    {childIndex > 0 && (
                                                                        <div className="mx-2 my-1 h-px bg-cyan-400/15"></div>
                                                                    )}
                                                                    <Link
                                                                        to={`/category/${category.slug}/${subcategory.slug}/${child.slug}`}
                                                                        className="block px-4 py-2 text-sm text-white/90 hover:bg-gradient-to-r hover:from-cyan-500/15 hover:to-blue-900/40 hover:text-cyan-100 rounded-lg transition-all duration-200 flex items-center gap-2"
                                                                        onClick={() => {
                                                                            setOpenDropdown(null)
                                                                            setOpenSubDropdown(null)
                                                                            setClickedDropdown(null)
                                                                            setClickedSubDropdown(null)
                                                                        }}
                                                                    >
                                                                        <span className="w-1 h-1 rounded-full bg-cyan-400/50"></span>
                                                                        <span>{translateCategory(child)}</span>
                                                                    </Link>
                                                                </React.Fragment>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                    
                </nav>
                
                {/* Right side actions - Compact */}
                <div className="flex items-center gap-1.5 md:gap-2 flex-shrink-0">
                    {/* Language Switcher - Always visible */}
                    <div className="flex-shrink-0">
                        <LanguageSwitcher variant="navbar" />
                    </div>
                    
                    {/* Wishlist Icon */}
                    <div className="hidden md:flex items-center justify-center flex-shrink-0">
                        <WishlistIcon />
                    </div>
                    
                    {/* Cart Icon */}
                    <div className="hidden md:flex items-center justify-center flex-shrink-0">
                        <CartIcon />
                    </div>
                    
                    {/* Mobile menu toggle */}
                    <button
                        className="relative inline-flex flex-col items-center justify-center md:hidden h-7 w-7 rounded-md border border-cyan-400/50 bg-blue-950/60 hover:bg-blue-900/70 transition-all duration-200 cursor-pointer flex-shrink-0"
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
                        className="hidden md:inline-flex items-center justify-center h-7 min-w-[60px] rounded-md border border-cyan-400/50 bg-blue-950/60 hover:bg-blue-900/70 px-2.5 py-1 text-xs font-semibold text-white transition-all duration-200 cursor-pointer whitespace-nowrap flex-shrink-0"
                    >
                        {t('navbar.login')}
                    </Link>
                </div>
            </div>

            {/* Mobile menu */}
            {isMobileOpen && (
                <div className="mt-2 md:hidden rounded-2xl bg-blue-950/98 backdrop-blur-xl border border-cyan-400/30 shadow-2xl mx-4 mb-4 px-5 py-6 space-y-3 text-sm text-white">
                    {/* Mobile Search Bar */}
                    <div className="relative mb-4">
                        <input
                            type="text"
                            placeholder="Search"
                            value={searchQuery}
                            onChange={(e) => {
                                const value = e.target.value
                                setSearchQuery(value)
                                
                                if (searchTimeoutRef.current) {
                                    clearTimeout(searchTimeoutRef.current)
                                }
                                
                                if (value.trim().length >= 2) {
                                    setIsSearching(true)
                                    searchTimeoutRef.current = setTimeout(async () => {
                                        try {
                                            const results = await searchAll(value.trim(), 5)
                                            if (results) {
                                                setSearchResults(results.results)
                                            } else {
                                                setSearchResults([])
                                            }
                                        } catch (error) {
                                            console.error('Search error:', error)
                                            setSearchResults([])
                                        } finally {
                                            setIsSearching(false)
                                        }
                                    }, 300)
                                } else {
                                    setSearchResults([])
                                    setIsSearching(false)
                                }
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && searchQuery.trim().length >= 2) {
                                    navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
                                    setSearchQuery('')
                                    setIsMobileOpen(false)
                                }
                            }}
                            className="w-full h-10 px-4 py-2 text-sm bg-blue-950/60 border border-cyan-400/30 rounded-lg text-white placeholder-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            {isSearching ? (
                                <svg className="animate-spin h-4 w-4 text-cyan-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : (
                                <svg className="h-4 w-4 text-cyan-400/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            )}
                        </div>
                        
                        {/* Mobile Search Results */}
                        {searchResults.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-blue-950/98 backdrop-blur-xl border border-cyan-400/40 rounded-xl shadow-2xl z-50 max-h-64 overflow-y-auto">
                                <div className="p-2">
                                    {searchResults.map((result) => (
                                        <Link
                                            key={`mobile-${result.type}-${result.id}`}
                                            to={result.url}
                                            onClick={() => {
                                                setSearchQuery('')
                                                setSearchResults([])
                                                setIsMobileOpen(false)
                                            }}
                                            className="block px-3 py-2.5 rounded-lg hover:bg-gradient-to-r hover:from-cyan-500/20 hover:to-blue-900/50 transition-all duration-200 mb-1"
                                        >
                                            <div className="flex items-center gap-2">
                                                <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                                                    result.type === 'product' ? 'bg-green-500/20 text-green-300' :
                                                    result.type === 'category' ? 'bg-blue-500/20 text-blue-300' :
                                                    result.type === 'subcategory' ? 'bg-purple-500/20 text-purple-300' :
                                                    'bg-cyan-500/20 text-cyan-300'
                                                }`}>
                                                    {result.type === 'product' ? 'P' : result.type === 'category' ? 'C' : result.type === 'subcategory' ? 'SC' : 'SS'}
                                                </span>
                                                <p className="text-sm font-medium text-white truncate">{result.name}</p>
                                            </div>
                                        </Link>
                                    ))}
                                    {searchQuery.trim().length >= 2 && (
                                        <Link
                                            to={`/search?q=${encodeURIComponent(searchQuery.trim())}`}
                                            onClick={() => {
                                                setSearchQuery('')
                                                setSearchResults([])
                                                setIsMobileOpen(false)
                                            }}
                                            className="block mt-2 px-3 py-2 text-center text-sm font-medium text-cyan-300 hover:text-cyan-200 bg-cyan-500/10 hover:bg-cyan-500/20 rounded-lg transition-all"
                                        >
                                            View all results
                                        </Link>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                    
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
                                <div className="flex items-center justify-between gap-2">
                                    <Link
                                        to={`/category/${category.slug}`}
                                        onClick={() => setIsMobileOpen(false)}
                                        className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-all flex items-center gap-2 ${
                                            isCategoryActive(category) 
                                                ? 'bg-blue-800/50 text-blue-100 shadow-md' 
                                                : 'bg-blue-950/60 hover:bg-gradient-to-r hover:from-cyan-500/20 hover:to-blue-900/50 hover:text-cyan-200'
                                        }`}
                                    >
                                        <span className="w-2 h-2 rounded-full bg-cyan-400/60"></span>
                                        <span>{translateCategory(category)}</span>
                                    </Link>
                                    {category.subcategories && category.subcategories.length > 0 && (
                                        <button
                                            onClick={() => setMobileOpenCategory(mobileOpenCategory === category.id ? null : category.id)}
                                            className="px-3 py-2.5 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-400/10 rounded-lg transition-all duration-200"
                                            aria-label="Toggle subcategories"
                                        >
                                            <svg
                                                className={`w-5 h-5 transition-transform duration-200 ${mobileOpenCategory === category.id ? 'rotate-180' : ''}`}
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
                                    <div className="ml-4 space-y-1 border-l-2 border-cyan-400/40 pl-3 mt-2 transition-all duration-200">
                                        {category.subcategories.map((subcategory, index) => (
                                            <div key={subcategory.id} className="space-y-1">
                                                {index > 0 && (
                                                    <div className="h-px bg-cyan-400/20 -ml-3"></div>
                                                )}
                                                <div className="flex items-center justify-between">
                                                    <Link
                                                        to={`/category/${category.slug}/${subcategory.slug}`}
                                                        onClick={() => setIsMobileOpen(false)}
                                                        className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium bg-blue-950/80 hover:bg-gradient-to-r hover:from-cyan-500/20 hover:to-blue-900/50 hover:text-cyan-200 transition-all duration-200 flex items-center gap-2"
                                                    >
                                                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400/60"></span>
                                                        <span>{translateCategory(subcategory)}</span>
                                                    </Link>
                                                    {subcategory.children && subcategory.children.length > 0 && (
                                                        <button
                                                            onClick={() => setMobileOpenSubcategory(mobileOpenSubcategory === subcategory.id ? null : subcategory.id)}
                                                            className="px-2 py-2.5 text-cyan-400 hover:text-cyan-300 transition-colors"
                                                            aria-label="Toggle sub-subcategories"
                                                        >
                                                            <svg
                                                                className={`w-4 h-4 transition-transform duration-200 ${mobileOpenSubcategory === subcategory.id ? 'rotate-180' : ''}`}
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
                                                    <div className="ml-4 space-y-1 border-l-2 border-cyan-400/25 pl-3 mt-1 transition-all duration-200">
                                                        <div className="px-2 py-1 mb-1">
                                                            <p className="text-xs font-semibold text-cyan-400/70 uppercase tracking-wider">{translateCategory(subcategory)}</p>
                                                        </div>
                                                        {subcategory.children.map((child, childIndex) => (
                                                            <React.Fragment key={child.id}>
                                                                {childIndex > 0 && (
                                                                    <div className="h-px bg-cyan-400/15 -ml-3"></div>
                                                                )}
                                                                <Link
                                                                    to={`/category/${category.slug}/${subcategory.slug}/${child.slug}`}
                                                                    onClick={() => setIsMobileOpen(false)}
                                                                    className="block px-4 py-2 rounded-lg text-sm bg-blue-950/70 hover:bg-gradient-to-r hover:from-cyan-500/15 hover:to-blue-900/40 hover:text-cyan-100 transition-all duration-200 flex items-center gap-2"
                                                                >
                                                                    <span className="w-1 h-1 rounded-full bg-cyan-400/50"></span>
                                                                    <span>{translateCategory(child)}</span>
                                                                </Link>
                                                            </React.Fragment>
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
                        {/* Language Switcher - Prominent in mobile menu */}
                        <div className="pb-2">
                            <p className="text-xs font-semibold text-cyan-400/80 uppercase tracking-wider mb-2 px-1">{t('common.language') || 'Language'}</p>
                            <div className="flex justify-center">
                                <LanguageSwitcher variant="navbar" />
                            </div>
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
                        <div className="flex justify-center gap-4">
                            <WishlistIcon />
                            <CartIcon />
                        </div>
                    </div>
                </div>
            )}
        </header>
    )
}

export default Navbar
