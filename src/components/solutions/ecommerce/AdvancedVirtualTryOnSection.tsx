import React from 'react'
import { useNavigate } from 'react-router-dom'

const AdvancedVirtualTryOnSection: React.FC = () => {
    const navigate = useNavigate()

    const modules = [
        {
            icon: (
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle cx="7" cy="12" r="4" strokeWidth={2} />
                    <circle cx="17" cy="12" r="4" strokeWidth={2} />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 12h2M3 12h4M17 12h4" />
                </svg>
            ),
            title: 'Frame Removal',
            description: 'Rimozione digitale degli occhiali indossati dall\'utente per facilitare la prova virtuale di nuove montature.',
            gradient: 'from-purple-500 to-pink-500'
        },
        {
            icon: (
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
            ),
            title: 'Simulatore di lenti',
            description: 'Prova virtuale di diverse tinte, rivestimenti e lenti fotocromatiche.',
            gradient: 'from-orange-500 to-yellow-500'
        },
        {
            icon: (
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
            title: 'Forma del viso',
            description: 'Analisi della forma del viso dell\'utente per consigliare le montature che gli corrispondano al meglio.',
            gradient: 'from-red-500 to-orange-500'
        }
    ]

    const handleDemoClick = () => {
        // Scroll to contact form or navigate to demo page
        const contactSection = document.getElementById('contact-demo-section')
        if (contactSection) {
            contactSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
    }

    return (
        <section className="bg-gray-50 py-12 md:py-16 lg:py-20 px-4 sm:px-6">
            <div className="w-[90%] mx-auto max-w-7xl">
                {/* Header */}
                <div className="text-center mb-12 md:mb-16">
                    <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-blue-950 mb-4">
                        Rendete efficiente il vostro shopping con Prova virtuale Advanced per il sito web
                    </h2>
                    <p className="text-base md:text-lg text-gray-600">
                        Esempi di moduli che possono essere aggiunti alle funzioni principali
                    </p>
                </div>

                {/* Feature Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-12">
                    {modules.map((module, index) => (
                        <div
                            key={index}
                            className="bg-white rounded-2xl p-6 md:p-8 shadow-lg hover:shadow-xl transition-shadow duration-300"
                        >
                            {/* Icon with Gradient Background */}
                            <div className={`w-20 h-20 rounded-xl bg-gradient-to-br ${module.gradient} flex items-center justify-center text-white mb-6`}>
                                {module.icon}
                            </div>

                            {/* Title */}
                            <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">
                                {module.title}
                            </h3>

                            {/* Description */}
                            <p className="text-gray-600 mb-6 leading-relaxed">
                                {module.description}
                            </p>

                            {/* Discover Link */}
                            <button 
                                onClick={() => navigate('/virtual-test')}
                                className="text-gray-900 font-semibold hover:text-blue-950 transition-colors cursor-pointer"
                            >
                                Scopri →
                            </button>
                        </div>
                    ))}
                </div>

                {/* Demo Request Button */}
                <div className="text-center mb-8">
                    <button
                        onClick={handleDemoClick}
                        className="px-8 md:px-12 py-4 md:py-5 bg-white border-2 border-blue-950 text-blue-950 font-semibold rounded-xl hover:bg-blue-50 transition-colors duration-300 text-base md:text-lg shadow-lg cursor-pointer"
                    >
                        Richiedete una demo per vedere tutte le configurazioni disponibili
                    </button>
                </div>

                {/* Gradient Line */}
                <div className="h-1 bg-gradient-to-r from-red-500 via-green-500 to-blue-500 rounded-full"></div>
            </div>
        </section>
    )
}

export default AdvancedVirtualTryOnSection

