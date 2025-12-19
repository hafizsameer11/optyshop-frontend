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

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0]

  const changeLanguage = (langCode: string) => {
    i18n.changeLanguage(langCode)
    setIsOpen(false)
  }

  return (
    <div className="fixed bottom-6 right-6 z-[100]">
      <div className="relative">
        {/* Main button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-center gap-2 h-14 w-14 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 text-white shadow-2xl hover:shadow-cyan-500/50 hover:scale-110 transition-all duration-300 border-2 border-white/20 backdrop-blur-sm"
          aria-label="Change language"
          title={`Current: ${currentLanguage.name} - Click to change language`}
        >
          <span className="text-2xl">{currentLanguage.flag}</span>
          <svg
            className={`w-4 h-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
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
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <div 
              className="absolute bottom-full right-0 mb-3 w-56 bg-white rounded-2xl shadow-2xl border-2 border-cyan-200/50 z-[110] py-2 overflow-hidden"
              style={{ 
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)'
              }}
            >
              <div className="px-3 py-2 border-b border-gray-200 bg-gradient-to-r from-cyan-50 to-blue-50">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">{i18n.t('common.language') || 'Select Language'}</p>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => changeLanguage(lang.code)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gradient-to-r hover:from-cyan-50 hover:to-blue-50 transition-all duration-200 ${
                      i18n.language === lang.code 
                        ? 'bg-gradient-to-r from-cyan-100 to-blue-100 text-cyan-700 font-semibold' 
                        : 'text-gray-700'
                    }`}
                  >
                    <span className="text-2xl">{lang.flag}</span>
                    <div className="flex-1">
                      <div className="text-sm font-medium">{lang.name}</div>
                      <div className="text-xs text-gray-500">{lang.countryCode} {lang.code.toUpperCase()}</div>
                    </div>
                    {i18n.language === lang.code && (
                      <svg className="w-5 h-5 text-cyan-600" fill="currentColor" viewBox="0 0 20 20">
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
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default FloatingLanguageSwitcher

