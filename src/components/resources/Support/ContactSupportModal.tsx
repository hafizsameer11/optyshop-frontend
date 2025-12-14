import React, { useState, useEffect } from 'react'
import { apiClient } from '../../../utils/api'
import { API_ROUTES } from '../../../config/apiRoutes'

interface FormField {
    id: string
    label: string
    type: string
    required: boolean
    placeholder?: string
    description?: string
    options?: Array<{ value: string; label: string }>
    accept?: string
    multiple?: boolean
    maxFiles?: number
    maxSize?: number
}

interface FormConfig {
    name: string
    title: string
    description: string
    ctaText: string
    fields: FormField[]
}

interface ContactSupportModalProps {
    isOpen: boolean
    onClose: () => void
}

const ContactSupportModal: React.FC<ContactSupportModalProps> = ({ isOpen, onClose }) => {
    const [config, setConfig] = useState<FormConfig | null>(null)
    const [isLoadingConfig, setIsLoadingConfig] = useState(false)
    const [formData, setFormData] = useState({
        email: '',
        firstName: '',
        lastName: '',
        phoneNumber: '',
        solutionsConcerned: [] as string[],
        message: '',
        attachments: [] as File[]
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
            const response = await apiClient.get<FormConfig>(API_ROUTES.FORMS.SUPPORT.CONFIG, false)
            if (response.success && response.data) {
                setConfig(response.data)
            } else {
                setSubmitError('Failed to load form configuration')
            }
        } catch (error: any) {
            setSubmitError('Failed to load form configuration')
            if (import.meta.env.DEV) {
                console.error('Error fetching support form config:', error)
            }
        } finally {
            setIsLoadingConfig(false)
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setFormData({
            ...formData,
            [name]: value
        })
        if (submitError) setSubmitError('')
    }

    const handleCheckboxChange = (value: string) => {
        setFormData({
            ...formData,
            solutionsConcerned: formData.solutionsConcerned.includes(value)
                ? formData.solutionsConcerned.filter(s => s !== value)
                : [...formData.solutionsConcerned, value]
        })
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files)
            const maxFiles = config?.fields.find(f => f.id === 'attachments')?.maxFiles || 5
            const maxSize = config?.fields.find(f => f.id === 'attachments')?.maxSize || 104857600

            if (files.length > maxFiles) {
                setSubmitError(`Maximum ${maxFiles} files allowed`)
                return
            }

            // Validate file sizes
            const oversizedFiles = files.filter(file => file.size > maxSize)
            if (oversizedFiles.length > 0) {
                setSubmitError(`File size exceeds ${(maxSize / 1024 / 1024).toFixed(0)}MB limit: ${oversizedFiles.map(f => f.name).join(', ')}`)
                return
            }

                setFormData({
                    ...formData,
                    attachments: files
                })
            if (submitError) setSubmitError('')
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitError('')
        setSubmitSuccess(false)

        // Validation
        const emailField = config?.fields.find(f => f.id === 'email')
        const firstNameField = config?.fields.find(f => f.id === 'firstName')
        const lastNameField = config?.fields.find(f => f.id === 'lastName')
        const messageField = config?.fields.find(f => f.id === 'message')

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
        if (messageField?.required && !formData.message) {
            setSubmitError('Message is required')
            return
        }

        setIsSubmitting(true)

        try {
            // Prepare payload - backend expects JSON with solutionsConcerned as array
            const payload: Record<string, any> = {
                email: formData.email,
                firstName: formData.firstName,
                lastName: formData.lastName,
                solutionsConcerned: formData.solutionsConcerned, // This must be an array!
                message: formData.message
            }

            // Add optional fields
            if (formData.phoneNumber) {
                payload.phoneNumber = formData.phoneNumber
            }

            // Handle file attachments - convert to base64 and include in JSON
            if (formData.attachments.length > 0) {
                const attachmentsBase64: Array<{
                    name: string
                    type: string
                    size: number
                    data: string
                }> = []

                // Convert each file to base64
                for (const file of formData.attachments) {
                    const base64 = await new Promise<string>((resolve, reject) => {
                        const reader = new FileReader()
                        reader.onload = () => {
                            const result = reader.result as string
                            // Remove data URL prefix (e.g., "data:application/pdf;base64,")
                            const base64Data = result.split(',')[1]
                            resolve(base64Data)
                        }
                        reader.onerror = reject
                        reader.readAsDataURL(file)
                    })

                    attachmentsBase64.push({
                        name: file.name,
                        type: file.type,
                        size: file.size,
                        data: base64
                    })
                }

                payload.attachments = attachmentsBase64
            }

            if (import.meta.env.DEV) {
                console.log('[Support Form] Submitting JSON:', {
                    email: formData.email,
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    phoneNumber: formData.phoneNumber,
                    solutionsConcerned: formData.solutionsConcerned,
                    message: formData.message,
                    attachmentsCount: formData.attachments.length
                })
            }

            const response = await apiClient.post(
                API_ROUTES.FORMS.SUPPORT.SUBMIT,
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
            phoneNumber: '',
                    solutionsConcerned: [],
            message: '',
            attachments: []
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
                    console.error('Support form submission error:', response)
                }
            }
        } catch (error: any) {
            setSubmitError(error.message || 'An error occurred. Please try again.')
            if (import.meta.env.DEV) {
                console.error('Support form submission exception:', error)
            }
        } finally {
            setIsSubmitting(false)
        }
    }

    if (!isOpen) return null

    const solutionsField = config?.fields.find(f => f.id === 'solutionsConcerned')
    const attachmentsField = config?.fields.find(f => f.id === 'attachments')

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm overflow-y-auto py-4">
            <div className="relative bg-white rounded-2xl shadow-2xl w-[90%] max-w-4xl max-h-[90vh] flex flex-col m-4">
                {/* Header - Fixed */}
                <div className="flex-shrink-0 p-6 md:p-8 pb-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                        <h2 className="text-2xl md:text-3xl font-bold text-blue-900">
                                {config?.title || 'Get in touch with our support team'}
                        </h2>
                            {config?.description && (
                                <p className="text-sm text-gray-600 mt-2">{config.description}</p>
                            )}
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                            aria-label="Close"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Form - Scrollable */}
                {isLoadingConfig ? (
                    <div className="flex-1 flex items-center justify-center p-8">
                        <p className="text-gray-600">Loading form...</p>
                    </div>
                ) : submitSuccess ? (
                    <div className="flex-1 flex items-center justify-center p-8">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">Message sent successfully!</h3>
                            <p className="text-gray-600">We'll get back to you soon.</p>
                        </div>
                    </div>
                ) : (
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
                        {submitError && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                                {submitError}
                            </div>
                        )}

                    {/* Email */}
                        {config?.fields.find(f => f.id === 'email') && (
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
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
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                                    placeholder={config.fields.find(f => f.id === 'email')?.placeholder || 'your.email@example.com'}
                        />
                    </div>
                        )}

                    {/* First Name and Last Name - Side by Side */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {config?.fields.find(f => f.id === 'firstName') && (
                        <div>
                            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
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
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                                placeholder="John"
                            />
                        </div>
                            )}
                            {config?.fields.find(f => f.id === 'lastName') && (
                        <div>
                            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
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
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                                placeholder="Doe"
                            />
                        </div>
                            )}
                    </div>

                    {/* Phone Number */}
                        {config?.fields.find(f => f.id === 'phoneNumber') && (
                    <div>
                        <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-2">
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
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                                    placeholder={config.fields.find(f => f.id === 'phoneNumber')?.placeholder || '+1 234 567 8900'}
                        />
                    </div>
                        )}

                    {/* Solutions Concerned */}
                        {solutionsField && solutionsField.options && (
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                    {solutionsField.label}
                        </h3>
                                {solutionsField.description && (
                        <p className="text-sm text-gray-600 mb-4">
                                        {solutionsField.description}
                        </p>
                                )}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {solutionsField.options.map((option) => (
                                <label
                                            key={option.value}
                                    className="flex items-start gap-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    <input
                                        type="checkbox"
                                                checked={formData.solutionsConcerned.includes(option.value)}
                                                onChange={() => handleCheckboxChange(option.value)}
                                        className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                            <span className="text-sm text-gray-700">{option.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                        )}

                    {/* Message */}
                        {config?.fields.find(f => f.id === 'message') && (
                    <div>
                        <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                                    {config.fields.find(f => f.id === 'message')?.label} 
                                    {config.fields.find(f => f.id === 'message')?.required && <span className="text-red-500">*</span>}
                        </label>
                        <textarea
                            id="message"
                            name="message"
                                    required={config.fields.find(f => f.id === 'message')?.required}
                            value={formData.message}
                            onChange={handleChange}
                            rows={6}
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors resize-y"
                                    placeholder={config.fields.find(f => f.id === 'message')?.placeholder || 'Let us know how we can help you, please detail your request in a few lines.'}
                        />
                    </div>
                        )}

                    {/* Attachments */}
                        {attachmentsField && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {attachmentsField.label}
                        </label>
                                {attachmentsField.description && (
                        <p className="text-sm text-gray-600 mb-3">
                                        {attachmentsField.description}
                        </p>
                                )}
                        <div className="flex items-center gap-4">
                            <label className="cursor-pointer">
                                <span className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors inline-block">
                                    Choose Files
                                </span>
                                <input
                                    type="file"
                                            multiple={attachmentsField.multiple}
                                            accept={attachmentsField.accept}
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                            </label>
                            <span className="text-sm text-gray-500">
                                {formData.attachments.length > 0
                                    ? `${formData.attachments.length} file(s) selected`
                                    : 'No file chosen'}
                            </span>
                        </div>
                        {formData.attachments.length > 0 && (
                            <ul className="mt-2 space-y-1">
                                {formData.attachments.map((file, index) => (
                                    <li key={index} className="text-sm text-gray-600">
                                        {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                        )}

                    {/* Submit Button */}
                    <div className="flex justify-center pt-4 pb-2">
                        <button
                            type="submit"
                                disabled={isSubmitting}
                                className="bg-blue-900 text-white font-semibold px-8 py-3 rounded-lg hover:bg-blue-800 transition-colors text-base md:text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                                {isSubmitting ? 'Sending...' : (config?.ctaText || 'Send your message')}
                        </button>
                    </div>
                </form>
                )}
            </div>
        </div>
    )
}

export default ContactSupportModal
