import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { CaseStudy } from '../../../services/caseStudiesService'

interface DownloadFormSectionProps {
    study: CaseStudy
}

const DownloadFormSection: React.FC<DownloadFormSectionProps> = ({ study }) => {
    const navigate = useNavigate()
    const [formData, setFormData] = useState({
        email: '',
        name: '',
        surname: '',
        village: '',
        companyName: ''
    })

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
        <section className="bg-gray-100 py-12 md:py-16 lg:py-20 px-4 sm:px-6">
            <div className="w-[90%] mx-auto max-w-7xl">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-start">
                    {/* Left Side - Case Study Document Preview */}
                    <div className="flex justify-center lg:justify-start">
                        <div className="relative w-full max-w-md">
                            <div className="transform rotate-[-2deg] shadow-2xl">
                                <div className="bg-white rounded-lg p-6 md:p-8 border-2 border-gray-200">
                                    {/* Document Header */}
                                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
                                        <div className="flex items-center gap-3">
                                            <div className="text-xs font-bold text-blue-900">FITTINGBOX</div>
                                            <div className="text-gray-400">|</div>
                                            <div className="text-sm font-semibold text-gray-800">{study.title.split(' ')[0]}</div>
                                        </div>
                                        <div className="text-xs text-gray-500">Case Study</div>
                                    </div>

                                    {/* Document Title */}
                                    <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-6 leading-tight">
                                        {study.title}
                                    </h3>

                                    {/* About Section */}
                                    <div className="mb-6">
                                        <h4 className="text-sm font-semibold text-gray-700 mb-3">About {study.title.split(' ')[0]}</h4>
                                        <div className="space-y-2 text-sm text-gray-600">
                                            <p><span className="font-medium">Type of Business:</span> {study.category}</p>
                                            {study.person && (
                                                <div className="mt-4">
                                                    <p className="text-sm font-semibold text-gray-700 mb-2">Starring</p>
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-semibold">
                                                            {study.person.name.split(' ').map(n => n[0]).join('')}
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-gray-900">{study.person.name}</p>
                                                            <p className="text-xs text-gray-600">{study.person.role}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Preview Image */}
                                    <div className="mt-6">
                                        <img
                                            src={study.image}
                                            alt={study.title}
                                            className="w-full h-48 object-cover rounded"
                                            onError={(e) => {
                                                const target = e.target as HTMLImageElement
                                                target.style.display = 'none'
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Side - Download Form */}
                    <div className="bg-white rounded-2xl p-6 md:p-8 lg:p-10 shadow-lg">
                        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
                            Download the case study
                        </h2>
                        <p className="text-sm md:text-base text-gray-600 mb-6 md:mb-8">
                            Fill out the form below to get your case study.
                        </p>

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
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                                    placeholder="your.email@example.com"
                                />
                            </div>

                            {/* Name and Surname - Side by Side */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                                        Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="name"
                                        name="name"
                                        required
                                        value={formData.name}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                                        placeholder="John"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="surname" className="block text-sm font-medium text-gray-700 mb-2">
                                        Surname <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="surname"
                                        name="surname"
                                        required
                                        value={formData.surname}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                                        placeholder="Doe"
                                    />
                                </div>
                            </div>

                            {/* Village and Company Name - Side by Side */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="village" className="block text-sm font-medium text-gray-700 mb-2">
                                        Village <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        id="village"
                                        name="village"
                                        required
                                        value={formData.village}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors bg-white"
                                    >
                                        <option value="">Select</option>
                                        <option value="new-york">New York</option>
                                        <option value="london">London</option>
                                        <option value="paris">Paris</option>
                                        <option value="tokyo">Tokyo</option>
                                        <option value="berlin">Berlin</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-2">
                                        Company Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="companyName"
                                        name="companyName"
                                        required
                                        value={formData.companyName}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                                        placeholder="Your Company"
                                    />
                                </div>
                            </div>

                            {/* Download Button */}
                            <button
                                type="submit"
                                className="w-full bg-blue-900 text-white font-semibold py-3 px-6 rounded-lg hover:bg-blue-800 transition-colors duration-300 text-base md:text-lg cursor-pointer"
                            >
                                Download
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default DownloadFormSection

