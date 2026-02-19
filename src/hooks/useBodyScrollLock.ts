import { useEffect } from 'react'

/**
 * Hook to lock/unlock body scroll
 * Prevents background page scrolling when modals or overlays are open
 */
export const useBodyScrollLock = (isLocked: boolean = true) => {
  useEffect(() => {
    if (!isLocked) return

    // Save original body styles
    const originalOverflow = document.body.style.overflow
    const originalPosition = document.body.style.position
    const originalTop = document.body.style.top
    
    // Get current scroll position
    const scrollY = window.scrollY
    
    // Disable body scroll
    document.body.style.overflow = 'hidden'
    document.body.style.position = 'fixed'
    document.body.style.top = `-${scrollY}px`
    document.body.style.width = '100%'
    
    // Re-enable body scroll and restore scroll position
    return () => {
      document.body.style.overflow = originalOverflow
      document.body.style.position = originalPosition
      document.body.style.top = originalTop
      document.body.style.width = ''
      
      // Restore scroll position
      window.scrollTo(0, scrollY)
    }
  }, [isLocked])
}
