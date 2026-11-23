import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

/** Visible home search — same destination as Navbar (`/search?q=`). */
const HomeSearchBar: React.FC = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  const submit = () => {
    const q = query.trim()
    if (q.length < 2) return
    navigate(`/search?q=${encodeURIComponent(q)}`)
  }

  return (
    <section className="w-full border-b border-slate-100 bg-slate-50/80">
      <div className="mx-auto flex max-w-screen-2xl items-center gap-3 px-4 py-4 sm:px-6 lg:px-8">
        <label htmlFor="home-search" className="sr-only">
          {t('navbar.search', 'Search')}
        </label>
        <div className="relative flex-1">
          <svg
            className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            id="home-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submit()
            }}
            placeholder={t('navbar.searchPlaceholder', 'Search glasses, brands, models…')}
            className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
          />
        </div>
        <button
          type="button"
          onClick={submit}
          className="shrink-0 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
        >
          {t('navbar.search', 'Search')}
        </button>
      </div>
    </section>
  )
}

export default HomeSearchBar
