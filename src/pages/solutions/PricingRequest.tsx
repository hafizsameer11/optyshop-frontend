import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import { apiClient } from '../../utils/api'
import { API_ROUTES } from '../../config/apiRoutes'

const PricingRequest: React.FC = () => {
    const [step, setStep] = useState(1)
    const [isSubmitted, setIsSubmitted] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitError, setSubmitError] = useState('')
    const [formData, setFormData] = useState({
        businessEmail: '',
        name: '',
        surname: '',
        village: '',
        companyName: '',
        numberOfFrames: '',
        numberOfProducts: '',
        brandCategories: [] as string[],
        hdPackshots: false,
        message: '',
    })

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target
        if (type === 'checkbox') {
            const checked = (e.target as HTMLInputElement).checked
            if (name === 'hdPackshots') {
                setFormData({
                    ...formData,
                    [name]: checked,
                })
            } else {
                // Handle brand categories checkboxes
                setFormData({
                    ...formData,
                    brandCategories: checked
                        ? [...formData.brandCategories, value]
                        : formData.brandCategories.filter((cat) => cat !== value),
                })
            }
        } else {
            setFormData({
                ...formData,
                [name]: value,
            })
        }
    }

    const handleStep1Submit = (e: React.FormEvent) => {
        e.preventDefault()
        setStep(2)
    }

    const handleStep2Submit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitError('')

        // Basic validation
        if (!formData.businessEmail || !formData.name || !formData.surname || !formData.village || !formData.companyName || !formData.numberOfFrames || !formData.numberOfProducts) {
            setSubmitError('Please fill in all required fields')
            return
        }

        setIsSubmitting(true)
        try {
            // Map form data to API payload
            // The API expects: email, company, monthlyTraffic, skuCount, priority
            // We'll map our fields appropriately
            const payload: Record<string, any> = {
                email: formData.businessEmail,
                company: formData.companyName,
                monthlyTraffic: formData.numberOfFrames, // Map frames to traffic
                skuCount: formData.numberOfProducts, // Map products to SKU count
                priority: 'medium', // Default priority
            }

            // Add optional fields if provided
            if (formData.message) {
                payload.message = formData.message
            }
            if (formData.brandCategories.length > 0) {
                payload.brandCategories = formData.brandCategories
            }
            if (formData.hdPackshots) {
                payload.hdPackshots = true
            }

            if (import.meta.env.DEV) {
                console.log('[Pricing Form] Submitting payload:', payload)
            }

            const response = await apiClient.post(
                API_ROUTES.FORMS.PRICING.SUBMIT,
                payload,
                false
            )

            if (response.success) {
                setIsSubmitted(true)
            } else {
                const errorMsg = response.error || response.message || 'Failed to submit pricing request. Please try again.'
                setSubmitError(errorMsg)
                if (import.meta.env.DEV) {
                    console.error('Pricing form submission error:', response)
                }
            }
        } catch (error: any) {
            setSubmitError(error.message || 'An error occurred. Please try again.')
            if (import.meta.env.DEV) {
                console.error('Pricing form submission exception:', error)
            }
        } finally {
            setIsSubmitting(false)
        }
    }

    const solutions = [
        {
            title: 'Digitalized frames',
            description: 'Our customizable process provides high-quality 3D rendering and modeling. Browse 100,000 digital stills in packshot and 3D.',
            image: '/assets/images/DSC1777_square.webp',
            path: '/digital-frames',
        },
        {
            title: 'Optical instruments',
            description: 'We bring your optical experience into the digital world and provide high-quality service to your customers while they shop.',
            image: '/assets/images/Microsoft.webp',
            path: '/optical-instruments',
        },
        {
            title: 'Open innovation',
            description: 'Our Open Innovation program was created to enable companies to develop new features and tailored products with us, focusing on their needs.',
            image: '/assets/images/DSC0763.webp',
            path: '/open-innovation',
        },
    ]

    // If form is submitted, show confirmation page
    if (isSubmitted) {
        return (
            <div className="bg-white min-h-screen">
                <Navbar />

                {/* Thank You Section */}
                <section
                    className="relative min-h-[400px] md:min-h-[500px] flex items-center py-12 md:py-16 lg:py-20 px-4 sm:px-6 bg-cover bg-center bg-no-repeat"
                    style={{
                        backgroundImage: 'url(/assets/images/DSC1613_M-1.webp)',
                    }}
                >
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
                    <div className="relative z-10 w-[90%] mx-auto max-w-4xl">
                        <div className="text-white">
                            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
                                Thank you for your request!
                            </h1>
                            <div className="w-24 h-0.5 bg-white mb-6"></div>
                            <p className="text-lg md:text-xl mb-4">
                                Our team will contact you within 2 business days to provide you with a quote tailored to your business.
                            </p>
                            <p className="text-base md:text-lg italic text-white/90">
                                If you don&apos;t receive a response, please check your spam folder.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Color Bar Separator */}
                <div className="h-1 bg-gradient-to-r from-orange-500 via-red-500 via-blue-400 to-blue-950"></div>

                {/* Solutions Section */}
                <section className="bg-white py-12 md:py-16 lg:py-20 px-4 sm:px-6">
                    <div className="w-[90%] mx-auto max-w-7xl">
                        <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-center mb-12 md:mb-16 text-blue-950">
                            In the meantime, you can <span className="font-bold">continue to explore our solutions</span>
                        </h2>

                        {/* Solution Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                            {solutions.map((solution, index) => (
                                <div
                                    key={index}
                                    className="bg-blue-950 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300"
                                >
                                    <div className="relative h-48 md:h-64 overflow-hidden">
                                        <img
                                            src={solution.image}
                                            alt={solution.title}
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-blue-950/80 to-transparent"></div>
                                    </div>
                                    <div className="p-6 md:p-8">
                                        <h3 className="text-xl md:text-2xl font-bold text-white mb-3 md:mb-4">
                                            {solution.title}
                                        </h3>
                                        <p className="text-white/90 text-sm md:text-base leading-relaxed mb-4 md:mb-6">
                                            {solution.description}
                                        </p>
                                        <Link
                                            to={solution.path}
                                            className="inline-block px-6 md:px-8 py-2 md:py-3 bg-blue-950 border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-blue-950 transition-colors duration-300 text-sm md:text-base"
                                        >
                                            You discover
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <Footer />
            </div>
        )
    }

    return (
        <div className="bg-white min-h-screen">
            <Navbar />

            {/* Header Section */}
            <section className="relative bg-gradient-to-r from-blue-950 to-blue-800 py-12 md:py-16 lg:py-20 px-4 sm:px-6">
                <div className="w-[90%] mx-auto max-w-7xl relative z-10">
                    <div className="mb-4">
                        <h1 className="text-2xl md:text-3xl lg:pt-15 lg:text-4xl font-bold text-white mb-2">
                            3D / Photo Studio | Request pricing
                        </h1>
                        <div className="w-32 h-0.5 bg-gray-300 mt-2"></div>
                    </div>
                    <p className="text-sm md:text-base text-white/90">
                        Please fill out the following information to request a personalized price.
                    </p>
                </div>
                {/* Background image overlay */}
                <div className="absolute top-0 right-0 w-1/3 h-full opacity-20">
                    <div className="w-full h-full bg-gradient-to-l from-transparent to-blue-900"></div>
                </div>
            </section>

            {/* Color Bar Separator */}
            <div className="h-1 bg-gradient-to-r from-orange-500 via-green-500 to-blue-500"></div>

            {/* Form Section */}
            <section className="bg-white py-12 md:py-16 lg:py-20 px-4 sm:px-6">
                <div className="w-[90%] mx-auto max-w-2xl">
                    {/* Form Card */}
                    <div className="bg-white rounded-lg shadow-lg p-6 md:p-8 lg:p-10">
                        {/* Progress Indicator */}
                        <div className="flex items-center justify-center mb-8">
                            <div className="flex items-center">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${step === 1 ? 'bg-blue-950 text-white' : 'bg-gray-300 text-gray-600'}`}>
                                    1
                                </div>
                                <div className="w-16 md:w-24 h-0.5 bg-gray-300 mx-2"></div>
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${step === 2 ? 'bg-blue-950 text-white' : 'bg-gray-300 text-gray-600'}`}>
                                    2
                                </div>
                            </div>
                        </div>

                        {/* Form Heading */}
                        <div className="text-center mb-8">
                            <p className="text-gray-500 text-sm md:text-base mb-2">
                                Interested in 3D digitization?
                            </p>
                            <h2 className="text-2xl md:text-3xl font-bold text-blue-950">
                                Request digitization of your models.
                            </h2>
                        </div>

                        {/* Step 1 Form */}
                        {step === 1 && (
                            <form onSubmit={handleStep1Submit} className="space-y-6">
                                {/* Business Email */}
                                <div>
                                    <label htmlFor="businessEmail" className="block text-sm font-semibold text-gray-700 mb-2">
                                        Business email <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="email"
                                        id="businessEmail"
                                        name="businessEmail"
                                        value={formData.businessEmail}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="your.email@company.com"
                                    />
                                </div>

                                {/* Name */}
                                <div>
                                    <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                                        Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="name"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Your name"
                                    />
                                </div>

                                {/* Surname */}
                                <div>
                                    <label htmlFor="surname" className="block text-sm font-semibold text-gray-700 mb-2">
                                        Surname <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="surname"
                                        name="surname"
                                        value={formData.surname}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Your surname"
                                    />
                                </div>

                                {/* Village */}
                                <div>
                                    <label htmlFor="village" className="block text-sm font-semibold text-gray-700 mb-2">
                                        Village <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        id="village"
                                        name="village"
                                        value={formData.village}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                                    >
                                        <option value="">Select</option>
                                        <option value="village1">Village 1</option>
                                        <option value="village2">Village 2</option>
                                        <option value="village3">Village 3</option>
                                    </select>
                                </div>

                                {/* Company Name */}
                                <div>
                                    <label htmlFor="companyName" className="block text-sm font-semibold text-gray-700 mb-2">
                                        Company Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="companyName"
                                        name="companyName"
                                        value={formData.companyName}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Your company name"
                                    />
                                </div>

                                {/* Continue Button */}
                                <div className="text-center pt-4">
                                    <button
                                        type="submit"
                                        className="px-8 md:px-12 py-3 md:py-4 bg-blue-700 text-white font-semibold rounded-lg hover:bg-blue-800 transition-colors duration-300 shadow-md text-base md:text-lg"
                                    >
                                        Continues
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* Step 2 Form */}
                        {step === 2 && (
                            <form onSubmit={handleStep2Submit} className="space-y-6">
                                {/* Number of frames in the catalog */}
                                <div>
                                    <label htmlFor="numberOfFrames" className="block text-sm font-semibold text-gray-700 mb-2">
                                        Number of frames in the catalog <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        id="numberOfFrames"
                                        name="numberOfFrames"
                                        value={formData.numberOfFrames}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                                    >
                                        <option value="">Select</option>
                                        <option value="1-50">1-50</option>
                                        <option value="51-100">51-100</option>
                                        <option value="101-500">101-500</option>
                                        <option value="501-1000">501-1000</option>
                                        <option value="1000+">1000+</option>
                                    </select>
                                </div>

                                {/* Number of products to be 3D scanned */}
                                <div>
                                    <label htmlFor="numberOfProducts" className="block text-sm font-semibold text-gray-700 mb-2">
                                        Number of products to be 3D scanned <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        id="numberOfProducts"
                                        name="numberOfProducts"
                                        value={formData.numberOfProducts}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Enter number"
                                        min="1"
                                    />
                                </div>

                                {/* Brand categories */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Brand categories <span className="text-red-500">*</span>
                                    </label>
                                    <div className="space-y-3">
                                        <label className="flex items-center">
                                            <input
                                                type="checkbox"
                                                name="brandCategory"
                                                value="private-label"
                                                checked={formData.brandCategories.includes('private-label')}
                                                onChange={handleChange}
                                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                            />
                                            <span className="ml-2 text-gray-700">Private label</span>
                                        </label>
                                        <label className="flex items-center">
                                            <input
                                                type="checkbox"
                                                name="brandCategory"
                                                value="international-brands"
                                                checked={formData.brandCategories.includes('international-brands')}
                                                onChange={handleChange}
                                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                            />
                                            <span className="ml-2 text-gray-700">International brands</span>
                                        </label>
                                    </div>
                                </div>

                                {/* HD Packshots checkbox */}
                                <div>
                                    <label className="flex items-center">
                                        <input
                                            type="checkbox"
                                            name="hdPackshots"
                                            checked={formData.hdPackshots}
                                            onChange={handleChange}
                                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                        />
                                        <span className="ml-2 text-gray-700">
                                            I&apos;m interested in receiving HD packshots of my glasses
                                        </span>
                                    </label>
                                </div>

                                {/* Message */}
                                <div>
                                    <label htmlFor="message" className="block text-sm font-semibold text-gray-700 mb-2">
                                        Message
                                    </label>
                                    <textarea
                                        id="message"
                                        name="message"
                                        value={formData.message}
                                        onChange={handleChange}
                                        rows={5}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
                                        placeholder="Tell us more about your needs"
                                    />
                                </div>

                                {/* Error Message */}
                                {submitError && (
                                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                                        {submitError}
                                    </div>
                                )}

                                {/* Submit Button */}
                                <div className="text-center pt-4">
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="px-8 md:px-12 py-3 md:py-4 bg-blue-950 text-white font-semibold rounded-lg hover:bg-blue-900 transition-colors duration-300 shadow-md text-base md:text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isSubmitting ? 'Submitting...' : 'Send my request'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    )
}

export default PricingRequest

