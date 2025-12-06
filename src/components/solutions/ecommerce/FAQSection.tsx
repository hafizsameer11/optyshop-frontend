import React, { useState } from 'react'

const FAQSection: React.FC = () => {
    const [openIndex, setOpenIndex] = useState<number | null>(0) // First item open by default

    const faqs = [
        {
            question: 'Che impatto ha il tasso di conversione sulle mie vendite online?',
            answer: (
                <>
                    Il tasso di conversione è la percentuale di utenti che completano un&apos;azione desiderata (ad esempio, un acquisto su un sito e-commerce). Il suo scopo è valutare l&apos;intenzione di acquisto dei visitatori del vostro sito web.
                    <br /><br />
                    <em>Tasso di conversione = numero di azioni specifiche compiute in un periodo di tempo / numero totale di visite al vostro sito nello stesso periodo di tempo.</em>
                    <br /><br />
                    Sebbene non sia direttamente collegato alle entrate delle vendite online, è un indicatore prezioso dell&apos;efficienza di un sito web nel convertire i visitatori in clienti.
                </>
            )
        },
        {
            question: 'Come verificare se la prova virtuale aumenta il tasso di conversione?',
            answer: (
                <>
                    L&apos;A/B testing è un metodo efficace per determinare l&apos;impatto della prova virtuale sul tasso di conversione e sul tasso di coinvolgimento. L&apos;A/B testing consiste nel confrontare due versioni della stessa pagina (Versione A vs. Versione B) per trovare la migliore esperienza utente e valutare l&apos;attrattiva di una funzionalità.
                    <br /><br />
                    Per maggiori informazioni, consultate{' '}
                    <a href="#" className="text-blue-600 underline hover:text-blue-800">
                        il caso di studio sull&apos;A/B testing di Fielmann
                    </a>.
                </>
            )
        },
        {
            question: 'Le montature virtuali assomigliano davvero a quelle fisiche?',
            answer: (
                <>
                    Utilizziamo una tecnologia brevettata per digitalizzare le montature reali e creare i loro gemelli digitali. Abbiamo sviluppato un software specifico per modificare le versioni 3D delle montature reali per renderle il più realistiche possibile.
                    <br /><br />
                    Il motore di prova virtuale Fittingbox posiziona accuratamente la montatura sul viso dell&apos;utente con dimensioni precise. La nuova versione della nostra prova virtuale presenta un rendering di alto livello delle montature, con{' '}
                    <a href="#" className="text-blue-600 underline hover:text-blue-800">
                        particolare attenzione agli occhiali trasparenti
                    </a>.
                </>
            )
        }
    ]

    const toggleFAQ = (index: number) => {
        setOpenIndex(openIndex === index ? null : index)
    }

    return (
        <section className="bg-white py-6 md:py-8 px-4 sm:px-6">
            <div className="w-[90%] mx-auto">
                {/* Main Heading */}
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-blue-950 text-center mb-8 md:mb-12">
                    Preparatevi a incrementare il tasso di conversione del vostro e-commerce
                </h2>

                {/* FAQ Items */}
                <div className="space-y-4">
                    {faqs.map((faq, index) => (
                        <div key={index} className="border-b border-gray-300 pb-4">
                            {/* Question Header */}
                            <button
                                onClick={() => toggleFAQ(index)}
                                className="w-full flex items-center justify-between text-left py-4 hover:text-blue-700 transition-colors"
                            >
                                <h3 className="text-base sm:text-lg md:text-xl font-bold text-blue-950 pr-4">
                                    {faq.question}
                                </h3>
                                <svg
                                    className={`w-6 h-6 text-gray-600 flex-shrink-0 transition-transform duration-300 ${openIndex === index ? 'rotate-180' : ''
                                        }`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M5 15l7-7 7 7"
                                    />
                                </svg>
                            </button>

                            {/* Answer Content */}
                            {openIndex === index && (
                                <div className="pb-4 text-base md:text-lg text-gray-700 leading-relaxed">
                                    {faq.answer}
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

