import React, { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import { getFlashOfferWithProducts } from '../../services/flashOffersService'
import type { FlashOffer } from '../../services/flashOffersService'
import type { Product } from '../../services/productsService'
import { getProductImageUrl } from '../../utils/productImage'
import { getProductDisplayName } from '../../utils/productDisplayName'
import {
    computeFlashAdjustedPrice,
    flashDiscountBadgeLabel,
    normalizeFlashDiscountType,
} from '../../utils/flashOfferDisplay'

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

function formatEndDate(endsAt: string, lang: string | undefined): string {
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

const FlashOfferLanding: React.FC = () => {
    const { id } = useParams<{ id: string }>()
    const { t, i18n } = useTranslation()
    const [offer, setOffer] = useState<FlashOffer | null>(null)
    const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)
    const [notFound, setNotFound] = useState(false)

    const freeShipLabel = t('shop.flashFreeShipping', 'Free shipping')

    useEffect(() => {
        let cancelled = false
        const run = async () => {
            if (!id) {
                setNotFound(true)
                setLoading(false)
                return
            }
            setLoading(true)
            setNotFound(false)
            const res = await getFlashOfferWithProducts(id)
            if (cancelled) return
            if (!res) {
                setNotFound(true)
                setOffer(null)
                setProducts([])
            } else {
                setOffer(res.offer)
                setProducts(res.products)
            }
            setLoading(false)
        }
        void run()
        return () => {
            cancelled = true
        }
    }, [id])

    const offerInTimeWindow = (o: FlashOffer) => {
        const now = Date.now()
        return (
            o.is_active &&
            new Date(o.starts_at).getTime() <= now &&
            new Date(o.ends_at).getTime() >= now
        )
    }

    const showFlashPricing =
        offer &&
        offer.is_expired !== true &&
        (offer.is_currently_active === true ||
            (offer.is_currently_active === undefined && offerInTimeWindow(offer)))

    const discountBadge =
        !loading && offer && !notFound ? flashDiscountBadgeLabel(offer, freeShipLabel) : null

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900">
            <Navbar />
            <div className="mx-auto w-[92%] max-w-6xl px-4 py-10">
                {loading ? (
                    <div className="py-20 text-center text-slate-600">{t('common.loading', 'Loading…')}</div>
                ) : notFound ? (
                    <div className="rounded-2xl bg-white p-10 text-center shadow">
                        <h1 className="text-2xl font-semibold text-slate-900">
                            {t('shop.flashOfferNotFound', 'This flash offer could not be found.')}
                        </h1>
                        <Link to="/shop/flash-offers" className="mt-6 inline-block font-medium text-blue-700 hover:underline">
                            {t('shop.backToFlashOffers', 'Back to flash offers')}
                        </Link>
                    </div>
                ) : offer ? (
                    <>
                        <div className="mb-8 overflow-hidden rounded-2xl bg-white shadow-md">
                            {offer.image_url && (
                                <div className="max-h-64 w-full overflow-hidden bg-slate-100 sm:max-h-80">
                                    <img
                                        src={offer.image_url}
                                        alt=""
                                        className="h-full w-full object-cover object-center"
                                    />
                                </div>
                            )}
                            <div className="p-6 sm:p-8">
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">{offer.title}</h1>
                                    {discountBadge && (
                                        <span className="shrink-0 rounded-md bg-red-600 px-2.5 py-1 text-sm font-bold text-white">
                                            {discountBadge}
                                        </span>
                                    )}
                                </div>
                                {offer.description && (
                                    <p className="mt-3 text-slate-600">{offer.description}</p>
                                )}
                                {formatEndDate(offer.ends_at, i18n.language) && (
                                    <p className="mt-4 text-sm font-medium text-slate-700">
                                        {offer.is_expired
                                            ? t('shop.flashOfferEndedOn', {
                                                  date: formatEndDate(offer.ends_at, i18n.language),
                                                  defaultValue: 'Ended on {{date}}',
                                              })
                                            : t('home.flashOffers.endsOn', {
                                                  date: formatEndDate(offer.ends_at, i18n.language),
                                              })}
                                    </p>
                                )}
                                {offer.is_expired && (
                                    <p className="mt-3 rounded-lg bg-amber-50 px-4 py-2 text-sm text-amber-900">
                                        {t(
                                            'shop.flashOfferExpiredBanner',
                                            'This promotion has ended. Product prices shown are regular catalog prices unless otherwise marked.'
                                        )}
                                    </p>
                                )}
                                {normalizeFlashDiscountType(offer.discount_type) === 'free_shipping' && showFlashPricing && (
                                    <p className="mt-2 text-sm text-emerald-800">{freeShipLabel}</p>
                                )}
                                <p className="mt-4 text-xs text-slate-500">
                                    {t(
                                        'shop.flashPriceDisclaimer',
                                        'Flash prices shown here are for reference only; your cart may show standard prices until checkout supports flash offers.'
                                    )}
                                </p>
                            </div>
                        </div>

                        <h2 className="mb-6 text-xl font-semibold text-slate-900">
                            {t('shop.flashOfferProducts', 'Products in this offer')}
                        </h2>
                        {products.length === 0 ? (
                            <p className="text-slate-600">{t('shop.noProductsInFlashOffer', 'No active products in this offer right now.')}</p>
                        ) : (
                            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                {products.map((product) => {
                                    const slug = product.slug || String(product.id)
                                    const name = getProductDisplayName(product) || product.name
                                    const img = getProductImageUrl(product)
                                    const base =
                                        product.sale_price != null &&
                                        Number(product.sale_price) > 0 &&
                                        Number(product.sale_price) < Number(product.price)
                                            ? Number(product.sale_price)
                                            : Number(product.price)
                                    const flash =
                                        showFlashPricing && offer
                                            ? computeFlashAdjustedPrice(base, offer)
                                            : null

                                    return (
                                        <li key={product.id}>
                                            <Link
                                                to={`/shop/product/${slug}`}
                                                className="block overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
                                            >
                                                <div className="aspect-[4/3] bg-slate-100 p-3">
                                                    <img src={img} alt="" className="h-full w-full object-contain" />
                                                </div>
                                                <div className="space-y-2 p-4">
                                                    <h3 className="line-clamp-2 font-semibold text-slate-900">{name}</h3>
                                                    {flash ? (
                                                        <div className="flex flex-wrap items-baseline gap-2">
                                                            <span className="text-lg font-bold text-blue-900">
                                                                €{flash.sale.toFixed(2)}
                                                            </span>
                                                            <span className="text-sm text-slate-400 line-through">
                                                                €{flash.compare.toFixed(2)}
                                                            </span>
                                                            <span className="text-xs font-medium text-red-600">
                                                                {t('shop.flashPriceLabel', 'Flash')}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <p className="text-lg font-bold text-blue-900">€{base.toFixed(2)}</p>
                                                    )}
                                                </div>
                                            </Link>
                                        </li>
                                    )
                                })}
                            </ul>
                        )}
                    </>
                ) : null}
            </div>
            <Footer />
        </div>
    )
}

export default FlashOfferLanding
