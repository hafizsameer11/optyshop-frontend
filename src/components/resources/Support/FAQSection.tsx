import React, { useState } from 'react'
import { useFAQs } from '../../../hooks/useFAQs'

const FAQSection: React.FC = () => {
    const { faqs, loading, error } = useFAQs()
    const [openId, setOpenId] = useState<number | null>(null)

    const toggleAccordion = (id: number) => {
        setOpenId(openId === id ? null : id)
    }

    if (loading) {
        return (
            <section className="bg-gray-50 py-16 md:py-24 px-4">
                <div className="w-[90%] max-w-4xl mx-auto">
                    <h2 className="text-3xl md:text-4xl font-bold text-[#0f172a] text-center mb-12">
                        Frequently Asked Questions
                    </h2>
                    <div className="text-center py-8">
                        <p className="text-gray-600">Loading FAQs...</p>
                    </div>
                </div>
            </section>
        )
    }

    if (error) {
        return (
            <section className="bg-gray-50 py-16 md:py-24 px-4">
                <div className="w-[90%] max-w-4xl mx-auto">
                    <h2 className="text-3xl md:text-4xl font-bold text-[#0f172a] text-center mb-12">
                        Frequently Asked Questions
                    </h2>
                    <div className="text-center py-8">
                        <p className="text-red-600">Error loading FAQs: {error}</p>
                    </div>
                </div>
            </section>
        )
    }

    if (faqs.length === 0) {
        return (
            <section className="bg-gray-50 py-16 md:py-24 px-4">
                <div className="w-[90%] max-w-4xl mx-auto">
                    <h2 className="text-3xl md:text-4xl font-bold text-[#0f172a] text-center mb-12">
                        Frequently Asked Questions
                    </h2>
                    <div className="text-center py-8">
                        <p className="text-gray-600">No FAQs available at the moment.</p>
                    </div>
                </div>
            </section>
        )
    }

    return (
        <section className="bg-gray-50 py-16 md:py-24 px-4">
            <div className="w-[90%] max-w-4xl mx-auto">
                <h2 className="text-3xl md:text-4xl font-bold text-[#0f172a] text-center mb-12">
                    Frequently Asked Questions
                </h2>

                <div className="space-y-4">
                    {faqs.map((faq) => (
                        <div key={faq.id} className="rounded-lg overflow-hidden bg-white">
                            <button
                                onClick={() => toggleAccordion(faq.id)}
                                className="w-full px-6 md:px-8 py-5 flex items-center justify-between hover:bg-slate-50 transition-colors border-b border-slate-200"
                            >
                                <h3 className="text-base md:text-lg font-medium text-[#0f172a] text-left">
                                    {faq.question}
                                </h3>
                                <div className={`flex-shrink-0 w-6 h-6 rounded-full border-2 border-[#0f172a] flex items-center justify-center transition-transform ${openId === faq.id ? 'rotate-180' : ''
                                    }`}>
                                    <svg
                                        className="w-4 h-4 text-[#0f172a]"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                                    </svg>
                                </div>
                            </button>

                            {openId === faq.id && (
                                <div className="px-6 md:px-8 py-4 bg-slate-50">
                                    <p className="text-slate-700 text-base leading-relaxed whitespace-pre-line">
                                        {faq.answer}
                                    </p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}

export default FAQSection

