import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { FaceMesh, type Results } from '@mediapipe/face_mesh'
import { Camera } from '@mediapipe/camera_utils'

const DemoRequestSection: React.FC = () => {
    const navigate = useNavigate()
    const [formData, setFormData] = useState({
        businessEmail: '',
        firstName: '',
        lastName: '',
        country: '',
        companyName: '',
        websiteUrl: '',
        numberOfFrames: '',
        message: ''
    })

    const [showCamera, setShowCamera] = useState(false)
    const [cameraError, setCameraError] = useState<string | null>(null)
    const [selectedFrame, setSelectedFrame] = useState('/assets/images/frame1.png')
    const videoRef = useRef<HTMLVideoElement | null>(null)
    const canvasRef = useRef<HTMLCanvasElement | null>(null)
    const streamRef = useRef<MediaStream | null>(null)
    const frameImageRef = useRef<HTMLImageElement | null>(null)

    const frameImages = [
        '/assets/images/frame1.png',
        '/assets/images/frame2.png',
        '/assets/images/frame3.png',
        '/assets/images/frame4.png',
    ]

    // Load frame image when selected
    useEffect(() => {
        const img = new Image()
        img.src = selectedFrame
        img.onload = () => {
            frameImageRef.current = img
        }
    }, [selectedFrame])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        })
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        console.log('Form submitted:', formData)
        // Navigate to thank you page after form submission
        navigate('/thank-you')
    }

    const handleTryNowClick = () => {
        setCameraError(null)
        setShowCamera(true)
    }

    // Initialize MediaPipe Face Mesh and camera when modal opens
    useEffect(() => {
        if (!showCamera) return

        if (!videoRef.current) return

        let camera: Camera | null = null
        let faceMesh: FaceMesh | null = null
        let resizeHandler: (() => void) | null = null

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
            const glassesWidth = eyeDistance * 2.0
            const glassesHeight = (frameImg.height / frameImg.width) * glassesWidth * 0.85

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
        }

        const setup = async () => {
            const video = videoRef.current
            const canvas = canvasRef.current
            if (!video || !canvas) return

            // Match canvas size to the rendered video size
            const resizeCanvas = () => {
                if (video && canvas) {
                    const rect = video.getBoundingClientRect()
                    canvas.width = rect.width * window.devicePixelRatio
                    canvas.height = rect.height * window.devicePixelRatio
                }
            }

            resizeCanvas()
            resizeHandler = () => resizeCanvas()
            window.addEventListener('resize', resizeHandler)

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

            try {
                await camera.start()
            } catch (error) {
                console.error('Error initializing camera:', error)
                setShowCamera(false)
                setCameraError('Unable to access camera. Please allow camera permissions and try again.')
            }
        }

        setup().catch((err) => {
            console.error('Error initializing virtual try-on', err)
            setShowCamera(false)
            setCameraError('Unable to initialize virtual try-on. Please try again.')
        })

        return () => {
            if (resizeHandler) {
                window.removeEventListener('resize', resizeHandler)
            }
            if (camera) {
                camera.stop()
            }
            if (faceMesh) {
                faceMesh.close()
            }
        }
    }, [showCamera])

    const closeCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop())
            streamRef.current = null
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null
        }
        setShowCamera(false)
        setCameraError(null)
    }

    // Cleanup camera stream on component unmount
    useEffect(() => {
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop())
            }
        }
    }, [])

    return (
        <section className="bg-white py-8 md:py-10 lg:py-12">
            <div className="w-[90%] mx-auto max-w-7xl">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 items-stretch">
                    {/* Left - Image with Overlay */}
                    <div className="relative h-[400px] md:h-[500px] lg:h-[700px] rounded-2xl overflow-hidden">
                        <img
                            src="/assets/images/virtual-try.jpg"
                            alt="Woman using virtual try-on on smartphone"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.style.display = 'none'
                            }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent flex flex-col justify-end items-center p-6 md:p-8">
                            <div className="text-white text-center">
                                <p className="text-sm md:text-base mb-2">Experience our</p>
                                <h3 className="text-2xl lg:text-3xl sm:text-3xl md:text-4xl font-bold mb-4">
                                    <strong>Live & Ultra-Realistic</strong> Eyewear Virtual Try-On
                                </h3>
                                <button
                                    onClick={handleTryNowClick}
                                    className="bg-white text-blue-950 px-6 md:px-8 py-3 md:py-4 rounded-lg font-semibold text-base md:text-lg hover:bg-gray-100 transition-colors duration-300"
                                >
                                    Try it now
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Right - Demo Request Form */}
                    <div className="bg-white rounded-2xl shadow-lg p-5 md:p-6 lg:p-7" id="demo-form">
                        <div className="mb-4 md:mb-5">
                            <h3 className="text-lg md:text-xl text-blue-950 mb-1.5">
                                Interested in Fittingbox Solution?
                            </h3>
                            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-950">
                                <strong>Get a live Demo</strong>
                            </h2>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4">
                            {/* Business Email */}
                            <div>
                                <label htmlFor="businessEmail" className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Business email <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="email"
                                    id="businessEmail"
                                    name="businessEmail"
                                    required
                                    value={formData.businessEmail}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                />
                            </div>

                            {/* First Name and Last Name */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1.5">
                                        First name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="firstName"
                                        name="firstName"
                                        required
                                        value={formData.firstName}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1.5">
                                        Last name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="lastName"
                                        name="lastName"
                                        required
                                        value={formData.lastName}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                    />
                                </div>
                            </div>

                            {/* Country and Company Name */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1.5">
                                        Country <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        id="country"
                                        name="country"
                                        required
                                        value={formData.country}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                    >
                                        <option value="">Please select</option>
                                        <option value="US">United States</option>
                                        <option value="CA">Canada</option>
                                        <option value="UK">United Kingdom</option>
                                        <option value="FR">France</option>
                                        <option value="DE">Germany</option>
                                        <option value="IT">Italy</option>
                                        <option value="ES">Spain</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-1.5">
                                        Company name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="companyName"
                                        name="companyName"
                                        required
                                        value={formData.companyName}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                    />
                                </div>
                            </div>

                            {/* Website URL and Number of frames */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="websiteUrl" className="block text-sm font-medium text-gray-700 mb-1.5">
                                        Website URL
                                    </label>
                                    <input
                                        type="url"
                                        id="websiteUrl"
                                        name="websiteUrl"
                                        value={formData.websiteUrl}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="numberOfFrames" className="block text-sm font-medium text-gray-700 mb-1.5">
                                        Number of frames in catalog
                                    </label>
                                    <select
                                        id="numberOfFrames"
                                        name="numberOfFrames"
                                        value={formData.numberOfFrames}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                    >
                                        <option value="">Please Select</option>
                                        <option value="0-100">0-100</option>
                                        <option value="101-500">101-500</option>
                                        <option value="501-1000">501-1000</option>
                                        <option value="1000+">1000+</option>
                                    </select>
                                </div>
                            </div>

                            {/* Message */}
                            <div>
                                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Message
                                </label>
                                <textarea
                                    id="message"
                                    name="message"
                                    rows={3}
                                    value={formData.message}
                                    onChange={handleChange}
                                    placeholder="Message"
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm resize-none"
                                />
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                className="w-full bg-blue-950 text-white px-6 md:px-8 py-3 md:py-4 rounded-lg font-semibold text-base md:text-lg hover:bg-blue-900 transition-colors duration-300"
                            >
                                Request a demo
                            </button>
                        </form>
                    </div>
                </div>
            </div>

            {/* Camera Modal for Virtual Try-On */}
            {showCamera && (
                <div className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-center justify-center">
                    <div className="bg-slate-950/95 w-[90%] max-w-6xl h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col">
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
                            <h2 className="text-white font-semibold text-lg">Virtual try-on</h2>
                            <button
                                onClick={closeCamera}
                                className="h-8 w-8 rounded-full border border-white/40 flex items-center justify-center text-white hover:bg-white/10"
                            >
                                ✕
                            </button>
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
                                </div>

                                {/* Bottom strip of frames */}
                                <div className="bg-slate-900/90 py-3 px-4 flex items-center justify-center gap-3 overflow-x-auto">
                                    {frameImages.map((src) => (
                                        <button
                                            key={src}
                                            type="button"
                                            onClick={() => setSelectedFrame(src)}
                                            className={`h-14 w-20 rounded-2xl border ${selectedFrame === src ? 'border-blue-500 ring-2 ring-blue-500/60' : 'border-slate-700'
                                                } overflow-hidden bg-slate-800`}
                                        >
                                            <img src={src} alt="Frame option" className="h-full w-full object-contain" />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Right: vertical list of frames */}
                            <div className="w-64 bg-slate-900/95 border-l border-slate-800 hidden sm:flex flex-col">
                                <div className="px-4 py-3 border-b border-slate-800">
                                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">FRAMES</p>
                                </div>
                                <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                                    {frameImages.map((src) => (
                                        <button
                                            key={src}
                                            type="button"
                                            onClick={() => setSelectedFrame(src)}
                                            className={`flex items-center gap-3 w-full rounded-2xl px-2 py-2 border ${selectedFrame === src ? 'border-blue-500 bg-blue-500/10' : 'border-slate-700 bg-slate-900'
                                                }`}
                                        >
                                            <div className="h-10 w-16 rounded-xl overflow-hidden bg-slate-800">
                                                <img src={src} alt="Frame option" className="h-full w-full object-contain" />
                                            </div>
                                            <span className="text-sm text-slate-100">Frame</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Camera Error Message */}
            {cameraError && !showCamera && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6">
                        <h3 className="text-xl font-bold text-red-600 mb-3">Camera Access Required</h3>
                        <p className="text-gray-700 mb-4">{cameraError}</p>
                        <button
                            onClick={() => setCameraError(null)}
                            className="w-full px-6 py-2 bg-blue-950 text-white rounded-lg hover:bg-blue-900 transition-colors"
                        >
                            OK
                        </button>
                    </div>
                </div>
            )}
        </section>
    )
}

export default DemoRequestSection

