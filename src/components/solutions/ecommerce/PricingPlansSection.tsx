import React from 'react'

const PricingPlansSection: React.FC = () => {
    const plans = [
        {
            name: 'Avviamento',
            description: 'Caratteristiche principali',
            modules: null,
            badge: null,
            bgColor: 'bg-white'
        },
        {
            name: 'Essenziale',
            description: 'Caratteristiche principali',
            modules: '+ 3 moduli',
            badge: 'BEST VALUE',
            bgColor: 'bg-[#C9F0F7]'
        },
        {
            name: 'All Stars',
            description: 'Caratteristiche principali',
            modules: '+ 5 moduli',
            badge: 'BEST SERVICE',
            bgColor: 'bg-[#F0EADF]'
        }
    ]

    const handleDiscoverClick = () => {
        // Scroll to contact form or navigate to pricing page
        const contactSection = document.getElementById('contact-demo-section')
        if (contactSection) {
            contactSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
    }

    return (
        <section className="bg-white py-12 md:py-16 lg:py-20 px-4 sm:px-6">
            <div className="w-[90%] mx-auto max-w-7xl">
                {/* Header */}
                <div className="text-center mb-12 md:mb-16">
                    <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-blue-950">
                        Scegliete la formula che <span className="font-bold">soddisfa</span> le vostre esigenze e il vostro budget
                    </h2>
                </div>

                {/* Plan Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-12 max-w-5xl mx-auto">
                    {plans.map((plan, index) => (
                        <div
                            key={index}
                            className={`${plan.bgColor} rounded-2xl p-6 md:p-8 shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col ${index === 0 ? 'pt-12 md:pt-16' : ''}`}
                        >
                            {/* Plan Name */}
                            <h3 className="text-2xl md:text-3xl font-bold text-blue-950 mb-4 text-center">
                                {plan.name}
                            </h3>

                            {/* Description */}
                            <div className="mb-6 text-center">
                                <p className="text-gray-700 text-base md:text-lg mb-2">
                                    {plan.description}
                                </p>
                                {plan.modules && (
                                    <p className="text-gray-600 text-sm md:text-base">
                                        {plan.modules}
                                    </p>
                                )}
                            </div>

                            {/* Badge */}
                            {plan.badge && (
                                <div className="mt-auto flex justify-center">
                                    <button className="px-6 py-3 bg-blue-950 text-white font-semibold rounded-full hover:bg-blue-900 transition-colors duration-300 text-sm md:text-base">
                                        {plan.badge}
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Bottom CTA Button */}
                <div className="text-center">
                    <button
                        onClick={handleDiscoverClick}
                        className="px-8 md:px-12 py-4 md:py-5 bg-white border-2 border-blue-950 text-blue-950 font-semibold rounded-full hover:bg-blue-50 transition-colors duration-300 text-base md:text-lg shadow-lg"
                    >
                        Scoprite tutte le caratteristiche principali e i moduli aggiuntivi
                    </button>
                </div>
            </div>
        </section>
    )
}

export default PricingPlansSection

