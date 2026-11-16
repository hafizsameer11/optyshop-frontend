import React, { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { submitContactForm } from '../../services/contactFormService'
import { getContactLocations, type ContactLocation } from '../../services/contactLocationsService'

const initialForm = {
    email: '',
    firstName: '',
    lastName: '',
    country: '',
    message: ''
}

interface ContactFormSectionProps {
    /** `compact`: single-column form only (e.g. home page). `default`: full layout with locations column. */
    variant?: 'default' | 'compact'
}

const ContactFormSection: React.FC<ContactFormSectionProps> = ({ variant = 'default' }) => {
    const isCompact = variant === 'compact'
    const { t } = useTranslation()
    const formPanelRef = useRef<HTMLDivElement>(null)
    const [formData, setFormData] = useState({
        email: '',
        firstName: '',
        lastName: '',
        country: '',
        message: ''
    })
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitError, setSubmitError] = useState<string>('')
    const [submitSuccess, setSubmitSuccess] = useState(false)
    const [locations, setLocations] = useState<ContactLocation[]>([])
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    useEffect(() => {
        if (submitSuccess && formPanelRef.current) {
            formPanelRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
    }, [submitSuccess])

    useEffect(() => {
        if (isCompact) return
        let cancelled = false
        ;(async () => {
            const data = await getContactLocations()
            if (!cancelled) setLocations(data)
        })()
        return () => { cancelled = true }
    }, [isCompact])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        })
        // Clear error when user starts typing
        if (submitError) {
            setSubmitError('')
        }
        if (submitSuccess) {
            setSubmitSuccess(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitError('')

        const normalized = {
            email: formData.email.trim(),
            firstName: formData.firstName.trim(),
            lastName: formData.lastName.trim(),
            country: formData.country.trim(),
            message: formData.message.trim(),
        }

        // Basic validation
        if (!normalized.email || !normalized.firstName || !normalized.lastName || !normalized.country || !normalized.message) {
            setSubmitError(t('contact.fillAllFields') || 'Please fill in all required fields')
            return
        }
        if (!emailRegex.test(normalized.email)) {
            setSubmitError(t('contact.invalidEmail') || 'Please enter a valid email address')
            return
        }
        if (normalized.message.length < 10) {
            setSubmitError(t('contact.messageTooShort') || 'Message should be at least 10 characters')
            return
        }

        setIsSubmitting(true)
        try {
            const payload = {
                email: normalized.email,
                firstName: normalized.firstName,
                lastName: normalized.lastName,
                country: normalized.country,
                message: normalized.message
            }

            if (import.meta.env.DEV) {
                console.log('[Contact Form] Submitting payload:', payload)
            }

            const result = await submitContactForm(payload)

            if (result.success) {
                setFormData({ ...initialForm })
                setSubmitError('')
                setSubmitSuccess(true)
            } else {
                const errorMsg = result.message || t('contact.errorSending')
                setSubmitError(errorMsg)
                if (import.meta.env.DEV) {
                    console.error('Contact form submission error:', result)
                }
            }
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : String(error)
            setSubmitError(msg || t('contact.errorSending'))
            if (import.meta.env.DEV) {
                console.error('Contact form submission exception:', error)
            }
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <section
            className={`bg-gray-50 px-4 sm:px-6 ${isCompact ? 'py-10 md:py-14' : 'py-12 md:py-16 lg:py-20'}`}
        >
            <div className={`w-[90%] mx-auto ${isCompact ? 'max-w-3xl' : 'max-w-7xl'}`}>
                <div className={isCompact ? '' : 'grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12'}>
                    {/* Left Section - Contact Form */}
                    <div
                        ref={formPanelRef}
                        className={`bg-white rounded-2xl p-6 md:p-8 shadow-lg ${isCompact ? '' : 'lg:h-[880px] lg:p-10'}`}
                    >
                        <h2 className="text-2xl md:text-3xl font-bold text-blue-950 mb-6 md:mb-8">
                            {isCompact ? t('home.contactTeaser.title') : t('contact.sendRequest') || 'Send us your request'}
                        </h2>
                        {isCompact && (
                            <p className="text-sm text-gray-600 mb-6 -mt-2">{t('home.contactTeaser.subtitle')}</p>
                        )}

                        {submitSuccess && (
                            <div
                                className="mb-6 p-5 rounded-xl border border-green-200 bg-green-50 text-green-900"
                                role="status"
                                aria-live="polite"
                            >
                                <p className="text-lg font-semibold">
                                    {t('contact.messageSent', 'Message sent successfully!')}
                                </p>
                                <p className="mt-2 text-sm text-green-800">
                                    {t(
                                        'contact.successDetail',
                                        'We have received your message and will get back to you soon.'
                                    )}
                                </p>
                                <button
                                    type="button"
                                    onClick={() => setSubmitSuccess(false)}
                                    className="mt-4 text-sm font-semibold text-blue-950 underline hover:no-underline"
                                >
                                    {t('contact.sendAnother', 'Send another message')}
                                </button>
                            </div>
                        )}

                        <form
                            onSubmit={handleSubmit}
                            className={`space-y-5 md:space-y-6 ${submitSuccess ? 'hidden' : ''}`}
                            aria-hidden={submitSuccess}
                        >
                            {/* Email */}
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                    {t('contact.email')} <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    required
                                    autoComplete="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>

                            {/* First Name and Last Name */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                                        {t('contact.firstName') || 'First name'} <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="firstName"
                                        name="firstName"
                                        required
                                        autoComplete="given-name"
                                        value={formData.firstName}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                                        {t('contact.lastName') || 'Last name'} <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="lastName"
                                        name="lastName"
                                        required
                                        autoComplete="family-name"
                                        value={formData.lastName}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                            </div>

                            {/* Country */}
                            <div>
                                <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-2">
                                    {t('contact.country') || 'Country'} <span className="text-red-500">*</span>
                                </label>
                                <select
                                    id="country"
                                    name="country"
                                    required
                                    value={formData.country}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="">{t('contact.selectCountry') || 'Please Select'}</option>
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

                            {/* Message */}
                            <div>
                                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                                    {t('contact.message')} <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    id="message"
                                    name="message"
                                    required
                                    rows={5}
                                    minLength={10}
                                    maxLength={2000}
                                    value={formData.message}
                                    onChange={handleChange}
                                    placeholder={t('contact.messagePlaceholder') || 'Tell us more about your needs.'}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                                />
                            </div>

                            {/* Disclaimer */}
                            <p className="text-xs text-gray-500">
                                *Fittingbox needs your contact information to share details about our products and services. You can unsubscribe from these communications at any time. Learn more in our{' '}
                                <a href="#" className="underline hover:text-blue-950">
                                    Privacy Policy
                                </a>
                                .
                            </p>

                            {/* Error Message */}
                            {submitError && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                                    {submitError}
                                </div>
                            )}

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full bg-blue-950 text-white px-6 md:px-8 py-3 md:py-4 rounded-lg font-semibold text-base md:text-lg hover:bg-blue-900 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? (
                                    <>
                                        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        <span>{t('contact.sending')}</span>
                                    </>
                                ) : (
                                    t('contact.sendMessage')
                                )}
                            </button>
                        </form>
                    </div>

                    {/* Right Section - Locations and Contact Details */}
                    {!isCompact && (
                    <div className="bg-white rounded-2xl p-6 md:p-8 lg:p-10 shadow-lg">
                        <h2 className="text-2xl md:text-3xl font-bold text-blue-950 mb-6 md:mb-8">
                            {t('contact.locations') || 'Locations'}
                        </h2>

                        <div className="space-y-8">
                            {locations.length === 0 ? (
                                <p className="text-sm text-gray-500">Locations will appear here once added in the admin panel.</p>
                            ) : (
                                locations.map((loc, index) => {
                                    const addressLines = (loc.address || "")
                                        .split(/\r?\n/)
                                        .map((line) => line.trim())
                                        .filter(Boolean)
                                    const phoneHref = loc.phone ? `tel:${loc.phone.replace(/\s+/g, "")}` : undefined
                                    return (
                                        <div key={loc.id}>
                                            {index > 0 && <div className="h-px bg-gray-300 mb-8"></div>}
                                            <h3 className="text-lg md:text-xl font-bold text-blue-950 mb-4">{loc.title}</h3>
                                            <div className="space-y-3 text-gray-700">
                                                {(loc.subtitle || addressLines.length > 0) && (
                                                    <div>
                                                        {loc.subtitle ? <p className="font-semibold mb-1">{loc.subtitle}</p> : null}
                                                        {addressLines.map((line) => (
                                                            <p key={line}>{line}</p>
                                                        ))}
                                                    </div>
                                                )}
                                                {loc.phone && (
                                                    <div>
                                                        <p className="font-semibold mb-1">Phone</p>
                                                        <a href={phoneHref} className="hover:text-blue-950">{loc.phone}</a>
                                                    </div>
                                                )}
                                                {loc.email && (
                                                    <div>
                                                        <p className="font-semibold mb-1">Email</p>
                                                        <a href={`mailto:${loc.email}`} className="hover:text-blue-950">{loc.email}</a>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    </div>
                    )}
                </div>
            </div>
        </section>
    )
}

export default ContactFormSection

