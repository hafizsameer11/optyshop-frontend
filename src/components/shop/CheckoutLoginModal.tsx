import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export interface CheckoutLoginModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

/**
 * Inline login for product checkout: sets tokens via AuthContext without leaving the page.
 */
const CheckoutLoginModal: React.FC<CheckoutLoginModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { t } = useTranslation()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({})
  const [submitError, setSubmitError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!isOpen) {
      setPassword('')
      setSubmitError('')
      setFieldErrors({})
    }
  }, [isOpen])

  if (!isOpen) {
    return null
  }

  const validate = () => {
    const next: { email?: string; password?: string } = {}
    if (!email.trim()) {
      next.email = t('auth.login.emailRequired')
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      next.email = t('auth.login.emailInvalid')
    }
    if (!password.trim()) {
      next.password = t('auth.login.passwordRequired')
    } else if (password.length < 6) {
      next.password = t('auth.login.passwordMinLength')
    }
    setFieldErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError('')
    if (!validate()) {
      return
    }
    setSubmitting(true)
    try {
      const result = await login(email.trim(), password)
      if (result.success) {
        setPassword('')
        onSuccess()
        onClose()
      } else {
        setSubmitError(
          typeof result.message === 'string' ? result.message : t('auth.login.loginFailed')
        )
      }
    } catch {
      setSubmitError(t('auth.login.errorOccurred'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60"
      role="dialog"
      aria-modal="true"
      aria-labelledby="checkout-login-title"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-gray-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h2 id="checkout-login-title" className="text-xl font-bold text-gray-900">
              {t('shop.checkoutLoginTitle', 'Sign in to continue')}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {t(
                'shop.checkoutLoginSubtitle',
                'Sign in here to complete your order — no need to leave checkout.'
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-lg shrink-0"
            aria-label={t('common.close', 'Close')}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="checkout-login-email" className="block text-sm font-medium text-gray-700 mb-1">
              {t('auth.login.emailAddress')}
            </label>
            <input
              id="checkout-login-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={e => {
                setEmail(e.target.value)
                if (fieldErrors.email) {
                  setFieldErrors(prev => ({ ...prev, email: undefined }))
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
              placeholder={t('auth.login.enterEmail')}
            />
            {fieldErrors.email && <p className="text-sm text-red-600 mt-1">{fieldErrors.email}</p>}
          </div>
          <div>
            <label htmlFor="checkout-login-password" className="block text-sm font-medium text-gray-700 mb-1">
              {t('auth.login.password')}
            </label>
            <input
              id="checkout-login-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={e => {
                setPassword(e.target.value)
                if (fieldErrors.password) {
                  setFieldErrors(prev => ({ ...prev, password: undefined }))
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
              placeholder={t('auth.login.enterPassword')}
            />
            {fieldErrors.password && <p className="text-sm text-red-600 mt-1">{fieldErrors.password}</p>}
          </div>

          {submitError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{submitError}</div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-blue-950 text-white py-3 rounded-lg font-semibold hover:bg-blue-900 transition-colors disabled:opacity-60"
          >
            {submitting ? t('auth.login.signingIn') : t('auth.login.signIn')}
          </button>

          <p className="text-center text-sm text-gray-600">
            {t('auth.login.dontHaveAccount')}{' '}
            <Link
              to="/register"
              className="text-blue-600 font-medium hover:underline"
              onClick={onClose}
            >
              {t('auth.login.createAccount')}
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}

export default CheckoutLoginModal
