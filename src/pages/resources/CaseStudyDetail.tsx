import React from 'react'
import { useParams, Link } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import { useCaseStudy } from '../../hooks/useCaseStudy'
import DownloadFormSection from '../../components/resources/CaseStudies/DownloadFormSection'
import BenefitsSection from '../../components/resources/CaseStudies/BenefitsSection'
import AboutCompanySection from '../../components/resources/CaseStudies/AboutCompanySection'

const CaseStudyDetail: React.FC = () => {
    const { slug } = useParams<{ slug: string }>()
    const { caseStudy: study, loading, error } = useCaseStudy(slug || '')

    if (loading) {
        return (
            <div className="bg-white min-h-screen">
                <Navbar />
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-center">
                        <p className="text-gray-600">Loading case study...</p>
                    </div>
                </div>
                <Footer />
            </div>
        )
    }

    if (error || !study) {
        return (
            <div className="bg-white min-h-screen">
                <Navbar />
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-center">
                        <h1 className="text-2xl font-bold text-gray-900 mb-4">
                            {error ? 'Error loading case study' : 'Case Study Not Found'}
                        </h1>
                        {error && <p className="text-red-600 mb-4">{error}</p>}
                        <Link to="/case-studies" className="text-blue-600 hover:text-blue-700">
                            Return to Case Studies
                        </Link>
                    </div>
                </div>
                <Footer />
            </div>
        )
    }

    return (
        <div className="bg-white min-h-screen">
            <Navbar />

            {/* Hero Section */}
            <section
                className="relative overflow-hidden pt-20 md:pt-0 bg-cover bg-center bg-no-repeat h-[80vh]"
                style={{
                    backgroundImage: 'url(/assets/images/case-studies_header_ok.webp)',
                }}
            >
                <div className="grid lg:grid-cols-3 gap-0 h-full">
                    {/* Left - Content with Dark Overlay (2/3 width) */}
                    <div className="lg:col-span-2 relative text-white px-4 sm:px-6 md:px-12 lg:px-16 py-8 sm:py-10 md:py-12 lg:py-16 flex flex-col justify-center">
                        {/* Dark overlay for text readability */}


                        <div className="relative z-10 w-full sm:w-[95%] mx-auto max-w-4xl space-y-4 sm:space-y-5 md:space-y-6">
                            <div>
                                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-4xl font-bold mb-4 sm:mb-5 md:mb-6 leading-tight">
                                    {study.heroTitle || study.title}
                                </h1>
                                <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold mb-2 sm:mb-3">
                                    {study.heroSubtitle || 'Case Study'}
                                </h2>
                                <div className="w-16 sm:w-20 h-0.5 sm:h-1 bg-white"></div>
                            </div>

                            <div className="space-y-3 sm:space-y-4 text-sm sm:text-base md:text-lg text-white/90 leading-relaxed">
                                {study.content && (
                                    <p>{study.content}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right - Image visible area (1/3 width) */}
                    <div className="lg:col-span-1 relative">
                        <div className="absolute inset-0 bg-gradient-to-l from-blue-950/20 to-transparent"></div>
                    </div>
                </div>
            </section>

            {/* Breadcrumbs Section */}
            <section className="relative bg-white">
                <div className="h-px bg-gradient-to-r from-orange-400 via-orange-300 to-teal-400"></div>

                <div className="w-[90%] mx-auto px-4 sm:px-6 py-4 md:py-6">
                    <div className="flex flex-wrap items-center gap-2 md:gap-3 text-xs md:text-sm">
                        <Link to="/" className="flex items-center gap-2 text-blue-900 hover:text-blue-700 transition-colors">
                            <svg className="w-3 md:w-4 h-3 md:h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                            </svg>
                            <span className="uppercase font-medium">HOME</span>
                        </Link>
                        <span className="text-gray-400">&gt;</span>
                        <Link to="/case-studies" className="text-blue-900 uppercase font-medium hover:text-blue-700">
                            RESOURCES
                        </Link>
                        <span className="text-gray-400">&gt;</span>
                        <Link to="/case-studies" className="text-blue-900 uppercase font-medium hover:text-blue-700">
                            CASE STUDIES
                        </Link>
                        <span className="text-gray-400">&gt;</span>
                        <span className="text-blue-900 uppercase font-medium">{study.category.toUpperCase()}</span>
                        <span className="text-gray-400">&gt;</span>
                        <span className="text-blue-900 uppercase font-semibold">{study.title.toUpperCase().slice(0, 20)}...</span>
                    </div>
                </div>
            </section>



            {/* Download Form Section */}
            <DownloadFormSection study={study} />

            {/* Benefits Section */}
            <BenefitsSection />

            {/* About Company Section */}
            <AboutCompanySection study={study} />
            <Footer />
        </div>
    )
}

export default CaseStudyDetail

