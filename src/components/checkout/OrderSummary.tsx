import React, { useState, useEffect } from 'react';
import { apiClient } from '../../utils/api';
import { API_ROUTES } from '../../config/apiRoutes';

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  type: 'product' | 'lens' | 'shipping' | 'discount';
}

export interface ShippingMethod {
  id: string;
  name: string;
  price: number;
  description: string;
  delivery_days: number;
}

export interface Coupon {
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order_amount?: number;
}

interface OrderSummaryProps {
  items: OrderItem[];
  onCouponApply?: (coupon: Coupon) => void;
  onShippingChange?: (shippingMethod: ShippingMethod) => void;
  className?: string;
}

const OrderSummary: React.FC<OrderSummaryProps> = ({
  items,
  onCouponApply,
  onShippingChange,
  className = ''
}) => {
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const [selectedShipping, setSelectedShipping] = useState<ShippingMethod | null>(null);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);

  // Fetch shipping methods
  useEffect(() => {
    const fetchShippingMethods = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get(API_ROUTES.SHIPPING_METHODS.LIST);
        setShippingMethods(response.data);
        
        // Select default shipping method (usually the first one)
        if (response.data.length > 0) {
          const defaultShipping = response.data.find((method: ShippingMethod) => 
            method.name.toLowerCase().includes('standard') || method.name.toLowerCase().includes('gls')
          ) || response.data[0];
          setSelectedShipping(defaultShipping);
          onShippingChange?.(defaultShipping);
        }
      } catch (err) {
        console.error('Failed to fetch shipping methods:', err);
        setError('Failed to load shipping options');
      } finally {
        setLoading(false);
      }
    };

    fetchShippingMethods();
  }, [onShippingChange]);

  // Calculate subtotal (excluding shipping and discounts)
  const calculateSubtotal = () => {
    return items
      .filter(item => item.type !== 'shipping' && item.type !== 'discount')
      .reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  // Calculate total with shipping and discounts
  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const shippingCost = selectedShipping?.price || 0;
    const discountAmount = calculateDiscountAmount();
    
    return subtotal + shippingCost - discountAmount;
  };

  // Calculate discount amount
  const calculateDiscountAmount = () => {
    if (!appliedCoupon) return 0;
    
    const subtotal = calculateSubtotal();
    
    // Check minimum order amount
    if (appliedCoupon.min_order_amount && subtotal < appliedCoupon.min_order_amount) {
      return 0;
    }
    
    if (appliedCoupon.discount_type === 'percentage') {
      return subtotal * (appliedCoupon.discount_value / 100);
    } else {
      return appliedCoupon.discount_value;
    }
  };

  // Apply coupon
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setError('Please enter a coupon code');
      return;
    }

    try {
      setCouponLoading(true);
      setError('');
      
      const response = await apiClient.post(API_ROUTES.COUPONS.APPLY, {
        code: couponCode.trim(),
        order_amount: calculateSubtotal()
      });
      
      const coupon = response.data;
      setAppliedCoupon(coupon);
      onCouponApply?.(coupon);
      setCouponCode('');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Invalid coupon code';
      setError(errorMessage);
      setAppliedCoupon(null);
    } finally {
      setCouponLoading(false);
    }
  };

  // Remove coupon
  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setError('');
  };

  // Handle shipping method change
  const handleShippingChange = (method: ShippingMethod) => {
    setSelectedShipping(method);
    onShippingChange?.(method);
  };

  const subtotal = calculateSubtotal();
  const discountAmount = calculateDiscountAmount();
  const total = calculateTotal();

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>
      
      {/* Order Items */}
      <div className="space-y-3 mb-6 max-h-[400px] overflow-y-auto custom-scrollbar">
        {items
          .filter(item => item.type !== 'shipping' && item.type !== 'discount')
          .map((item) => (
            <div key={item.id} className="flex justify-between items-center">
              <div>
                <span className="text-gray-900 font-medium">{item.name}</span>
                {item.quantity > 1 && (
                  <span className="text-gray-500 text-sm ml-2">x{item.quantity}</span>
                )}
              </div>
              <span className="text-gray-900 font-medium">
                +${(item.price * item.quantity).toFixed(2)}
              </span>
            </div>
          ))}
      </div>

      {/* Subtotal */}
      <div className="border-t pt-4 mb-4">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">
            Subtotal ({items.filter(item => item.type !== 'shipping' && item.type !== 'discount').length} items)
          </span>
          <span className="text-gray-900 font-medium">${subtotal.toFixed(2)}</span>
        </div>
      </div>

      {/* Shipping Methods */}
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-3">Shipping</h3>
        {loading ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
          </div>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
            {shippingMethods.map((method) => (
              <label
                key={method.id}
                className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center">
                  <input
                    type="radio"
                    name="shipping"
                    value={method.id}
                    checked={selectedShipping?.id === method.id}
                    onChange={() => handleShippingChange(method)}
                    className="mr-3 text-purple-600 focus:ring-purple-500"
                  />
                  <div>
                    <div className="font-medium text-gray-900">{method.name}</div>
                    <div className="text-sm text-gray-500">
                      {method.description} ({method.delivery_days} business days)
                    </div>
                  </div>
                </div>
                <span className="font-medium text-gray-900">
                  {method.price === 0 ? 'FREE' : `$${method.price.toFixed(2)}`}
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Coupon Code */}
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-3">Coupon code</h3>
        {appliedCoupon ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex justify-between items-center">
              <div>
                <span className="font-medium text-green-900">{appliedCoupon.code}</span>
                <span className="text-green-700 text-sm ml-2">
                  {appliedCoupon.discount_type === 'percentage' 
                    ? `-${appliedCoupon.discount_value}%`
                    : `-$${appliedCoupon.discount_value.toFixed(2)}`
                  }
                </span>
              </div>
              <button
                onClick={handleRemoveCoupon}
                className="text-red-600 hover:text-red-700 text-sm font-medium"
              >
                Remove
              </button>
            </div>
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              type="text"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              placeholder="Enter coupon code"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <button
              onClick={handleApplyCoupon}
              disabled={couponLoading}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 transition-colors font-medium"
            >
              {couponLoading ? 'Applying...' : 'Apply'}
            </button>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* Total */}
      <div className="border-t pt-4">
        <div className="space-y-2">
          {selectedShipping && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">
                Shipping ({selectedShipping.name} - {selectedShipping.delivery_days} business days)
              </span>
              <span className="text-gray-900">
                {selectedShipping.price === 0 ? 'FREE' : `$${selectedShipping.price.toFixed(2)}`}
              </span>
            </div>
          )}
          
          {discountAmount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-green-600">Discount</span>
              <span className="text-green-600">-${discountAmount.toFixed(2)}</span>
            </div>
          )}
          
          <div className="flex justify-between items-center pt-2 border-t">
            <span className="text-lg font-bold text-gray-900">Estimate Total</span>
            <span className="text-lg font-bold text-gray-900">${total.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderSummary;
