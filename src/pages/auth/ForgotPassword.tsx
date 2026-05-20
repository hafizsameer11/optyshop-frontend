import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import { useToast } from '../../context/ToastContext'
import { requestPasswordReset } from '../../services/authPasswordService'
import { formatErrorMessage } from '../../utils/errorUtils'

const ForgotPassword: React.FC = () => {
    const { t } = useTranslation()
    const { showSuccess, showError } = useToast()
    const [email, setEmail] = useState('')
    const [error, setError] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitted, setSubmitted] = useState(false)

    const validate = () => {
        if (!email.trim()) {
            setError(t('auth.forgotPassword.emailRequired'))
            return false
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
            setError(t('auth.forgotPassword.emailInvalid'))
            return false
        }
        setError('')
        return true
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!validate()) return

        setIsSubmitting(true)
        try {
            const result = await requestPasswordReset(email)
            if (result.success) {
                setSubmitted(true)
                showSuccess(
                    result.message ||
                        t('auth.forgotPassword.emailSent')
                )
            } else {
                showError(result.message || t('auth.forgotPassword.requestFailed'))
            }
        } catch (err: unknown) {
            showError(formatErrorMessage(err))
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="bg-white min-h-screen">
            <Navbar />
            <section
                className="relative min-h-[260px] md:min-h-[300px] flex items-center pt-20 md:pt-0 bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: 'url(/assets/images/virtual-try.jpg)' }}
            >
                <div className="absolute inset-0 bg-blue-950/70 backdrop-blur-sm" />
                <div className="relative z-10 w-[90%] mx-auto max-w-4xl text-white text-center">
                    <h1 className="text-3xl md:text-4xl font-bold mb-4">
                        {t('auth.forgotPassword.title')}
                    </h1>
                    <p className="text-base md:text-lg text-white/90 max-w-2xl mx-auto">
                        {t('auth.forgotPassword.description')}
                    </p>
                </div>
            </section>

            <section className="bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-50 py-12 md:py-16 px-4 sm:px-6">
                <div className="w-[90%] mx-auto max-w-xl">
                    <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
                        <div className="bg-gradient-to-r from-blue-950 to-blue-900 px-8 pt-8 pb-6">
                            <h2 className="text-2xl font-bold text-white">
                                {t('auth.forgotPassword.heading')}
                            </h2>
                        </div>

                        <div className="p-8 md:p-10">
                            {submitted ? (
                                <div className="space-y-6 text-center">
                                    <p className="text-gray-700">
                                        {t('auth.forgotPassword.checkInbox')}
                                    </p>
                                    <Link
                                        to="/login"
                                        className="inline-flex items-center justify-center w-full rounded-xl bg-gradient-to-r from-blue-950 to-blue-900 text-white font-semibold py-4"
                                    >
                                        {t('auth.forgotPassword.backToLogin')}
                                    </Link>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-5">
                                    <div>
                                        <label
                                            htmlFor="email"
                                            className="block text-sm font-semibold text-gray-700 mb-2.5"
                                        >
                                            {t('auth.forgotPassword.emailAddress')}
                                        </label>
                                        <input
                                            type="email"
                                            id="email"
                                            name="email"
                                            value={email}
                                            onChange={(e) => {
                                                setEmail(e.target.value)
                                                if (error) setError('')
                                            }}
                                            className={`w-full px-4 py-3.5 rounded-xl border-2 transition-all ${
                                                error
                                                    ? 'border-red-400 bg-red-50'
                                                    : 'border-gray-200 bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                                            } focus:outline-none text-gray-900`}
                                            placeholder={t('auth.forgotPassword.enterEmail')}
                                        />
                                        {error && (
                                            <p className="mt-2 text-sm text-red-600">{error}</p>
                                        )}
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full rounded-xl bg-gradient-to-r from-blue-950 to-blue-900 text-white font-semibold py-4 disabled:opacity-50"
                                    >
                                        {isSubmitting
                                            ? t('auth.forgotPassword.sending')
                                            : t('auth.forgotPassword.sendLink')}
                                    </button>

                                    <p className="text-center text-sm text-gray-600">
                                        <Link
                                            to="/login"
                                            className="text-blue-600 hover:text-blue-800 font-medium hover:underline"
                                        >
                                            {t('auth.forgotPassword.backToLogin')}
                                        </Link>
                                    </p>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            </section>
            <Footer />
        </div>
    )
}

export default ForgotPassword
