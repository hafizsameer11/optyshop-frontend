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

const FloatingLanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)

  const activeLangCode = (i18n.resolvedLanguage || i18n.language || 'it').split('-')[0]
  const currentLanguage =
    languages.find((lang) => lang.code === activeLangCode) ||
    languages.find((l) => l.code === 'it') ||
    languages[0]

  const changeLanguage = (code: string) => {
    i18n.changeLanguage(code)
    setIsOpen(false)
  }

  return (
    <div className="fixed bottom-4 right-4 z-[100] sm:bottom-6 sm:right-6">
      <div className="relative">
        {/* Main button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex h-11 w-11 items-center justify-center gap-1 rounded-full border-2 border-white/20 bg-gradient-to-br from-cyan-400 to-blue-600 text-white shadow-xl backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-cyan-500/40 sm:h-14 sm:w-14 sm:gap-2 sm:shadow-2xl sm:hover:scale-110"
          aria-label="Change language"
          title={`Current: ${currentLanguage.name} - Click to change language`}
        >
          <span className="text-lg sm:text-2xl">{currentLanguage.flag}</span>
          <svg
            className={`hidden w-4 h-4 transition-transform duration-300 sm:block ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Dropdown menu */}
        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm transition-opacity duration-200"
              onClick={() => setIsOpen(false)}
            />
            <div 
              className="absolute bottom-full right-0 mb-3 w-64 bg-white rounded-2xl border-2 border-cyan-200/40 z-[110] py-2 overflow-hidden transition-all duration-300 transform"
              style={{
                animation: 'slideUp 0.3s ease-out',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(59, 130, 246, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
              }}
            >
              {/* Header with gradient */}
              <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-cyan-50 via-blue-50 to-cyan-50">
                <p className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                  <svg className="w-4 h-4 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                  </svg>
                  {i18n.t('common.language') || 'Select Language'}
                </p>
              </div>
              
              {/* Language Options with smooth scrolling */}
              <div className="max-h-80 overflow-y-auto custom-scrollbar py-1.5 scrollbar-thin">
                {languages.map((lang, index) => (
                  <button
                    key={lang.code}
                    onClick={() => changeLanguage(lang.code)}
                    className={`group relative w-full flex items-center gap-3 px-4 py-3.5 text-left transition-all duration-300 mx-1.5 rounded-xl ${
                      i18n.language === lang.code 
                        ? 'bg-gradient-to-r from-cyan-100 to-blue-100 text-cyan-700 shadow-lg scale-[1.02]' 
                        : 'text-gray-700 hover:bg-gradient-to-r hover:from-cyan-50 hover:to-blue-50 hover:shadow-md hover:scale-[1.01] active:scale-[0.99]'
                    }`}
                  >
                    {/* Flag with bounce animation */}
                    <span className={`text-3xl transition-all duration-300 ${
                      i18n.language === lang.code 
                        ? 'scale-110 rotate-3' 
                        : 'group-hover:scale-110 group-hover:rotate-3'
                    }`}>
                      {lang.flag}
                    </span>
                    
                    {/* Language Info */}
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-bold transition-colors duration-200 ${
                        activeLangCode === lang.code 
                          ? 'text-cyan-700' 
                          : 'text-gray-800 group-hover:text-cyan-600'
                      }`}>
                        {lang.name}
                      </div>
                      <div className={`text-xs transition-colors duration-200 ${
                        activeLangCode === lang.code 
                          ? 'text-cyan-600' 
                          : 'text-gray-500 group-hover:text-gray-600'
                      }`}>
                        {lang.countryCode} {lang.code.toUpperCase()}
                      </div>
                    </div>
                    
                    {/* Checkmark with animation */}
                    {activeLangCode === lang.code && (
                      <svg 
                        className="w-5 h-5 text-cyan-600 transition-transform duration-300" 
                        fill="currentColor" 
                        viewBox="0 0 20 20"
                        style={{
                          animation: 'zoomIn 0.3s ease-out'
                        }}
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                    
                    {/* Hover indicator bar */}
                    {activeLangCode !== lang.code && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-0 bg-gradient-to-b from-cyan-400 via-blue-500 to-cyan-400 rounded-r-full transition-all duration-300 group-hover:h-10 opacity-0 group-hover:opacity-100" />
                    )}
                    
                    {/* Active language indicator */}
                    {activeLangCode === lang.code && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-10 bg-gradient-to-b from-cyan-400 via-blue-500 to-cyan-400 rounded-r-full" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default FloatingLanguageSwitcher

