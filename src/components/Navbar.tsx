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
import { useAuth } from '../context/AuthContext'
import {
    COLLECTIONS_ALL_PATH,
    collectionCategoryPath,
    isCollectionsAllPath,
} from '../utils/collectionPaths'

const Navbar: React.FC = () => {
    const { t, i18n } = useTranslation()
    const { user } = useAuth()
    const { menuCategoryLabel } = useCategoryTranslation()
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
    const pathMatches = (path: string) =>
        location.pathname === path || location.pathname.startsWith(`${path}/`)

    /** Always open the global catalogue search page — never stay on the current category/shop listing. */
    const goToGlobalSearch = (rawQuery: string, options?: { closeMobile?: boolean }) => {
        const query = rawQuery.trim()
        if (query.length < 2) return
        setSearchQuery('')
        setIsSearchOpen(false)
        setSearchResults([])
        if (options?.closeMobile) {
            setIsMobileOpen(false)
        }
        navigate(`/search?q=${encodeURIComponent(query)}`)
    }

    const isCategoryActive = (category: Category) => {
        const categoryPath = collectionCategoryPath(category.slug)
        const legacyPath = `/category/${category.slug}`
        if (pathMatches(categoryPath) || pathMatches(legacyPath)) {
            return true
        }
        if (category.subcategories) {
            return category.subcategories.some((sub) => {
                const subPath = collectionCategoryPath(category.slug, sub.slug)
                const legacySubPath = `/category/${category.slug}/${sub.slug}`
                if (pathMatches(subPath) || pathMatches(legacySubPath)) {
                    return true
                }
                if (sub.children) {
                    return sub.children.some((child) => {
                        const childPath = collectionCategoryPath(category.slug, sub.slug, child.slug)
                        const legacyChildPath = `/category/${category.slug}/${sub.slug}/${child.slug}`
                        return pathMatches(childPath) || pathMatches(legacyChildPath)
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
            <div className="mx-auto flex w-full max-w-[1920px] items-center justify-between gap-2 px-3 py-2 sm:gap-3 sm:px-4 md:gap-4 md:px-6 md:py-3">
                {/* Logo */}
                <Link to="/" className="group flex shrink-0 items-center space-x-1.5 md:space-x-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-md bg-cyan-400 shadow-sm transition-all duration-300 group-hover:bg-cyan-300 md:h-9 md:w-9 md:rounded-lg">
                        <span className="text-[10px] font-bold text-white md:text-sm">OS</span>
                    </div>
                    <span className="hidden text-xs font-bold uppercase tracking-wide text-white transition-colors group-hover:text-cyan-200 sm:inline md:text-base">
                        OPTISHOP
                    </span>
                </Link>

                {/* Search Bar - Centered */}
                <div 
                    className="navbar-search-container relative flex-1 max-w-2xl" 
                    ref={searchRef}
                >
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
                                    e.preventDefault()
                                    goToGlobalSearch(searchQuery)
                                } else if (e.key === 'Escape') {
                                    setIsSearchOpen(false)
                                }
                            }}
                            className="h-8 w-full rounded-lg border border-cyan-400/40 bg-blue-950/70 px-3 py-2 pr-8 text-xs text-white placeholder-cyan-400/60 transition-colors focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 sm:px-4 sm:pr-10 sm:text-sm md:h-10"
                            style={{
                                width: '100%',
                                maxWidth: '100%',
                                minWidth: 0,
                                boxSizing: 'border-box',
                                flexShrink: 1
                            }}
                        />
                        <button
                            type="button"
                            onClick={() => {
                                if (searchQuery.trim().length < 2) {
                                    setSearchResults([{
                                        id: 0,
                                        name: 'Please type at least 2 characters',
                                        type: 'message',
                                        slug: '',
                                        url: '',
                                        description: 'Type more characters to see search results'
                                    }])
                                    setTimeout(() => {
                                        setIsSearchOpen(false)
                                        setSearchResults([])
                                    }, 2000)
                                    return
                                }
                                goToGlobalSearch(searchQuery)
                            }}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-cyan-400/20 rounded-full transition-colors cursor-pointer"
                            disabled={isSearching}
                        >
                            {isSearching ? (
                                <svg className="animate-spin h-4 w-4 text-cyan-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : (
                                <svg className="h-4 w-4 text-cyan-400/80 hover:text-cyan-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            )}
                        </button>
                        
                        {/* Search Results Dropdown */}
                        {isSearchOpen && searchResults.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-blue-950/98 backdrop-blur-xl border border-cyan-400/40 rounded-xl shadow-2xl z-50 max-h-96 overflow-y-auto">
                                <div className="p-2">
                                    {searchResults[0].id === 0 ? (
                                        // Special message case
                                        <div className="px-3 py-2.5 text-center">
                                            <p className="text-sm font-medium text-cyan-300">{searchResults[0].name}</p>
                                            {searchResults[0].description && (
                                                <p className="text-xs text-cyan-400/70 mt-1">{searchResults[0].description}</p>
                                            )}
                                        </div>
                                    ) : (
                                        <>
                                            <div className="text-xs text-cyan-400/60 px-3 py-2 font-medium">
                                                Found {searchResults.length} results for "{searchQuery}"
                                            </div>
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
                                                <button
                                                    type="button"
                                                    onClick={() => goToGlobalSearch(searchQuery)}
                                                    className="mt-2 block w-full rounded-lg bg-cyan-500/10 px-3 py-2 text-center text-sm font-medium text-cyan-300 transition-all hover:bg-cyan-500/20 hover:text-cyan-200"
                                                >
                                                    View all results
                                                </button>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Desktop navigation — separate category menus (not one Collections dropdown) */}
                <nav className="hidden flex-shrink-0 items-center space-x-1.5 lg:flex" ref={dropdownRef}>
                    <Link
                        to="/"
                        className={`flex h-8 items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium text-white transition-all duration-200 md:h-9 ${
                            isActive('/') 
                                ? 'bg-blue-800/50 text-blue-100' 
                                : 'bg-blue-950/60 hover:bg-blue-900/70 hover:text-cyan-200'
                        }`}
                    >
                        {t('navbar.home')}
                    </Link>

                    {!loading && categories.map((category) => (
                        <div
                            key={category.id}
                            className="group relative"
                            onMouseEnter={() => {
                                if (dropdownTimeoutRef.current) {
                                    clearTimeout(dropdownTimeoutRef.current)
                                    dropdownTimeoutRef.current = null
                                }
                                if (category.subcategories && category.subcategories.length > 0) {
                                    setOpenDropdown(category.id)
                                }
                            }}
                            onMouseLeave={() => {
                                if (clickedDropdown !== category.id) {
                                    dropdownTimeoutRef.current = setTimeout(() => {
                                        setOpenDropdown(null)
                                        setOpenSubDropdown(null)
                                    }, 200)
                                }
                            }}
                        >
                            <div className="flex items-center">
                                <Link
                                    to={collectionCategoryPath(category.slug)}
                                    className={`flex h-8 items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium text-white transition-all duration-200 md:h-9 ${
                                        isCategoryActive(category)
                                            ? 'bg-blue-800/50 text-blue-100'
                                            : 'bg-blue-950/60 hover:bg-blue-900/70 hover:text-cyan-200'
                                    }`}
                                >
                                    <span>{menuCategoryLabel(category)}</span>
                                </Link>
                                {category.subcategories && category.subcategories.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.preventDefault()
                                            e.stopPropagation()
                                            if (openDropdown === category.id && clickedDropdown === category.id) {
                                                setOpenDropdown(null)
                                                setOpenSubDropdown(null)
                                                setClickedDropdown(null)
                                            } else {
                                                setOpenDropdown(category.id)
                                                setClickedDropdown(category.id)
                                                setOpenSubDropdown(null)
                                            }
                                        }}
                                        className={`flex h-8 items-center justify-center px-1 text-white transition-all duration-200 md:h-9 ${
                                            openDropdown === category.id
                                                ? 'text-cyan-200'
                                                : 'hover:text-cyan-200'
                                        }`}
                                        aria-label="Toggle subcategories"
                                    >
                                        <svg
                                            className={`h-3 w-3 transition-transform duration-200 ${openDropdown === category.id ? 'rotate-180' : ''}`}
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>
                                )}
                            </div>

                            {openDropdown === category.id && category.subcategories && category.subcategories.length > 0 && (
                                <div
                                    className="absolute left-0 right-0 top-full z-40 h-2"
                                    style={{ pointerEvents: 'none' }}
                                />
                            )}

                            {openDropdown === category.id && category.subcategories && category.subcategories.length > 0 && (
                                <div
                                    className="absolute left-0 top-full z-50 w-64 transform rounded-xl border border-cyan-400/40 bg-blue-950/98 py-3 shadow-2xl backdrop-blur-xl transition-all duration-200 ease-out"
                                    style={{ marginTop: '2px', paddingTop: '8px' }}
                                    onMouseEnter={() => {
                                        if (dropdownTimeoutRef.current) {
                                            clearTimeout(dropdownTimeoutRef.current)
                                            dropdownTimeoutRef.current = null
                                        }
                                        setOpenDropdown(category.id)
                                    }}
                                    onMouseLeave={() => {
                                        if (clickedDropdown !== category.id) {
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
                                                className="group/subcat relative"
                                                onMouseEnter={() => {
                                                    if (subDropdownTimeoutRef.current) {
                                                        clearTimeout(subDropdownTimeoutRef.current)
                                                        subDropdownTimeoutRef.current = null
                                                    }
                                                    if (subcategory.children && subcategory.children.length > 0) {
                                                        setOpenSubDropdown(subcategory.id)
                                                    }
                                                }}
                                                onMouseLeave={() => {
                                                    if (clickedSubDropdown !== subcategory.id) {
                                                        subDropdownTimeoutRef.current = setTimeout(() => {
                                                            setOpenSubDropdown(null)
                                                        }, 150)
                                                    }
                                                }}
                                            >
                                                {index > 0 && (
                                                    <div className="mx-2 my-1 h-px bg-cyan-400/20" />
                                                )}
                                                <div className="flex w-full items-center justify-between">
                                                    <Link
                                                        to={collectionCategoryPath(category.slug, subcategory.slug)}
                                                        className="group/item flex flex-1 items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:bg-gradient-to-r hover:from-cyan-500/20 hover:to-blue-900/50 hover:text-cyan-200"
                                                        onClick={() => {
                                                            if (clickedDropdown !== category.id) {
                                                                setOpenDropdown(null)
                                                            }
                                                        }}
                                                        onMouseEnter={() => {
                                                            if (subDropdownTimeoutRef.current) {
                                                                clearTimeout(subDropdownTimeoutRef.current)
                                                                subDropdownTimeoutRef.current = null
                                                            }
                                                            if (subcategory.children && subcategory.children.length > 0) {
                                                                setOpenSubDropdown(subcategory.id)
                                                            }
                                                        }}
                                                    >
                                                        <span className="h-1.5 w-1.5 rounded-full bg-cyan-400/60 transition-colors group-hover/item:bg-cyan-400" />
                                                        <span>{menuCategoryLabel(subcategory)}</span>
                                                    </Link>
                                                    {subcategory.children && subcategory.children.length > 0 && (
                                                        <button
                                                            type="button"
                                                            className="cursor-pointer px-2 focus:outline-none"
                                                            onClick={(e) => {
                                                                e.preventDefault()
                                                                e.stopPropagation()
                                                                if (openSubDropdown === subcategory.id && clickedSubDropdown === subcategory.id) {
                                                                    setOpenSubDropdown(null)
                                                                    setClickedSubDropdown(null)
                                                                } else {
                                                                    setOpenSubDropdown(subcategory.id)
                                                                    setClickedSubDropdown(subcategory.id)
                                                                }
                                                            }}
                                                            onMouseEnter={() => {
                                                                if (subDropdownTimeoutRef.current) {
                                                                    clearTimeout(subDropdownTimeoutRef.current)
                                                                    subDropdownTimeoutRef.current = null
                                                                }
                                                                setOpenSubDropdown(subcategory.id)
                                                            }}
                                                            aria-label="Toggle sub-subcategories"
                                                        >
                                                            <svg
                                                                className={`h-4 w-4 text-cyan-400/70 transition-colors group-hover/subcat:text-cyan-300 ${openSubDropdown === subcategory.id ? 'text-cyan-300' : ''}`}
                                                                fill="none"
                                                                stroke="currentColor"
                                                                viewBox="0 0 24 24"
                                                            >
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                            </svg>
                                                        </button>
                                                    )}
                                                </div>

                                                {openSubDropdown === subcategory.id && subcategory.children && subcategory.children.length > 0 && (
                                                    <div
                                                        className="absolute bottom-0 left-full top-0 z-[55] w-2"
                                                        style={{ pointerEvents: 'none' }}
                                                    />
                                                )}

                                                {openSubDropdown === subcategory.id && subcategory.children && subcategory.children.length > 0 && (
                                                    <div
                                                        className="absolute left-full top-0 z-[60] w-60 transform rounded-xl border border-cyan-400/40 bg-blue-950/98 py-3 shadow-2xl backdrop-blur-xl transition-all duration-200 ease-out"
                                                        style={{ marginLeft: '4px' }}
                                                        onMouseEnter={() => {
                                                            if (subDropdownTimeoutRef.current) {
                                                                clearTimeout(subDropdownTimeoutRef.current)
                                                                subDropdownTimeoutRef.current = null
                                                            }
                                                            setOpenSubDropdown(subcategory.id)
                                                        }}
                                                        onMouseLeave={() => {
                                                            if (clickedSubDropdown !== subcategory.id) {
                                                                subDropdownTimeoutRef.current = setTimeout(() => {
                                                                    setOpenSubDropdown(null)
                                                                }, 150)
                                                            }
                                                        }}
                                                    >
                                                        <div className="px-2">
                                                            <div className="mb-1 px-3 py-1.5">
                                                                <p className="text-xs font-semibold uppercase tracking-wider text-cyan-400/80">
                                                                    {menuCategoryLabel(subcategory)}
                                                                </p>
                                                            </div>
                                                            {subcategory.children.map((child, childIndex) => (
                                                                <React.Fragment key={child.id}>
                                                                    {childIndex > 0 && (
                                                                        <div className="mx-2 my-1 h-px bg-cyan-400/15" />
                                                                    )}
                                                                    <Link
                                                                        to={collectionCategoryPath(
                                                                            category.slug,
                                                                            subcategory.slug,
                                                                            child.slug
                                                                        )}
                                                                        className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm text-white/90 transition-all duration-200 hover:bg-gradient-to-r hover:from-cyan-500/15 hover:to-blue-900/40 hover:text-cyan-100"
                                                                        onClick={() => {
                                                                            setOpenDropdown(null)
                                                                            setOpenSubDropdown(null)
                                                                            setClickedDropdown(null)
                                                                            setClickedSubDropdown(null)
                                                                        }}
                                                                    >
                                                                        <span className="h-1 w-1 rounded-full bg-cyan-400/50" />
                                                                        <span>{menuCategoryLabel(child)}</span>
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
                
                {/* Right side actions */}
                <div className="flex shrink-0 items-center gap-1.5 md:gap-2.5">
                    <div
                        className="hidden overflow-hidden rounded-md border border-cyan-400/45 sm:flex"
                        role="group"
                        aria-label={t('navbar.menuLanguage', 'Shop menu language')}
                    >
                        <button
                            type="button"
                            onClick={() => i18n.changeLanguage('en')}
                            className={`px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wide transition-colors md:text-xs ${
                                (i18n.resolvedLanguage || i18n.language || '').split('-')[0] === 'en'
                                    ? 'bg-cyan-400 text-blue-950'
                                    : 'text-white/85 hover:bg-blue-900/50'
                            }`}
                        >
                            EN
                        </button>
                        <button
                            type="button"
                            onClick={() => i18n.changeLanguage('it')}
                            className={`px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wide transition-colors md:text-xs ${
                                (i18n.resolvedLanguage || i18n.language || '').split('-')[0] === 'it'
                                    ? 'bg-cyan-400 text-blue-950'
                                    : 'text-white/85 hover:bg-blue-900/50'
                            }`}
                        >
                            IT
                        </button>
                    </div>
                    {/* Full language switcher — desktop only (mobile uses menu + floating control) */}
                    <div className="hidden shrink-0 md:block">
                        <LanguageSwitcher variant="navbar" />
                    </div>
                    
                    {/* Wishlist Icon */}
                    <div className="hidden md:flex items-center justify-center flex-shrink-0">
                        <WishlistIcon />
                    </div>
                    
                    {/* Cart Icon — show on mobile too */}
                    <div className="flex items-center justify-center flex-shrink-0">
                        <CartIcon />
                    </div>
                    
                    {/* Mobile menu toggle */}
                    <button
                        className="relative inline-flex h-8 w-8 flex-shrink-0 cursor-pointer flex-col items-center justify-center rounded-md border border-cyan-400/50 bg-blue-950/60 transition-all duration-200 hover:bg-blue-900/70 md:hidden"
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

                    {user?.role === 'customer' ? (
                        <Link
                            to="/account"
                            className="hidden h-8 min-w-[72px] flex-shrink-0 cursor-pointer items-center justify-center whitespace-nowrap rounded-md border border-cyan-400/50 bg-blue-950/60 px-3 py-1.5 text-xs font-semibold text-white transition-all duration-200 hover:bg-blue-900/70 md:inline-flex md:h-9 md:text-sm"
                        >
                            {t('nav.account', 'Account')}
                        </Link>
                    ) : (
                        <Link
                            to="/login"
                            className="hidden h-8 min-w-[60px] flex-shrink-0 cursor-pointer items-center justify-center whitespace-nowrap rounded-md border border-cyan-400/50 bg-blue-950/60 px-3 py-1.5 text-xs font-semibold text-white transition-all duration-200 hover:bg-blue-900/70 md:inline-flex md:h-9 md:text-sm"
                        >
                            {t('navbar.login')}
                        </Link>
                    )}
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
                                    e.preventDefault()
                                    goToGlobalSearch(searchQuery, { closeMobile: true })
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
                        <Link
                            to={COLLECTIONS_ALL_PATH}
                            onClick={() => setIsMobileOpen(false)}
                            className={`block px-4 py-2.5 rounded-lg font-medium transition-all ${
                                isCollectionsAllPath(location.pathname)
                                    ? 'bg-blue-800/50 text-blue-100'
                                    : 'bg-blue-950/60 hover:bg-blue-900/70'
                            }`}
                        >
                            {t('navbar.allProducts', 'All products')}
                        </Link>
                        {!loading && categories.map((category) => (
                            <div key={category.id} className="space-y-1">
                                <div className="flex items-center justify-between gap-2">
                                    <Link
                                        to={collectionCategoryPath(category.slug)}
                                        onClick={() => setIsMobileOpen(false)}
                                        className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-all flex items-center gap-2 ${
                                            isCategoryActive(category) 
                                                ? 'bg-blue-800/50 text-blue-100 shadow-md' 
                                                : 'bg-blue-950/60 hover:bg-gradient-to-r hover:from-cyan-500/20 hover:to-blue-900/50 hover:text-cyan-200'
                                        }`}
                                    >
                                        <span className="w-2 h-2 rounded-full bg-cyan-400/60"></span>
                                        <span>{menuCategoryLabel(category)}</span>
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
                                                        to={collectionCategoryPath(category.slug, subcategory.slug)}
                                                        onClick={() => setIsMobileOpen(false)}
                                                        className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium bg-blue-950/80 hover:bg-gradient-to-r hover:from-cyan-500/20 hover:to-blue-900/50 hover:text-cyan-200 transition-all duration-200 flex items-center gap-2"
                                                    >
                                                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400/60"></span>
                                                        <span>{menuCategoryLabel(subcategory)}</span>
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
                                                            <p className="text-xs font-semibold text-cyan-400/70 uppercase tracking-wider">{menuCategoryLabel(subcategory)}</p>
                                                        </div>
                                                        {subcategory.children.map((child, childIndex) => (
                                                            <React.Fragment key={child.id}>
                                                                {childIndex > 0 && (
                                                                    <div className="h-px bg-cyan-400/15 -ml-3"></div>
                                                                )}
                                                                <Link
                                                                    to={collectionCategoryPath(
                                                                        category.slug,
                                                                        subcategory.slug,
                                                                        child.slug
                                                                    )}
                                                                    onClick={() => setIsMobileOpen(false)}
                                                                    className="block px-4 py-2 rounded-lg text-sm bg-blue-950/70 hover:bg-gradient-to-r hover:from-cyan-500/15 hover:to-blue-900/40 hover:text-cyan-100 transition-all duration-200 flex items-center gap-2"
                                                                >
                                                                    <span className="w-1 h-1 rounded-full bg-cyan-400/50"></span>
                                                                    <span>{menuCategoryLabel(child)}</span>
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
                        <div className="pb-2">
                            <p className="text-xs font-semibold text-cyan-400/80 uppercase tracking-wider mb-2 px-1">
                                {t('navbar.menuLanguage', 'Shop menu (EN / IT)')}
                            </p>
                            <div className="flex justify-center gap-2">
                                <div className="flex rounded-md border border-cyan-400/45 overflow-hidden">
                                    <button
                                        type="button"
                                        onClick={() => i18n.changeLanguage('en')}
                                        className={`px-3 py-1.5 text-xs font-bold uppercase ${
                                            (i18n.resolvedLanguage || i18n.language || '').split('-')[0] === 'en'
                                                ? 'bg-cyan-400 text-blue-950'
                                                : 'text-white/90 hover:bg-blue-900/50'
                                        }`}
                                    >
                                        EN
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => i18n.changeLanguage('it')}
                                        className={`px-3 py-1.5 text-xs font-bold uppercase ${
                                            (i18n.resolvedLanguage || i18n.language || '').split('-')[0] === 'it'
                                                ? 'bg-cyan-400 text-blue-950'
                                                : 'text-white/90 hover:bg-blue-900/50'
                                        }`}
                                    >
                                        IT
                                    </button>
                                </div>
                            </div>
                        </div>
                        {/* Language Switcher - Prominent in mobile menu */}
                        <div className="pb-2">
                            <p className="text-xs font-semibold text-cyan-400/80 uppercase tracking-wider mb-2 px-1">{t('common.language') || 'Language'}</p>
                            <div className="flex justify-center">
                                <LanguageSwitcher variant="navbar" />
                            </div>
                        </div>
                        {user?.role === 'customer' ? (
                            <Link
                                to="/account"
                                onClick={() => setIsMobileOpen(false)}
                                className="w-full rounded-full border border-cyan-400 bg-blue-950/60 hover:bg-blue-900/70 px-5 py-2.5 text-sm font-semibold text-white transition-all duration-200 cursor-pointer text-center block"
                            >
                                {t('nav.account', 'Account')}
                            </Link>
                        ) : (
                            <Link
                                to="/login"
                                onClick={() => {
                                    setIsMobileOpen(false)
                                }}
                                className="w-full rounded-full border border-cyan-400 bg-blue-950/60 hover:bg-blue-900/70 px-5 py-2.5 text-sm font-semibold text-white transition-all duration-200 cursor-pointer text-center block"
                            >
                                {t('navbar.login')}
                            </Link>
                        )}
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
