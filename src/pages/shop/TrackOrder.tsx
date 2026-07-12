import React, { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import { trackOrderByNumber, type TrackedOrder } from '../../services/ordersService'

const STATUS_STEPS = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'] as const

const TrackOrder: React.FC = () => {
    const { t } = useTranslation()
    const [searchParams] = useSearchParams()
    const [orderNumber, setOrderNumber] = useState('')
    const [email, setEmail] = useState('')
    const [order, setOrder] = useState<TrackedOrder | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [searched, setSearched] = useState(false)

    useEffect(() => {
        const qOrder = searchParams.get('order') || searchParams.get('order_number') || ''
        const qEmail = searchParams.get('email') || ''
        if (qOrder) setOrderNumber(qOrder)
        if (qEmail) setEmail(qEmail)
    }, [searchParams])

    const formatCurrency = (value: number | string | undefined): string => {
        if (value === undefined || value === null) return '€0.00'
        const num = typeof value === 'number' ? value : Number(value) || 0
        return `€${num.toFixed(2)}`
    }

    const getStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'pending':
                return 'bg-yellow-100 text-yellow-800'
            case 'confirmed':
            case 'processing':
                return 'bg-blue-100 text-blue-800'
            case 'shipped':
                return 'bg-purple-100 text-purple-800'
            case 'delivered':
                return 'bg-green-100 text-green-800'
            case 'cancelled':
            case 'refunded':
                return 'bg-red-100 text-red-800'
            default:
                return 'bg-gray-100 text-gray-800'
        }
    }

    const statusIndex = (status: string) => {
        const s = status?.toLowerCase()
        if (s === 'cancelled' || s === 'refunded') return -1
        const idx = STATUS_STEPS.indexOf(s as (typeof STATUS_STEPS)[number])
        if (idx >= 0) return idx
        if (s === 'completed') return STATUS_STEPS.indexOf('delivered')
        return 0
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setOrder(null)
        setSearched(true)

        const trimmedOrder = orderNumber.trim()
        const trimmedEmail = email.trim()

        if (!trimmedOrder) {
            setError(t('trackOrder.orderNumberRequired', 'Please enter your order number.'))
            return
        }
        if (!trimmedEmail) {
            setError(t('trackOrder.emailRequired', 'Please enter the email used at checkout.'))
            return
        }

        try {
            setLoading(true)
            const result = await trackOrderByNumber(trimmedOrder, trimmedEmail)
            if (result?.order) {
                setOrder(result.order)
            } else {
                setError(
                    t(
                        'trackOrder.notFound',
                        'Order not found. Please check your order number and email.'
                    )
                )
            }
        } catch (err: unknown) {
            const message =
                (err as { response?: { data?: { message?: string } }; message?: string })?.response
                    ?.data?.message ||
                (err as Error)?.message ||
                t('trackOrder.notFound', 'Order not found. Please check your order number and email.')
            setError(message)
        } finally {
            setLoading(false)
        }
    }

    const currentStep = order ? statusIndex(order.status) : -1
    const isTerminalBad =
        order?.status?.toLowerCase() === 'cancelled' || order?.status?.toLowerCase() === 'refunded'

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            <section className="pt-24 pb-16 px-4 sm:px-6">
                <div className="mx-auto max-w-3xl">
                    <div className="mb-8 text-center">
                        <h1 className="text-3xl font-bold text-gray-900 md:text-4xl">
                            {t('trackOrder.title', 'Track your order')}
                        </h1>
                        <p className="mt-2 text-gray-600">
                            {t(
                                'trackOrder.subtitle',
                                'Enter the order number from your confirmation email and the email you used at checkout.'
                            )}
                        </p>
                    </div>

                    <form
                        onSubmit={handleSubmit}
                        className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:p-8"
                    >
                        <div className="space-y-4">
                            <div>
                                <label
                                    htmlFor="order_number"
                                    className="mb-1.5 block text-sm font-semibold text-gray-700"
                                >
                                    {t('orders.orderNumber', 'Order Number')}{' '}
                                    <span className="text-red-500">*</span>
                                </label>
                                <input
                                    id="order_number"
                                    type="text"
                                    value={orderNumber}
                                    onChange={(e) => setOrderNumber(e.target.value)}
                                    placeholder="ORD-XXXXXXXX"
                                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                    autoComplete="off"
                                />
                            </div>
                            <div>
                                <label
                                    htmlFor="track_email"
                                    className="mb-1.5 block text-sm font-semibold text-gray-700"
                                >
                                    {t('trackOrder.checkoutEmail', 'Email used at checkout')}{' '}
                                    <span className="text-red-500">*</span>
                                </label>
                                <input
                                    id="track_email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                    autoComplete="email"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="mt-6 w-full rounded-lg bg-blue-950 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {loading
                                ? t('trackOrder.searching', 'Looking up your order…')
                                : t('trackOrder.trackButton', 'Track order')}
                        </button>
                    </form>

                    {searched && !loading && order && (
                        <div className="mt-8 space-y-6">
                            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                                <div className="flex flex-wrap items-start justify-between gap-4">
                                    <div>
                                        <p className="text-sm text-gray-500">
                                            {t('orders.orderNumber', 'Order Number')}
                                        </p>
                                        <p className="text-xl font-bold text-gray-900">{order.order_number}</p>
                                        <p className="mt-1 text-sm text-gray-600">
                                            {t('orders.orderDate', 'Order Date')}:{' '}
                                            {new Date(order.created_at).toLocaleString()}
                                        </p>
                                    </div>
                                    <span
                                        className={`rounded-full px-3 py-1 text-sm font-semibold capitalize ${getStatusColor(order.status)}`}
                                    >
                                        {t(`orders.${order.status.toLowerCase()}`, {
                                            defaultValue: order.status,
                                        })}
                                    </span>
                                </div>

                                {!isTerminalBad && currentStep >= 0 && (
                                    <div className="mt-8">
                                        <p className="mb-4 text-sm font-semibold text-gray-700">
                                            {t('trackOrder.progress', 'Order progress')}
                                        </p>
                                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                            {STATUS_STEPS.map((step, index) => {
                                                const done = index <= currentStep
                                                const active = index === currentStep
                                                return (
                                                    <div
                                                        key={step}
                                                        className="flex flex-1 items-center gap-2 sm:flex-col sm:text-center"
                                                    >
                                                        <div
                                                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                                                                done
                                                                    ? 'bg-blue-950 text-white'
                                                                    : 'bg-gray-200 text-gray-500'
                                                            } ${active ? 'ring-2 ring-blue-300 ring-offset-2' : ''}`}
                                                        >
                                                            {done ? '✓' : index + 1}
                                                        </div>
                                                        <span
                                                            className={`text-xs font-medium capitalize ${
                                                                done ? 'text-gray-900' : 'text-gray-400'
                                                            }`}
                                                        >
                                                            {t(`orders.${step}`, { defaultValue: step })}
                                                        </span>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                )}

                                {order.shipped_at && (
                                    <p className="mt-4 text-sm text-gray-600">
                                        {t('trackOrder.shippedOn', 'Shipped on')}:{' '}
                                        {new Date(order.shipped_at).toLocaleString()}
                                    </p>
                                )}
                                {order.delivered_at && (
                                    <p className="mt-1 text-sm text-gray-600">
                                        {t('trackOrder.deliveredOn', 'Delivered on')}:{' '}
                                        {new Date(order.delivered_at).toLocaleString()}
                                    </p>
                                )}
                            </div>

                            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                                <h2 className="mb-4 text-lg font-semibold text-gray-900">
                                    {t('orders.orderItems', 'Order Items')}
                                </h2>
                                <ul className="divide-y divide-gray-100">
                                    {order.items.map((item) => (
                                        <li
                                            key={item.id}
                                            className="flex justify-between gap-4 py-4 first:pt-0 last:pb-0"
                                        >
                                            <div>
                                                <p className="font-medium text-gray-900">
                                                    {item.product_name}
                                                </p>
                                                {item.product_sku && (
                                                    <p className="text-xs text-gray-500">
                                                        {t('orders.sku', 'SKU')}: {item.product_sku}
                                                    </p>
                                                )}
                                                <p className="text-sm text-gray-600">
                                                    {t('common.quantity', 'Quantity')}: {item.quantity}
                                                </p>
                                            </div>
                                            <p className="shrink-0 font-semibold text-gray-900">
                                                {formatCurrency(item.total_price)}
                                            </p>
                                        </li>
                                    ))}
                                </ul>
                                <div className="mt-4 border-t border-gray-200 pt-4 text-right">
                                    <p className="text-lg font-bold text-blue-950">
                                        {t('orders.total', 'Total')}: {formatCurrency(order.total)}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        {t('orders.paymentStatus', 'Payment Status')}:{' '}
                                        <span className="capitalize">{order.payment_status}</span>
                                    </p>
                                </div>
                            </div>

                            {order.shipping_address && (
                                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                                    <h2 className="mb-2 text-lg font-semibold text-gray-900">
                                        {t('orders.shippingAddress', 'Shipping Address')}
                                    </h2>
                                    <p className="text-gray-700">
                                        {order.shipping_address.first_name}{' '}
                                        {order.shipping_address.last_name}
                                        <br />
                                        {order.shipping_address.city}, {order.shipping_address.zip_code}
                                        <br />
                                        {order.shipping_address.country}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    <p className="mt-8 text-center text-sm text-gray-500">
                        {t('trackOrder.needHelp', 'Need help?')}{' '}
                        <Link to="/contact" className="font-medium text-blue-600 hover:text-blue-800">
                            {t('footer.contact', 'Contact')}
                        </Link>
                    </p>
                </div>
            </section>

            <Footer />
        </div>
    )
}

export default TrackOrder
