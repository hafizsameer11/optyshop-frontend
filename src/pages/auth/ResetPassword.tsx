import React, { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import { useToast } from '../../context/ToastContext'
import { resetPasswordWithToken } from '../../services/authPasswordService'
import { formatErrorMessage } from '../../utils/errorUtils'

const ResetPassword: React.FC = () => {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const token = searchParams.get('token') || ''
    const { showSuccess, showError } = useToast()

    const [formData, setFormData] = useState({
        newPassword: '',
        confirmPassword: '',
    })
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData((prev) => ({ ...prev, [name]: value }))
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: '' }))
        }
    }

    const validate = () => {
        const next: Record<string, string> = {}
        if (!token) {
            next.token = t('auth.resetPassword.invalidLink')
        }
        if (!formData.newPassword) {
            next.newPassword = t('auth.resetPassword.passwordRequired')
        } else if (formData.newPassword.length < 6) {
            next.newPassword = t('auth.resetPassword.passwordMinLength')
        } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.newPassword)) {
            next.newPassword = t('auth.resetPassword.passwordComplexity')
        }
        if (formData.newPassword !== formData.confirmPassword) {
            next.confirmPassword = t('auth.resetPassword.passwordsDontMatch')
        }
        setErrors(next)
        return Object.keys(next).length === 0
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!validate()) return

        setIsSubmitting(true)
        try {
            const result = await resetPasswordWithToken(token, formData.newPassword)
            if (result.success) {
                showSuccess(
                    result.message || t('auth.resetPassword.success')
                )
                navigate('/login', { replace: true })
            } else {
                showError(result.message || t('auth.resetPassword.failed'))
            }
        } catch (err: unknown) {
            showError(formatErrorMessage(err))
        } finally {
            setIsSubmitting(false)
        }
    }

    if (!token) {
        return (
            <div className="bg-white min-h-screen">
                <Navbar />
                <section className="py-16 px-4">
                    <div className="max-w-lg mx-auto text-center space-y-4">
                        <p className="text-gray-700">{t('auth.resetPassword.invalidLink')}</p>
                        <Link
                            to="/forgot-password"
                            className="text-blue-600 font-medium hover:underline"
                        >
                            {t('auth.resetPassword.requestNewLink')}
                        </Link>
                    </div>
                </section>
                <Footer />
            </div>
        )
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
                        {t('auth.resetPassword.title')}
                    </h1>
                    <p className="text-base md:text-lg text-white/90 max-w-2xl mx-auto">
                        {t('auth.resetPassword.description')}
                    </p>
                </div>
            </section>

            <section className="bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-50 py-12 md:py-16 px-4 sm:px-6">
                <div className="w-[90%] mx-auto max-w-xl">
                    <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
                        <div className="bg-gradient-to-r from-blue-950 to-blue-900 px-8 pt-8 pb-6">
                            <h2 className="text-2xl font-bold text-white">
                                {t('auth.resetPassword.heading')}
                            </h2>
                        </div>

                        <div className="p-8 md:p-10">
                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div>
                                    <label
                                        htmlFor="newPassword"
                                        className="block text-sm font-semibold text-gray-700 mb-2.5"
                                    >
                                        {t('auth.resetPassword.newPassword')}
                                    </label>
                                    <input
                                        type="password"
                                        id="newPassword"
                                        name="newPassword"
                                        value={formData.newPassword}
                                        onChange={handleChange}
                                        className={`w-full px-4 py-3.5 rounded-xl border-2 ${
                                            errors.newPassword
                                                ? 'border-red-400 bg-red-50'
                                                : 'border-gray-200 bg-gray-50'
                                        } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                    />
                                    {errors.newPassword && (
                                        <p className="mt-2 text-sm text-red-600">
                                            {errors.newPassword}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label
                                        htmlFor="confirmPassword"
                                        className="block text-sm font-semibold text-gray-700 mb-2.5"
                                    >
                                        {t('auth.resetPassword.confirmPassword')}
                                    </label>
                                    <input
                                        type="password"
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        className={`w-full px-4 py-3.5 rounded-xl border-2 ${
                                            errors.confirmPassword
                                                ? 'border-red-400 bg-red-50'
                                                : 'border-gray-200 bg-gray-50'
                                        } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                    />
                                    {errors.confirmPassword && (
                                        <p className="mt-2 text-sm text-red-600">
                                            {errors.confirmPassword}
                                        </p>
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full rounded-xl bg-gradient-to-r from-blue-950 to-blue-900 text-white font-semibold py-4 disabled:opacity-50"
                                >
                                    {isSubmitting
                                        ? t('auth.resetPassword.saving')
                                        : t('auth.resetPassword.savePassword')}
                                </button>

                                <p className="text-center text-sm text-gray-600">
                                    <Link
                                        to="/login"
                                        className="text-blue-600 hover:text-blue-800 font-medium hover:underline"
                                    >
                                        {t('auth.resetPassword.backToLogin')}
                                    </Link>
                                </p>
                            </form>
                        </div>
                    </div>
                </div>
            </section>
            <Footer />
        </div>
    )
}

export default ResetPassword
