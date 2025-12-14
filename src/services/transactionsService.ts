/**
 * Transactions Service
 * Handles transaction fetching for customers
 */

import { apiClient } from '../utils/api';
import { API_ROUTES } from '../config/apiRoutes';

// ============================================
// Type Definitions
// ============================================

export interface Transaction {
  id: number;
  transaction_number?: string; // Unique transaction ID (e.g., TXN-1703123456789-1234)
  order_id: number;
  user_id: number;
  type: 'payment' | 'refund' | 'partial_refund' | 'chargeback' | 'reversal';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'refunded';
  payment_method: 'stripe' | 'paypal' | 'cod' | string;
  amount: number | string; // Can be number or string (Prisma Decimal)
  currency: string;
  gateway_transaction_id?: string | null;
  gateway_response?: any;
  gateway_fee?: number | string | null;
  net_amount?: number | string | null; // Calculated: amount - gateway_fee
  description?: string | null;
  metadata?: any;
  processed_at?: string | null; // Timestamp when transaction was processed
  created_at: string;
  updated_at: string;
  order?: {
    id: number;
    order_number: string;
    total: number | string;
    status: string;
    payment_status?: string; // Order payment status (paid, pending, refunded, etc.)
  };
}

export interface TransactionListResponse {
  transactions: Transaction[];
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}

/**
 * Get all transactions for the current user
 * @param params - Optional query parameters (page, limit, status, type, orderId)
 */
export const getTransactions = async (
  params?: {
    page?: number;
    limit?: number;
    status?: string;
    type?: string;
    orderId?: number | string;
  }
): Promise<Transaction[]> => {
  try {
    // Build query string
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.type) queryParams.append('type', params.type);
    if (params?.orderId) queryParams.append('orderId', params.orderId.toString());

    const queryString = queryParams.toString();
    const url = queryString ? `${API_ROUTES.TRANSACTIONS.LIST}?${queryString}` : API_ROUTES.TRANSACTIONS.LIST;

    const response = await apiClient.get<TransactionListResponse | Transaction[]>(
      url,
      true // Requires authentication (USER endpoint)
    );

    if (response.success && response.data) {
      // Handle both array response and wrapped response
      if (Array.isArray(response.data)) {
        return response.data;
      }
      // If backend returns { transactions: [...] }, extract it
      if (response.data && typeof response.data === 'object' && 'transactions' in response.data) {
        return (response.data as TransactionListResponse).transactions || [];
      }
      return [];
    }

    return [];
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return [];
  }
};

/**
 * Get a specific transaction by ID
 * @param transactionId - Transaction ID
 */
export const getTransactionById = async (transactionId: number | string): Promise<Transaction | null> => {
  try {
    const response = await apiClient.get<Transaction>(
      API_ROUTES.TRANSACTIONS.BY_ID(transactionId),
      true // Requires authentication (USER endpoint)
    );

    if (response.success && response.data) {
      // API returns { data: { transaction: {...} } } or { data: {...} }
      const transactionData = (response.data as any).transaction || response.data;
      return transactionData;
    }

    return null;
  } catch (error) {
    console.error('Error fetching transaction:', error);
    return null;
  }
};

