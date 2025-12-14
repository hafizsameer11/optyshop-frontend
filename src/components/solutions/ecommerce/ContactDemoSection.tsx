import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { FaceMesh, type Results } from '@mediapipe/face_mesh'
import { Camera } from '@mediapipe/camera_utils'
import { defaultContactDemoConfig } from '../../../data/contactFormConfig'
import type { ContactDemoConfig, FormField } from '../../../data/contactFormConfig'
import { apiClient } from '../../../utils/api'
import { API_ROUTES } from '../../../config/apiRoutes'

interface ContactDemoSectionProps {
    config?: ContactDemoConfig
}

const ContactDemoSection: React.FC<ContactDemoSectionProps> = ({ config = defaultContactDemoConfig }) => {
    const navigate = useNavigate()
    const formFields: FormField[] = config.rightSection.formFields || []

    const [formData, setFormData] = useState<Record<string, string>>({})
    const [showCamera, setShowCamera] = useState(false)
    const [cameraError, setCameraError] = useState<string | null>(null)
    const [selectedFrame, setSelectedFrame] = useState('/assets/images/frame1.png')
    const videoRef = useRef<HTMLVideoElement | null>(null)
    const canvasRef = useRef<HTMLCanvasElement | null>(null)
    const streamRef = useRef<MediaStream | null>(null)
    const formRef = useRef<HTMLFormElement>(null)
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
            const glassesWidth = eyeDistance * 1.9
            const glassesHeight = (frameImg.height / frameImg.width) * glassesWidth * 0.7 // Reduce height by 30%

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


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitError('')

        // Basic validation
        if (!formData.email || !formData.name || !formData.surname || !formData.village || !formData.companyName) {
            setSubmitError('Please fill in all required fields')
            return
        }

        setIsSubmitting(true)
        try {
            const response = await apiClient.post(
                API_ROUTES.FORMS.DEMO.SUBMIT,
                {
                    email: formData.email,
                    name: formData.name,
                    surname: formData.surname,
                    village: formData.village,
                    companyName: formData.companyName,
                    websiteUrl: formData.websiteUrl || undefined,
                    numberOfFrames: formData.numberOfFrames || undefined,
                    message: formData.message || undefined,
                },
                false
            )

            if (response.success) {
                // Navigate to thank you page on success
                navigate('/thank-you')
            } else {
                setSubmitError(response.message || 'Failed to submit demo request. Please try again.')
            }
        } catch (error: any) {
            setSubmitError(error.message || 'An error occurred. Please try again.')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <section className="bg-white py-8 md:py-10 lg:py-12 px-4 sm:px-6">
            <div className="w-[90%] mx-auto">
                <div className="grid lg:grid-cols-2 gap-6 md:gap-8 items-stretch">
                    {/* Left Section - Promotional Banner */}
                    <div className="relative order-2 lg:order-1 h-full">
                        <div className="relative rounded-2xl overflow-hidden h-full">
                            <img
                                src={config.leftSection.image}
                                alt={config.leftSection.overlayText.largeText}
                                className="w-full h-full object-cover rounded-2xl"
                                onError={(e) => {
                                    const target = e.target as HTMLImageElement
                                    target.style.display = 'none'
                                }}
                            />
                            {/* Overlay Text */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent flex flex-col justify-end items-center p-6 md:p-8">
                                <div className="text-white space-y-2 md:space-y-3 text-center">
                                    <p className="text-xs md:text-sm">{config.leftSection.overlayText.smallText}</p>
                                    <h3 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold">
                                        <span className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl">
                                            {config.leftSection.overlayText.largeText.split(' ')[0]}
                                        </span>
                                        {config.leftSection.overlayText.largeText.split(' ').length > 1 && (
                                            <>
                                                <br />
                                                {config.leftSection.overlayText.largeText.split(' ').slice(1).join(' ')}
                                            </>
                                        )}
                                    </h3>
                                    <button
                                        onClick={handleTryNowClick}
                                        className="px-5 md:px-6 py-2 md:py-2.5 bg-white text-blue-950 font-semibold rounded-lg hover:bg-gray-100 transition-colors duration-300 text-sm md:text-base mt-3 cursor-pointer"
                                    >
                                        {config.leftSection.overlayText.buttonText}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Section - Contact Form */}
                    <div className="order-1 lg:order-2 h-full flex">
                        <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-4 md:p-6 lg:p-7 w-full">
                            <h3 className="text-base md:text-lg font-semibold text-blue-950 mb-1">
                                {config.rightSection.title}
                            </h3>
                            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-950 mb-4 md:mb-5">
                                {config.rightSection.heading}
                            </h2>

                            <form ref={formRef} onSubmit={handleSubmit} className="space-y-3 md:space-y-3.5">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-3.5">
                                    {formFields.map((field) => {
                                        // Determine if field should span full width
                                        const isFullWidth = field.fullWidth || field.type === 'textarea'

                                        return (
                                            <div key={field.name} className={isFullWidth ? 'md:col-span-2' : ''}>
                                                <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">
                                                    {field.label} {field.required && <span className="text-red-500">*</span>}
                                                </label>
                                                {field.type === 'select' ? (
                                                    <select
                                                        name={field.name}
                                                        required={field.required}
                                                        value={formData[field.name] || ''}
                                                        onChange={handleChange}
                                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    >
                                                        {field.options?.map((option) => (
                                                            <option key={option} value={option === 'Select' ? '' : option}>
                                                                {option}
                                                            </option>
                                                        ))}
                                                    </select>
                                                ) : field.type === 'textarea' ? (
                                                    <textarea
                                                        name={field.name}
                                                        required={field.required}
                                                        value={formData[field.name] || ''}
                                                        onChange={handleChange}
                                                        placeholder={field.placeholder}
                                                        rows={3}
                                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                                    />
                                                ) : (
                                                    <input
                                                        type={field.type}
                                                        name={field.name}
                                                        required={field.required}
                                                        value={formData[field.name] || ''}
                                                        onChange={handleChange}
                                                        placeholder={field.placeholder}
                                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    />
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>

                                {submitError && (
                                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                                        {submitError}
                                    </div>
                                )}

                                <div className="pt-3">
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full px-6 md:px-8 py-2.5 md:py-3 bg-blue-950 text-white font-semibold rounded-lg hover:bg-blue-900 transition-colors duration-300 text-sm md:text-base disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                <span>Submitting...</span>
                                            </>
                                        ) : (
                                            config.rightSection.submitButtonText
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
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

export default ContactDemoSection

