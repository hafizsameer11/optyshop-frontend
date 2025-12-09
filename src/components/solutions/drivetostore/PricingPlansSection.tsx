import React from 'react'

const PricingPlansSection: React.FC = () => {
    const plans = [
        {
            name: 'Starter',
            description: 'Core Features',
            modules: null,
            badge: null,
            bgColor: 'bg-white'
        },
        {
            name: 'Essential',
            description: 'Core Features',
            modules: '+ 3 modules',
            badge: 'BEST VALUE',
            bgColor: 'bg-[#C9F0F7]'
        },
        {
            name: 'All Stars',
            description: 'Core Features',
            modules: '+ 5 modules',
            badge: 'BEST SERVICE',
            bgColor: 'bg-[#F0EADF]'
        }
    ]

    const handleDiscoverClick = () => {
        // Scroll to contact form or navigate to pricing page
        const contactSection = document.getElementById('demo-form')
        if (contactSection) {
            contactSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
    }

    return (
        <section className="bg-white py-12 md:py-16 lg:py-20 px-4 sm:px-6">
            <div className="w-[90%] mx-auto max-w-7xl">
                {/* Header */}
                <div className="text-center mb-12 md:mb-16">
                    <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-4xl font-bold text-blue-950">
                        Choose the formula that <strong>meets your needs and your budget</strong>
                    </h2>
                </div>

                {/* Plan Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-12 max-w-5xl mx-auto">
                    {plans.map((plan, index) => (
                        <div
                            key={index}
                            className={`${plan.bgColor} rounded-2xl p-6 md:p-8 shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col text-center`}
                        >
                            {/* Plan Name */}
                            <h3 className="text-2xl md:text-3xl font-bold text-blue-950 mb-4">
                                {plan.name}
                            </h3>

                            {/* Description */}
                            <div className="mb-6">
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
                        className="px-8 md:px-12 py-4 md:py-5 bg-white border-2 border-gray-900 text-gray-900 font-semibold rounded-xl hover:bg-gray-50 transition-colors duration-300 text-base md:text-lg shadow-lg cursor-pointer"
                    >
                        Discover all the Core Features & additional Modules
                    </button>
                </div>
            </div>
        </section>
    )
}

export default PricingPlansSection

