import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * ScrollToTop Component
 * Scrolls window to top on route changes and page refresh
 * Respects hash navigation - if there's a hash in the URL, 
 * the individual page components will handle scrolling to the hash target
 */
const ScrollToTop = () => {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    // If there's a hash, don't scroll to top - let the page handle hash scrolling
    // This ensures hash links (like #live-demo) work correctly
    if (!hash) {
      // Scroll to top immediately on route change or page refresh
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'instant' // Use 'instant' for immediate scroll on page refresh/load
      })
    }
  }, [pathname, hash]) // Trigger on pathname or hash change

  return null
}

export default ScrollToTop
