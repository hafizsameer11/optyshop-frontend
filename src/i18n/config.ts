import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

import enTranslations from './locales/en.json'
import esTranslations from './locales/es.json'
import frTranslations from './locales/fr.json'
import deTranslations from './locales/de.json'
import itTranslations from './locales/it.json'
import ptTranslations from './locales/pt.json'

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: enTranslations },
      es: { translation: esTranslations },
      fr: { translation: frTranslations },
      de: { translation: deTranslations },
      it: { translation: itTranslations },
      pt: { translation: ptTranslations }
    },
    fallbackLng: 'it',
    load: 'languageOnly',
    debug: false,
    interpolation: {
      escapeValue: false
    },
    // First visit: Italian (fallback). Returning users keep their choice from localStorage.
    // Do not use browser navigator here or most visitors would get English.
    detection: {
      order: ['localStorage'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng'
    }
  })

if (typeof document !== 'undefined') {
  const setHtmlLang = (lng: string) => {
    document.documentElement.setAttribute('lang', lng.split('-')[0])
  }
  setHtmlLang(i18n.language || 'it')
  i18n.on('languageChanged', setHtmlLang)
}

export default i18n

