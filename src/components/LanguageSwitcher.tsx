import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'

interface Language {
  code: string
  name: string
  flag: string
  countryCode: string
}

const languages: Language[] = [
  { code: 'en', name: 'English', flag: '🇬🇧', countryCode: 'GB' },
  { code: 'es', name: 'Español', flag: '🇪🇸', countryCode: 'ES' },
  { code: 'fr', name: 'Français', flag: '🇫🇷', countryCode: 'FR' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪', countryCode: 'DE' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹', countryCode: 'IT' },
  { code: 'pt', name: 'Português', flag: '🇵🇹', countryCode: 'PT' }
]

interface LanguageSwitcherProps {
  variant?: 'navbar' | 'dashboard'
}

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ variant = 'navbar' }) => {
  const { i18n } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0]

  const changeLanguage = (langCode: string) => {
    i18n.changeLanguage(langCode)
    setIsOpen(false)
  }

  if (variant === 'dashboard') {
    return (
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <span className="text-xl">{currentLanguage.flag}</span>
          <span className="text-sm font-medium text-gray-700">{currentLanguage.countryCode} {currentLanguage.code.toUpperCase()}</span>
          <svg
            className={`w-4 h-4 text-gray-600 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20 py-1">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => changeLanguage(lang.code)}
                  className={`w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-gray-100 transition-colors ${
                    i18n.language === lang.code ? 'bg-purple-50 text-purple-600' : 'text-gray-700'
                  }`}
                >
                  <span className="text-xl">{lang.flag}</span>
                  <span className="text-sm font-medium">{lang.name}</span>
                  {i18n.language === lang.code && (
                    <svg className="w-4 h-4 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    )
  }

  // Navbar variant
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center gap-1 h-7 md:h-8 min-w-[60px] md:min-w-[70px] px-2 md:px-2.5 py-1 rounded-full border border-cyan-400 bg-blue-950/60 hover:bg-blue-900/70 transition-colors text-white whitespace-nowrap"
        aria-label="Change language"
      >
        <span className="text-sm md:text-base leading-none">{currentLanguage.flag}</span>
        <span className="text-[9px] md:text-[10px] font-semibold hidden sm:inline-block">{currentLanguage.code.toUpperCase()}</span>
        <svg
          className={`w-2.5 h-2.5 md:w-3 md:h-3 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm transition-opacity duration-200"
            onClick={() => setIsOpen(false)}
          />
          <div 
            className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border-2 border-cyan-200/30 z-50 py-2 overflow-hidden transition-all duration-300 transform"
            style={{ 
              animation: 'slideDown 0.3s ease-out',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(59, 130, 246, 0.1)'
            }}
          >
            {/* Header */}
            <div className="px-4 py-2.5 border-b border-gray-100 bg-gradient-to-r from-cyan-50 via-blue-50 to-cyan-50">
              <p className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                <svg className="w-3.5 h-3.5 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                </svg>
                Select Language
              </p>
            </div>
            
            {/* Language Options */}
            <div className="py-1.5">
              {languages.map((lang, index) => (
                <button
                  key={lang.code}
                  onClick={() => changeLanguage(lang.code)}
                  className={`group relative w-full flex items-center gap-3 px-4 py-3 text-left transition-all duration-200 mx-1.5 rounded-xl ${
                    i18n.language === lang.code 
                      ? 'bg-gradient-to-r from-cyan-100 to-blue-100 text-cyan-700 shadow-md' 
                      : 'text-slate-700 hover:bg-gradient-to-r hover:from-cyan-50 hover:to-blue-50 hover:shadow-sm hover:scale-[1.02]'
                  }`}
                >
                  {/* Flag with animation */}
                  <span className={`text-2xl transition-transform duration-200 ${i18n.language === lang.code ? 'scale-110' : 'group-hover:scale-110'}`}>
                    {lang.flag}
                  </span>
                  
                  {/* Language Info */}
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-semibold transition-colors ${
                      i18n.language === lang.code ? 'text-cyan-700' : 'text-gray-800 group-hover:text-cyan-600'
                    }`}>
                      {lang.name}
                    </div>
                    <div className={`text-xs transition-colors ${
                      i18n.language === lang.code ? 'text-cyan-600' : 'text-gray-500 group-hover:text-gray-600'
                    }`}>
                      {lang.countryCode} {lang.code.toUpperCase()}
                    </div>
                  </div>
                  
                  {/* Checkmark for active language */}
                  {i18n.language === lang.code && (
                    <svg 
                      className="w-5 h-5 text-cyan-600 transition-transform duration-200" 
                      fill="currentColor" 
                      viewBox="0 0 20 20"
                      style={{
                        animation: 'zoomIn 0.2s ease-out'
                      }}
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                  
                  {/* Hover indicator */}
                  {i18n.language !== lang.code && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-0 bg-gradient-to-b from-cyan-400 to-blue-500 rounded-r-full transition-all duration-200 group-hover:h-8" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default LanguageSwitcher

