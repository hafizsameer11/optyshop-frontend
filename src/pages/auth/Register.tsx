import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'

const Register: React.FC = () => {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const { register } = useAuth()
    const { showSuccess, showError } = useToast()
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
        phone: ''
    })
    const [errors, setErrors] = useState<{ [key: string]: string }>({})
    const [successMessages, setSuccessMessages] = useState<{ [key: string]: string }>({})
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitError, setSubmitError] = useState<string>('')

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
        // Clear error and success messages when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }))
        }
        if (successMessages[name]) {
            setSuccessMessages(prev => ({
                ...prev,
                [name]: ''
            }))
        }
        if (submitError) {
            setSubmitError('')
        }

        // Check password match in real-time for confirm password field
        if (name === 'password' || name === 'confirmPassword') {
            const password = name === 'password' ? value : formData.password
            const confirmPassword = name === 'confirmPassword' ? value : formData.confirmPassword

            if (password && confirmPassword && password === confirmPassword) {
                setSuccessMessages(prev => ({
                    ...prev,
                    confirmPassword: t('auth.register.passwordsMatch') || 'Passwords match!'
                }))
                setErrors(prev => ({
                    ...prev,
                    confirmPassword: ''
                }))
            } else if (password && confirmPassword && password !== confirmPassword) {
                setSuccessMessages(prev => ({
                    ...prev,
                    confirmPassword: ''
                }))
            }
        }
    }

    const validateForm = () => {
        const newErrors: { [key: string]: string } = {}
        const newSuccessMessages: { [key: string]: string } = {}

        if (!formData.firstName.trim()) {
            newErrors.firstName = t('auth.register.firstNameRequired')
        }

        if (!formData.lastName.trim()) {
            newErrors.lastName = t('auth.register.lastNameRequired')
        }

        if (!formData.email.trim()) {
            newErrors.email = t('auth.register.emailRequired')
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = t('auth.register.emailInvalid')
        }

        if (!formData.password.trim()) {
            newErrors.password = t('auth.register.passwordRequired')
        } else if (formData.password.length < 6) {
            newErrors.password = t('auth.register.passwordMinLength')
        }

        if (!formData.confirmPassword.trim()) {
            newErrors.confirmPassword = t('auth.register.confirmPasswordRequired')
        } else if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = t('auth.register.passwordsDontMatch')
        } else if (formData.password === formData.confirmPassword && formData.password.trim()) {
            newSuccessMessages.confirmPassword = t('auth.register.passwordsMatch') || 'Passwords match!'
        }

        setErrors(newErrors)
        setSuccessMessages(newSuccessMessages)
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
            // Build registration data - only include phone if it has a value
            const registerData: any = {
                email: formData.email.trim(),
                password: formData.password,
                first_name: formData.firstName.trim(),
                last_name: formData.lastName.trim(),
            }

            // Only include phone if it's not empty
            if (formData.phone && formData.phone.trim()) {
                registerData.phone = formData.phone.trim()
            }

            // Role defaults to 'customer' if not specified
            registerData.role = 'customer'

            const result = await register(registerData)
            if (result.success) {
                // Show success message and navigate to login page
                showSuccess(t('auth.register.registrationSuccessful') || 'Registration successful! Please login to continue.')
                setTimeout(() => {
                    navigate('/login')
                }, 1500)
            } else {
                // Handle different error structures
                let errorMessage = t('auth.register.registrationFailed')

                if (result.errors && Array.isArray(result.errors) && result.errors.length > 0) {
                    errorMessage = result.errors.map((err: any) => err.msg).join(', ')
                } else if (typeof result.message === 'string') {
                    errorMessage = result.message
                } else if (result.message && typeof result.message === 'object') {
                    // If message is an object, try to extract meaningful info
                    const messageObj = result.message as any
                    if (typeof messageObj.message === 'string') {
                        errorMessage = messageObj.message
                    } else if (typeof messageObj.error === 'string') {
                        errorMessage = messageObj.error
                    } else {
                        errorMessage = JSON.stringify(messageObj)
                    }
                } else if (result.error) {
                    if (typeof result.error === 'string') {
                        errorMessage = result.error
                    } else if (typeof result.error === 'object') {
                        const errorObj = result.error as any
                        if (typeof errorObj.message === 'string') {
                            errorMessage = errorObj.message
                        } else if (typeof errorObj.error === 'string') {
                            errorMessage = errorObj.error
                        } else {
                            errorMessage = JSON.stringify(result.error)
                        }
                    }
                }

                // If there are validation errors, show them
                if (result.error && typeof result.error === 'object') {
                    const validationErrors = Object.entries(result.error)
                        .map(([field, message]) => {
                            // Handle nested message objects
                            if (typeof message === 'object') {
                                return JSON.stringify(message)
                            }
                            return `${field}: ${message}`
                        })
                        .join(', ')
                    if (validationErrors) {
                        errorMessage = `${errorMessage}: ${validationErrors}`
                    }
                }

                showError(errorMessage)
            }
        } catch (error: any) {
            let errorMessage = t('auth.register.errorOccurred')

            if (error && typeof error === 'object') {
                if (typeof error.message === 'string') {
                    errorMessage = error.message
                } else if (error.error && typeof error.error === 'string') {
                    errorMessage = error.error
                } else {
                    errorMessage = JSON.stringify(error)
                }
            } else if (typeof error === 'string') {
                errorMessage = error
            }

            showError(errorMessage)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="bg-white min-h-screen">
            <Navbar />
            {/* Hero Section */}
            <section
                className="relative min-h-[300px] md:min-h-[350px] flex items-center pt-20 md:pt-0 bg-cover bg-center bg-no-repeat"
                style={{
                    backgroundImage: 'url(/assets/images/virtual-try.jpg)',
                }}
            >
                <div className="absolute inset-0 bg-blue-950/70 backdrop-blur-sm"></div>
                <div className="relative z-10 w-[90%] mx-auto max-w-4xl text-white text-center">
                    <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
                        {t('auth.register.title')}
                    </h1>
                    <h2 className="text-lg md:text-xl lg:text-2xl font-semibold mb-6">
                        {t('auth.register.subtitle')} <span className="underline">{t('auth.register.optiShop')}</span> {t('auth.register.today')}
                    </h2>
                    <p className="text-base md:text-lg text-white/90 max-w-2xl mx-auto">
                        {t('auth.register.description')}
                    </p>
                </div>
            </section>

            {/* Breadcrumbs Section */}
            <div className="bg-white py-4 px-4 sm:px-6 border-b border-gray-200">
                <div className="w-[90%] mx-auto max-w-6xl">
                    <nav className="flex items-center gap-2 text-sm text-gray-900">
                        <Link to="/" className="flex items-center gap-2 hover:text-gray-700 transition-colors">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                            </svg>
                            <span>{t('common.home').toUpperCase()}</span>
                        </Link>
                        <span className="text-gray-500">&gt;</span>
                        <span className="text-gray-900">{t('common.register').toUpperCase()}</span>
                    </nav>
                </div>
            </div>

            <section className="bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-50 py-12 md:py-16 lg:py-20 px-4 sm:px-6">
                <div className="w-[90%] mx-auto max-w-xl">
                    <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
                        {/* Form Header */}
                        <div className="bg-gradient-to-r from-blue-950 to-blue-900 px-8 pt-8 pb-6">
                            <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">{t('auth.register.createAccount')}</h2>
                            <p className="text-blue-100 text-sm">{t('auth.register.joinMessage')}</p>
                        </div>

                        <div className="p-8 md:p-10">
                            {/* Register Form */}
                            <form onSubmit={handleSubmit} className="space-y-5">
                                {/* First Name and Last Name - Side by Side */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {/* First Name Field */}
                                    <div>
                                        <label htmlFor="firstName" className="block text-sm font-semibold text-gray-700 mb-2.5">
                                            {t('auth.register.firstName')}
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                </svg>
                                            </div>
                                            <input
                                                type="text"
                                                id="firstName"
                                                name="firstName"
                                                value={formData.firstName}
                                                onChange={handleChange}
                                                className={`w-full pl-12 pr-4 py-3.5 rounded-xl border-2 transition-all duration-200 ${errors.firstName ? 'border-red-400 bg-red-50 focus:ring-red-500 focus:border-red-500' : 'border-gray-200 bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white'} focus:outline-none text-gray-900 placeholder-gray-400`}
                                                placeholder={t('auth.register.enterFirstName')}
                                            />
                                        </div>
                                        {errors.firstName && (
                                            <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                </svg>
                                                {errors.firstName}
                                            </p>
                                        )}
                                    </div>

                                    {/* Last Name Field */}
                                    <div>
                                        <label htmlFor="lastName" className="block text-sm font-semibold text-gray-700 mb-2.5">
                                            {t('auth.register.lastName')}
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                </svg>
                                            </div>
                                            <input
                                                type="text"
                                                id="lastName"
                                                name="lastName"
                                                value={formData.lastName}
                                                onChange={handleChange}
                                                className={`w-full pl-12 pr-4 py-3.5 rounded-xl border-2 transition-all duration-200 ${errors.lastName ? 'border-red-400 bg-red-50 focus:ring-red-500 focus:border-red-500' : 'border-gray-200 bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white'} focus:outline-none text-gray-900 placeholder-gray-400`}
                                                placeholder={t('auth.register.enterLastName')}
                                            />
                                        </div>
                                        {errors.lastName && (
                                            <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                </svg>
                                                {errors.lastName}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Email Field */}
                                <div>
                                    <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2.5">
                                        {t('auth.register.emailAddress')}
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                                            </svg>
                                        </div>
                                        <input
                                            type="email"
                                            id="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            className={`w-full pl-12 pr-4 py-3.5 rounded-xl border-2 transition-all duration-200 ${errors.email ? 'border-red-400 bg-red-50 focus:ring-red-500 focus:border-red-500' : 'border-gray-200 bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white'} focus:outline-none text-gray-900 placeholder-gray-400`}
                                            placeholder={t('auth.register.enterEmail')}
                                        />
                                    </div>
                                    {errors.email && (
                                        <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                            {errors.email}
                                        </p>
                                    )}
                                </div>

                                {/* Password Field */}
                                <div>
                                    <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2.5">
                                        {t('auth.register.password')}
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                            </svg>
                                        </div>
                                        <input
                                            type="password"
                                            id="password"
                                            name="password"
                                            value={formData.password}
                                            onChange={handleChange}
                                            className={`w-full pl-12 pr-4 py-3.5 rounded-xl border-2 transition-all duration-200 ${errors.password ? 'border-red-400 bg-red-50 focus:ring-red-500 focus:border-red-500' : 'border-gray-200 bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white'} focus:outline-none text-gray-900 placeholder-gray-400`}
                                            placeholder={t('auth.register.createPassword')}
                                        />
                                    </div>
                                    {errors.password && (
                                        <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                            {errors.password}
                                        </p>
                                    )}
                                </div>

                                {/* Confirm Password Field */}
                                <div>
                                    <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-2.5">
                                        {t('auth.register.confirmPassword')}
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                            </svg>
                                        </div>
                                        <input
                                            type="password"
                                            id="confirmPassword"
                                            name="confirmPassword"
                                            value={formData.confirmPassword}
                                            onChange={handleChange}
                                            className={`w-full pl-12 pr-4 py-3.5 rounded-xl border-2 transition-all duration-200 ${errors.confirmPassword ? 'border-red-400 bg-red-50 focus:ring-red-500 focus:border-red-500' : successMessages.confirmPassword ? 'border-green-400 bg-green-50 focus:ring-green-500 focus:border-green-500' : 'border-gray-200 bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white'} focus:outline-none text-gray-900 placeholder-gray-400`}
                                            placeholder={t('auth.register.confirmPasswordPlaceholder')}
                                        />
                                    </div>
                                    {errors.confirmPassword && (
                                        <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                            {errors.confirmPassword}
                                        </p>
                                    )}
                                    {successMessages.confirmPassword && (
                                        <p className="mt-2 text-sm text-green-600 flex items-center gap-1">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            {successMessages.confirmPassword}
                                        </p>
                                    )}
                                </div>

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full rounded-xl bg-gradient-to-r from-blue-950 to-blue-900 text-white font-semibold py-4 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 group mt-6 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            <span>{t('auth.register.creatingAccount')}</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>{t('auth.register.createAccount')}</span>
                                            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                            </svg>
                                        </>
                                    )}
                                </button>
                            </form>

                            {/* Divider */}
                            <div className="relative my-8">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-200"></div>
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-4 bg-white text-gray-500">{t('auth.register.alreadyMember')}</span>
                                </div>
                            </div>

                            {/* Login Link */}
                            <div className="text-center">
                                <p className="text-gray-600 text-sm mb-3">
                                    {t('auth.register.alreadyHaveAccount')}
                                </p>
                                <Link
                                    to="/login"
                                    className="inline-block w-full rounded-xl border-2 border-blue-950 text-blue-950 font-semibold py-3.5 hover:bg-blue-950 hover:text-white transition-all duration-200 text-center"
                                >
                                    {t('auth.register.signIn')}
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            <Footer />
        </div>
    )
}

export default Register

