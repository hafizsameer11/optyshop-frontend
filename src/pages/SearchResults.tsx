import React, { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { searchAll, type SearchResult } from '../services/searchService'
import { useTranslation } from 'react-i18next'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

const SearchResults: React.FC = () => {
    const [searchParams] = useSearchParams()
    const { t } = useTranslation()
    const query = searchParams.get('q') || ''
    const [results, setResults] = useState<SearchResult[]>([])
    const [loading, setLoading] = useState(false)
    const [stats, setStats] = useState({
        total: 0,
        products: 0,
        categories: 0,
        subcategories: 0,
        sub_subcategories: 0
    })

    useEffect(() => {
        const performSearch = async () => {
            if (!query || query.trim().length < 2) {
                setResults([])
                setStats({
                    total: 0,
                    products: 0,
                    categories: 0,
                    subcategories: 0,
                    sub_subcategories: 0
                })
                return
            }

            setLoading(true)
            try {
                const searchData = await searchAll(query.trim(), 50)
                if (searchData) {
                    setResults(searchData.results)
                    setStats({
                        total: searchData.total,
                        products: searchData.products,
                        categories: searchData.categories,
                        subcategories: searchData.subcategories,
                        sub_subcategories: searchData.sub_subcategories
                    })
                } else {
                    setResults([])
                    setStats({
                        total: 0,
                        products: 0,
                        categories: 0,
                        subcategories: 0,
                        sub_subcategories: 0
                    })
                }
            } catch (error) {
                console.error('Search error:', error)
                setResults([])
            } finally {
                setLoading(false)
            }
        }

        performSearch()
    }, [query])

    const groupedResults = {
        products: results.filter(r => r.type === 'product'),
        categories: results.filter(r => r.type === 'category'),
        subcategories: results.filter(r => r.type === 'subcategory'),
        sub_subcategories: results.filter(r => r.type === 'sub_subcategory')
    }

    return (
        <>
            <Navbar />
            <div className="min-h-screen bg-white text-gray-900 pt-24 pb-12 px-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                        {t('search.results') || 'Search Results'}
                    </h1>
                    {query && (
                        <p className="text-gray-600">
                            {loading ? (
                                t('search.searching') || 'Searching...'
                            ) : stats.total > 0 ? (
                                <>
                                    {stats.total} {t('search.resultsFound') || 'results found'} for "<span className="text-blue-600 font-semibold">{query}</span>"
                                </>
                            ) : (
                                <>
                                    {t('search.noResults') || 'No results found'} for "<span className="text-blue-600 font-semibold">{query}</span>"
                                </>
                            )}
                        </p>
                    )}
                </div>

                {/* Stats */}
                {stats.total > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                        {stats.products > 0 && (
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                                <p className="text-2xl font-bold text-amber-600">{stats.products}</p>
                                <p className="text-sm text-amber-700">{t('search.products') || 'Products'}</p>
                            </div>
                        )}
                        {stats.categories > 0 && (
                            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                                <p className="text-2xl font-bold text-purple-600">{stats.categories}</p>
                                <p className="text-sm text-purple-700">{t('search.categories') || 'Categories'}</p>
                            </div>
                        )}
                        {stats.subcategories > 0 && (
                            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                                <p className="text-2xl font-bold text-indigo-600">{stats.subcategories}</p>
                                <p className="text-sm text-indigo-700">{t('search.subcategories') || 'Subcategories'}</p>
                            </div>
                        )}
                        {stats.sub_subcategories > 0 && (
                            <div className="bg-pink-50 border border-pink-200 rounded-lg p-4">
                                <p className="text-2xl font-bold text-pink-600">{stats.sub_subcategories}</p>
                                <p className="text-sm text-pink-700">{t('search.subSubcategories') || 'Sub-Subcategories'}</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Loading State */}
                {loading && (
                    <div className="flex justify-center items-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-400"></div>
                    </div>
                )}

                {/* Results */}
                {!loading && results.length > 0 && (
                    <div className="space-y-8">
                        {/* Products */}
                        {groupedResults.products.length > 0 && (
                            <section>
                                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <span className="w-1 h-8 bg-amber-400 rounded"></span>
                                    {t('search.products') || 'Products'} ({groupedResults.products.length})
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {groupedResults.products.map((result) => (
                                        <Link
                                            key={`product-${result.id}`}
                                            to={result.url}
                                            className="bg-white border border-gray-200 rounded-xl p-4 hover:bg-gray-50 hover:border-gray-300 transition-all group shadow-sm"
                                        >
                                            <div className="flex gap-4">
                                                {result.image && (
                                                    <img
                                                        src={result.image}
                                                        alt={result.name}
                                                        className="w-20 h-20 object-cover rounded-lg"
                                                    />
                                                )}
                                                <div className="flex-1">
                                                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors mb-1">
                                                        {result.name}
                                                    </h3>
                                                    {result.description && (
                                                        <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                                                            {result.description}
                                                        </p>
                                                    )}
                                                    {result.price && (
                                                        <p className="text-lg font-bold text-gray-900">
                                                            ${result.price}
                                                        </p>
                                                    )}
                                                    {result.category && (
                                                        <p className="text-xs text-gray-500 mt-1">
                                                            in {result.category.name}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Categories */}
                        {groupedResults.categories.length > 0 && (
                            <section>
                                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <span className="w-1 h-8 bg-indigo-400 rounded"></span>
                                    {t('search.categories') || 'Categories'} ({groupedResults.categories.length})
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {groupedResults.categories.map((result) => (
                                        <Link
                                            key={`category-${result.id}`}
                                            to={result.url}
                                            className="bg-white border border-gray-200 rounded-xl p-4 hover:bg-gray-50 hover:border-gray-300 transition-all group shadow-sm"
                                        >
                                            <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors mb-1">
                                                {result.name}
                                            </h3>
                                            {result.description && (
                                                <p className="text-sm text-gray-700 line-clamp-2">
                                                    {result.description}
                                                </p>
                                            )}
                                        </Link>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Subcategories */}
                        {groupedResults.subcategories.length > 0 && (
                            <section>
                                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <span className="w-1 h-8 bg-purple-400 rounded"></span>
                                    {t('search.subcategories') || 'Subcategories'} ({groupedResults.subcategories.length})
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {groupedResults.subcategories.map((result) => (
                                        <Link
                                            key={`subcategory-${result.id}`}
                                            to={result.url}
                                            className="bg-white border border-gray-200 rounded-xl p-4 hover:bg-gray-50 hover:border-gray-300 transition-all group shadow-sm"
                                        >
                                            <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors mb-1">
                                                {result.name}
                                            </h3>
                                            {result.description && (
                                                <p className="text-sm text-gray-700 line-clamp-2 mb-2">
                                                    {result.description}
                                                </p>
                                            )}
                                            {result.category && (
                                                <p className="text-xs text-gray-500">
                                                    in {result.category.name}
                                                </p>
                                            )}
                                        </Link>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Sub-Subcategories */}
                        {groupedResults.sub_subcategories.length > 0 && (
                            <section>
                                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <span className="w-1 h-8 bg-fuchsia-400 rounded"></span>
                                    {t('search.subSubcategories') || 'Sub-Subcategories'} ({groupedResults.sub_subcategories.length})
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {groupedResults.sub_subcategories.map((result) => (
                                        <Link
                                            key={`sub-subcategory-${result.id}`}
                                            to={result.url}
                                            className="bg-white border border-gray-200 rounded-xl p-4 hover:bg-gray-50 hover:border-gray-300 transition-all group shadow-sm"
                                        >
                                            <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors mb-1">
                                                {result.name}
                                            </h3>
                                            {result.description && (
                                                <p className="text-sm text-gray-700 line-clamp-2 mb-2">
                                                    {result.description}
                                                </p>
                                            )}
                                            {result.category && result.parent && (
                                                <p className="text-xs text-gray-500">
                                                    {result.parent.name} in {result.category.name}
                                                </p>
                                            )}
                                        </Link>
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>
                )}

                {/* No Results */}
                {!loading && results.length === 0 && query && (
                    <div className="text-center py-20">
                        <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <p className="text-xl text-gray-900 mb-2">{t('search.noResults') || 'No results found'}</p>
                        <p className="text-gray-600">{t('search.tryDifferent') || 'Try a different search term'}</p>
                    </div>
                )}
            </div>
        </div>
            <Footer />
        </>
    )
}

export default SearchResults

