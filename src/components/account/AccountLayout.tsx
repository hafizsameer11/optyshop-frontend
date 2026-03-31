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
    <div className="flex min-h-screen flex-col bg-white">
      <Navbar />

      {/* Hero: same pattern as Contact / Login — clears fixed navbar via pt; does not modify Navbar */}
      <section
        className="relative flex min-h-[220px] flex-col justify-center bg-cover bg-center bg-no-repeat sm:min-h-[260px] md:min-h-[300px]"
        style={{
          backgroundImage: 'url(/assets/images/virtual-try.jpg)',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-blue-950 via-blue-950/85 to-blue-950/40" />
        <div className="relative z-10 w-[90%] mx-auto max-w-7xl pt-24 pb-10 sm:pt-28 sm:pb-12">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl">
                {t('account.title', 'User account')}
              </h1>
              {user && (
                <p className="mt-3 text-base text-white/90 sm:text-lg">
                  {user.first_name} {user.last_name}
                  {user.email ? ` · ${user.email}` : ''}
                </p>
              )}
              <div className="mt-4 h-1 w-20 rounded-full bg-white/90" />
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="shrink-0 self-start rounded-xl border border-white/40 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20 md:self-end"
            >
              {t('common.logout', 'Log out')}
            </button>
          </div>
        </div>
        <div className="relative z-10 h-1 w-full bg-gradient-to-r from-orange-500 via-green-500 to-blue-500" />
      </section>

      <main className="flex-1 bg-slate-50">
        <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <nav
            className="mb-6 flex flex-wrap gap-2 border-b border-slate-200 pb-4"
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
