import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getTransactions, getTransactionById } from '../../services/transactionsService'
import type { Transaction } from '../../services/transactionsService'

const Transactions: React.FC = () => {
  const { t } = useTranslation()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')

  useEffect(() => {
    fetchTransactions()
  }, [statusFilter, typeFilter])

  const fetchTransactions = async () => {
    try {
      setLoading(true)
      const params: any = {}
      if (statusFilter !== 'all') params.status = statusFilter
      if (typeFilter !== 'all') params.type = typeFilter
      
      const data = await getTransactions(params)
      setTransactions(data)
    } catch (error) {
      console.error('Error fetching transactions:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredTransactions = transactions.filter(transaction =>
    transaction.id.toString().includes(searchTerm) ||
    transaction.transaction_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transaction.gateway_transaction_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transaction.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transaction.order?.order_number?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusColor = (status: string) => {
    if (!status) return 'bg-gray-100 text-gray-800'
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
    if (!type) return 'bg-gray-100 text-gray-800'
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

  const formatCurrency = (value: number | string | undefined, currency: string = 'USD'): string => {
    if (value === undefined || value === null) return `$0.00`
    const numValue = typeof value === 'number' ? value : Number(value) || 0
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(numValue)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">{t('transactions.title', { defaultValue: 'Transactions' })}</h1>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6 border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder={t('transactions.searchTransactions', { defaultValue: 'Search transactions...' })}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">{t('transactions.allStatus', { defaultValue: 'All Status' })}</option>
            <option value="pending">{t('transactions.pending', { defaultValue: 'Pending' })}</option>
            <option value="processing">{t('transactions.processing', { defaultValue: 'Processing' })}</option>
            <option value="completed">{t('transactions.completed', { defaultValue: 'Completed' })}</option>
            <option value="failed">{t('transactions.failed', { defaultValue: 'Failed' })}</option>
            <option value="cancelled">{t('transactions.cancelled', { defaultValue: 'Cancelled' })}</option>
            <option value="refunded">{t('transactions.refunded', { defaultValue: 'Refunded' })}</option>
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">{t('transactions.allTypes', { defaultValue: 'All Types' })}</option>
            <option value="payment">{t('transactions.payment', { defaultValue: 'Payment' })}</option>
            <option value="refund">{t('transactions.refund', { defaultValue: 'Refund' })}</option>
            <option value="partial_refund">{t('transactions.partialRefund', { defaultValue: 'Partial Refund' })}</option>
            <option value="chargeback">{t('transactions.chargeback', { defaultValue: 'Chargeback' })}</option>
            <option value="reversal">{t('transactions.reversal', { defaultValue: 'Reversal' })}</option>
          </select>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">{t('transactions.noTransactions', { defaultValue: 'No transactions found' })}</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('transactions.transactionId', { defaultValue: 'Transaction ID' })}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('transactions.order', { defaultValue: 'Order' })}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('transactions.type', { defaultValue: 'Type' })}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('transactions.amount', { defaultValue: 'Amount' })}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('transactions.status', { defaultValue: 'Status' })}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('transactions.paymentMethod', { defaultValue: 'Payment Method' })}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('transactions.date', { defaultValue: 'Date' })}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('transactions.actions', { defaultValue: 'Actions' })}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredTransactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        #{transaction.id}
                        {transaction.transaction_number && (
                          <div className="text-xs text-gray-500 mt-1 font-mono">
                            {transaction.transaction_number}
                          </div>
                        )}
                        {transaction.gateway_transaction_id && (
                          <div className="text-xs text-gray-400 mt-1 font-mono">
                            {transaction.gateway_transaction_id}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {transaction.order ? (
                          <Link
                            to={`/customer/orders/${transaction.order_id}`}
                            className="text-blue-600 hover:text-blue-800 font-medium"
                          >
                            {transaction.order.order_number || `#${transaction.order_id}`}
                          </Link>
                        ) : (
                          <span className="text-gray-500">#{transaction.order_id}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(transaction.type)}`}>
                          {t(`transactions.${(transaction.type || '').toLowerCase()}`, { defaultValue: transaction.type || 'N/A' })}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(transaction.amount, transaction.currency)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(transaction.status)}`}>
                          {t(`transactions.${transaction.status.toLowerCase()}`, { defaultValue: transaction.status })}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                        {transaction.payment_method}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(transaction.created_at).toLocaleDateString()}
                        <div className="text-xs text-gray-500">
                          {new Date(transaction.created_at).toLocaleTimeString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <Link
                          to={`/customer/transactions/${transaction.id}`}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          {t('transactions.viewDetails', { defaultValue: 'View Details' })}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default Transactions

