import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const ContactFormSection: React.FC = () => {
    const navigate = useNavigate()
    const [formData, setFormData] = useState({
        email: '',
        firstName: '',
        lastName: '',
        country: '',
        companyName: '',
        message: ''
    })

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        })
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        console.log('Form submitted:', formData)
        // Navigate to thank you page after form submission
        navigate('/thank-you')
    }

    return (
        <section className="bg-gray-50 py-12 md:py-16 lg:py-20 px-4 sm:px-6">
            <div className="w-[90%] mx-auto max-w-7xl">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
                    {/* Left Section - Contact Form */}
                    <div className="bg-white rounded-2xl p-6 md:p-8 lg:h-[880px] lg:p-10 shadow-lg">
                        <h2 className="text-2xl md:text-3xl font-bold text-blue-950 mb-6 md:mb-8">
                            Send us your request
                        </h2>

                        <form onSubmit={handleSubmit} className="space-y-5 md:space-y-6">
                            {/* Email */}
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                    Email <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    required
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>

                            {/* First Name and Last Name */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                                        First name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="firstName"
                                        name="firstName"
                                        required
                                        value={formData.firstName}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                                        Last name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="lastName"
                                        name="lastName"
                                        required
                                        value={formData.lastName}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                            </div>

                            {/* Country */}
                            <div>
                                <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-2">
                                    Country <span className="text-red-500">*</span>
                                </label>
                                <select
                                    id="country"
                                    name="country"
                                    required
                                    value={formData.country}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="">Please Select</option>
                                    <option value="US">United States</option>
                                    <option value="CA">Canada</option>
                                    <option value="UK">United Kingdom</option>
                                    <option value="FR">France</option>
                                    <option value="DE">Germany</option>
                                    <option value="IT">Italy</option>
                                    <option value="ES">Spain</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>

                            {/* Company Name */}
                            <div>
                                <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-2">
                                    Company name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="companyName"
                                    name="companyName"
                                    required
                                    value={formData.companyName}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>

                            {/* Message */}
                            <div>
                                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                                    Message <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    id="message"
                                    name="message"
                                    required
                                    rows={5}
                                    value={formData.message}
                                    onChange={handleChange}
                                    placeholder="Tell us more about your needs."
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                                />
                            </div>

                            {/* Disclaimer */}
                            <p className="text-xs text-gray-500">
                                *Fittingbox needs your contact information to share details about our products and services. You can unsubscribe from these communications at any time. Learn more in our{' '}
                                <a href="#" className="underline hover:text-blue-950">
                                    Privacy Policy
                                </a>
                                .
                            </p>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                className="w-full bg-blue-950 text-white px-6 md:px-8 py-3 md:py-4 rounded-lg font-semibold text-base md:text-lg hover:bg-blue-900 transition-colors duration-300"
                            >
                                Contact us
                            </button>
                        </form>
                    </div>

                    {/* Right Section - Locations and Contact Details */}
                    <div className="bg-white rounded-2xl p-6 md:p-8 lg:p-10 shadow-lg">
                        <h2 className="text-2xl md:text-3xl font-bold text-blue-950 mb-6 md:mb-8">
                            Locations
                        </h2>

                        <div className="space-y-8">
                            {/* Europe */}
                            <div>
                                <h3 className="text-lg md:text-xl font-bold text-blue-950 mb-4">EUROPE</h3>
                                <div className="space-y-3 text-gray-700">
                                    <div>
                                        <p className="font-semibold mb-1">Headquarters</p>
                                        <p>209 Rue de l'Innovation</p>
                                        <p>31670 Labège</p>
                                        <p>France</p>
                                    </div>
                                    <div>
                                        <p className="font-semibold mb-1">Phone</p>
                                        <a href="tel:+33971007100" className="hover:text-blue-950">
                                            +33 9 71 00 71 00
                                        </a>
                                    </div>
                                    <div>
                                        <p className="font-semibold mb-1">Email</p>
                                        <a href="mailto:contact@fittingbox.com" className="hover:text-blue-950">
                                            contact@fittingbox.com
                                        </a>
                                    </div>
                                </div>
                            </div>

                            <div className="h-px bg-gray-300"></div>

                            {/* North America */}
                            <div>
                                <h3 className="text-lg md:text-xl font-bold text-blue-950 mb-4">NORTH AMERICA</h3>
                                <div className="space-y-3 text-gray-700">
                                    <div>
                                        <p className="font-semibold mb-1">US Subsidiary</p>
                                        <p>19790 W Dixie Hwy, Suite 311</p>
                                        <p>Aventura, FL 33180</p>
                                        <p>USA</p>
                                    </div>
                                    <div>
                                        <p className="font-semibold mb-1">Phone</p>
                                        <a href="tel:+33971007100" className="hover:text-blue-950">
                                            +33 9 71 00 71 00
                                        </a>
                                    </div>
                                    <div>
                                        <p className="font-semibold mb-1">Email</p>
                                        <a href="mailto:contactus@fittingbox.com" className="hover:text-blue-950">
                                            contactus@fittingbox.com
                                        </a>
                                    </div>
                                </div>
                            </div>

                            <div className="h-px bg-gray-300"></div>

                            {/* Customer Support */}
                            <div>
                                <h3 className="text-lg md:text-xl font-bold text-blue-950 mb-4">Customer Support</h3>
                                <div className="space-y-3 text-gray-700">
                                    <div>
                                        <p className="font-semibold mb-1">Phone</p>
                                        <a href="tel:+33971007140" className="hover:text-blue-950">
                                            +33 9 71 00 71 40
                                        </a>
                                    </div>
                                    <div>
                                        <p className="font-semibold mb-1">Email</p>
                                        <a href="mailto:sales-cs@fittingbox.com" className="hover:text-blue-950">
                                            sales-cs@fittingbox.com
                                        </a>
                                    </div>
                                </div>
                            </div>

                            <div className="h-px bg-gray-300"></div>

                            {/* Billing */}
                            <div>
                                <h3 className="text-lg md:text-xl font-bold text-blue-950 mb-4">Billing</h3>
                                <div className="space-y-3 text-gray-700">
                                    <div>
                                        <p className="font-semibold mb-1">Phone</p>
                                        <a href="tel:+33971007100" className="hover:text-blue-950">
                                            +33 9 71 00 71 00
                                        </a>
                                    </div>
                                    <div>
                                        <p className="font-semibold mb-1">Email</p>
                                        <a href="mailto:comptabilite@fittingbox.com" className="hover:text-blue-950">
                                            comptabilite@fittingbox.com
                                        </a>
                                    </div>
                                </div>
                            </div>

                            <div className="h-px bg-gray-300"></div>

                            {/* Marketing */}
                            <div>
                                <h3 className="text-lg md:text-xl font-bold text-blue-950 mb-4">Marketing</h3>
                                <div className="space-y-3 text-gray-700">
                                    <div>
                                        <p className="font-semibold mb-1">Phone</p>
                                        <a href="tel:+33971007100" className="hover:text-blue-950">
                                            +33 9 71 00 71 00
                                        </a>
                                    </div>
                                    <div>
                                        <p className="font-semibold mb-1">Email</p>
                                        <a href="mailto:marketing@fittingbox.com" className="hover:text-blue-950">
                                            marketing@fittingbox.com
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default ContactFormSection

