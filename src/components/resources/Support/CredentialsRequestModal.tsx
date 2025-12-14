import React, { useState, useEffect } from 'react'
import { apiClient } from '../../../utils/api'
import { API_ROUTES } from '../../../config/apiRoutes'

interface FormField {
    id: string
    label: string
    type: string
    required: boolean
    placeholder?: string
}

interface FormConfig {
    name: string
    title: string
    description: string
    ctaText: string
    fields: FormField[]
}

interface CredentialsRequestModalProps {
    isOpen: boolean
    onClose: () => void
}

const CredentialsRequestModal: React.FC<CredentialsRequestModalProps> = ({ isOpen, onClose }) => {
    const [config, setConfig] = useState<FormConfig | null>(null)
    const [isLoadingConfig, setIsLoadingConfig] = useState(false)
    const [formData, setFormData] = useState({
        email: '',
        firstName: '',
        lastName: '',
        phoneNumber: ''
    })
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitError, setSubmitError] = useState<string>('')
    const [submitSuccess, setSubmitSuccess] = useState(false)

    // Fetch form config
    useEffect(() => {
        if (isOpen && !config) {
            fetchConfig()
        }
    }, [isOpen])

    const fetchConfig = async () => {
        setIsLoadingConfig(true)
        try {
            const response = await apiClient.get<FormConfig>(API_ROUTES.FORMS.CREDENTIALS.CONFIG, false)
            if (response.success && response.data) {
                setConfig(response.data)
            } else {
                setSubmitError('Failed to load form configuration')
            }
        } catch (error: any) {
            setSubmitError('Failed to load form configuration')
            if (import.meta.env.DEV) {
                console.error('Error fetching credentials form config:', error)
            }
        } finally {
            setIsLoadingConfig(false)
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData({
            ...formData,
            [name]: value
        })
        if (submitError) setSubmitError('')
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitError('')
        setSubmitSuccess(false)

        // Validation
        const emailField = config?.fields.find(f => f.id === 'email')
        const firstNameField = config?.fields.find(f => f.id === 'firstName')
        const lastNameField = config?.fields.find(f => f.id === 'lastName')
        const phoneNumberField = config?.fields.find(f => f.id === 'phoneNumber')

        if (emailField?.required && !formData.email) {
            setSubmitError('Email is required')
            return
        }
        if (firstNameField?.required && !formData.firstName) {
            setSubmitError('First name is required')
            return
        }
        if (lastNameField?.required && !formData.lastName) {
            setSubmitError('Last name is required')
            return
        }
        if (phoneNumberField?.required && !formData.phoneNumber) {
            setSubmitError('Phone number is required')
            return
        }

        setIsSubmitting(true)

        try {
            // Prepare payload
            const payload: Record<string, any> = {
                email: formData.email,
                firstName: formData.firstName,
                lastName: formData.lastName
            }

            if (formData.phoneNumber) {
                payload.phoneNumber = formData.phoneNumber
            }

            if (import.meta.env.DEV) {
                console.log('[Credentials Form] Submitting:', payload)
            }

            const response = await apiClient.post(
                API_ROUTES.FORMS.CREDENTIALS.SUBMIT,
                payload,
                false
            )

            if (response.success) {
                setSubmitSuccess(true)
                // Reset form
                setFormData({
                    email: '',
                    firstName: '',
                    lastName: '',
                    phoneNumber: ''
                })
                // Close modal after 2 seconds
                setTimeout(() => {
                    onClose()
                    setSubmitSuccess(false)
                }, 2000)
            } else {
                // Handle validation errors
                if (response.data?.issues) {
                    setSubmitError(Array.isArray(response.data.issues) 
                        ? response.data.issues.join(', ')
                        : response.data.issues)
                } else {
                    setSubmitError(response.message || response.error || 'Failed to submit form. Please try again.')
                }
                if (import.meta.env.DEV) {
                    console.error('Credentials form submission error:', response)
                }
            }
        } catch (error: any) {
            setSubmitError(error.message || 'An error occurred. Please try again.')
            if (import.meta.env.DEV) {
                console.error('Credentials form submission exception:', error)
            }
        } finally {
            setIsSubmitting(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="relative bg-white rounded-2xl shadow-2xl w-[90%] max-w-2xl p-6 md:p-8 m-4">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label="Close"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                {/* Form */}
                {isLoadingConfig ? (
                    <div className="flex items-center justify-center p-8">
                        <p className="text-gray-600">Loading form...</p>
                    </div>
                ) : submitSuccess ? (
                    <div className="flex items-center justify-center p-8">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">Request submitted successfully!</h3>
                            <p className="text-gray-600">You will receive your credentials by email shortly.</p>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <h2 className="text-2xl md:text-3xl font-bold text-blue-900 mb-6">
                            {config?.title || 'Request Your Credentials'}
                        </h2>
                        {config?.description && (
                            <p className="text-sm text-gray-600 mb-6">{config.description}</p>
                        )}

                        {submitError && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                                {submitError}
                            </div>
                        )}

                        {/* Email */}
                        {config?.fields.find(f => f.id === 'email') && (
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-blue-900 mb-2">
                                    {config.fields.find(f => f.id === 'email')?.label} 
                                    {config.fields.find(f => f.id === 'email')?.required && <span className="text-red-500">*</span>}
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    required={config.fields.find(f => f.id === 'email')?.required}
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 rounded-full border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                                    placeholder={config.fields.find(f => f.id === 'email')?.placeholder || 'your.email@example.com'}
                                />
                            </div>
                        )}

                        {/* First Name and Last Name - Side by Side */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {config?.fields.find(f => f.id === 'firstName') && (
                                <div>
                                    <label htmlFor="firstName" className="block text-sm font-medium text-blue-900 mb-2">
                                        {config.fields.find(f => f.id === 'firstName')?.label} 
                                        {config.fields.find(f => f.id === 'firstName')?.required && <span className="text-red-500">*</span>}
                                    </label>
                                    <input
                                        type="text"
                                        id="firstName"
                                        name="firstName"
                                        required={config.fields.find(f => f.id === 'firstName')?.required}
                                        value={formData.firstName}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 rounded-full border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                                        placeholder="John"
                                    />
                                </div>
                            )}
                            {config?.fields.find(f => f.id === 'lastName') && (
                                <div>
                                    <label htmlFor="lastName" className="block text-sm font-medium text-blue-900 mb-2">
                                        {config.fields.find(f => f.id === 'lastName')?.label} 
                                        {config.fields.find(f => f.id === 'lastName')?.required && <span className="text-red-500">*</span>}
                                    </label>
                                    <input
                                        type="text"
                                        id="lastName"
                                        name="lastName"
                                        required={config.fields.find(f => f.id === 'lastName')?.required}
                                        value={formData.lastName}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 rounded-full border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                                        placeholder="Doe"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Phone Number */}
                        {config?.fields.find(f => f.id === 'phoneNumber') && (
                            <div>
                                <label htmlFor="phoneNumber" className="block text-sm font-medium text-blue-900 mb-2">
                                    {config.fields.find(f => f.id === 'phoneNumber')?.label} 
                                    {config.fields.find(f => f.id === 'phoneNumber')?.required && <span className="text-red-500">*</span>}
                                </label>
                                <input
                                    type="tel"
                                    id="phoneNumber"
                                    name="phoneNumber"
                                    required={config.fields.find(f => f.id === 'phoneNumber')?.required}
                                    value={formData.phoneNumber}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 rounded-full border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                                    placeholder={config.fields.find(f => f.id === 'phoneNumber')?.placeholder || '+1 234 567 8900'}
                                />
                            </div>
                        )}

                        {/* Submit Button */}
                        <div className="flex justify-center pt-4">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="bg-blue-900 text-white font-semibold px-8 py-3 rounded-lg hover:bg-blue-800 transition-colors text-base md:text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? 'Submitting...' : (config?.ctaText || 'Submit your request')}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    )
}

export default CredentialsRequestModal
