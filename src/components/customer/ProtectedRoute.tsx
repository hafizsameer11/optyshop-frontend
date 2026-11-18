import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

interface ProtectedRouteProps {
  children: React.ReactNode
}

/** Auth gate only. Use with AccountLayout for /account routes; pages like Payment use this without a shell layout. */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, isLoading } = useAuth()
  const location = useLocation()
  const returnTo = `${location.pathname}${location.search || ''}`

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-950" />
      </div>
    )
  }

  if (!user || !(user.id || user.email)) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(returnTo || '/account/orders')}`} replace />
  }

  // Allow customers (and users without an explicit role) into account pages
  if (user.role && user.role !== 'customer') {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

export default ProtectedRoute

