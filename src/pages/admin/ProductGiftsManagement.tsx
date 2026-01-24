import React, { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { useAuth } from '../../context/AuthContext';
import {
  adminGetProductGifts,
  adminCreateProductGift,
  adminUpdateProductGift,
  adminDeleteProductGift,
  type ProductGift
} from '../../services/productGiftsService';
import ProtectedRoute from '../../components/customer/ProtectedRoute';

const ProductGiftsManagement: React.FC = () => {
  const { user } = useAuth();
  const [productGifts, setProductGifts] = useState<ProductGift[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingGift, setEditingGift] = useState<ProductGift | null>(null);
  const [formData, setFormData] = useState({
    product_id: 0,
    gift_product_id: 0,
    min_quantity: 1,
    max_quantity: 0,
    is_active: true,
    description: ''
  });

  useEffect(() => {
    fetchProductGifts();
  }, []);

  const fetchProductGifts = async () => {
    try {
      const gifts = await adminGetProductGifts();
      setProductGifts(gifts);
    } catch (error) {
      console.error('Error fetching product gifts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingGift) {
        await adminUpdateProductGift(editingGift.id, formData);
      } else {
        await adminCreateProductGift(formData);
      }
      
      fetchProductGifts();
      resetForm();
    } catch (error) {
      console.error('Error saving product gift:', error);
    }
  };

  const handleEdit = (gift: ProductGift) => {
    setEditingGift(gift);
    setFormData({
      product_id: gift.product_id,
      gift_product_id: gift.gift_product_id,
      min_quantity: gift.min_quantity,
      max_quantity: gift.max_quantity || 0,
      is_active: gift.is_active,
      description: gift.description || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this product gift?')) {
      try {
        await adminDeleteProductGift(id);
        fetchProductGifts();
      } catch (error) {
        console.error('Error deleting product gift:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      product_id: 0,
      gift_product_id: 0,
      min_quantity: 1,
      max_quantity: 0,
      is_active: true,
      description: ''
    });
    setEditingGift(null);
    setShowForm(false);
  };

  if (!user || user.role !== 'admin') {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
            <p className="text-gray-600">You don't have permission to access this page.</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Product Gifts Management</h1>
              <p className="text-gray-600 mt-2">Manage free gift promotions for products</p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
            >
              Create New Gift Rule
            </button>
          </div>

          {showForm && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <h2 className="text-xl font-semibold mb-4">
                {editingGift ? 'Edit Product Gift' : 'Create New Product Gift'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Product ID *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={formData.product_id || ''}
                      onChange={(e) => setFormData({...formData, product_id: Number(e.target.value)})}
                      placeholder="Enter product ID"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Gift Product ID *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={formData.gift_product_id || ''}
                      onChange={(e) => setFormData({...formData, gift_product_id: Number(e.target.value)})}
                      placeholder="Enter gift product ID"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Minimum Quantity *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={formData.min_quantity}
                      onChange={(e) => setFormData({...formData, min_quantity: Number(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Maximum Quantity (0 for unlimited)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.max_quantity}
                      onChange={(e) => setFormData({...formData, max_quantity: Number(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows={3}
                    placeholder="Describe the gift promotion..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                    className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                  />
                  <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">
                    Active
                  </label>
                </div>

                <div className="flex gap-4">
                  <button
                    type="submit"
                    className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
                  >
                    {editingGift ? 'Update Gift Rule' : 'Create Gift Rule'}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
              <p className="mt-4 text-gray-600">Loading product gifts...</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Product ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Gift Product ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Quantity
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {productGifts.map((gift) => (
                      <tr key={gift.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          #{gift.product_id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          #{gift.gift_product_id}
                          {gift.gift_product && (
                            <div className="text-xs text-gray-500">{gift.gift_product.name}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          Min: {gift.min_quantity}
                          {gift.max_quantity > 0 && ` | Max: ${gift.max_quantity}`}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            gift.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {gift.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          <div className="max-w-xs truncate">{gift.description || '-'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleEdit(gift)}
                            className="text-indigo-600 hover:text-indigo-900 mr-4"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(gift.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {productGifts.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500">No product gift rules found.</p>
                </div>
              )}
            </div>
          )}
        </div>
        
        <Footer />
      </div>
    </ProtectedRoute>
  );
};

export default ProductGiftsManagement;
