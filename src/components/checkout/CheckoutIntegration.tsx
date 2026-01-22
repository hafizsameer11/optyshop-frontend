import React, { useState, useEffect } from 'react';
import OrderSummary, { type OrderItem, type ShippingMethod, type Coupon } from './OrderSummary';
import ProgressiveVision from '../prescription/ProgressiveVision';
import { submitProgressiveForm, type ProgressiveFormData } from '../../services/progressiveVisionService';
import { apiClient } from '../../utils/api';
import { API_ROUTES } from '../../config/apiRoutes';

interface CheckoutIntegrationProps {
  productId?: string;
  lensTypeId?: string;
  basePrice?: number;
  className?: string;
}

interface CheckoutData {
  items: OrderItem[];
  progressiveData?: ProgressiveFormData;
  selectedShipping?: ShippingMethod;
  appliedCoupon?: Coupon;
}

const CheckoutIntegration: React.FC<CheckoutIntegrationProps> = ({
  productId,
  lensTypeId,
  basePrice = 66.98,
  className = ''
}) => {
  const [checkoutData, setCheckoutData] = useState<CheckoutData>({
    items: [],
    progressiveData: undefined,
    selectedShipping: undefined,
    appliedCoupon: undefined
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [orderComplete, setOrderComplete] = useState(false);

  // Initialize base items
  useEffect(() => {
    const baseItems: OrderItem[] = [
      {
        id: 'base-product',
        name: 'blacjo',
        price: basePrice,
        quantity: 1,
        type: 'product'
      },
      {
        id: 'standard-progressive',
        name: 'Standard Progressive',
        price: 100.00,
        quantity: 1,
        type: 'lens'
      }
    ];
    
    setCheckoutData(prev => ({
      ...prev,
      items: baseItems
    }));
  }, [basePrice]);

  // Handle progressive form data changes
  const handleProgressiveChange = (progressiveData: ProgressiveFormData) => {
    setCheckoutData(prev => ({
      ...prev,
      progressiveData
    }));
  };

  // Handle coupon application
  const handleCouponApply = (coupon: Coupon) => {
    setCheckoutData(prev => ({
      ...prev,
      appliedCoupon: coupon
    }));
  };

  // Handle shipping method change
  const handleShippingChange = (shippingMethod: ShippingMethod) => {
    // Update items to include shipping cost
    setCheckoutData(prev => {
      const filteredItems = prev.items.filter(item => item.type !== 'shipping');
      const shippingItem: OrderItem = {
        id: `shipping-${shippingMethod.id}`,
        name: shippingMethod.name,
        price: shippingMethod.price,
        quantity: 1,
        type: 'shipping'
      };
      
      return {
        ...prev,
        items: [...filteredItems, shippingItem],
        selectedShipping: shippingMethod
      };
    });
  };

  // Calculate total
  const calculateTotal = () => {
    const subtotal = checkoutData.items
      .filter(item => item.type !== 'discount')
      .reduce((total, item) => total + (item.price * item.quantity), 0);
    
    const discountAmount = checkoutData.appliedCoupon ? 
      (checkoutData.appliedCoupon.discount_type === 'percentage' 
        ? subtotal * (checkoutData.appliedCoupon.discount_value / 100)
        : checkoutData.appliedCoupon.discount_value) : 0;
    
    return subtotal - discountAmount;
  };

  // Validate form data
  const validateFormData = (): boolean => {
    if (!checkoutData.progressiveData) {
      setError('Please complete the Progressive Vision form');
      return false;
    }

    const { pd_first, pd_second, right_eye_sph, right_eye_cyl, right_eye_axis } = checkoutData.progressiveData;
    
    if (!pd_first || !pd_second) {
      setError('Please enter both PD values');
      return false;
    }

    if (!right_eye_sph || right_eye_sph === '--') {
      setError('Please enter SPH for right eye');
      return false;
    }

    if (!right_eye_cyl || right_eye_cyl === '--') {
      setError('Please enter CYL for right eye');
      return false;
    }

    if (!right_eye_axis || right_eye_axis === '--') {
      setError('Please enter AXIS for right eye');
      return false;
    }

    return true;
  };

  // Submit order
  const handleSubmitOrder = async () => {
    if (!validateFormData()) {
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Step 1: Submit progressive form
      if (checkoutData.progressiveData) {
        await submitProgressiveForm(checkoutData.progressiveData);
      }

      // Step 2: Create order
      const orderData = {
        items: checkoutData.items.filter(item => item.type !== 'shipping' && item.type !== 'discount'),
        shipping_method_id: checkoutData.selectedShipping?.id,
        coupon_code: checkoutData.appliedCoupon?.code,
        prescription_data: checkoutData.progressiveData,
        product_id: productId,
        lens_type_id: lensTypeId,
        total_amount: calculateTotal()
      };

      const orderResponse = await apiClient.post(API_ROUTES.ORDERS.CREATE, orderData);
      console.log('Order created:', orderResponse.data);

      // Step 3: Add to cart if needed
      if (productId) {
        const cartItem = {
          product_id: productId,
          quantity: 1,
          prescription_data: checkoutData.progressiveData,
          lens_type_id: lensTypeId,
          customizations: {
            progressive_vision: checkoutData.progressiveData
          }
        };

        await apiClient.post(API_ROUTES.CART.ADD_ITEM, cartItem);
      }

      setOrderComplete(true);
      
    } catch (err: any) {
      console.error('Order submission failed:', err);
      const errorMessage = err.response?.data?.message || 'Failed to submit order. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Reset form
  const handleReset = () => {
    setCheckoutData({
      items: [
        {
          id: 'base-product',
          name: 'blacjo',
          price: basePrice,
          quantity: 1,
          type: 'product'
        },
        {
          id: 'standard-progressive',
          name: 'Standard Progressive',
          price: 100.00,
          quantity: 1,
          type: 'lens'
        }
      ],
      progressiveData: undefined,
      selectedShipping: undefined,
      appliedCoupon: undefined
    });
    setOrderComplete(false);
    setError('');
  };

  if (orderComplete) {
    return (
      <div className={`max-w-4xl mx-auto ${className}`}>
        <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-green-900 mb-2">Order Complete!</h2>
          <p className="text-green-700 mb-6">
            Your progressive vision prescription has been submitted successfully.
          </p>
          <button
            onClick={handleReset}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            Start New Order
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`max-w-6xl mx-auto ${className}`}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Progressive Vision Form */}
        <div>
          <ProgressiveVision 
            onProgressiveChange={handleProgressiveChange}
          />
        </div>

        {/* Order Summary */}
        <div>
          <OrderSummary
            items={checkoutData.items}
            onCouponApply={handleCouponApply}
            onShippingChange={handleShippingChange}
          />

          {/* Submit Button */}
          <div className="mt-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <button
              onClick={handleSubmitOrder}
              disabled={loading || !checkoutData.progressiveData || !checkoutData.selectedShipping}
              className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 transition-colors font-medium flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Processing Order...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Complete Order
                </>
              )}
            </button>

            <div className="mt-4 text-center">
              <p className="text-sm text-gray-500">
                By completing this order, you confirm that your prescription information is accurate.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutIntegration;
