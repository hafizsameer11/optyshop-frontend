import React, { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getTransactionById } from '../../services/transactionsService'
import type { Transaction } from '../../services/transactionsService'

const TransactionDetail: React.FC = () => {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [transaction, setTransaction] = useState<Transaction | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) {
      fetchTransaction()
    }
  }, [id])

  const fetchTransaction = async () => {
    try {
      setLoading(true)
      const data = await getTransactionById(id!)
      setTransaction(data)
    } catch (error) {
      console.error('Error fetching transaction:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: number | string | undefined, currency: string = 'USD'): string => {
    if (value === undefined || value === null) return `$0.00`
    const numValue = typeof value === 'number' ? value : Number(value) || 0
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(numValue)
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'processing':
        return 'bg-blue-100 text-blue-800'
      case 'failed':
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      case 'refunded':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'payment':
        return 'bg-blue-100 text-blue-800'
      case 'refund':
      case 'partial_refund':
        return 'bg-orange-100 text-orange-800'
      case 'chargeback':
      case 'reversal':
        return 'bg-red-100 text-red-800'
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

  if (!transaction) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg mb-4">{t('transactions.transactionNotFound', { defaultValue: 'Transaction not found' })}</p>
        <Link
          to="/customer/transactions"
          className="text-blue-600 hover:text-blue-800 font-medium"
        >
          {t('transactions.backToTransactions', { defaultValue: 'Back to Transactions' })}
        </Link>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <button
            onClick={() => navigate(-1)}
            className="text-gray-600 hover:text-gray-800 mb-2 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {t('common.back', { defaultValue: 'Back' })}
          </button>
          <h1 className="text-3xl font-bold text-gray-900">
            {t('transactions.transactionDetails', { defaultValue: 'Transaction Details' })} #{transaction.id}
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Transaction Info */}
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {t('transactions.transactionInformation', { defaultValue: 'Transaction Information' })}
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">{t('transactions.transactionId', { defaultValue: 'Transaction ID' })}</span>
                <span className="font-medium text-gray-900">#{transaction.id}</span>
              </div>
              {transaction.transaction_number && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">{t('transactions.transactionNumber', { defaultValue: 'Transaction Number' })}</span>
                  <span className="font-medium text-gray-900 font-mono text-sm">{transaction.transaction_number}</span>
                </div>
              )}
              {transaction.gateway_transaction_id && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">{t('transactions.gatewayTransactionId', { defaultValue: 'Gateway Transaction ID' })}</span>
                  <span className="font-medium text-gray-900 font-mono text-sm">{transaction.gateway_transaction_id}</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-gray-600">{t('transactions.type', { defaultValue: 'Type' })}</span>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(transaction.type)}`}>
                  {t(`transactions.${transaction.type.toLowerCase()}`, { defaultValue: transaction.type })}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">{t('transactions.status', { defaultValue: 'Status' })}</span>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(transaction.status)}`}>
                  {t(`transactions.${transaction.status.toLowerCase()}`, { defaultValue: transaction.status })}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">{t('transactions.amount', { defaultValue: 'Amount' })}</span>
                <span className="font-bold text-lg text-gray-900">
                  {formatCurrency(transaction.amount, transaction.currency)}
                </span>
              </div>
              {transaction.gateway_fee && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">{t('transactions.gatewayFee', { defaultValue: 'Gateway Fee' })}</span>
                  <span className="font-medium text-gray-900">
                    {formatCurrency(transaction.gateway_fee, transaction.currency)}
                  </span>
                </div>
              )}
              {transaction.net_amount && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">{t('transactions.netAmount', { defaultValue: 'Net Amount' })}</span>
                  <span className="font-medium text-gray-900">
                    {formatCurrency(transaction.net_amount, transaction.currency)}
                    <span className="text-xs text-gray-500 ml-2">
                      ({t('transactions.afterFees', { defaultValue: 'after fees' })})
                    </span>
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-gray-600">{t('transactions.paymentMethod', { defaultValue: 'Payment Method' })}</span>
                <span className="font-medium text-gray-900 capitalize">{transaction.payment_method}</span>
              </div>
              {transaction.description && (
                <div className="flex justify-between items-start">
                  <span className="text-gray-600">{t('transactions.description', { defaultValue: 'Description' })}</span>
                  <span className="font-medium text-gray-900 text-right max-w-md">{transaction.description}</span>
                </div>
              )}
            </div>
          </div>

          {/* Order Info */}
          {transaction.order && (
            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                {t('transactions.relatedOrder', { defaultValue: 'Related Order' })}
              </h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">{t('transactions.orderNumber', { defaultValue: 'Order Number' })}</span>
                  <Link
                    to={`/customer/orders/${transaction.order_id}`}
                    className="font-medium text-blue-600 hover:text-blue-800"
                  >
                    {transaction.order.order_number || `#${transaction.order_id}`}
                  </Link>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">{t('transactions.orderTotal', { defaultValue: 'Order Total' })}</span>
                  <span className="font-medium text-gray-900">
                    {formatCurrency(transaction.order.total, transaction.currency)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">{t('transactions.orderStatus', { defaultValue: 'Order Status' })}</span>
                  <span className="font-medium text-gray-900 capitalize">{transaction.order.status}</span>
                </div>
                {transaction.order.payment_status && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">{t('transactions.orderPaymentStatus', { defaultValue: 'Order Payment Status' })}</span>
                    <span className="font-medium text-gray-900 capitalize">{transaction.order.payment_status}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Gateway Response */}
          {transaction.gateway_response && (
            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                {t('transactions.gatewayResponse', { defaultValue: 'Gateway Response' })}
              </h2>
              <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto text-sm">
                {JSON.stringify(transaction.gateway_response, null, 2)}
              </pre>
            </div>
          )}

          {/* Metadata */}
          {transaction.metadata && (
            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                {t('transactions.metadata', { defaultValue: 'Metadata' })}
              </h2>
              <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto text-sm">
                {JSON.stringify(transaction.metadata, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Timestamps */}
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {t('transactions.timestamps', { defaultValue: 'Timestamps' })}
            </h2>
            <div className="space-y-4">
              <div>
                <span className="text-gray-600 text-sm">{t('transactions.createdAt', { defaultValue: 'Created At' })}</span>
                <div className="font-medium text-gray-900 mt-1">
                  {new Date(transaction.created_at).toLocaleString()}
                </div>
              </div>
              <div>
                <span className="text-gray-600 text-sm">{t('transactions.updatedAt', { defaultValue: 'Updated At' })}</span>
                <div className="font-medium text-gray-900 mt-1">
                  {new Date(transaction.updated_at).toLocaleString()}
                </div>
              </div>
              {transaction.processed_at && (
                <div>
                  <span className="text-gray-600 text-sm">{t('transactions.processedAt', { defaultValue: 'Processed At' })}</span>
                  <div className="font-medium text-gray-900 mt-1">
                    {new Date(transaction.processed_at).toLocaleString()}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {t('transactions.actions', { defaultValue: 'Actions' })}
            </h2>
            <div className="space-y-2">
              {transaction.order && (
                <Link
                  to={`/customer/orders/${transaction.order_id}`}
                  className="block w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-center"
                >
                  {t('transactions.viewOrder', { defaultValue: 'View Order' })}
                </Link>
              )}
              <Link
                to="/customer/transactions"
                className="block w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors text-center"
              >
                {t('transactions.backToTransactions', { defaultValue: 'Back to Transactions' })}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TransactionDetail

