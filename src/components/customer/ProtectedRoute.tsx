import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import CustomerLayout from './CustomerLayout'

interface ProtectedRouteProps {
  children: React.ReactNode
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  // Only allow customers to access customer dashboard
  // If admin tries to access, redirect to home
  if (user.role !== 'customer') {
    return <Navigate to="/" replace />
  }

  return <CustomerLayout>{children}</CustomerLayout>
}

export default ProtectedRoute

