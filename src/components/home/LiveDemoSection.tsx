import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import VirtualTryOnModal from './VirtualTryOnModal'
import { apiClient } from '../../utils/api'
import { API_ROUTES } from '../../config/apiRoutes'

const LiveDemoSection: React.FC = () => {
    const navigate = useNavigate()
    const [isTryOnOpen, setIsTryOnOpen] = useState(false)
    const [formData, setFormData] = useState({
        email: '',
        name: '',
        surname: '',
        village: '',
        companyName: '',
        websiteUrl: '',
        framesInCatalog: '',
        message: ''
    })
    const [errors, setErrors] = useState<{ [key: string]: string }>({})
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitError, setSubmitError] = useState<string>('')

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }))
        }
    }

    const validateForm = () => {
        const newErrors: { [key: string]: string } = {}

        if (!formData.email.trim()) {
            newErrors.email = 'Email is required'
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Please enter a valid email'
        }

        if (!formData.name.trim()) {
            newErrors.name = 'Name is required'
        }

        if (!formData.surname.trim()) {
            newErrors.surname = 'Surname is required'
        }

        if (!formData.village || formData.village === 'Village *') {
            newErrors.village = 'Village is required'
        }

        if (!formData.companyName.trim()) {
            newErrors.companyName = 'Company name is required'
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitError('')

        if (!validateForm()) {
            return
        }

        setIsSubmitting(true)
        try {
            // Prepare payload - backend expects 'name' and 'surname'
            const payload: Record<string, any> = {
                email: formData.email,
                name: formData.name,
                surname: formData.surname,
                village: formData.village,
                company_name: formData.companyName,
            }

            if (formData.websiteUrl) payload.website_url = formData.websiteUrl
            if (formData.framesInCatalog) payload.number_of_frames = formData.framesInCatalog
            if (formData.message) payload.message = formData.message

            // Remove undefined fields
            Object.keys(payload).forEach(key => {
                if (payload[key as keyof typeof payload] === undefined) {
                    delete payload[key as keyof typeof payload]
                }
            })

            if (import.meta.env.DEV) {
                console.log('[Demo Form] Submitting payload:', payload)
            }

            const response = await apiClient.post(
                API_ROUTES.FORMS.DEMO.SUBMIT,
                payload,
                false
            )

            if (response.success) {
                // Navigate to thank you page on success
                navigate('/thank-you')
            } else {
                // Show detailed error message from backend
                const errorMsg = response.error || response.message || 'Failed to submit demo request. Please try again.'
                setSubmitError(errorMsg)
                if (import.meta.env.DEV) {
                    console.error('Demo submission error:', response)
                }
            }
        } catch (error: any) {
            setSubmitError(error.message || 'An error occurred. Please try again.')
            if (import.meta.env.DEV) {
                console.error('Demo submission exception:', error)
            }
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <section id="live-demo" className="bg-white py-16 px-4">
            <div className="w-[90%] mx-auto grid gap-10 lg:grid-cols-2">
                {/* Left image panel */}
                <div className="relative overflow-hidden image-cover rounded-3xl shadow-2xl h-[630px]">
                    <img
                        src="/assets/images/virtual-try.jpg"
                        alt="Virtual eyewear try-on"
                        className="h-full w-full object-cover"
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

                    <div className="absolute inset-0 flex flex-col items-center justify-end pb-10 px-6 text-white space-y-4 text-center">
                        <p className="text-lg font-medium max-w-xl">
                            <span className="block">Discover our ultra-realistic</span>
                            <span className="block">virtual eyewear try-on solution</span>
                        </p>
                        <button
                            onClick={() => setIsTryOnOpen(true)}
                            className="rounded-full bg-white/90 text-slate-900 px-8 py-3 font-semibold shadow-lg hover:bg-white transition-colors"
                        >
                            Try on glasses
                        </button>
                    </div>
                </div>

                {/* Right form panel */}
                <div className="bg-white rounded-3xl shadow-[0_20px_45px_rgba(14,30,37,0.08)] p-8 space-y-6 border border-slate-100">
                    <div className="text-center lg:text-left space-y-2">
                        <p className="text-slate-600 text-sm uppercase tracking-[0.35em]">Interested?</p>
                        <h2 className="text-2xl font-semibold text-slate-800">Interested in the OptiShop solution?</h2>
                        <p className="text-xl text-blue-700 font-semibold">Book a live demo</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4 text-slate-700">
                        <div>
                            <input
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                className={`w-full rounded-full border ${errors.email ? 'border-red-300' : 'border-slate-200'} px-5 py-3 focus:outline-none focus:ring-2 focus:ring-blue-400`}
                                placeholder="Email *"
                            />
                            {errors.email && <p className="text-red-500 text-sm mt-1 ml-2">{errors.email}</p>}
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <input
                                    name="name"
                                    type="text"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    className={`rounded-full border ${errors.name ? 'border-red-300' : 'border-slate-200'} px-5 py-3 focus:outline-none focus:ring-2 focus:ring-blue-400`}
                                    placeholder="Name *"
                                />
                                {errors.name && <p className="text-red-500 text-sm mt-1 ml-2">{errors.name}</p>}
                            </div>
                            <div>
                                <input
                                    name="surname"
                                    type="text"
                                    value={formData.surname}
                                    onChange={handleInputChange}
                                    className={`rounded-full border ${errors.surname ? 'border-red-300' : 'border-slate-200'} px-5 py-3 focus:outline-none focus:ring-2 focus:ring-blue-400`}
                                    placeholder="Surname *"
                                />
                                {errors.surname && <p className="text-red-500 text-sm mt-1 ml-2">{errors.surname}</p>}
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <select
                                    name="village"
                                    value={formData.village}
                                    onChange={handleInputChange}
                                    className={`rounded-full border ${errors.village ? 'border-red-300' : 'border-slate-200'} px-5 py-3 focus:outline-none focus:ring-2 focus:ring-blue-400 w-full`}
                                >
                                    <option value="">Village *</option>
                                    <option value="New York">New York</option>
                                    <option value="Paris">Paris</option>
                                    <option value="Dubai">Dubai</option>
                                </select>
                                {errors.village && <p className="text-red-500 text-sm mt-1 ml-2">{errors.village}</p>}
                            </div>
                            <div>
                                <input
                                    name="companyName"
                                    type="text"
                                    value={formData.companyName}
                                    onChange={handleInputChange}
                                    className={`rounded-full border ${errors.companyName ? 'border-red-300' : 'border-slate-200'} px-5 py-3 focus:outline-none focus:ring-2 focus:ring-blue-400`}
                                    placeholder="Company name *"
                                />
                                {errors.companyName && <p className="text-red-500 text-sm mt-1 ml-2">{errors.companyName}</p>}
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                            <input
                                name="websiteUrl"
                                type="url"
                                value={formData.websiteUrl}
                                onChange={handleInputChange}
                                className="rounded-full border border-slate-200 px-5 py-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
                                placeholder="Website URL"
                            />
                            <select
                                name="framesInCatalog"
                                value={formData.framesInCatalog}
                                onChange={handleInputChange}
                                className="rounded-full border border-slate-200 px-5 py-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
                            >
                                <option value="">Frames in catalog</option>
                                <option value="0-100">0-100</option>
                                <option value="100-500">100-500</option>
                                <option value="500+">500+</option>
                            </select>
                        </div>

                        <textarea
                            name="message"
                            value={formData.message}
                            onChange={handleInputChange}
                            className="w-full rounded-3xl border border-slate-200 px-5 py-3 min-h-[110px] resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
                            placeholder="Message"
                        />

                        {submitError && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                                {submitError}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full rounded-full bg-blue-900 text-white font-semibold py-3 shadow-lg hover:bg-blue-800 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
                                'Request a demo'
                            )}
                        </button>
                    </form>
                </div>
            </div>

            <VirtualTryOnModal open={isTryOnOpen} onClose={() => setIsTryOnOpen(false)} />
        </section>
    )
}

export default LiveDemoSection


