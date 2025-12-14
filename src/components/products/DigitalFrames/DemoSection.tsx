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
        companyName: '',
        websiteUrl: '',
        numberOfFrames: '',
        message: ''
    })
    const [errors, setErrors] = useState<{ [key: string]: string }>({})
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitError, setSubmitError] = useState<string>('')

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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
        <section className="bg-stone-100 py-16 md:py-24">
            <div className="w-[90%] mx-auto">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-white rounded-3xl shadow-lg p-8 md:p-12">
                        <div className="mb-8">
                            <h2 className="text-xl md:text-2xl font-semibold text-slate-800 mb-2">
                                Interested in the Fittingbox solution?
                            </h2>
                            <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold text-slate-800">
                                Book a live demo
                            </h3>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Email - Full Width */}
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                                    Email <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    required
                                    value={formData.email}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-3 rounded-lg border ${errors.email ? 'border-red-300' : 'border-slate-300'} focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent text-slate-900 bg-white`}
                                    placeholder="your.email@example.com"
                                />
                                {errors.email && <p className="text-red-500 text-sm mt-1 ml-1">{errors.email}</p>}
                            </div>

                            {/* Name and Surname - Two Columns */}
                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-2">
                                        Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="name"
                                        name="name"
                                        required
                                        value={formData.name}
                                        onChange={handleChange}
                                        className={`w-full px-4 py-3 rounded-lg border ${errors.name ? 'border-red-300' : 'border-slate-300'} focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent text-slate-900 bg-white`}
                                        placeholder="Your name"
                                    />
                                    {errors.name && <p className="text-red-500 text-sm mt-1 ml-1">{errors.name}</p>}
                                </div>
                                <div>
                                    <label htmlFor="surname" className="block text-sm font-medium text-slate-700 mb-2">
                                        Surname <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="surname"
                                        name="surname"
                                        required
                                        value={formData.surname}
                                        onChange={handleChange}
                                        className={`w-full px-4 py-3 rounded-lg border ${errors.surname ? 'border-red-300' : 'border-slate-300'} focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent text-slate-900 bg-white`}
                                        placeholder="Your surname"
                                    />
                                    {errors.surname && <p className="text-red-500 text-sm mt-1 ml-1">{errors.surname}</p>}
                                </div>
                            </div>

                            {/* Village and Company Name - Two Columns */}
                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="village" className="block text-sm font-medium text-slate-700 mb-2">
                                        Village <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        id="village"
                                        name="village"
                                        required
                                        value={formData.village}
                                        onChange={handleChange}
                                        className={`w-full px-4 py-3 rounded-lg border ${errors.village ? 'border-red-300' : 'border-slate-300'} focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent appearance-none bg-white text-slate-900`}
                                    >
                                        <option value="" className="text-slate-500">Select</option>
                                        <option value="village1" className="text-slate-900">Village 1</option>
                                        <option value="village2" className="text-slate-900">Village 2</option>
                                        <option value="village3" className="text-slate-900">Village 3</option>
                                    </select>
                                    {errors.village && <p className="text-red-500 text-sm mt-1 ml-1">{errors.village}</p>}
                                </div>
                                <div>
                                    <label htmlFor="companyName" className="block text-sm font-medium text-slate-700 mb-2">
                                        Company Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="companyName"
                                        name="companyName"
                                        required
                                        value={formData.companyName}
                                        onChange={handleChange}
                                        className={`w-full px-4 py-3 rounded-lg border ${errors.companyName ? 'border-red-300' : 'border-slate-300'} focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent text-slate-900 bg-white`}
                                        placeholder="Your company name"
                                    />
                                    {errors.companyName && <p className="text-red-500 text-sm mt-1 ml-1">{errors.companyName}</p>}
                                </div>
                            </div>

                            {/* Website URL and Number of Frames - Two Columns */}
                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="websiteUrl" className="block text-sm font-medium text-slate-700 mb-2">
                                        Website URL
                                    </label>
                                    <input
                                        type="url"
                                        id="websiteUrl"
                                        name="websiteUrl"
                                        value={formData.websiteUrl}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent text-slate-900 bg-white"
                                        placeholder="https://example.com"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="numberOfFrames" className="block text-sm font-medium text-slate-700 mb-2">
                                        Number of frames in the catalog
                                    </label>
                                    <select
                                        id="numberOfFrames"
                                        name="numberOfFrames"
                                        value={formData.numberOfFrames}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent appearance-none bg-white text-slate-900"
                                    >
                                        <option value="" className="text-slate-500">Select</option>
                                        <option value="0-100" className="text-slate-900">0 - 100</option>
                                        <option value="101-500" className="text-slate-900">101 - 500</option>
                                        <option value="501-1000" className="text-slate-900">501 - 1,000</option>
                                        <option value="1001-5000" className="text-slate-900">1,001 - 5,000</option>
                                        <option value="5000+" className="text-slate-900">5,000+</option>
                                    </select>
                                </div>
                            </div>

                            {/* Message - Full Width */}
                            <div>
                                <label htmlFor="message" className="block text-sm font-medium text-slate-700 mb-2">
                                    Message
                                </label>
                                <textarea
                                    id="message"
                                    name="message"
                                    rows={5}
                                    value={formData.message}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent resize-y text-slate-900 bg-white"
                                    placeholder="Message"
                                />
                            </div>

                            {/* Submit Button */}
                            {submitError && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                                    {submitError}
                                </div>
                            )}

                            <div className="flex justify-center pt-4">
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-8 py-3 bg-slate-800 text-white font-bold rounded-lg hover:bg-slate-700 transition-colors duration-300 shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
                </div>
            </div>
        </section>
    )
}

export default DemoSection

