import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import { useCart } from '../../context/CartContext'
import { 
    getProductBySlug, 
    getRelatedProducts,
    type Product
} from '../../services/productsService'
import { getProductImageUrl } from '../../utils/productImage'
import ProductCheckout from '../../components/shop/ProductCheckout'
import VirtualTryOnModal from '../../components/home/VirtualTryOnModal'

const ProductDetail: React.FC = () => {
    const { slug } = useParams<{ slug: string }>()
    const navigate = useNavigate()
    const { addToCart } = useCart()
    const [product, setProduct] = useState<Product | null>(null)
    const [relatedProducts, setRelatedProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedImageIndex, setSelectedImageIndex] = useState(0)
    const [quantity, setQuantity] = useState(1)
    const [showCheckout, setShowCheckout] = useState(false)
    const [showTryOn, setShowTryOn] = useState(false)

    useEffect(() => {
        const fetchProduct = async () => {
            if (!slug) return
            
            setLoading(true)
            const productData = await getProductBySlug(slug)
            
            if (productData) {
                // Reset selected image index when loading a new product
                setSelectedImageIndex(0)
                
                // Debug log product data and image info
                if (import.meta.env.DEV) {
                    const imageUrl = getProductImageUrl(productData, 0)
                    console.log('🔍 Product Detail Data:', {
                        id: productData.id,
                        name: productData.name,
                        price: productData.price,
                        priceType: typeof productData.price,
                        sale_price: productData.sale_price,
                        images: productData.images,
                        image: productData.image,
                        image_url: productData.image_url,
                        thumbnail: productData.thumbnail,
                        selectedImageUrl: imageUrl,
                        stock_status: (productData as any).stock_status,
                        stock_quantity: productData.stock_quantity,
                        in_stock: productData.in_stock,
                        fullProduct: productData
                    })
                }
                setProduct(productData)
                // Fetch related products
                const related = await getRelatedProducts(productData.id, 4)
                setRelatedProducts(related)
            } else {
                // Product not found, redirect to shop
                navigate('/shop')
            }
            setLoading(false)
        }

        fetchProduct()
    }, [slug, navigate])

    const handleAddToCart = () => {
        if (!product) return
        
        try {
            // Convert API product to cart-compatible format
            const salePrice = product.sale_price ? Number(product.sale_price) : null
            const regularPrice = product.price ? Number(product.price) : 0
            const finalPrice = salePrice && regularPrice && salePrice < regularPrice ? salePrice : regularPrice
            
            const cartProduct = {
                id: product.id || 0,
                name: product.name || '',
                brand: product.brand || '',
                category: product.category?.slug || 'eyeglasses',
                price: finalPrice,
                image: getProductImageUrl(product, selectedImageIndex), // Use the same image extraction logic, with selected image index
                description: product.description || '',
                inStock: product.in_stock || false,
                rating: product.rating ? Number(product.rating) : undefined
            }
            
            // Add quantity copies
            for (let i = 0; i < quantity; i++) {
                addToCart(cartProduct)
            }
        } catch (error) {
            console.error('Error adding to cart:', error)
        }
    }

    if (loading) {
        return (
            <div className="bg-white min-h-screen">
                <Navbar />
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-center">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-950 mb-4"></div>
                        <p className="text-lg text-gray-600">Loading product...</p>
                    </div>
                </div>
                <Footer />
            </div>
        )
    }

    if (!product) {
        return (
            <div className="bg-white min-h-screen">
                <Navbar />
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-center">
                        <h1 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h1>
                        <Link to="/shop" className="text-blue-600 hover:text-blue-700">
                            Return to Shop
                        </Link>
                    </div>
                </div>
                <Footer />
            </div>
        )
    }

    // Calculate prices safely, ensuring they're numbers
    // Handle price as string or number
    const p = product as any
    
    // Get raw price values - check multiple possible fields
    const rawPrice = product.price || p.price_value || p.regular_price || 0
    const rawSalePrice = product.sale_price || p.sale_price_value || p.discounted_price || null
    
    // Convert price to number - handle string, number, or undefined
    let priceValue = 0
    if (rawPrice != null && rawPrice !== undefined) {
        if (typeof rawPrice === 'string') {
            const parsed = parseFloat(rawPrice)
            priceValue = !isNaN(parsed) ? parsed : 0
        } else {
            priceValue = Number(rawPrice) || 0
        }
    }
    
    // Convert sale_price to number
    let salePriceValue: number | null = null
    if (rawSalePrice != null && rawSalePrice !== undefined) {
        if (typeof rawSalePrice === 'string') {
            const parsed = parseFloat(rawSalePrice)
            salePriceValue = !isNaN(parsed) ? parsed : null
        } else {
            salePriceValue = Number(rawSalePrice) || null
        }
    }
    
    const salePriceNum = salePriceValue != null && !isNaN(salePriceValue) && salePriceValue > 0 ? salePriceValue : null
    const regularPriceNum = !isNaN(priceValue) && priceValue > 0 ? priceValue : 0
    
    // Debug price calculation in development
    if (import.meta.env.DEV) {
        if (regularPriceNum === 0) {
            console.warn('⚠️ Price calculation warning:', {
                rawPrice,
                priceValue,
                regularPriceNum,
                productPrice: product.price,
                product: product
            })
        }
    }
    
    const hasValidSale = salePriceNum != null && regularPriceNum > 0 && salePriceNum < regularPriceNum
    const displayPrice = hasValidSale ? salePriceNum : regularPriceNum
    const originalPrice = hasValidSale ? regularPriceNum : null

    return (
        <div className="bg-white min-h-screen">
            <Navbar />

            {/* Breadcrumbs */}
            <div className="bg-white py-4 px-4 sm:px-6 border-b border-gray-200">
                <div className="w-[90%] mx-auto max-w-7xl">
                    <nav className="flex items-center gap-2 text-sm text-gray-900">
                        <Link to="/" className="flex items-center gap-2 hover:text-gray-700 transition-colors">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                            </svg>
                            <span>HOME</span>
                        </Link>
                        <span className="text-gray-500">&gt;</span>
                        <Link to="/shop" className="hover:text-gray-700 transition-colors">
                            SHOP
                        </Link>
                        <span className="text-gray-500">&gt;</span>
                        <span className="text-gray-900">{product.name}</span>
                    </nav>
                </div>
            </div>

            {/* Product Details */}
            <section className="py-12 md:py-16 lg:py-20 px-4 sm:px-6">
                <div className="w-[90%] mx-auto max-w-7xl">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
                        {/* Product Images */}
                        <div>
                            <div className="relative bg-gray-100 rounded-lg overflow-hidden mb-4" style={{ aspectRatio: '1/1' }}>
                                <img
                                    key={`product-${product.id}-img-${selectedImageIndex}`}
                                    src={getProductImageUrl(product, selectedImageIndex)}
                                    alt={product.name}
                                    className="w-full h-full object-cover p-8"
                                    onError={(e) => {
                                        const target = e.target as HTMLImageElement
                                        if (import.meta.env.DEV) {
                                            console.warn('Image failed to load for product:', product.id, product.name, 'Attempted URL:', target.src)
                                        }
                                        target.src = '/assets/images/frame1.png'
                                    }}
                                />
                                {(() => {
                                    const p = product as any
                                    const stockStatus = p.stock_status
                                    const stockQty = product.stock_quantity
                                    
                                    // Check if out of stock - stock_status takes priority
                                    const isOutOfStock = 
                                        stockStatus === 'out_of_stock' ||
                                        (stockStatus !== 'in_stock' && stockQty !== undefined && stockQty <= 0) ||
                                        (stockStatus === undefined && product.in_stock === false) ||
                                        (stockStatus === undefined && stockQty !== undefined && stockQty <= 0)
                                    
                                    return isOutOfStock ? (
                                        <div className="absolute top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-full text-sm font-semibold">
                                            Out of Stock
                                        </div>
                                    ) : null
                                })()}
                                {salePriceNum && regularPriceNum && salePriceNum < regularPriceNum && (
                                    <div className="absolute top-4 left-4 bg-red-500 text-white px-4 py-2 rounded-full text-sm font-semibold">
                                        Sale
                                    </div>
                                )}
                            </div>
                            
                            {/* Thumbnail Images */}
                            {(() => {
                                // Parse images if it's a JSON string
                                let imagesArray: string[] = []
                                if (product.images) {
                                    if (typeof product.images === 'string') {
                                        try {
                                            imagesArray = JSON.parse(product.images)
                                        } catch (e) {
                                            imagesArray = [product.images]
                                        }
                                    } else if (Array.isArray(product.images)) {
                                        imagesArray = product.images
                                    }
                                }
                                
                                return imagesArray.length > 1 ? (
                                    <div className="flex gap-2 overflow-x-auto">
                                        {imagesArray.map((image, index) => (
                                            <button
                                                key={index}
                                                onClick={() => setSelectedImageIndex(index)}
                                                className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 ${
                                                    selectedImageIndex === index
                                                        ? 'border-blue-950'
                                                        : 'border-gray-200'
                                                }`}
                                            >
                                                <img
                                                    src={image}
                                                    alt={`${product.name} view ${index + 1}`}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        const target = e.target as HTMLImageElement
                                                        target.src = '/assets/images/frame1.png'
                                                    }}
                                                />
                                            </button>
                                        ))}
                                    </div>
                                ) : null
                            })()}
                        </div>

                        {/* Product Info */}
                        <div>
                            <div className="mb-4">
                                <p className="text-sm text-gray-500 uppercase tracking-wide mb-2">
                                    {product.brand || product.category?.name || 'Brand'}
                                </p>
                                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                                    {product.name}
                                </h1>

                                {/* Price */}
                                <div className="mb-6">
                                    {originalPrice ? (
                                        <div className="flex items-center gap-4">
                                            <span className="text-4xl font-bold text-blue-950">
                                                ${displayPrice.toFixed(2)}
                                            </span>
                                            <span className="text-2xl text-gray-500 line-through">
                                                ${originalPrice.toFixed(2)}
                                            </span>
                                            <span className="text-lg font-semibold text-red-600">
                                                {Math.round(((originalPrice - displayPrice) / originalPrice) * 100)}% OFF
                                            </span>
                                        </div>
                                    ) : (
                                        <span className="text-4xl font-bold text-blue-950">
                                            ${displayPrice.toFixed(2)}
                                        </span>
                                    )}
                                </div>

                                {/* Description */}
                                {product.description && (
                                    <div className="mb-6">
                                        <h2 className="text-xl font-semibold text-gray-900 mb-2">Description</h2>
                                        <p className="text-gray-600 leading-relaxed">
                                            {product.description}
                                        </p>
                                    </div>
                                )}

                                {/* Product Details */}
                                <div className="mb-6 space-y-2">
                                    {product.frame_shape && (
                                        <div className="flex">
                                            <span className="font-semibold text-gray-700 w-32">Frame Shape:</span>
                                            <span className="text-gray-600 capitalize">{product.frame_shape.replace('_', ' ')}</span>
                                        </div>
                                    )}
                                    {product.frame_material && (
                                        <div className="flex">
                                            <span className="font-semibold text-gray-700 w-32">Material:</span>
                                            <span className="text-gray-600 capitalize">{product.frame_material}</span>
                                        </div>
                                    )}
                                    {product.gender && (
                                        <div className="flex">
                                            <span className="font-semibold text-gray-700 w-32">Gender:</span>
                                            <span className="text-gray-600 capitalize">{product.gender}</span>
                                        </div>
                                    )}
                                    {product.category && (
                                        <div className="flex">
                                            <span className="font-semibold text-gray-700 w-32">Category:</span>
                                            <span className="text-gray-600">{product.category.name}</span>
                                        </div>
                                    )}
                                    {product.sku && (
                                        <div className="flex">
                                            <span className="font-semibold text-gray-700 w-32">SKU:</span>
                                            <span className="text-gray-600">{product.sku}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Quantity and Add to Cart */}
                                <div className="mb-6">
                                    <div className="flex items-center gap-4 mb-4">
                                        <label className="font-semibold text-gray-700">Quantity:</label>
                                        <div className="flex items-center border border-gray-300 rounded-lg">
                                            <button
                                                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                                className="px-4 py-2 hover:bg-gray-100 transition-colors"
                                                disabled={quantity <= 1}
                                            >
                                                -
                                            </button>
                                            <span className="px-4 py-2 min-w-[60px] text-center">{quantity}</span>
                                            <button
                                                onClick={() => setQuantity(quantity + 1)}
                                                className="px-4 py-2 hover:bg-gray-100 transition-colors"
                                                disabled={(() => {
                                                    const p = product as any
                                                    const stockStatus = p.stock_status
                                                    const stockQty = product.stock_quantity
                                                    
                                                    // Check if out of stock
                                                    return stockStatus === 'out_of_stock' ||
                                                           (stockStatus !== 'in_stock' && stockQty !== undefined && stockQty <= 0) ||
                                                           (stockStatus === undefined && product.in_stock === false) ||
                                                           (stockStatus === undefined && stockQty !== undefined && stockQty <= 0)
                                                })()}
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-3">
                                        <button
                                            onClick={() => setShowCheckout(true)}
                                            disabled={(() => {
                                                const p = product as any
                                                const stockStatus = p.stock_status
                                                const stockQty = product.stock_quantity
                                                
                                                // Check if out of stock
                                                return stockStatus === 'out_of_stock' ||
                                                       (stockStatus !== 'in_stock' && stockQty !== undefined && stockQty <= 0) ||
                                                       (stockStatus === undefined && product.in_stock === false) ||
                                                       (stockStatus === undefined && stockQty !== undefined && stockQty <= 0)
                                            })()}
                                            className={`w-full px-6 py-4 rounded-lg font-semibold text-lg transition-colors ${
                                                (() => {
                                                    const p = product as any
                                                    const stockStatus = p.stock_status
                                                    const stockQty = product.stock_quantity
                                                    
                                                    // Check if in stock - stock_status === 'in_stock' means it's in stock
                                                    const isInStock = stockStatus === 'in_stock' ||
                                                                      (stockStatus !== 'out_of_stock' && stockQty !== undefined && stockQty > 0) ||
                                                                      (stockStatus === undefined && product.in_stock === true) ||
                                                                      (stockStatus === undefined && stockQty !== undefined && stockQty > 0)
                                                    
                                                    return isInStock
                                                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                                                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                })()
                                            }`}
                                        >
                                            Select Lenses
                                        </button>
                                        
                                        <div className="flex gap-3">
                                            <button
                                                onClick={() => setShowTryOn(true)}
                                                disabled={(() => {
                                                    const p = product as any
                                                    const stockStatus = p.stock_status
                                                    const stockQty = product.stock_quantity
                                                    
                                                    // Check if out of stock
                                                    return stockStatus === 'out_of_stock' ||
                                                           (stockStatus !== 'in_stock' && stockQty !== undefined && stockQty <= 0) ||
                                                           (stockStatus === undefined && product.in_stock === false) ||
                                                           (stockStatus === undefined && stockQty !== undefined && stockQty <= 0)
                                                })()}
                                                className="flex-1 px-6 py-3 rounded-lg font-semibold text-base transition-colors bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                Try on
                                            </button>
                                            
                                            <a
                                                href="https://wa.me/1234567890"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex-1 px-6 py-3 rounded-lg font-semibold text-base transition-colors bg-blue-600 text-white hover:bg-blue-700 flex items-center justify-center gap-2"
                                            >
                                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                                                </svg>
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Related Products */}
            {relatedProducts.length > 0 && (
                <section className="py-12 md:py-16 bg-gray-50 px-4 sm:px-6">
                    <div className="w-[90%] mx-auto max-w-7xl">
                        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">Related Products</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {relatedProducts.map((relatedProduct) => (
                                <Link
                                    key={relatedProduct.id}
                                    to={`/shop/product/${relatedProduct.slug}`}
                                    className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col"
                                >
                                    <div className="relative h-64 bg-gray-100 overflow-hidden">
                                        <img
                                            src={getProductImageUrl(relatedProduct)}
                                            alt={relatedProduct.name}
                                            className="w-full h-full object-contain p-4"
                                            onError={(e) => {
                                                const target = e.target as HTMLImageElement
                                                target.src = '/assets/images/frame1.png'
                                            }}
                                        />
                                    </div>
                                    <div className="p-4 flex-grow flex flex-col">
                                        <h3 className="text-lg font-bold text-gray-900 mb-2">
                                            {relatedProduct.name}
                                        </h3>
                                        <div className="mt-auto pt-4">
                                            <span className="text-xl font-bold text-blue-950">
                                                ${Number(relatedProduct.sale_price || relatedProduct.price || 0).toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            <Footer />

            {/* Checkout Modal */}
            {showCheckout && product && (
                <ProductCheckout
                    product={product}
                    onClose={() => setShowCheckout(false)}
                />
            )}

            {/* Virtual Try-On Modal */}
            <VirtualTryOnModal
                open={showTryOn}
                onClose={() => setShowTryOn(false)}
                selectedProduct={product}
            />
        </div>
    )
}

export default ProductDetail

