import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'

const Webinar: React.FC = () => {
    const navigate = useNavigate()
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        jobTitle: '',
        companyName: '',
        country: ''
    })

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        })
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        // Handle form submission here
        console.log('Form submitted:', formData)
        // Navigate to video page after form submission
        navigate('/webinar-video')
    }

    return (
        <div className="bg-white min-h-screen">
            <Navbar />

            {/* Hero Section */}
            <section className="bg-blue-950 py-12 md:py-16 px-4 sm:px-6 relative overflow-hidden">
                {/* Wavy background pattern */}
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute inset-0" style={{
                        backgroundImage: 'radial-gradient(circle at 20% 50%, #60a5fa 0%, transparent 50%), radial-gradient(circle at 80% 80%, #60a5fa 0%, transparent 50%)',
                    }}></div>
                </div>

                <div className="w-[90%] mx-auto relative z-10">
                    <div className="grid lg:grid-cols-2 gap-8 items-center">
                        {/* Left Section - Title */}
                        <div className="space-y-4 lg:pt-12 md:space-y-6">
                            <div className="text-amber-200 text-sm md:text-base font-semibold uppercase tracking-wide">
                                ON-DEMAND WEBINAR
                            </div>
                            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-4xl font-bold text-white leading-tight">
                                Virtual Glasses Try-On
                            </h1>
                            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-4xl font-bold text-white leading-tight">
                                5 Things to Keep in Mind
                            </h2>
                            <p className="text-xl sm:text-2xl text-white">
                                Before Implementing Your
                            </p>
                            <div className="pt-4">
                                <button className="px-6 md:px-8 py-3 md:py-4 bg-white border-2 border-black text-black font-semibold rounded-lg hover:bg-gray-100 transition-colors duration-300 text-base md:text-lg">
                                    View the webinar
                                </button>
                            </div>
                        </div>

                        {/* Right Section - Presenter */}
                        <div className="flex items-center space-x-4 md:space-x-6">
                            <div className="flex-shrink-0">
                                <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-white overflow-hidden bg-gray-300">
                                    <img
                                        src="/assets/images/Webinar-cta-image-v2.webp"
                                        alt="Matthieu MONTPELLIER"
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement
                                            target.style.display = 'none'
                                        }}
                                    />
                                </div>
                            </div>
                            <div className="text-white">
                                <p className="text-sm md:text-base mb-2">Presented by</p>
                                <h3 className="text-lg md:text-xl font-bold mb-1">
                                    Matthieu MONTPELLIER
                                </h3>
                                <p className="text-sm md:text-base">
                                    Head of Customer Success at Fittingbox
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Main Content */}
            <section className="py-12 md:py-16 px-4 sm:px-6">
                <div className="w-[90%] mx-auto">
                    {/* Top Questions */}
                    <div className="text-center mb-12">
                        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-blue-950 mb-8">
                            Discover the 5 key success factors and all the answers to your questions:
                        </h2>
                        <div className="grid md:grid-cols-3 gap-4 md:gap-6 text-left">
                            <div className="border-l-2 border-gray-300 pl-4">
                                <p className="text-base md:text-lg font-semibold text-blue-950">
                                    How can I make sure the implementation is suitable for my e-commerce site?
                                </p>
                            </div>
                            <div className="border-l-2 border-gray-300 pl-4">
                                <p className="text-base md:text-lg font-semibold text-blue-950">
                                    How can I make the glasses I&apos;m selling available for trying on?
                                </p>
                            </div>
                            <div className="border-l-2 border-gray-300 pl-4">
                                <p className="text-base md:text-lg font-semibold text-blue-950">
                                    How can I tailor try-on to my online customer experience and my brand?
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Webinar Form */}
                    <div className="bg-gray-50 rounded-2xl p-6 md:p-8 lg:p-12 mb-12">
                        <h3 className="text-2xl md:text-3xl font-bold text-blue-950 mb-4">
                            Access to the on-demand webinar
                        </h3>
                        <p className="text-base md:text-lg text-gray-700 mb-6">
                            Please, fill out the form below to watch the webinar.
                        </p>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        First name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="firstName"
                                        required
                                        value={formData.firstName}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Last name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="lastName"
                                        required
                                        value={formData.lastName}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Professional email <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    required
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Job title
                                </label>
                                <input
                                    type="text"
                                    name="jobTitle"
                                    value={formData.jobTitle}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Company name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="companyName"
                                    required
                                    value={formData.companyName}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Country/Region <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="country"
                                    required
                                    value={formData.country}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="">Please Select</option>
                                    <option value="US">United States</option>
                                    <option value="UK">United Kingdom</option>
                                    <option value="CA">Canada</option>
                                    <option value="FR">France</option>
                                    <option value="DE">Germany</option>
                                    <option value="IT">Italy</option>
                                    <option value="ES">Spain</option>
                                    <option value="AU">Australia</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>

                            <div className="text-xs md:text-sm text-gray-600 leading-relaxed pt-2">
                                <p>
                                    Fittingbox needs the contact information you provide to us to contact you about our products and services. You may unsubscribe from these communications at any time. For information on how to unsubscribe, as well as our privacy practices and commitment to protecting your privacy, please review our Privacy Policy.
                                </p>
                            </div>

                            <div className="pt-4">
                                <button
                                    type="submit"
                                    className="w-full md:w-auto px-8 md:px-12 py-3 md:py-4 bg-blue-950 text-white font-semibold rounded-lg hover:bg-blue-900 transition-colors duration-300 text-base md:text-lg"
                                >
                                    Watch it now!
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Explanatory Content */}
                    <div className="space-y-8 md:space-y-12">
                        <div>
                            <h3 className="text-2xl md:text-3xl font-bold text-blue-950 mb-4">
                                Why does implementing a virtual try-on feature have to follow certain rules?
                            </h3>
                            <p className="text-base md:text-lg text-gray-700 leading-relaxed mb-4">
                                While virtual trying-on is becoming commonplace in the eyewear industry, and the fashion industry more generally, it&apos;s crucial to promote it at every possible customer touchpoint.
                            </p>
                            <h4 className="text-xl md:text-2xl font-semibold text-blue-950 mb-4">
                                Why? Because some basic principles apply:
                            </h4>
                            <ol className="list-decimal list-inside space-y-3 text-base md:text-lg text-gray-700 leading-relaxed ml-4">
                                <li>the feature must be as <strong>visible as possible</strong></li>
                                <li>You want the customer experience to be <strong>simple and seamless</strong></li>
                                <li>Do you want your <strong>eyewear catalog to be featured</strong>?</li>
                                <li>It is supposed to <strong>increase sales</strong></li>
                            </ol>
                            <p className="text-base md:text-lg text-gray-700 leading-relaxed mt-4">
                                With all this in mind, there are a few strategies you can adopt if you want your new virtual try-on feature to be effective and add value. These strategies can help you highlight your virtual try-on and ensure it reflects its ease of use. In other words, they will encourage customers to virtually try on glasses on your website and encourage them to purchase their next pair.
                            </p>
                        </div>

                        <div>
                            <h3 className="text-2xl md:text-3xl font-bold text-blue-950 mb-4">
                                How can I learn more about these strategies for my eyewear business?
                            </h3>
                            <p className="text-base md:text-lg text-gray-700 leading-relaxed mb-4">
                                We at Fittingbox, who work with all types of clients every month, know from experience what <strong>5 things to keep in mind before doing a virtual fitting</strong>.
                            </p>
                            <p className="text-base md:text-lg text-gray-700 leading-relaxed mb-4">
                                Matthieu Montpellier, Head of Customer Success at Fittingbox, analyzes these 5 key success factors to answer all your questions, including the following topics:
                            </p>
                            <ul className="list-disc list-inside space-y-2 text-base md:text-lg text-gray-700 leading-relaxed ml-4">
                                <li>How to make sure your implementation fits your e-commerce website</li>
                                <li>How to make the glasses you sell available for virtual try-on</li>
                                <li>How to adapt virtual try-on to your online customer experience and your brand</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    )
}

export default Webinar

