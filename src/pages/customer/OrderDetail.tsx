import React, { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getOrderById } from '../../services/ordersService'
import type { Order } from '../../services/ordersService'

interface ContactLensDetails {
  right_eye?: {
    qty: number
    base_curve: number | string
    diameter: number | string
    power: number | string
    cylinder?: number | string
    axis?: number | string
  }
  left_eye?: {
    qty: number
    base_curve: number | string
    diameter: number | string
    power: number | string
    cylinder?: number | string
    axis?: number | string
  }
  astigmatism?: {
    right_cylinder?: number | string
    right_axis?: number | string
    left_cylinder?: number | string
    left_axis?: number | string
  }
  form_type?: 'spherical' | 'astigmatism'
  unit?: string
}

interface OrderItem {
  id: number
  product_id: number
  product_name?: string
  product_slug?: string
  quantity: number
  price: number
  subtotal: number
  lens_index?: number | string
  lens_coating?: string
  prescription_id?: number | null
  frame_size_id?: number | null
  customization?: any
  // Contact lens fields (legacy - for backward compatibility)
  contact_lens_right_qty?: number
  contact_lens_right_base_curve?: number
  contact_lens_right_diameter?: number
  contact_lens_right_power?: number | string
  contact_lens_left_qty?: number
  contact_lens_left_base_curve?: number
  contact_lens_left_diameter?: number
  contact_lens_left_power?: number | string
  // New formatted contact_lens_details field from API
  contact_lens_details?: ContactLensDetails
}

interface OrderDetailData {
  id: number
  order_number: string
  user_id: number
  status: string
  payment_status: string
  payment_method: string
  subtotal: number | string
  tax?: number | string
  shipping: number | string
  discount?: number | string
  total: number | string
  shipping_address: any
  billing_address: any
  created_at: string
  updated_at: string
  items?: OrderItem[]
  notes?: string | null
  shipped_at?: string | null
  delivered_at?: string | null
}

const OrderDetail: React.FC = () => {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [order, setOrder] = useState<OrderDetailData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (id) {
      fetchOrderDetail()
    }
  }, [id])

  const fetchOrderDetail = async () => {
    try {
      setLoading(true)
      setError(null)
      const orderData = await getOrderById(id!)
      
      if (orderData) {
        // API returns order with items already included
        setOrder(orderData as OrderDetailData)
      } else {
        setError('Order not found')
      }
    } catch (err: any) {
      console.error('Error fetching order:', err)
      setError(err.message || 'Failed to load order details')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: number | string | undefined): string => {
    if (value === undefined || value === null) return '$0.00'
    const numValue = typeof value === 'number' ? value : Number(value) || 0
    return `$${numValue.toFixed(2)}`
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'processing':
        return 'bg-blue-100 text-blue-800'
      case 'shipped':
        return 'bg-purple-100 text-purple-800'
      case 'completed':
      case 'delivered':
        return 'bg-green-100 text-green-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      case 'refunded':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div>
        <div className="mb-6">
          <button
            onClick={() => navigate('/customer/orders')}
            className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {t('orders.backToOrders')}
          </button>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-red-800 mb-2">{t('common.error')}</h2>
          <p className="text-red-600">{error || t('orders.notFound', { defaultValue: 'Order not found' })}</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Back Button */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/customer/orders')}
          className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {t('orders.backToOrders')}
        </button>
      </div>

      {/* Order Header */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('orders.orderDetails')} #{order.id}</h1>
            <p className="text-gray-600">{t('orders.orderNumber')}: {order.order_number}</p>
          </div>
          <div className="flex flex-col md:items-end gap-2 mt-4 md:mt-0">
            <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(order.status)}`}>
              {t(`orders.${order.status.toLowerCase()}`, { defaultValue: order.status })}
            </span>
            {order.payment_status && (
              <span className={`px-3 py-1 text-sm font-medium rounded-full ${getPaymentStatusColor(order.payment_status)}`}>
                {t('orders.paymentStatus')}: {t(`orders.${order.payment_status.toLowerCase()}`, { defaultValue: order.payment_status })}
              </span>
            )}
          </div>
        </div>
        <div className="border-t border-gray-200 pt-4">
          <p className="text-sm text-gray-600">
            <span className="font-medium">{t('orders.orderDate')}:</span>{' '}
            {new Date(order.created_at).toLocaleString()}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Items */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('orders.orderItems')}</h2>
            {order.items && order.items.length > 0 ? (
              <div className="space-y-4">
                {order.items.map((item: any, index: number) => (
                  <div key={item.id || index} className="border-b border-gray-200 pb-4 last:border-b-0 last:pb-0">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">
                          {item.product_name || item.product?.name || `Product #${item.product_id}`}
                        </h3>
                        {item.product_sku && (
                          <p className="text-sm text-gray-500 mt-1">SKU: {item.product_sku}</p>
                        )}
                        <div className="mt-2 text-sm text-gray-600 space-y-1">
                          <p>{t('common.quantity')}: {item.quantity}</p>
                          <p>{t('orders.unitPrice')}: {formatCurrency(item.unit_price)}</p>
                          {item.lens_index && <p>Lens Index: {item.lens_index}</p>}
                          {item.lens_coatings && (
                            <p>Lens Coatings: {Array.isArray(item.lens_coatings) ? item.lens_coatings.join(', ') : item.lens_coatings}</p>
                          )}
                          {item.frame_size_id && <p>Frame Size ID: {item.frame_size_id}</p>}
                          
                          {/* Contact Lens Details - Priority: contact_lens_details > legacy fields > customization */}
                          {(item.contact_lens_details || item.contact_lens_right_qty || item.contact_lens_left_qty || item.customization?.contactLens) && (
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <p className="font-semibold text-gray-700 mb-2">Contact Lens Specifications:</p>
                              {(() => {
                                // Priority 1: Use contact_lens_details from API (new formatted structure)
                                if (item.contact_lens_details) {
                                  const details = item.contact_lens_details
                                  const unit = details.unit || 'unit'
                                  const formType = details.form_type || 'spherical'
                                  const isAstigmatism = formType === 'astigmatism' || !!details.astigmatism
                                  
                                  return (
                                    <div className="space-y-2 text-xs">
                                      {details.right_eye && (
                                        <div>
                                          <span className="font-semibold text-blue-600">Right Eye:</span>
                                          <span className="ml-2">
                                            Qty: {details.right_eye.qty || 0} {unit} | 
                                            B.C: {details.right_eye.base_curve || 'N/A'} | 
                                            DIA: {details.right_eye.diameter || 'N/A'} | 
                                            PWR: {details.right_eye.power || 'N/A'}
                                            {isAstigmatism && (details.right_eye.cylinder || details.astigmatism?.right_cylinder) && (
                                              <> | CYL: {details.right_eye.cylinder || details.astigmatism?.right_cylinder}</>
                                            )}
                                            {isAstigmatism && (details.right_eye.axis || details.astigmatism?.right_axis) && (
                                              <> | AXI: {details.right_eye.axis || details.astigmatism?.right_axis}°</>
                                            )}
                                          </span>
                                        </div>
                                      )}
                                      {details.left_eye && (
                                        <div>
                                          <span className="font-semibold text-purple-600">Left Eye:</span>
                                          <span className="ml-2">
                                            Qty: {details.left_eye.qty || 0} {unit} | 
                                            B.C: {details.left_eye.base_curve || 'N/A'} | 
                                            DIA: {details.left_eye.diameter || 'N/A'} | 
                                            PWR: {details.left_eye.power || 'N/A'}
                                            {isAstigmatism && (details.left_eye.cylinder || details.astigmatism?.left_cylinder) && (
                                              <> | CYL: {details.left_eye.cylinder || details.astigmatism?.left_cylinder}</>
                                            )}
                                            {isAstigmatism && (details.left_eye.axis || details.astigmatism?.left_axis) && (
                                              <> | AXI: {details.left_eye.axis || details.astigmatism?.left_axis}°</>
                                            )}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  )
                                }
                                
                                // Priority 2: Check if data comes from API response (contact_lens_* fields)
                                if (item.contact_lens_right_qty || item.contact_lens_left_qty) {
                                  const isAstigmatism = item.customization && typeof item.customization === 'object' && 
                                    (item.customization.left_cylinder || item.customization.right_cylinder)
                                  
                                  return (
                                    <div className="space-y-2 text-xs">
                                      <div>
                                        <span className="font-semibold text-blue-600">Right Eye:</span>
                                        <span className="ml-2">
                                          Qty: {item.contact_lens_right_qty || 0} | 
                                          B.C: {item.contact_lens_right_base_curve || 'N/A'} | 
                                          DIA: {item.contact_lens_right_diameter || 'N/A'} | 
                                          PWR: {item.contact_lens_right_power || 'N/A'}
                                          {isAstigmatism && item.customization?.right_cylinder && (
                                            <> | CYL: {item.customization.right_cylinder}</>
                                          )}
                                          {isAstigmatism && item.customization?.right_axis && (
                                            <> | AXI: {item.customization.right_axis}°</>
                                          )}
                                        </span>
                                      </div>
                                      <div>
                                        <span className="font-semibold text-purple-600">Left Eye:</span>
                                        <span className="ml-2">
                                          Qty: {item.contact_lens_left_qty || 0} | 
                                          B.C: {item.contact_lens_left_base_curve || 'N/A'} | 
                                          DIA: {item.contact_lens_left_diameter || 'N/A'} | 
                                          PWR: {item.contact_lens_left_power || 'N/A'}
                                          {isAstigmatism && item.customization?.left_cylinder && (
                                            <> | CYL: {item.customization.left_cylinder}</>
                                          )}
                                          {isAstigmatism && item.customization?.left_axis && (
                                            <> | AXI: {item.customization.left_axis}°</>
                                          )}
                                        </span>
                                      </div>
                                    </div>
                                  )
                                }
                                
                                // Priority 3: Check if data comes from local cart (customization.contactLens)
                                if (item.customization?.contactLens) {
                                  const custom = item.customization.contactLens
                                  const unit = custom.unit || 'unit'
                                  const formType = custom.formType || 'spherical'
                                  const isAstigmatism = formType === 'astigmatism'
                                  
                                  return (
                                    <div className="space-y-2 text-xs">
                                      {custom.right && (
                                        <div>
                                          <span className="font-semibold text-blue-600">Right Eye:</span>
                                          <span className="ml-2">
                                            Qty: {custom.right.qty || 0} {unit} | 
                                            B.C: {custom.right.baseCurve || 'N/A'} | 
                                            DIA: {custom.right.diameter || 'N/A'} | 
                                            PWR: {custom.right.power || 'N/A'}
                                            {isAstigmatism && custom.right.cylinder && (
                                              <> | CYL: {custom.right.cylinder}</>
                                            )}
                                            {isAstigmatism && custom.right.axis && (
                                              <> | AXI: {custom.right.axis}°</>
                                            )}
                                          </span>
                                        </div>
                                      )}
                                      {custom.left && (
                                        <div>
                                          <span className="font-semibold text-purple-600">Left Eye:</span>
                                          <span className="ml-2">
                                            Qty: {custom.left.qty || 0} {unit} | 
                                            B.C: {custom.left.baseCurve || 'N/A'} | 
                                            DIA: {custom.left.diameter || 'N/A'} | 
                                            PWR: {custom.left.power || 'N/A'}
                                            {isAstigmatism && custom.left.cylinder && (
                                              <> | CYL: {custom.left.cylinder}</>
                                            )}
                                            {isAstigmatism && custom.left.axis && (
                                              <> | AXI: {custom.left.axis}°</>
                                            )}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  )
                                }
                                
                                return null
                              })()}
                            </div>
                          )}
                          
                          {/* Other customizations */}
                          {item.customization && !item.customization.contactLens && !item.contact_lens_right_qty && (
                            <p className="text-xs text-gray-500">Customization: {JSON.stringify(item.customization)}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">
                          {formatCurrency(item.total_price)}
                        </p>
                        {item.product?.slug && (
                          <Link
                            to={`/shop/product/${item.product.slug}`}
                            className="text-blue-600 hover:text-blue-800 text-sm mt-2 inline-block"
                          >
                            {t('shop.viewDetails')}
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">{t('orders.noItems', { defaultValue: 'No items found for this order.' })}</p>
            )}
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('orders.orderSummary')}</h2>
            <div className="space-y-3">
              <div className="flex justify-between text-gray-600">
                <span>{t('common.subtotal')}:</span>
                <span className="font-medium">{formatCurrency(order.subtotal)}</span>
              </div>
              {order.tax && Number(order.tax) > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>{t('common.tax')}:</span>
                  <span className="font-medium">{formatCurrency(order.tax)}</span>
                </div>
              )}
              {order.discount && Number(order.discount) > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>{t('common.discount')}:</span>
                  <span className="font-medium">-{formatCurrency(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-600">
                <span>{t('common.shipping')}:</span>
                <span className="font-medium">{formatCurrency(order.shipping)}</span>
              </div>
              <div className="border-t border-gray-200 pt-3 mt-3">
                <div className="flex justify-between text-lg font-bold text-gray-900">
                  <span>{t('common.total')}:</span>
                  <span>{formatCurrency(order.total)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          {order.shipping_address && (
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 mt-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('orders.shippingAddress')}</h2>
              <div className="text-gray-600 space-y-1">
                {typeof order.shipping_address === 'object' ? (
                  <>
                    <p className="font-medium">{order.shipping_address.first_name} {order.shipping_address.last_name}</p>
                    <p>{order.shipping_address.address}</p>
                    <p>{order.shipping_address.city}, {order.shipping_address.zip_code}</p>
                    <p>{order.shipping_address.country}</p>
                    <p className="mt-2">Phone: {order.shipping_address.phone}</p>
                    <p>Email: {order.shipping_address.email}</p>
                  </>
                ) : (
                  <p className="text-gray-500">Address information not available</p>
                )}
              </div>
            </div>
          )}

          {/* Billing Address */}
          {order.billing_address && (
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 mt-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('orders.billingAddress')}</h2>
              <div className="text-gray-600 space-y-1">
                {typeof order.billing_address === 'object' ? (
                  <>
                    <p className="font-medium">{order.billing_address.first_name} {order.billing_address.last_name}</p>
                    <p>{order.billing_address.address}</p>
                    <p>{order.billing_address.city}, {order.billing_address.zip_code}</p>
                    <p>{order.billing_address.country}</p>
                    <p className="mt-2">Phone: {order.billing_address.phone}</p>
                    <p>Email: {order.billing_address.email}</p>
                  </>
                ) : (
                  <p className="text-gray-500">Address information not available</p>
                )}
              </div>
            </div>
          )}

          {/* Payment Method */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 mt-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('orders.paymentInformation')}</h2>
            <div className="text-gray-600 space-y-2">
              <p><span className="font-medium">{t('orders.method')}:</span> <span className="capitalize">{order.payment_method || 'N/A'}</span></p>
              <p><span className="font-medium">{t('orders.status')}:</span> <span className="capitalize">{t(`orders.${order.payment_status?.toLowerCase()}`, { defaultValue: order.payment_status || 'N/A' })}</span></p>
            </div>
          </div>

          {/* Order Notes */}
          {order.notes && (
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 mt-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('orders.orderNotes')}</h2>
              <p className="text-gray-600">{order.notes}</p>
            </div>
          )}

          {/* Shipping Dates */}
          {(order.shipped_at || order.delivered_at) && (
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 mt-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('orders.shippingInformation')}</h2>
              <div className="text-gray-600 space-y-2">
                {order.shipped_at && (
                  <p><span className="font-medium">{t('orders.shipped')}:</span> {new Date(order.shipped_at).toLocaleString()}</p>
                )}
                {order.delivered_at && (
                  <p><span className="font-medium">{t('orders.delivered')}:</span> {new Date(order.delivered_at).toLocaleString()}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default OrderDetail

