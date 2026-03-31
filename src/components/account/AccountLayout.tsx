import React from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Navbar from '../Navbar'
import Footer from '../Footer'
import { useAuth } from '../../context/AuthContext'

const tabClass = ({ isActive }: { isActive: boolean }) =>
  `inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${
    isActive
      ? 'bg-blue-950 text-white shadow-sm'
      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
  }`

const AccountLayout: React.FC = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const handleLogout = async () => {
    await logout()
    navigate('/', { replace: true })
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Navbar />
      <main className="flex-1">
        <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                {t('account.title', 'User account')}
              </h1>
              {user && (
                <p className="mt-1 text-sm text-slate-600">
                  {user.first_name} {user.last_name}
                  {user.email ? ` · ${user.email}` : ''}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="self-start rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 sm:self-center"
            >
              {t('common.logout', 'Log out')}
            </button>
          </div>

          <nav
            className="mb-8 flex flex-wrap gap-2 border-b border-slate-200 pb-4"
            aria-label={t('account.navAria', 'Account sections')}
          >
            <NavLink to="/account/orders" className={tabClass} end={false}>
              {t('account.tabs.orders', 'Orders')}
            </NavLink>
            <NavLink to="/account/payments" className={tabClass}>
              {t('account.tabs.payments', 'Payments')}
            </NavLink>
            <NavLink to="/account/profile" className={tabClass} end>
              {t('account.tabs.profile', 'Profile')}
            </NavLink>
          </nav>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 lg:p-8">
            <Outlet />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default AccountLayout
