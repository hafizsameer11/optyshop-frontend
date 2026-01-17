import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { apiClient } from '../../utils/api'
import { API_ROUTES } from '../../config/apiRoutes'
import { useAuth } from '../../context/AuthContext'

interface DashboardStats {
  totalOrders: number
  pendingOrders: number
  completedOrders: number
  totalPrescriptions: number
  cartItems: number
}

interface RecentOrder {
  id: number
  order_number: string
  status: string
  total_amount: number
  created_at: string
}

interface RecentPrescription {
  id: number
  prescription_type: string
  created_at: string
  status: string
}

const Dashboard: React.FC = () => {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    totalPrescriptions: 0,
    cartItems: 0
  })
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([])
  const [recentPrescriptions, setRecentPrescriptions] = useState<RecentPrescription[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError('')
      
      // Fetch orders
      const ordersResponse = await apiClient.get(API_ROUTES.ORDERS.LIST, true)
      const orders = ordersResponse.success && ordersResponse.data ? (ordersResponse.data as any).orders || [] : []
      
      // Fetch prescriptions
      const prescriptionsResponse = await apiClient.get(API_ROUTES.PRESCRIPTIONS.LIST, true)
      const prescriptions = prescriptionsResponse.success && prescriptionsResponse.data ? (prescriptionsResponse.data as any).prescriptions || [] : []
      
      // Fetch cart
      const cartResponse = await apiClient.get(API_ROUTES.CART.GET, true)
      const cartItems = cartResponse.success && cartResponse.data ? (cartResponse.data as any).items || [] : []

      setStats({
        totalOrders: orders.length,
        pendingOrders: orders.filter((o: any) => o.status === 'pending' || o.status === 'processing').length,
        completedOrders: orders.filter((o: any) => o.status === 'completed' || o.status === 'delivered').length,
        totalPrescriptions: prescriptions.length,
        cartItems: cartItems.length
      })

      // Get recent orders (last 5)
      const sortedOrders = orders
        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5)
      setRecentOrders(sortedOrders)

      // Get recent prescriptions (last 3)
      const sortedPrescriptions = prescriptions
        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 3)
      setRecentPrescriptions(sortedPrescriptions)

    } catch (error: any) {
      console.error('Error fetching dashboard data:', error)
      setError(error.message || 'Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-950"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <svg className="w-12 h-12 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 className="text-lg font-semibold text-red-800 mb-2">{t('dashboard.errorTitle')}</h3>
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={fetchDashboardData}
          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
        >
          {t('dashboard.retry')}
        </button>
      </div>
    )
  }

  const statCards = [
    {
      title: t('dashboard.totalOrders'),
      value: stats.totalOrders,
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      ),
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600'
    },
    {
      title: t('dashboard.pendingOrders'),
      value: stats.pendingOrders,
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'bg-yellow-500',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-600'
    },
    {
      title: t('dashboard.completedOrders'),
      value: stats.completedOrders,
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600'
    },
    {
      title: t('dashboard.totalPrescriptions'),
      value: stats.totalPrescriptions,
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600'
    },
    {
      title: t('dashboard.cartItems'),
      value: stats.cartItems,
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      color: 'bg-orange-500',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-600'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-950 to-blue-900 rounded-2xl p-6 lg:p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold mb-2">
              {t('dashboard.welcomeBack')}, {user?.first_name}!
            </h1>
            <p className="text-blue-100 text-base lg:text-lg">
              {t('dashboard.welcomeMessage')}
            </p>
          </div>
          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="bg-white/20 hover:bg-white/30 text-white p-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title={t('dashboard.refresh')}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 lg:gap-6">
        {statCards.map((card, index) => (
          <div
            key={index}
            className="bg-white rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-200 overflow-hidden group"
          >
            <div className="p-4 lg:p-6">
              <div className="flex items-center justify-between mb-3 lg:mb-4">
                <div className={`${card.bgColor} ${card.textColor} p-2 lg:p-3 rounded-lg group-hover:scale-110 transition-transform duration-200`}>
                  {card.icon}
                </div>
              </div>
              <p className="text-gray-600 text-xs lg:text-sm font-medium mb-1 lg:mb-2">{card.title}</p>
              <p className="text-xl lg:text-3xl font-bold text-gray-900">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-4 lg:p-6">
        <h2 className="text-lg lg:text-xl font-bold text-gray-900 mb-4 lg:mb-6">{t('dashboard.quickActions')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
          <Link
            to="/customer/cart"
            className="flex items-center gap-3 p-3 lg:p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors group"
          >
            <div className="bg-blue-500 text-white p-2 rounded-lg group-hover:scale-110 transition-transform">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm lg:text-base">{t('dashboard.viewCart')}</p>
              <p className="text-xs lg:text-sm text-gray-600">{stats.cartItems} {t('dashboard.items')}</p>
            </div>
          </Link>

          <Link
            to="/customer/prescriptions"
            className="flex items-center gap-3 p-3 lg:p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors group"
          >
            <div className="bg-purple-500 text-white p-2 rounded-lg group-hover:scale-110 transition-transform">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm lg:text-base">{t('dashboard.managePrescriptions')}</p>
              <p className="text-xs lg:text-sm text-gray-600">{stats.totalPrescriptions} {t('dashboard.prescriptions')}</p>
            </div>
          </Link>

          <Link
            to="/shop"
            className="flex items-center gap-3 p-3 lg:p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors group sm:col-span-2 lg:col-span-1"
          >
            <div className="bg-green-500 text-white p-2 rounded-lg group-hover:scale-110 transition-transform">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm lg:text-base">{t('dashboard.continueShopping')}</p>
              <p className="text-xs lg:text-sm text-gray-600">{t('dashboard.browseProducts')}</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-4 lg:p-6">
          <div className="flex items-center justify-between mb-4 lg:mb-6">
            <h2 className="text-lg lg:text-xl font-bold text-gray-900">{t('dashboard.recentOrders')}</h2>
            <Link
              to="/customer/orders"
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              {t('dashboard.viewAll')}
            </Link>
          </div>
          {recentOrders.length > 0 ? (
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div>
                    <p className="font-semibold text-gray-900">#{order.order_number}</p>
                    <p className="text-sm text-gray-600">{new Date(order.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">${order.total_amount}</p>
                    <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                      order.status === 'completed' || order.status === 'delivered' 
                        ? 'bg-green-100 text-green-800'
                        : order.status === 'pending' || order.status === 'processing'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <p className="text-gray-600">{t('dashboard.noRecentOrders')}</p>
              <Link
                to="/shop"
                className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {t('dashboard.startShopping')}
              </Link>
            </div>
          )}
        </div>

        {/* Recent Prescriptions */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-4 lg:p-6">
          <div className="flex items-center justify-between mb-4 lg:mb-6">
            <h2 className="text-lg lg:text-xl font-bold text-gray-900">{t('dashboard.recentPrescriptions')}</h2>
            <Link
              to="/customer/prescriptions"
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              {t('dashboard.viewAll')}
            </Link>
          </div>
          {recentPrescriptions.length > 0 ? (
            <div className="space-y-4">
              {recentPrescriptions.map((prescription) => (
                <div key={prescription.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div>
                    <p className="font-semibold text-gray-900">{prescription.prescription_type}</p>
                    <p className="text-sm text-gray-600">{new Date(prescription.created_at).toLocaleDateString()}</p>
                  </div>
                  <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                    prescription.status === 'verified' 
                      ? 'bg-green-100 text-green-800'
                      : prescription.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {prescription.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-600">{t('dashboard.noRecentPrescriptions')}</p>
              <Link
                to="/customer/prescriptions"
                className="inline-block mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                {t('dashboard.addPrescription')}
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Dashboard

