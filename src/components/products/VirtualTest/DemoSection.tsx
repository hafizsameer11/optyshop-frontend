import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiClient } from '../../../utils/api'
import { API_ROUTES } from '../../../config/apiRoutes'

const DemoSection: React.FC = () => {
    const navigate = useNavigate()
    const [formData, setFormData] = useState({
        email: '',
        name: '',
        surname: '',
        village: '',
        company: '',
        website: '',
        frames: '',
        message: ''
    })
    const [errors, setErrors] = useState<{ [key: string]: string }>({})
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitError, setSubmitError] = useState<string>('')

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
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

        if (!formData.village) {
            newErrors.village = 'Village is required'
        }

        if (!formData.company.trim()) {
            newErrors.company = 'Company name is required'
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
            const response = await apiClient.post(
                API_ROUTES.FORMS.DEMO.SUBMIT,
                {
                    email: formData.email,
                    name: formData.name,
                    surname: formData.surname,
                    village: formData.village,
                    companyName: formData.company,
                    websiteUrl: formData.website || undefined,
                    numberOfFrames: formData.frames || undefined,
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
        <section className="bg-gray-50 py-16 md:py-24 px-4">
            <div className="w-[90%] max-w-2xl mx-auto bg-white rounded-3xl shadow-lg p-8 md:p-12">

                <div className="text-center mb-10">
                    <p className="text-slate-600 text-sm md:text-base mb-2">Interested in the Fittingbox solution?</p>
                    <h2 className="text-3xl md:text-4xl font-bold text-[#0f172a] mb-8">
                        Book a live demo
                    </h2>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Email */}
                    <div>
                        <label className="block text-slate-600 text-sm font-medium mb-2">Email <span className="text-red-500">*</span></label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className={`w-full rounded-full border ${errors.email ? 'border-red-300' : 'border-slate-300'} px-5 py-3 text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400`}
                            placeholder="your@email.com"
                            required
                        />
                        {errors.email && <p className="text-red-500 text-sm mt-1 ml-2">{errors.email}</p>}
                    </div>

                    {/* Name and Surname */}
                    <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-slate-600 text-sm font-medium mb-2">Name <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className={`w-full rounded-full border ${errors.name ? 'border-red-300' : 'border-slate-300'} px-5 py-3 text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400`}
                                placeholder="John"
                                required
                            />
                            {errors.name && <p className="text-red-500 text-sm mt-1 ml-2">{errors.name}</p>}
                        </div>
                        <div>
                            <label className="block text-slate-600 text-sm font-medium mb-2">Surname <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                name="surname"
                                value={formData.surname}
                                onChange={handleChange}
                                className={`w-full rounded-full border ${errors.surname ? 'border-red-300' : 'border-slate-300'} px-5 py-3 text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400`}
                                placeholder="Doe"
                                required
                            />
                            {errors.surname && <p className="text-red-500 text-sm mt-1 ml-2">{errors.surname}</p>}
                        </div>
                    </div>

                    {/* Village and Company */}
                    <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-slate-600 text-sm font-medium mb-2">Village <span className="text-red-500">*</span></label>
                            <select
                                name="village"
                                value={formData.village}
                                onChange={handleChange}
                                className={`w-full rounded-full border ${errors.village ? 'border-red-300' : 'border-slate-300'} px-5 py-3 text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400`}
                                required
                            >
                                <option value="" className="text-slate-500">Select</option>
                                <option value="new-york" className="text-slate-900">New York</option>
                                <option value="london" className="text-slate-900">London</option>
                                <option value="paris" className="text-slate-900">Paris</option>
                                <option value="dubai" className="text-slate-900">Dubai</option>
                            </select>
                            {errors.village && <p className="text-red-500 text-sm mt-1 ml-2">{errors.village}</p>}
                        </div>
                        <div>
                            <label className="block text-slate-600 text-sm font-medium mb-2">Company Name <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                name="company"
                                value={formData.company}
                                onChange={handleChange}
                                className={`w-full rounded-full border ${errors.company ? 'border-red-300' : 'border-slate-300'} px-5 py-3 text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400`}
                                placeholder="Your Company"
                                required
                            />
                            {errors.company && <p className="text-red-500 text-sm mt-1 ml-2">{errors.company}</p>}
                        </div>
                    </div>

                    {/* Website and Frames */}
                    <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-slate-600 text-sm font-medium mb-2">Website URL</label>
                            <input
                                type="url"
                                name="website"
                                value={formData.website}
                                onChange={handleChange}
                                className="w-full rounded-full border border-slate-300 px-5 py-3 text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                                placeholder="https://example.com"
                            />
                        </div>
                        <div>
                            <label className="block text-slate-600 text-sm font-medium mb-2">Number of frames in the catalog</label>
                            <select
                                name="frames"
                                value={formData.frames}
                                onChange={handleChange}
                                className="w-full rounded-full border border-slate-300 px-5 py-3 text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                            >
                                <option value="" className="text-slate-500">Select</option>
                                <option value="0-100" className="text-slate-900">0-100</option>
                                <option value="100-500" className="text-slate-900">100-500</option>
                                <option value="500-1000" className="text-slate-900">500-1000</option>
                                <option value="1000+" className="text-slate-900">1000+</option>
                            </select>
                        </div>
                    </div>

                    {/* Message */}
                    <div>
                        <label className="block text-slate-600 text-sm font-medium mb-2">Message</label>
                        <textarea
                            name="message"
                            value={formData.message}
                            onChange={handleChange}
                            className="w-full rounded-3xl border border-slate-300 px-5 py-3 min-h-[120px] resize-none text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                            placeholder="Your message..."
                        />
                    </div>

                    {/* Submit Button */}
                    <div className="text-center pt-4">
                        {submitError && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                                {submitError}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-10 py-3 bg-[#1e3a8a] text-white font-semibold rounded-full shadow-lg hover:bg-[#1a3276] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
                    </div>
                </form>
            </div>
        </section>
    )
}

export default DemoSection
