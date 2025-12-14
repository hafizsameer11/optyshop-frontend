import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { apiClient } from '../../utils/api'
import { API_ROUTES } from '../../config/apiRoutes'

interface DashboardStats {
  totalOrders: number
  pendingOrders: number
  completedOrders: number
  totalPrescriptions: number
  cartItems: number
}

const Dashboard: React.FC = () => {
  const { t } = useTranslation()
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    totalPrescriptions: 0,
    cartItems: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
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
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
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
      color: 'bg-blue-500'
    },
    {
      title: t('dashboard.pendingOrders'),
      value: stats.pendingOrders,
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'bg-yellow-500'
    },
    {
      title: t('dashboard.completedOrders'),
      value: stats.completedOrders,
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'bg-green-500'
    },
    {
      title: t('dashboard.totalPrescriptions'),
      value: stats.totalPrescriptions,
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      color: 'bg-purple-500'
    },
    {
      title: t('dashboard.cartItems'),
      value: stats.cartItems,
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      color: 'bg-orange-500'
    }
  ]

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">{t('dashboard.title')}</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {statCards.map((card, index) => (
          <div
            key={index}
            className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium mb-2">{card.title}</p>
                <p className="text-3xl font-bold text-gray-900">{card.value}</p>
              </div>
              <div className={`${card.color} text-white p-3 rounded-lg`}>
                {card.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('dashboard.welcomeMessage')}</h2>
        <p className="text-gray-600">
          {t('dashboard.description')}
        </p>
      </div>
    </div>
  )
}

export default Dashboard

