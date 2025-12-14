import React, { useState, useRef, useEffect } from 'react'
import { getProducts, type Product } from '../../../services/productsService'
import {
    simulateARCoating,
    simulatePhotochromic,
    type ARCoatingResponse,
    type PhotochromicResponse,
} from '../../../services/simulationsService'
import { getProductImageUrl } from '../../../utils/productImage'
import BaseCurveCalculator from '../../simulations/BaseCurveCalculator'
import LensThicknessCalculator from '../../simulations/LensThicknessCalculator'

type Viewer3DModalProps = {
    open: boolean
    onClose: () => void
}

interface FrameItem {
    id: number
    name: string
    image: string
    slug?: string
}

const Viewer3DModal: React.FC<Viewer3DModalProps> = ({ open, onClose }) => {
    const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [selectedFrame, setSelectedFrame] = useState<FrameItem | null>(null)
    const [rotation, setRotation] = useState({ x: 0, y: 0 })
    const [isDragging, setIsDragging] = useState(false)
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
    const containerRef = useRef<HTMLDivElement>(null)

    // Simulation states
    const [photochromicEnabled, setPhotochromicEnabled] = useState(false)
    const [photochromicData, setPhotochromicData] = useState<PhotochromicResponse | null>(null)
    const [isLoadingPhotochromic, setIsLoadingPhotochromic] = useState(false)
    const [arCoatingEnabled, setArCoatingEnabled] = useState(false)
    const [arCoatingData, setArCoatingData] = useState<ARCoatingResponse | null>(null)
    const [isLoadingARCoating, setIsLoadingARCoating] = useState(false)
    const [showBaseCurveCalculator, setShowBaseCurveCalculator] = useState(false)
    const [showLensThicknessCalculator, setShowLensThicknessCalculator] = useState(false)

    // Fetch products when modal opens
    useEffect(() => {
        if (open && products.length === 0) {
            const fetchProducts = async () => {
                try {
                    setLoading(true)
                    setError(null)
                    const result = await getProducts({ limit: 50 }) // Fetch up to 50 products
                    if (result && result.products && result.products.length > 0) {
                        setProducts(result.products)
                        // Set first product as selected if available
                        const firstProduct = result.products[0]
                        setSelectedFrame({
                            id: firstProduct.id,
                            name: firstProduct.name,
                            image: getProductImageUrl(firstProduct),
                            slug: firstProduct.slug,
                        })
                    } else {
                        setError('No products available. Please try again later.')
                    }
                } catch (error) {
                    console.error('Error fetching products:', error)
                    setError('Failed to load products. Please try again later.')
                } finally {
                    setLoading(false)
                }
            }
            fetchProducts()
        }
    }, [open])

    // Convert products to frame items using the centralized image utility
    const frameItems: FrameItem[] = products.map((product) => ({
        id: product.id,
        name: product.name,
        image: getProductImageUrl(product),
        slug: product.slug,
    }))

    useEffect(() => {
        if (!open) {
            setRotation({ x: 0, y: 0 })
            setIsDragging(false)
            // Reset simulation states
            setPhotochromicEnabled(false)
            setArCoatingEnabled(false)
            setPhotochromicData(null)
            setArCoatingData(null)
            setShowBaseCurveCalculator(false)
            setShowLensThicknessCalculator(false)
            setError(null)
        }
    }, [open])

    // Fetch Photochromic simulation when enabled
    useEffect(() => {
        if (photochromicEnabled && !photochromicData) {
            setIsLoadingPhotochromic(true)
            simulatePhotochromic({ sunlightLevel: 75 })
                .then((data) => {
                    if (data && data.simulation) {
                        setPhotochromicData(data)
                    } else {
                        console.warn('Photochromic simulation returned invalid data')
                    }
                })
                .catch((error) => {
                    console.error('Failed to load photochromic simulation:', error)
                })
                .finally(() => {
                    setIsLoadingPhotochromic(false)
                })
        } else if (!photochromicEnabled) {
            setPhotochromicData(null)
        }
    }, [photochromicEnabled, photochromicData])

    // Fetch AR Coating simulation when enabled
    useEffect(() => {
        if (arCoatingEnabled && !arCoatingData) {
            setIsLoadingARCoating(true)
            simulateARCoating({ reflectionIntensity: 45 })
                .then((data) => {
                    if (data && data.simulation) {
                        setArCoatingData(data)
                    } else {
                        console.warn('AR coating simulation returned invalid data')
                    }
                })
                .catch((error) => {
                    console.error('Failed to load AR coating simulation:', error)
                })
                .finally(() => {
                    setIsLoadingARCoating(false)
                })
        } else if (!arCoatingEnabled) {
            setArCoatingData(null)
        }
    }, [arCoatingEnabled, arCoatingData])

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging) return

            const deltaX = e.clientX - dragStart.x
            const deltaY = e.clientY - dragStart.y

            setRotation(prev => ({
                x: Math.max(-90, Math.min(90, prev.x + deltaY * 0.5)),
                y: prev.y + deltaX * 0.5
            }))

            setDragStart({ x: e.clientX, y: e.clientY })
        }

        const handleMouseUp = () => {
            setIsDragging(false)
        }

        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove)
            window.addEventListener('mouseup', handleMouseUp)
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove)
            window.removeEventListener('mouseup', handleMouseUp)
        }
    }, [isDragging, dragStart])

    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault()
        setIsDragging(true)
        setDragStart({ x: e.clientX, y: e.clientY })
    }

    const handleReset = () => {
        setRotation({ x: 0, y: 0 })
    }

    if (!open) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="relative w-full max-w-7xl max-h-[90vh] mx-auto bg-slate-900 flex flex-col rounded-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-700">
                    <div className="text-white font-semibold text-lg">Virtual try-on</div>
                    <div className="flex items-center gap-2">
                        {/* Photochromic Toggle */}
                        <button
                            onClick={() => setPhotochromicEnabled(!photochromicEnabled)}
                            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                                photochromicEnabled
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                            }`}
                            disabled={isLoadingPhotochromic}
                        >
                            {isLoadingPhotochromic ? 'Loading...' : `Photochromic ${photochromicEnabled ? 'ON' : 'OFF'}`}
                        </button>

                        {/* AR Coating Toggle */}
                        <button
                            onClick={() => setArCoatingEnabled(!arCoatingEnabled)}
                            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                                arCoatingEnabled
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                            }`}
                            disabled={isLoadingARCoating}
                        >
                            {isLoadingARCoating ? 'Loading...' : `AR Coating ${arCoatingEnabled ? 'ON' : 'OFF'}`}
                        </button>

                        {/* Base Curve Button */}
                        <button
                            onClick={() => setShowBaseCurveCalculator(!showBaseCurveCalculator)}
                            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                                showBaseCurveCalculator
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                            }`}
                        >
                            Base Curve
                        </button>

                        {/* Lens Thickness Button */}
                        <button
                            onClick={() => setShowLensThicknessCalculator(!showLensThicknessCalculator)}
                            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                                showLensThicknessCalculator
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                            }`}
                        >
                            Lens Thickness
                        </button>

                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-full bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-white transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Center - 3D Viewer */}
                    <div className="flex-1 flex items-center justify-center bg-white relative">
                        <div
                            ref={containerRef}
                            className="relative w-full h-full flex items-center justify-center cursor-grab active:cursor-grabbing select-none"
                            onMouseDown={handleMouseDown}
                        >
                            {selectedFrame ? (
                                <div
                                    className="relative transition-transform duration-100"
                                    style={{
                                        transform: `perspective(1000px) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
                                    }}
                                >
                                    <img
                                        src={selectedFrame.image}
                                        alt={selectedFrame.name}
                                        className="w-64 h-64 md:w-80 md:h-80 object-contain"
                                        draggable={false}
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement
                                            target.src = '/assets/images/frame1.png'
                                        }}
                                    />
                                </div>
                            ) : (
                                <div className="text-gray-400">No product selected</div>
                            )}

                            {/* Bottom Controls */}
                            <div className="absolute bottom-4 left-4 flex gap-3">
                                <button className="w-12 h-12 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-lg transition-colors">
                                    <svg className="w-6 h-6 text-slate-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                </button>
                                <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                                    <span className="text-xs font-bold text-slate-800">3D</span>
                                </div>
                            </div>

                            {/* Reset Button */}
                            <button
                                onClick={handleReset}
                                className="absolute bottom-4 right-4 w-12 h-12 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-lg transition-colors"
                            >
                                <svg className="w-6 h-6 text-slate-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                            </button>
                        </div>

                        {/* Horizontal Frame Icons Row */}
                        {frameItems.length > 0 && (
                            <div className="absolute bottom-0 left-0 right-0 bg-slate-900/95 py-3 px-4 flex items-center justify-center gap-3 overflow-x-auto border-t border-slate-700">
                                {frameItems.slice(0, 8).map((frame) => (
                                    <button
                                        key={frame.id}
                                        type="button"
                                        onClick={() => {
                                            // Update selected frame with fresh image URL from product
                                            const product = products.find(p => p.id === frame.id)
                                            if (product) {
                                                setSelectedFrame({
                                                    id: product.id,
                                                    name: product.name,
                                                    image: getProductImageUrl(product),
                                                    slug: product.slug,
                                                })
                                            } else {
                                                setSelectedFrame(frame)
                                            }
                                        }}
                                        className={`h-16 w-20 rounded-xl border-2 flex-shrink-0 transition-all overflow-hidden ${
                                            selectedFrame?.id === frame.id
                                                ? 'border-blue-500 ring-2 ring-blue-500/60 bg-slate-800'
                                                : 'border-slate-700 bg-slate-800 hover:border-slate-600'
                                        }`}
                                    >
                                        <img
                                            src={frame.image}
                                            alt={frame.name}
                                            className="h-full w-full object-contain p-1"
                                            onError={(e) => {
                                                const target = e.target as HTMLImageElement
                                                target.src = '/assets/images/frame1.png'
                                            }}
                                        />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right Sidebar - Frame Selection */}
                    <div className="w-80 bg-slate-800 overflow-y-auto border-l border-slate-700">
                        <div className="p-4 border-b border-slate-700">
                            <h3 className="text-slate-300 font-semibold text-sm uppercase tracking-wide">FRAMES</h3>
                        </div>
                        {loading ? (
                            <div className="p-4 text-center text-white">
                                <div className="animate-pulse">Loading products...</div>
                            </div>
                        ) : error ? (
                            <div className="p-4 text-center text-red-400">
                                <p>{error}</p>
                                <button
                                    onClick={() => {
                                        setProducts([])
                                        setError(null)
                                        const fetchProducts = async () => {
                                            try {
                                                setLoading(true)
                                                const result = await getProducts({ limit: 50 })
                                                if (result && result.products && result.products.length > 0) {
                                                    setProducts(result.products)
                                                    const firstProduct = result.products[0]
                                                    setSelectedFrame({
                                                        id: firstProduct.id,
                                                        name: firstProduct.name,
                                                        image: getProductImageUrl(firstProduct),
                                                        slug: firstProduct.slug,
                                                    })
                                                }
                                            } catch (err) {
                                                console.error('Error fetching products:', err)
                                            } finally {
                                                setLoading(false)
                                            }
                                        }
                                        fetchProducts()
                                    }}
                                    className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                                >
                                    Retry
                                </button>
                            </div>
                        ) : frameItems.length === 0 ? (
                            <div className="p-4 text-center text-white">
                                <p>No products available</p>
                            </div>
                        ) : (
                            <div className="p-4 space-y-3">
                                {frameItems.map((frame) => (
                                    <div
                                        key={frame.id}
                                        className={`rounded-lg p-3 cursor-pointer transition-all flex items-center gap-3 ${
                                            selectedFrame?.id === frame.id
                                                ? 'bg-slate-700 border-2 border-white'
                                                : 'bg-slate-700/50 border-2 border-transparent hover:bg-slate-700/70'
                                        }`}
                                        onClick={() => {
                                            // Update selected frame with fresh image URL from product
                                            const product = products.find(p => p.id === frame.id)
                                            if (product) {
                                                setSelectedFrame({
                                                    id: product.id,
                                                    name: product.name,
                                                    image: getProductImageUrl(product),
                                                    slug: product.slug,
                                                })
                                            } else {
                                                setSelectedFrame(frame)
                                            }
                                        }}
                                    >
                                        {/* Frame Icon */}
                                        <div className="w-16 h-16 flex-shrink-0 bg-slate-600 rounded-lg flex items-center justify-center overflow-hidden">
                                            <img
                                                src={frame.image}
                                                alt={frame.name}
                                                className="w-full h-full object-contain"
                                                onError={(e) => {
                                                    const target = e.target as HTMLImageElement
                                                    target.src = '/assets/images/frame1.png'
                                                }}
                                            />
                                        </div>
                                        {/* Frame Label */}
                                        <div className="flex-1">
                                            <p className="text-white text-sm font-medium">{frame.name || 'Frame'}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Base Curve Calculator Modal */}
                {showBaseCurveCalculator && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                        <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                            <BaseCurveCalculator onClose={() => setShowBaseCurveCalculator(false)} />
                        </div>
                    </div>
                )}

                {/* Lens Thickness Calculator Modal */}
                {showLensThicknessCalculator && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                        <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                            <LensThicknessCalculator onClose={() => setShowLensThicknessCalculator(false)} />
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default Viewer3DModal

