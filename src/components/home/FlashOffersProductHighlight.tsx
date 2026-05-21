import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { FlashOffer } from '../../services/flashOffersService'
import { getFlashOffers } from '../../services/flashOffersService'
import type { Product } from '../../services/productsService'
import { getProductById } from '../../services/productsService'
import { getProductImageUrl } from '../../utils/productImage'
import { getProductDisplayName } from '../../utils/productDisplayName'
import { flashDiscountBadgeLabel, resolveFlashOfferCtaPath } from '../../utils/flashOfferDisplay'
import { prefetchFlashOfferShopIntent } from '../../utils/flashOfferShopIntentPrefetch'

const MAX_OFFERS = 3

type Row = { offer: FlashOffer; product: Product | null }

function resolveIntlLocale(lang: string | undefined): string {
    const base = (lang || 'it').split('-')[0].toLowerCase()
    const map: Record<string, string> = {
        en: 'en-GB',
        it: 'it-IT',
        de: 'de-DE',
        fr: 'fr-FR',
        es: 'es-ES',
        pt: 'pt-PT',
    }
    return map[base] || `${base}-${base.toUpperCase()}`
}

/** Human-readable end date/time in the active UI language (no HH:MM:SS countdown). */
function formatOfferEndDate(endsAt: string, lang: string | undefined): string {
    const d = new Date(endsAt)
    if (Number.isNaN(d.getTime())) return ''
    try {
        return new Intl.DateTimeFormat(resolveIntlLocale(lang), {
            weekday: 'short',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }).format(d)
    } catch {
        return d.toLocaleString()
    }
}

const FlashOffersProductHighlight: React.FC = () => {
    const { t, i18n } = useTranslation()
    const freeShipLabel = t('shop.flashFreeShipping', 'Free shipping')
    const [rows, setRows] = useState<Row[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let cancelled = false

        const run = async () => {
            try {
                const offers = await getFlashOffers(true)
                const now = Date.now()
                const valid = offers
                    .filter((o) => o.is_active && new Date(o.ends_at).getTime() > now)
                    .slice(0, MAX_OFFERS)

                if (valid.length === 0) {
                    if (!cancelled) {
                        setRows([])
                        setLoading(false)
                    }
                    return
                }

                const enriched: Row[] = await Promise.all(
                    valid.map(async (offer) => {
                        const pid = offer.product_ids?.[0]
                        if (!pid) {
                            return { offer, product: null }
                        }
                        const product = await getProductById(pid)
                        return { offer, product }
                    })
                )

                if (!cancelled) {
                    setRows(enriched)
                    setLoading(false)
                }
            } catch {
                if (!cancelled) {
                    setRows([])
                    setLoading(false)
                }
            }
        }

        void run()
        return () => {
            cancelled = true
        }
    }, [])

    useEffect(() => {
        if (loading || rows.length === 0) return

        const prefetchVisibleOffers = () => {
            for (const { offer, product } of rows) {
                const slug = product ? product.slug || String(product.id) : null
                const to = resolveFlashOfferCtaPath(offer, slug)
                prefetchFlashOfferShopIntent(offer.id, to)
            }
        }

        let idleHandle: number | undefined
        let timeoutHandle: number | undefined
        if (typeof requestIdleCallback !== 'undefined') {
            idleHandle = requestIdleCallback(prefetchVisibleOffers, { timeout: 2500 })
        } else {
            timeoutHandle = window.setTimeout(prefetchVisibleOffers, 1200)
        }
        return () => {
            if (idleHandle !== undefined) cancelIdleCallback(idleHandle)
            if (timeoutHandle !== undefined) window.clearTimeout(timeoutHandle)
        }
    }, [loading, rows])

    const visibleRows = rows.filter(({ offer }) => new Date(offer.ends_at).getTime() > Date.now())

    if (!loading && visibleRows.length === 0) {
        return null
    }

    const resolveTo = (offer: FlashOffer, product: Product | null): string => {
        const slug = product ? product.slug || String(product.id) : null
        return resolveFlashOfferCtaPath(offer, slug)
    }

    const cardImage = (offer: FlashOffer, product: Product | null) => {
        if (product) {
            return getProductImageUrl(product)
        }
        if (offer.image_url?.trim()) {
            return offer.image_url.trim()
        }
        return '/assets/images/frame1.png'
    }

    const cardTitle = (offer: FlashOffer, product: Product | null) => {
        if (product) {
            const n = getProductDisplayName(product)
            return n || product.name
        }
        return offer.title
    }

    const cardPrice = (product: Product | null) => {
        if (!product) return null
        const sale = product.sale_price
        const base = product.price
        if (typeof sale === 'number' && sale > 0 && sale < (base ?? Infinity)) {
            return { current: sale, compare: base }
        }
        if (typeof base === 'number') {
            return { current: base, compare: null as number | null }
        }
        return null
    }

    const ctaClassName =
        'mt-1 inline-flex w-full items-center justify-center rounded-xl bg-blue-900 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-800'

    const renderCta = (to: string, offerId: number) => {
        const external = /^https?:\/\//i.test(to)
        const intentPrefetch = () => prefetchFlashOfferShopIntent(offerId, to)
        if (external) {
            return (
                <a
                    href={to}
                    className={ctaClassName}
                    target="_blank"
                    rel="noopener noreferrer"
                    onPointerEnter={intentPrefetch}
                    onFocus={intentPrefetch}
                >
                    {t('home.flashOffers.shopNow')}
                </a>
            )
        }
        return (
            <Link
                to={to}
                className={ctaClassName}
                onPointerEnter={intentPrefetch}
                onFocus={intentPrefetch}
            >
                {t('home.flashOffers.shopNow')}
            </Link>
        )
    }

    return (
        <section className="bg-[#f8f3ed] px-4 py-10 sm:px-6 md:py-16">
            <div className="mx-auto w-full max-w-7xl space-y-4 text-center lg:w-[90%]">
                <p className="text-sm uppercase tracking-[0.4em] text-slate-500">{t('home.flashOffers.eyebrow')}</p>
                <h2 className="text-2xl md:text-3xl font-semibold text-slate-800 pb-4 md:pb-8">
                    {t('home.flashOffers.title')}{' '}
                    <span className="text-blue-700">{t('home.flashOffers.titleHighlight')}</span>
                </h2>
            </div>

            <div className="mx-auto mt-6 grid max-w-7xl grid-cols-1 gap-6 sm:mt-8 sm:grid-cols-2 sm:gap-8 md:grid-cols-3 lg:w-[90%]">
                {loading
                    ? Array.from({ length: MAX_OFFERS }).map((_, i) => (
                          <div
                              key={i}
                              className="relative overflow-hidden rounded-3xl bg-white shadow-[0_20px_45px_rgba(14,30,37,0.08)] animate-pulse"
                          >
                              <div className="aspect-[4/3] bg-slate-200" />
                              <div className="space-y-3 p-5">
                                  <div className="h-5 bg-slate-200 rounded w-3/4 mx-auto" />
                                  <div className="h-4 bg-slate-200 rounded w-1/2 mx-auto" />
                                  <div className="h-10 bg-slate-200 rounded-xl" />
                              </div>
                          </div>
                      ))
                    : visibleRows.map(({ offer, product }) => {
                          const to = resolveTo(offer, product)
                          const endDateLabel = formatOfferEndDate(offer.ends_at, i18n.language)
                          const price = cardPrice(product)
                          const disc = flashDiscountBadgeLabel(offer, freeShipLabel)

                          return (
                              <div
                                  key={offer.id}
                                  className="relative overflow-hidden rounded-3xl bg-white shadow-[0_20px_45px_rgba(14,30,37,0.08)] transition-shadow hover:shadow-[0_24px_50px_rgba(14,30,37,0.12)]"
                              >
                                  <div className="relative aspect-[4/3] bg-gray-100">
                                      <img
                                          src={cardImage(offer, product)}
                                          alt={cardTitle(offer, product)}
                                          className="h-full w-full object-contain p-3"
                                      />
                                      <span className="absolute left-3 top-3 rounded-full bg-gradient-to-r from-orange-500 to-pink-500 px-2.5 py-1 text-xs font-semibold text-white shadow-md">
                                          {t('home.flashOffers.badge')}
                                      </span>
                                      {disc && (
                                          <span className="absolute right-3 top-3 rounded-md bg-red-600 px-2 py-1 text-xs font-bold text-white">
                                              {disc}
                                          </span>
                                      )}
                                  </div>
                                  <div className="flex flex-col gap-2 p-5 text-center">
                                      <h3 className="line-clamp-2 min-h-[2.75rem] text-base font-semibold text-slate-900">
                                          {cardTitle(offer, product)}
                                      </h3>
                                      {offer.description && (
                                          <p className="line-clamp-2 text-sm text-slate-500">{offer.description}</p>
                                      )}
                                      {price && (
                                          <div className="flex flex-wrap items-center justify-center gap-2">
                                              <span className="text-lg font-bold text-blue-900">
                                                  €{Number(price.current).toFixed(2)}
                                              </span>
                                              {price.compare != null && (
                                                  <span className="text-sm text-slate-400 line-through">
                                                      €{Number(price.compare).toFixed(2)}
                                                  </span>
                                              )}
                                          </div>
                                      )}
                                      {endDateLabel && (
                                          <p className="text-sm font-bold tracking-tight text-slate-900">
                                              {t('home.flashOffers.endsOn', { date: endDateLabel })}
                                          </p>
                                      )}
                                      {renderCta(to, offer.id)}
                                  </div>
                              </div>
                          )
                      })}
            </div>
        </section>
    )
}

export default FlashOffersProductHighlight
