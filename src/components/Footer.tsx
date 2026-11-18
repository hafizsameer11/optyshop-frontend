import React, { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import LanguageSwitcher from './LanguageSwitcher'
import { getBanners, type Banner } from '../services/bannersService'
import { getSocialLinks, type SocialLink } from '../services/socialLinksService'

const SocialIcon: React.FC<{ platform: string }> = ({ platform }) => {
    const p = (platform || '').toLowerCase()
    if (p === 'instagram') {
        return (
            <svg className="w-5 h-5 text-[#212B47]" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.98-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.98-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
            </svg>
        )
    }
    if (p === 'linkedin') return <span className="text-[#212B47] font-bold text-sm">in</span>
    if (p === 'facebook') return <span className="text-[#212B47] font-bold text-sm">f</span>
    if (p === 'youtube') return <span className="text-[#212B47] font-bold text-xs">YT</span>
    if (p === 'twitter') return <span className="text-[#212B47] font-bold text-sm">X</span>
    if (p === 'tiktok') return <span className="text-[#212B47] font-bold text-xs">TT</span>
    if (p === 'whatsapp') return <span className="text-[#212B47] font-bold text-xs">WA</span>
    return <span className="text-[#212B47] font-bold text-xs">••</span>
}

const Footer: React.FC = () => {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const [footerBanners, setFooterBanners] = useState<Banner[]>([])
    const [socialLinks, setSocialLinks] = useState<SocialLink[]>([])

    const label = (key: string, fallback: string) => {
        const value = t(key, { defaultValue: fallback })
        return !value || value === key ? fallback : value
    }

    useEffect(() => {
        let cancelled = false
        ;(async () => {
            try {
                const [banners, links] = await Promise.all([
                    getBanners({ page_type: 'home', position: 'footer' }),
                    getSocialLinks(),
                ])
                if (!cancelled) {
                    setFooterBanners(banners || [])
                    setSocialLinks(links || [])
                }
            } catch {
                if (!cancelled) {
                    setFooterBanners([])
                    setSocialLinks([])
                }
            }
        })()
        return () => {
            cancelled = true
        }
    }, [])

    const handleContactClick = () => {
        navigate('/contact')
    }

    return (
        <footer className="bg-[#212B47] text-white relative">
            {footerBanners.length > 0 && (
                <div className="w-full bg-white">
                    {footerBanners.map((banner) => {
                        const src = banner.mobile_image_url || banner.image_url
                        const image = (
                            <img
                                src={src || ''}
                                alt={banner.title || 'Footer banner'}
                                className="w-full h-auto max-h-48 object-contain object-center"
                                loading="lazy"
                            />
                        )
                        if (banner.link_url) {
                            const isExternal = /^https?:\/\//i.test(banner.link_url)
                            if (isExternal) {
                                return (
                                    <a key={banner.id} href={banner.link_url} target="_blank" rel="noopener noreferrer">
                                        {image}
                                    </a>
                                )
                            }
                            return (
                                <Link key={banner.id} to={banner.link_url}>
                                    {image}
                                </Link>
                            )
                        }
                        return <div key={banner.id}>{image}</div>
                    })}
                </div>
            )}

            <div className="h-1 bg-gradient-to-r from-orange-500 via-red-500 to-cyan-400"></div>

            <div className="w-[90%] max-w-7xl mx-auto py-12 px-4">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 mb-12 items-start">
                    <div className="lg:col-span-5">
                        <div className="flex items-center space-x-2 mb-3">
                            <div className="h-10 w-10 border-2 border-blue-400 rounded-md flex items-center justify-center text-sm tracking-widest bg-white/10">
                                OS
                            </div>
                            <span className="text-xl font-bold tracking-[0.35em] uppercase text-white">
                                OPTISHOP
                            </span>
                        </div>
                        <p className="text-sm text-slate-400 mb-4">
                            {label('footer.tagline', 'The Digital Eyewear Company®')}
                        </p>
                        {socialLinks.length > 0 && (
                            <div className="flex flex-wrap gap-3 mb-4">
                                {socialLinks.map((link) => (
                                    <a
                                        key={link.id}
                                        href={link.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-10 h-10 rounded-full bg-white flex items-center justify-center hover:bg-slate-200 transition-colors"
                                        aria-label={link.label || link.platform}
                                        title={link.label || link.platform}
                                    >
                                        <SocialIcon platform={link.platform} />
                                    </a>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="lg:col-span-7">
                        <h3 className="text-white font-semibold mb-3 text-base">
                            {label('footer.companyAndShop', 'Azienda e negozio')}
                        </h3>
                        <div className="h-px bg-white/30 mb-4"></div>
                        <div className="mb-6">
                            <p className="text-sm text-slate-400 mb-2">{label('common.language', 'Lingua')}</p>
                            <div className="bg-white/10 rounded-lg p-2">
                                <LanguageSwitcher variant="navbar" />
                            </div>
                        </div>
                        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-2.5 text-sm text-slate-400 mb-6">
                            <li>
                                <Link to="/our-technology" className="hover:text-white transition-colors">
                                    {label('whoWeAre.ourTechnology', 'La nostra tecnologia')}
                                </Link>
                            </li>
                            <li>
                                <Link to="/job-opportunities" className="hover:text-white transition-colors">
                                    {label('whoWeAre.jobOpportunities', 'Opportunità di lavoro')}
                                </Link>
                            </li>
                            <li>
                                <Link to="/blog" className="hover:text-white transition-colors font-medium text-slate-300">
                                    {label('resources.blog', 'Blog')}
                                </Link>
                            </li>
                            <li>
                                <Link to="/shop" className="hover:text-white transition-colors">
                                    {label('footer.shop', 'Negozio')}
                                </Link>
                            </li>
                            <li>
                                <Link to="/cart" className="hover:text-white transition-colors">
                                    {label('footer.cart', 'Carrello')}
                                </Link>
                            </li>
                            <li>
                                <Link to="/track-order" className="hover:text-white transition-colors">
                                    {label('footer.trackOrder', 'Traccia ordine')}
                                </Link>
                            </li>
                            <li>
                                <Link to="/contact" className="hover:text-white transition-colors">
                                    {label('footer.contact', 'Contatti')}
                                </Link>
                            </li>
                            <li>
                                <Link to="/login" className="hover:text-white transition-colors">
                                    {label('footer.login', 'Accedi')}
                                </Link>
                            </li>
                            <li>
                                <Link to="/register" className="hover:text-white transition-colors">
                                    {label('footer.register', 'Registrati')}
                                </Link>
                            </li>
                        </ul>
                        <button
                            type="button"
                            onClick={handleContactClick}
                            className="inline-flex w-full sm:w-auto justify-center px-8 py-3 bg-transparent border-2 border-white text-white font-semibold rounded-full hover:bg-white/10 transition-colors duration-300 text-sm"
                        >
                            {label('footer.contactUs', 'Contattaci')}
                        </button>
                    </div>
                </div>

                <div className="border-t border-white/20 pt-6 pb-4">
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-2 text-sm text-slate-400">
                        <span>{label('footer.copyright', '© OptiShop 2025')}</span>
                        <span className="hidden sm:inline">•</span>
                        <a href="#" className="underline hover:text-white transition-colors">
                            {label('footer.termsOfUse', 'Condizioni di utilizzo')}
                        </a>
                        <span className="hidden sm:inline">•</span>
                        <a href="#" className="underline hover:text-white transition-colors">
                            {label('footer.privacyLegal', 'Privacy e note legali')}
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    )
}

export default Footer
