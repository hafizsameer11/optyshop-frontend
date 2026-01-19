import React, { createContext, useContext, useState, type ReactNode } from 'react'
import ToastNotification, { type ToastType } from '../components/common/ToastNotification'

interface Toast {
  id: string
  message: string
  type?: ToastType
  duration?: number
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number) => void
  showSuccess: (message: string, duration?: number) => void
  showError: (message: string, duration?: number) => void
  showWarning: (message: string, duration?: number) => void
  showInfo: (message: string, duration?: number) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export const useToast = () => {
  const context = useContext(ToastContext)
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

interface ToastProviderProps {
  children: ReactNode
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = (message: string, type?: ToastType, duration?: number) => {
    const id = Date.now().toString()
    const newToast: Toast = {
      id,
      message,
      type: type || 'info',
      duration: duration || 5000
    }

    setToasts(prev => [...prev, newToast])
  }

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  const showToast = (message: string, type?: ToastType, duration?: number) => {
    addToast(message, type, duration)
  }

  const showSuccess = (message: string, duration?: number) => {
    addToast(message, 'success', duration)
  }

  const showError = (message: string, duration?: number) => {
    addToast(message, 'error', duration)
  }

  const showWarning = (message: string, duration?: number) => {
    addToast(message, 'warning', duration)
  }

  const showInfo = (message: string, duration?: number) => {
    addToast(message, 'info', duration)
  }

  const value: ToastContextType = {
    showToast,
    showSuccess,
    showError,
    showWarning,
    showInfo
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toasts.map((toast) => (
        <ToastNotification
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          isVisible={true}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </ToastContext.Provider>
  )
}

export default ToastProvider
