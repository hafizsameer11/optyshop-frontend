import React from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

const Footer: React.FC = () => {
    const { t } = useTranslation()
    const navigate = useNavigate()

    const handleContactClick = () => {
        navigate('/contact')
    }

    return (
        <footer className="bg-[#212B47] text-white relative">
            {/* Top gradient bar */}
            <div className="h-1 bg-gradient-to-r from-orange-500 via-red-500 to-cyan-400"></div>

            <div className="w-[90%] max-w-6xl mx-auto py-12 px-4">
                {/* Main footer content */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
                    {/* Left: Logo */}
                    <div className="md:col-span-1">
                        <div className="flex items-center space-x-2 mb-2">
                            <div className="h-10 w-10 border-2 border-blue-400 rounded-md flex items-center justify-center text-sm tracking-widest bg-white/10">
                                OS
                            </div>
                            <span className="text-xl font-bold tracking-[0.35em] uppercase text-white">
                                OptiShop
                            </span>
                        </div>
                        <p className="text-sm text-slate-400 mt-2">{t('footer.tagline')}</p>
                    </div>

                    {/* Middle-left: Useful links */}
                    <div>
                        <h3 className="text-white font-semibold mb-3">{t('footer.usefulLinks')}</h3>
                        <div className="h-px bg-white/30 mb-4"></div>
                        <ul className="space-y-2 text-sm text-slate-400">
                            <li>
                                <Link to="/support" className="hover:text-white transition-colors">
                                    {t('footer.customerService')}
                                </Link>
                            </li>
                            <li>
                                <Link to="/help-center" className="hover:text-white transition-colors">
                                    {t('footer.helpCenter')}
                                </Link>
                            </li>
                            <li>
                                <Link to="/help-center" className="hover:text-white transition-colors">
                                    {t('footer.faq')}
                                </Link>
                            </li>
                            <li>
                                <Link to="/" className="hover:text-white transition-colors">
                                    {t('footer.siteMap')}
                                </Link>
                            </li>
                            <li>
                                <Link to="/contact" className="hover:text-white transition-colors">
                                    {t('footer.generalTerms')}
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Middle-right: Corporate */}
                    <div>
                        <h3 className="text-white font-semibold mb-3">{t('footer.corporate')}</h3>
                        <div className="h-px bg-white/30 mb-4"></div>
                        <ul className="space-y-2 text-sm text-slate-400">
                            <li>
                                <Link to="/our-history" className="hover:text-white transition-colors">
                                    {t('footer.whoWeAre')}
                                </Link>
                            </li>
                            <li>
                                <Link to="/our-technology" className="hover:text-white transition-colors">
                                    {t('footer.ourTechnology')}
                                </Link>
                            </li>
                            <li>
                                <Link to="/join-us" className="hover:text-white transition-colors">
                                    {t('footer.joinUs')}
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Right: Follow us */}
                    <div>
                        <h3 className="text-white font-semibold mb-3">{t('footer.followUs')}</h3>
                        <div className="h-px bg-white/30 mb-4"></div>
                        <div className="flex gap-3 mb-6">
                            {/* LinkedIn */}
                            <a
                                href="#"
                                className="w-10 h-10 rounded-full bg-white flex items-center justify-center hover:bg-slate-200 transition-colors"
                                aria-label="LinkedIn"
                            >
                                <span className="text-[#212B47] font-bold text-sm">in</span>
                            </a>
                            {/* Facebook */}
                            <a
                                href="#"
                                className="w-10 h-10 rounded-full bg-white flex items-center justify-center hover:bg-slate-200 transition-colors"
                                aria-label="Facebook"
                            >
                                <span className="text-[#212B47] font-bold text-sm">f</span>
                            </a>
                            {/* Instagram */}
                            <a
                                href="#"
                                className="w-10 h-10 rounded-full bg-white flex items-center justify-center hover:bg-slate-200 transition-colors"
                                aria-label="Instagram"
                            >
                                <svg
                                    className="w-5 h-5 text-[#212B47]"
                                    fill="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.98-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.98-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                                </svg>
                            </a>
                            {/* YouTube */}
                            <a
                                href="#"
                                className="w-10 h-10 rounded-full bg-white flex items-center justify-center hover:bg-slate-200 transition-colors"
                                aria-label="YouTube"
                            >
                                <span className="text-[#212B47] font-bold text-xs">YT</span>
                            </a>
                        </div>
                        {/* Contact Us Button */}
                        <button
                            onClick={handleContactClick}
                            className="px-6 py-3 bg-[#212B47] border-2 border-white text-white font-semibold rounded-full hover:bg-white/10 transition-colors duration-300 uppercase tracking-wide text-sm"
                        >
                            {t('footer.contactUs')}
                        </button>
                    </div>
                </div>

                {/* Bottom copyright */}
                <div className="border-t border-white/20 pt-6 pb-4">
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-2 text-sm text-slate-400">
                        <span>{t('footer.copyright')}</span>
                        <span className="hidden sm:inline">•</span>
                        <a href="#" className="underline hover:text-white transition-colors">
                            {t('footer.termsOfUse')}
                        </a>
                        <span className="hidden sm:inline">•</span>
                        <a href="#" className="underline hover:text-white transition-colors">
                            {t('footer.privacyLegal')}
                        </a>
                    </div>
                </div>
            </div>

            {/* Floating chat button */}
            <button
                className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg flex items-center justify-center z-50 transition-colors"
                aria-label="Chat"
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                </svg>
            </button>
        </footer>
    )
}

export default Footer

