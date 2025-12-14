import React, { useEffect, useRef, useState } from 'react'
import { FaceMesh, type Results } from '@mediapipe/face_mesh'
import { Camera } from '@mediapipe/camera_utils'
import { simulateARCoating, type ARCoatingResponse, simulatePhotochromic, type PhotochromicResponse } from '../../services/simulationsService'
import { getProducts, type Product } from '../../services/productsService'
import { getProductImageUrl } from '../../utils/productImage'
import BaseCurveCalculator from '../simulations/BaseCurveCalculator'
import LensThicknessCalculator from '../simulations/LensThicknessCalculator'

type VirtualTryOnModalProps = {
    open: boolean
    onClose: () => void
    selectedProduct?: Product | null
}

const VirtualTryOnModal: React.FC<VirtualTryOnModalProps> = ({ open, onClose, selectedProduct }) => {
    const videoRef = useRef<HTMLVideoElement | null>(null)
    const canvasRef = useRef<HTMLCanvasElement | null>(null)
    const arCoatingCanvasRef = useRef<HTMLCanvasElement | null>(null)
    const photochromicCanvasRef = useRef<HTMLCanvasElement | null>(null)
    const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [selectedFrame, setSelectedFrame] = useState<string>('')
    const [arCoatingEnabled, setArCoatingEnabled] = useState(false)
    const [arCoatingData, setArCoatingData] = useState<ARCoatingResponse | null>(null)
    const [isLoadingARCoating, setIsLoadingARCoating] = useState(false)
    const [photochromicEnabled, setPhotochromicEnabled] = useState(false)
    const [photochromicData, setPhotochromicData] = useState<PhotochromicResponse | null>(null)
    const [isLoadingPhotochromic, setIsLoadingPhotochromic] = useState(false)
    const [showBaseCurveCalculator, setShowBaseCurveCalculator] = useState(false)
    const [showLensThicknessCalculator, setShowLensThicknessCalculator] = useState(false)

    // Store the currently loaded frame image for drawing on the canvas
    const frameImageRef = useRef<HTMLImageElement | null>(null)

    // Frame size configuration - Adjust these values to customize frame dimensions
    const FRAME_WIDTH_MULTIPLIER = 1.9  // Adjust this to change frame width (larger = wider)
    const FRAME_HEIGHT_MULTIPLIER = 0.9  // Adjust this to change frame height (larger = taller)
    // OR set a fixed height in pixels (uncomment the line below and comment out the height calculation)
    // const FIXED_FRAME_HEIGHT = 80  // Set your desired fixed height in pixels

    // Fetch products from backend when modal opens
    useEffect(() => {
        if (open && products.length === 0) {
            const fetchProducts = async () => {
                try {
                    setLoading(true)
                    setError(null)
                    const result = await getProducts({ limit: 50 }) // Fetch up to 50 products
                    if (result && result.products && result.products.length > 0) {
                        setProducts(result.products)
                        
                        // If a product was passed as prop, select it; otherwise select first product
                        if (selectedProduct) {
                            const productImageUrl = getProductImageUrl(selectedProduct)
                            setSelectedFrame(productImageUrl)
                            // Make sure the selected product is in the products list
                            const productExists = result.products.some(p => p.id === selectedProduct.id)
                            if (!productExists) {
                                // Add the selected product to the list if it's not already there
                                setProducts([selectedProduct, ...result.products])
                            }
                        } else {
                            // Set first product as selected if no product prop provided
                            const firstProduct = result.products[0]
                            const firstImageUrl = getProductImageUrl(firstProduct)
                            setSelectedFrame(firstImageUrl)
                        }
                    } else {
                        // If no products from API but we have a selected product, use it
                        if (selectedProduct) {
                            setProducts([selectedProduct])
                            const productImageUrl = getProductImageUrl(selectedProduct)
                            setSelectedFrame(productImageUrl)
                        } else {
                            setError('No products available. Please try again later.')
                            // Fallback to default frame
                            setSelectedFrame('/assets/images/frame1.png')
                        }
                    }
                } catch (error) {
                    console.error('Error fetching products:', error)
                    // If API fails but we have a selected product, use it
                    if (selectedProduct) {
                        setProducts([selectedProduct])
                        const productImageUrl = getProductImageUrl(selectedProduct)
                        setSelectedFrame(productImageUrl)
                        setError(null)
                    } else {
                        setError('Failed to load products. Please try again later.')
                        // Fallback to default frame
                        setSelectedFrame('/assets/images/frame1.png')
                    }
                } finally {
                    setLoading(false)
                }
            }
            fetchProducts()
        } else if (open && selectedProduct) {
            // If modal opens with a selected product and products are already loaded
            const productImageUrl = getProductImageUrl(selectedProduct)
            setSelectedFrame(productImageUrl)
            // Add to products list if not already there
            const productExists = products.some(p => p.id === selectedProduct.id)
            if (!productExists) {
                setProducts([selectedProduct, ...products])
            }
        }
    }, [open, products.length, selectedProduct])

    // Load selected frame image
    useEffect(() => {
        if (selectedFrame) {
            const img = new Image()
            img.crossOrigin = 'anonymous'
            img.src = selectedFrame
            img.onload = () => {
                frameImageRef.current = img
            }
            img.onerror = () => {
                console.error('Failed to load frame image:', selectedFrame)
                // Fallback to default
                const fallbackImg = new Image()
                fallbackImg.src = '/assets/images/frame1.png'
                fallbackImg.onload = () => {
                    frameImageRef.current = fallbackImg
                }
            }
        }
    }, [selectedFrame])

    // Fetch AR coating simulation when enabled
    useEffect(() => {
        if (arCoatingEnabled && !arCoatingData) {
            setIsLoadingARCoating(true)
            simulateARCoating({ lensType: 'standard' })
                .then((data) => {
                    if (data) {
                        setArCoatingData(data)
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

    // Fetch photochromic simulation when enabled
    useEffect(() => {
        if (photochromicEnabled && !photochromicData) {
            setIsLoadingPhotochromic(true)
            simulatePhotochromic({ sunlightLevel: 75 })
                .then((data) => {
                    if (data) {
                        setPhotochromicData(data)
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

    useEffect(() => {
        if (!open) return

        if (!videoRef.current) return

        let camera: Camera | null = null
        let faceMesh: FaceMesh | null = null

        const onResults = (results: Results) => {
            const canvas = canvasRef.current
            const video = videoRef.current
            const frameImg = frameImageRef.current

            if (!canvas || !video || !results.multiFaceLandmarks?.length || !frameImg) return

            const ctx = canvas.getContext('2d')
            if (!ctx) return

            const width = canvas.width
            const height = canvas.height

            ctx.clearRect(0, 0, width, height)

            const landmarks = results.multiFaceLandmarks[0]

            // Use eye corners to position the glasses
            const leftEye = landmarks[33] // left eye outer corner
            const rightEye = landmarks[263] // right eye outer corner
            const nose = landmarks[1]

            if (!leftEye || !rightEye || !nose) return

            const lx = leftEye.x * width
            const ly = leftEye.y * height
            const rx = rightEye.x * width
            const ry = rightEye.y * height
            const ny = nose.y * height

            const eyeCenterX = (lx + rx) / 2
            const eyeCenterY = (ly + ry) / 2

            const dx = rx - lx
            const dy = ry - ly
            const eyeDistance = Math.sqrt(dx * dx + dy * dy)

            // Basic sizing and rotation for the frame
            const glassesWidth = eyeDistance * FRAME_WIDTH_MULTIPLIER

            // Option 1: Height based on width with multiplier (recommended)
            const glassesHeight = (frameImg.height / frameImg.width) * glassesWidth * FRAME_HEIGHT_MULTIPLIER

            // Option 2: Fixed height (uncomment below and comment out the line above)
            // const glassesHeight = FIXED_FRAME_HEIGHT

            // Option 3: Height based on eye distance (alternative method)
            // const glassesHeight = eyeDistance * FRAME_HEIGHT_MULTIPLIER

            const angle = Math.atan2(dy, dx)

            ctx.save()
            ctx.translate(eyeCenterX, (eyeCenterY + ny) / 2)
            ctx.rotate(angle)
            ctx.drawImage(
                frameImg,
                -glassesWidth / 2,
                -glassesHeight / 2,
                glassesWidth,
                glassesHeight
            )
            ctx.restore()

            // Apply AR coating effects if enabled
            if (arCoatingEnabled && arCoatingData) {
                const arCanvas = arCoatingCanvasRef.current
                if (arCanvas) {
                    const arCtx = arCanvas.getContext('2d')
                    if (arCtx) {
                        // Clear previous AR coating effects
                        arCtx.clearRect(0, 0, width, height)

                        const { simulation } = arCoatingData
                        const { reflectionIntensity, reflectionOpacity, colorIntensity, colors } = simulation

                        // Draw AR coating effects on the lens area
                        arCtx.save()
                        arCtx.translate(eyeCenterX, (eyeCenterY + ny) / 2)
                        arCtx.rotate(angle)

                        // Create lens area (elliptical shape)
                        const lensWidth = glassesWidth * 0.85
                        const lensHeight = glassesHeight * 0.6
                        const leftLensX = -glassesWidth * 0.6
                        const rightLensX = glassesWidth * 0.1

                        // Draw reflections and color tints for both lenses
                        ;[leftLensX, rightLensX].forEach((lensX) => {
                            // Create gradient for color tints
                            const gradient = arCtx.createRadialGradient(
                                lensX,
                                0,
                                0,
                                lensX,
                                0,
                                lensWidth / 2
                            )

                            // Add color tints based on API response
                            colors.forEach((color, index) => {
                                const colorMap: Record<string, string> = {
                                    green: `rgba(0, 255, 0, ${colorIntensity * 0.3})`,
                                    blue: `rgba(0, 150, 255, ${colorIntensity * 0.3})`,
                                    purple: `rgba(150, 0, 255, ${colorIntensity * 0.3})`,
                                    red: `rgba(255, 0, 0, ${colorIntensity * 0.3})`,
                                    yellow: `rgba(255, 255, 0, ${colorIntensity * 0.3})`,
                                }
                                const colorValue = colorMap[color.toLowerCase()] || `rgba(255, 255, 255, ${colorIntensity * 0.2})`
                                const stop = index / colors.length
                                gradient.addColorStop(stop, colorValue)
                            })
                            gradient.addColorStop(1, 'transparent')

                            // Draw color tint
                            arCtx.fillStyle = gradient
                            arCtx.beginPath()
                            arCtx.ellipse(lensX, 0, lensWidth / 2, lensHeight / 2, 0, 0, Math.PI * 2)
                            arCtx.fill()

                            // Draw reflections (simulated as bright spots)
                            const reflectionCount = Math.floor(reflectionIntensity / 10)
                            for (let i = 0; i < reflectionCount; i++) {
                                const reflectionX = lensX + (Math.random() - 0.5) * lensWidth * 0.6
                                const reflectionY = (Math.random() - 0.5) * lensHeight * 0.6
                                const reflectionSize = (Math.random() * 20 + 10) * (reflectionIntensity / 100)

                                arCtx.fillStyle = `rgba(255, 255, 255, ${reflectionOpacity})`
                                arCtx.beginPath()
                                arCtx.arc(reflectionX, reflectionY, reflectionSize, 0, Math.PI * 2)
                                arCtx.fill()

                                // Add glow effect
                                arCtx.shadowBlur = reflectionSize * 2
                                arCtx.shadowColor = 'rgba(255, 255, 255, 0.5)'
                                arCtx.fill()
                                arCtx.shadowBlur = 0
                            }
                        })

                        arCtx.restore()
                    }
                }
            } else {
                // Clear AR coating canvas when disabled
                const arCanvas = arCoatingCanvasRef.current
                if (arCanvas) {
                    const arCtx = arCanvas.getContext('2d')
                    if (arCtx) {
                        arCtx.clearRect(0, 0, arCanvas.width, arCanvas.height)
                    }
                }
            }

            // Apply photochromic effects if enabled
            if (photochromicEnabled && photochromicData) {
                const photoCanvas = photochromicCanvasRef.current
                if (photoCanvas) {
                    const photoCtx = photoCanvas.getContext('2d')
                    if (photoCtx) {
                        // Clear previous photochromic effects
                        photoCtx.clearRect(0, 0, width, height)

                        const { simulation } = photochromicData
                        const { opacity, brightness, contrast, color } = simulation

                        // Draw photochromic tint on the lens area
                        photoCtx.save()
                        photoCtx.translate(eyeCenterX, (eyeCenterY + ny) / 2)
                        photoCtx.rotate(angle)

                        // Create lens area (elliptical shape)
                        const lensWidth = glassesWidth * 0.85
                        const lensHeight = glassesHeight * 0.6
                        const leftLensX = -glassesWidth * 0.6
                        const rightLensX = glassesWidth * 0.1

                        // Color mapping for photochromic tints
                        const colorMap: Record<string, string> = {
                            dark_gray: 'rgba(64, 64, 64,',
                            gray: 'rgba(128, 128, 128,',
                            light_gray: 'rgba(192, 192, 192,',
                            brown: 'rgba(139, 69, 19,',
                            amber: 'rgba(255, 191, 0,',
                            blue: 'rgba(0, 100, 200,',
                        }
                        const baseColor = colorMap[color.toLowerCase()] || 'rgba(64, 64, 64,'

                        // Draw photochromic tint for both lenses
                        ;[leftLensX, rightLensX].forEach((lensX) => {
                            // Create gradient for photochromic tint
                            const gradient = photoCtx.createRadialGradient(
                                lensX,
                                0,
                                0,
                                lensX,
                                0,
                                lensWidth / 2
                            )

                            // Apply opacity and color
                            const tintOpacity = opacity * 0.8 // Scale opacity for visual effect
                            gradient.addColorStop(0, `${baseColor}${tintOpacity})`)
                            gradient.addColorStop(0.5, `${baseColor}${tintOpacity * 0.7})`)
                            gradient.addColorStop(1, 'transparent')

                            // Draw tint overlay
                            photoCtx.fillStyle = gradient
                            photoCtx.beginPath()
                            photoCtx.ellipse(lensX, 0, lensWidth / 2, lensHeight / 2, 0, 0, Math.PI * 2)
                            photoCtx.fill()

                            // Apply brightness and contrast adjustments using composite operations
                            // We'll use a darker overlay to simulate reduced brightness
                            const brightnessAdjustment = 1 - brightness // Inverse brightness (lower brightness = darker)
                            photoCtx.fillStyle = `rgba(0, 0, 0, ${brightnessAdjustment * 0.4})`
                            photoCtx.fill()

                            // Apply contrast by adding a subtle overlay
                            if (contrast > 1) {
                                // Higher contrast = more defined edges
                                photoCtx.strokeStyle = `rgba(0, 0, 0, ${(contrast - 1) * 0.2})`
                                photoCtx.lineWidth = 2
                                photoCtx.beginPath()
                                photoCtx.ellipse(lensX, 0, lensWidth / 2, lensHeight / 2, 0, 0, Math.PI * 2)
                                photoCtx.stroke()
                            }
                        })

                        photoCtx.restore()
                    }
                }
            } else {
                // Clear photochromic canvas when disabled
                const photoCanvas = photochromicCanvasRef.current
                if (photoCanvas) {
                    const photoCtx = photoCanvas.getContext('2d')
                    if (photoCtx) {
                        photoCtx.clearRect(0, 0, photoCanvas.width, photoCanvas.height)
                    }
                }
            }
        }

        const setup = async () => {
            const video = videoRef.current
            const canvas = canvasRef.current
            if (!video || !canvas) return

            // Match canvas size to the rendered video size
            const resizeCanvas = () => {
                const rect = video.getBoundingClientRect()
                const dpr = window.devicePixelRatio
                canvas.width = rect.width * dpr
                canvas.height = rect.height * dpr
                
                // Also resize AR coating and photochromic canvases
                const arCanvas = arCoatingCanvasRef.current
                if (arCanvas) {
                    arCanvas.width = rect.width * dpr
                    arCanvas.height = rect.height * dpr
                }
                const photoCanvas = photochromicCanvasRef.current
                if (photoCanvas) {
                    photoCanvas.width = rect.width * dpr
                    photoCanvas.height = rect.height * dpr
                }
            }

            resizeCanvas()
            window.addEventListener('resize', resizeCanvas)

            faceMesh = new FaceMesh({
                locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
            })

            faceMesh.setOptions({
                maxNumFaces: 1,
                refineLandmarks: true,
                minDetectionConfidence: 0.6,
                minTrackingConfidence: 0.6,
            })

            faceMesh.onResults(onResults)

            camera = new Camera(video, {
                onFrame: async () => {
                    if (faceMesh && video.videoWidth > 0 && video.videoHeight > 0) {
                        await faceMesh.send({ image: video })
                    }
                },
                width: 640,
                height: 480,
            })

            await camera.start()
        }

        setup().catch((err) => {
            console.error('Error initializing virtual try-on', err)
        })

        return () => {
            if (camera) {
                camera.stop()
            }
            if (faceMesh) {
                faceMesh.close()
            }
        }
    }, [open])

    if (!open) return null

    return (
        <div className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-center justify-center">
            <div className="bg-slate-950/95 w-[90%] max-w-6xl h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
                    <h2 className="text-white font-semibold text-lg">Virtual try-on</h2>
                    <div className="flex items-center gap-3">
                        {/* Photochromic Toggle */}
                        <button
                            onClick={() => setPhotochromicEnabled(!photochromicEnabled)}
                            disabled={isLoadingPhotochromic}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                photochromicEnabled
                                    ? 'bg-amber-500 text-white hover:bg-amber-600'
                                    : 'bg-slate-700 text-slate-200 hover:bg-slate-600'
                            } ${isLoadingPhotochromic ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {isLoadingPhotochromic ? 'Loading...' : photochromicEnabled ? 'Photochromic ON' : 'Photochromic OFF'}
                        </button>
                        {/* AR Coating Toggle */}
                        <button
                            onClick={() => setArCoatingEnabled(!arCoatingEnabled)}
                            disabled={isLoadingARCoating}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                arCoatingEnabled
                                    ? 'bg-blue-500 text-white hover:bg-blue-600'
                                    : 'bg-slate-700 text-slate-200 hover:bg-slate-600'
                            } ${isLoadingARCoating ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {isLoadingARCoating ? 'Loading...' : arCoatingEnabled ? 'AR Coating ON' : 'AR Coating OFF'}
                        </button>
                        {/* Base Curve Calculator Button */}
                        <button
                            onClick={() => setShowBaseCurveCalculator(!showBaseCurveCalculator)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                showBaseCurveCalculator
                                    ? 'bg-green-500 text-white hover:bg-green-600'
                                    : 'bg-slate-700 text-slate-200 hover:bg-slate-600'
                            }`}
                        >
                            Base Curve
                        </button>
                        {/* Lens Thickness Calculator Button */}
                        <button
                            onClick={() => setShowLensThicknessCalculator(!showLensThicknessCalculator)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                showLensThicknessCalculator
                                    ? 'bg-purple-500 text-white hover:bg-purple-600'
                                    : 'bg-slate-700 text-slate-200 hover:bg-slate-600'
                            }`}
                        >
                            Lens Thickness
                        </button>
                        <button
                            onClick={onClose}
                            className="h-8 w-8 rounded-full border border-white/40 flex items-center justify-center text-white hover:bg-white/10"
                        >
                            ✕
                        </button>
                    </div>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    {/* Left: camera + bottom strip */}
                    <div className="relative flex-1 bg-black/80 flex flex-col">
                        <div className="flex-1 relative">
                            {/* Video feed */}
                            <video
                                ref={videoRef}
                                className="w-full h-full object-cover"
                                muted
                                autoPlay
                                playsInline
                            />
                            {/* Canvas overlay for frames */}
                            <canvas
                                ref={canvasRef}
                                className="pointer-events-none absolute inset-0 w-full h-full"
                            />
                            {/* Canvas overlay for AR coating effects */}
                            <canvas
                                ref={arCoatingCanvasRef}
                                className="pointer-events-none absolute inset-0 w-full h-full mix-blend-mode-screen"
                            />
                            {/* Canvas overlay for photochromic effects */}
                            <canvas
                                ref={photochromicCanvasRef}
                                className="pointer-events-none absolute inset-0 w-full h-full mix-blend-mode-multiply"
                            />
                        </div>

                        {/* Bottom strip of frames */}
                        <div className="bg-slate-900/90 py-3 px-4 flex items-center justify-center gap-3 overflow-x-auto">
                            {loading ? (
                                <div className="text-slate-400 text-sm">Loading products...</div>
                            ) : error ? (
                                <div className="text-red-400 text-sm">{error}</div>
                            ) : products.length > 0 ? (
                                products.map((product) => {
                                    const imageUrl = getProductImageUrl(product)
                                    const isSelected = selectedFrame === imageUrl
                                    return (
                                        <button
                                            key={product.id}
                                            type="button"
                                            onClick={() => setSelectedFrame(imageUrl)}
                                            className={`h-14 w-20 rounded-2xl border ${isSelected ? 'border-blue-500 ring-2 ring-blue-500/60' : 'border-slate-700'
                                                } overflow-hidden bg-slate-800`}
                                            title={product.name}
                                        >
                                            <img 
                                                src={imageUrl} 
                                                alt={product.name} 
                                                className="h-full w-full object-contain"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).src = '/assets/images/frame1.png'
                                                }}
                                            />
                                        </button>
                                    )
                                })
                            ) : (
                                <div className="text-slate-400 text-sm">No products available</div>
                            )}
                        </div>
                    </div>

                    {/* Right: vertical list of frames */}
                    <div className="w-64 bg-slate-900/95 border-l border-slate-800 hidden sm:flex flex-col">
                        <div className="px-4 py-3 border-b border-slate-800">
                            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Frames</p>
                        </div>
                        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                            {loading ? (
                                <div className="text-slate-400 text-sm text-center py-4">Loading products...</div>
                            ) : error ? (
                                <div className="text-red-400 text-sm text-center py-4">{error}</div>
                            ) : products.length > 0 ? (
                                products.map((product) => {
                                    const imageUrl = getProductImageUrl(product)
                                    const isSelected = selectedFrame === imageUrl
                                    return (
                                        <button
                                            key={product.id}
                                            type="button"
                                            onClick={() => setSelectedFrame(imageUrl)}
                                            className={`flex items-center gap-3 w-full rounded-2xl px-2 py-2 border ${isSelected ? 'border-blue-500 bg-blue-500/10' : 'border-slate-700 bg-slate-900'
                                                }`}
                                        >
                                            <div className="h-10 w-16 rounded-xl overflow-hidden bg-slate-800">
                                                <img 
                                                    src={imageUrl} 
                                                    alt={product.name} 
                                                    className="h-full w-full object-contain"
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).src = '/assets/images/frame1.png'
                                                    }}
                                                />
                                            </div>
                                            <span className="text-sm text-slate-100 truncate">{product.name}</span>
                                        </button>
                                    )
                                })
                            ) : (
                                <div className="text-slate-400 text-sm text-center py-4">No products available</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Base Curve Calculator Modal */}
            {showBaseCurveCalculator && (
                <div className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                        <BaseCurveCalculator onClose={() => setShowBaseCurveCalculator(false)} />
                    </div>
                </div>
            )}

            {/* Lens Thickness Calculator Modal */}
            {showLensThicknessCalculator && (
                <div className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                        <LensThicknessCalculator onClose={() => setShowLensThicknessCalculator(false)} />
                    </div>
                </div>
            )}
        </div>
    )
}

export default VirtualTryOnModal


