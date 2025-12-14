import React, { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import { apiClient } from '../../utils/api'
import { API_ROUTES } from '../../config/apiRoutes'

interface Job {
    id: number
    title: string
    department: string
    location: string
    type: string
    description: string
    requirements: string[]
}

const JobApplication: React.FC = () => {
    const { jobId } = useParams<{ jobId: string }>()
    const navigate = useNavigate()

    const [job, setJob] = useState<Job | null>(null)
    const [isLoadingJob, setIsLoadingJob] = useState(true)
    const [jobError, setJobError] = useState<string>('')

    const [formConfig, setFormConfig] = useState<any>(null)
    const [isLoadingConfig, setIsLoadingConfig] = useState(false)

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        linkedIn: '',
        portfolio: '',
        coverLetter: ''
    })

    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isSubmitted, setIsSubmitted] = useState(false)
    const [submitError, setSubmitError] = useState<string>('')

    // Fetch form config
    useEffect(() => {
        const fetchConfig = async () => {
            setIsLoadingConfig(true)
            try {
                const response = await apiClient.get(API_ROUTES.FORMS.JOB_APPLICATION.CONFIG, false)
                if (response.success && response.data) {
                    setFormConfig(response.data)
                }
            } catch (err: any) {
                if (import.meta.env.DEV) {
                    console.error('Error fetching job application form config:', err)
                }
            } finally {
                setIsLoadingConfig(false)
            }
        }

        fetchConfig()
    }, [])

    // Fetch job details
    useEffect(() => {
        const fetchJob = async () => {
            if (!jobId) {
                setJobError('Job ID is required')
                setIsLoadingJob(false)
                return
            }

            setIsLoadingJob(true)
            setJobError('')
            try {
                const response = await apiClient.get<Job>(API_ROUTES.JOBS.BY_ID(jobId), false)
                if (response.success && response.data) {
                    setJob(response.data)
                } else {
                    setJobError(response.message || 'Failed to load job details')
                }
            } catch (err: any) {
                setJobError(err.message || 'Failed to load job details')
            } finally {
                setIsLoadingJob(false)
            }
        }

        fetchJob()
    }, [jobId])

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
    }


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitError('')
        
        // Validate job exists
        if (!job || !job.id) {
            setSubmitError('Job information is missing. Please refresh the page and try again.')
            return
        }

        setIsSubmitting(true)

        try {
            // Use the job.id from the fetched job data
            const jobIdToSend = String(job.id)

            // Prepare JSON payload according to API config
            const payload: Record<string, any> = {
                jobId: jobIdToSend,
                name: formData.name,
                email: formData.email
            }

            // Add optional fields
            if (formData.linkedIn) {
                payload.linkedIn = formData.linkedIn
            }

            if (formData.portfolio) {
                payload.portfolio = formData.portfolio
            }

            if (formData.coverLetter) {
                payload.coverLetter = formData.coverLetter
            }

            if (import.meta.env.DEV) {
                console.log('[Job Application] Sending JSON payload:', payload)
                console.log('[Job Application] Job ID being sent:', jobIdToSend, 'Job object:', job)
            }

            const response = await apiClient.post(
                API_ROUTES.FORMS.JOB_APPLICATION.SUBMIT,
                payload,
                false
            )

            if (response.success) {
                setIsSubmitted(true)
            } else {
                // Show detailed error message from backend
                let errorMsg = response.error || response.message || 'Failed to submit application. Please try again.'
                
                // Handle invalid reference / job_id errors
                if (errorMsg.includes('Invalid reference') || 
                    errorMsg.includes('job_id') || 
                    errorMsg.includes('does not exist') ||
                    errorMsg.includes('Foreign key constraint')) {
                    errorMsg = 'The job you are applying for no longer exists or is invalid. Please go back to job listings and select a valid job opening.'
                }
                
                setSubmitError(errorMsg)
                if (import.meta.env.DEV) {
                    console.error('Job application submission error:', response)
                    console.error('Job ID sent:', jobIdToSend, 'Job from state:', job)
                }
            }
        } catch (error: any) {
            setSubmitError(error.message || 'An error occurred. Please try again.')
            if (import.meta.env.DEV) {
                console.error('Job application submission exception:', error)
            }
        } finally {
            setIsSubmitting(false)
        }
    }

    if (isLoadingJob) {
        return (
            <div className="bg-white min-h-screen">
                <Navbar />
                <section className="bg-white py-12 md:py-16 lg:py-20 px-4 sm:px-6">
                    <div className="w-[90%] mx-auto max-w-4xl text-center">
                        <div className="flex items-center justify-center">
                            <svg className="animate-spin h-8 w-8 text-blue-950" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        </div>
                        <p className="mt-4 text-gray-600">Loading job details...</p>
                    </div>
                </section>
                <Footer />
            </div>
        )
    }

    if (jobError && !job) {
        return (
            <div className="bg-white min-h-screen">
                <Navbar />
                <section className="bg-white py-12 md:py-16 lg:py-20 px-4 sm:px-6">
                    <div className="w-[90%] mx-auto max-w-4xl text-center">
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                            <p className="font-semibold">Error loading job</p>
                            <p className="text-sm mt-1">{jobError}</p>
                        </div>
                        <Link
                            to="/job-opportunities"
                            className="inline-block px-6 md:px-8 py-3 md:py-4 rounded-lg bg-[#253C69] text-white font-semibold hover:bg-[#1e2f52] transition-colors duration-300"
                        >
                            Back to Job Opportunities
                        </Link>
                    </div>
                </section>
                <Footer />
            </div>
        )
    }

    if (isSubmitted) {
        return (
            <div className="bg-white min-h-screen">
                <Navbar />

                {/* Hero Section */}
                <section
                    className="relative overflow-hidden bg-cover bg-center bg-no-repeat"
                    style={{
                        backgroundImage: 'url(/assets/images/Banner-join-us-tewt-2.webp)',
                        backgroundColor: '#253C69'
                    }}
                >
                    {/* Dark blue gradient overlay from left */}
                    <div className="absolute inset-0 bg-gradient-to-r from-[#253C69] via-[#253C69]/80 to-transparent"></div>

                    <div className="relative px-4 sm:px-6 md:px-12 lg:px-16 py-12 md:py-16 lg:py-20">
                        <div className="max-w-4xl">
                            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 md:mb-6 leading-tight">
                                Application Submitted
                            </h1>
                            <p className="text-lg sm:text-xl md:text-2xl text-white/90 mb-4">
                                Thank you for your interest in joining our team
                            </p>
                            <div className="w-16 sm:w-20 md:w-24 h-0.5 md:h-1 bg-white"></div>
                        </div>
                    </div>

                    {/* Gradient Line at Bottom */}
                    <div className="relative h-1 bg-gradient-to-r from-orange-500 via-green-500 to-purple-500 z-10"></div>
                </section>

                {/* Breadcrumbs Section */}
                <div className="bg-white py-4 px-4 sm:px-6">
                    <div className="w-[90%] mx-auto max-w-6xl">
                        <nav className="flex items-center gap-2 text-sm text-gray-900">
                            <Link to="/" className="flex items-center gap-2 hover:text-gray-700 transition-colors">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                                </svg>
                                <span>HOME</span>
                            </Link>
                            <span className="text-gray-500">&gt;</span>
                            <Link to="/our-history" className="hover:text-gray-700 transition-colors">
                                WHO WE ARE
                            </Link>
                            <span className="text-gray-500">&gt;</span>
                            <Link to="/join-us" className="hover:text-gray-700 transition-colors">
                                JOIN US
                            </Link>
                            <span className="text-gray-500">&gt;</span>
                            <Link to="/job-opportunities" className="hover:text-gray-700 transition-colors">
                                JOB OPPORTUNITIES
                            </Link>
                            <span className="text-gray-500">&gt;</span>
                            <span className="text-gray-900">APPLICATION SUBMITTED</span>
                        </nav>
                    </div>
                </div>

                {/* Header Section with Job Info */}
                {job && (
                    <section className="bg-gradient-to-r from-blue-950 to-blue-800 py-8 md:py-12 px-4 sm:px-6">
                        <div className="w-[90%] mx-auto max-w-6xl">
                            <div className="text-white">
                                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 md:mb-6">
                                    {job.title}
                                </h2>
                                <div className="flex flex-wrap items-center gap-4 text-sm md:text-base">
                                    <div className="flex items-center gap-2">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                        </svg>
                                        <span className="font-semibold">{job.department}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        <span className="font-semibold">{job.location}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span className="font-semibold">{job.type}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                )}

                {/* Success Message */}
                <section className="bg-white py-12 md:py-16 lg:py-20 px-4 sm:px-6">
                    <div className="w-[90%] mx-auto max-w-3xl">
                        <div className="text-center space-y-6 md:space-y-8">
                            <div className="w-20 h-20 md:w-24 md:h-24 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                                <svg className="w-10 h-10 md:w-12 md:h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-blue-950">
                                Application Submitted!
                            </h1>
                            <p className="text-lg md:text-xl text-gray-700">
                                Thank you for your interest in joining Fittingbox. We've received your application and will review it shortly.
                            </p>
                            <p className="text-base md:text-lg text-gray-600">
                                Our team will contact you if your profile matches our requirements.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                                <Link
                                    to="/job-opportunities"
                                    className="inline-block px-6 md:px-8 py-3 md:py-4 rounded-lg bg-[#253C69] text-white font-semibold hover:bg-[#1e2f52] transition-colors duration-300 text-sm md:text-base"
                                >
                                    View Other Positions
                                </Link>
                                <Link
                                    to="/join-us"
                                    className="inline-block px-6 md:px-8 py-3 md:py-4 rounded-lg border-2 border-[#253C69] text-[#253C69] font-semibold hover:bg-blue-50 transition-colors duration-300 text-sm md:text-base"
                                >
                                    Back to Join Us
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>

                <Footer />
            </div>
        )
    }

    return (
        <div className="bg-white min-h-screen">
            <Navbar />

            {/* Hero Section */}
            <section
                className="relative overflow-hidden bg-cover bg-center bg-no-repeat"
                style={{
                    backgroundImage: 'url(/assets/images/Banner-join-us-tewt-2.webp)',
                    backgroundColor: '#253C69'
                }}
            >
                {/* Dark blue gradient overlay from left */}
                <div className="absolute inset-0 bg-gradient-to-r from-[#253C69] via-[#253C69]/80 to-transparent"></div>

                <div className="relative px-4 sm:px-6 md:px-12 lg:px-16 py-12 md:py-16 lg:py-20">
                    <div className="max-w-4xl">
                        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 md:mb-6 leading-tight">
                            Apply for Position
                        </h1>
                        <p className="text-lg sm:text-xl md:text-2xl text-white/90 mb-4">
                            Join our team and help shape the future of digital eyewear
                        </p>
                        <div className="w-16 sm:w-20 md:w-24 h-0.5 md:h-1 bg-white"></div>
                    </div>
                </div>

                {/* Gradient Line at Bottom */}
                <div className="relative h-1 bg-gradient-to-r from-orange-500 via-green-500 to-purple-500 z-10"></div>
            </section>

            {/* Breadcrumbs Section */}
            <div className="bg-white py-4 px-4 sm:px-6">
                <div className="w-[90%] mx-auto max-w-6xl">
                    <nav className="flex items-center gap-2 text-sm text-gray-900">
                        <Link to="/" className="flex items-center gap-2 hover:text-gray-700 transition-colors">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                            </svg>
                            <span>HOME</span>
                        </Link>
                        <span className="text-gray-500">&gt;</span>
                        <Link to="/our-history" className="hover:text-gray-700 transition-colors">
                            WHO WE ARE
                        </Link>
                        <span className="text-gray-500">&gt;</span>
                        <Link to="/join-us" className="hover:text-gray-700 transition-colors">
                            JOIN US
                        </Link>
                        <span className="text-gray-500">&gt;</span>
                        <Link to="/job-opportunities" className="hover:text-gray-700 transition-colors">
                            JOB OPPORTUNITIES
                        </Link>
                        <span className="text-gray-500">&gt;</span>
                        <span className="text-gray-900">APPLY</span>
                    </nav>
                </div>
            </div>

            {/* Header Section */}
            {job && (
                <section className="bg-gradient-to-r from-blue-950 to-blue-800 py-8 md:py-12 px-4 sm:px-6">
                    <div className="w-[90%] mx-auto max-w-6xl">
                        <div className="text-white">
                            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6">
                                {job.title}
                            </h1>
                            <div className="flex flex-wrap items-center gap-4 text-sm md:text-base">
                                <div className="flex items-center gap-2">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                    <span className="font-semibold">{job.department}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    <span className="font-semibold">{job.location}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span className="font-semibold">{job.type}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* Application Form Section */}
            <section className="bg-white py-12 md:py-16 lg:py-20 px-4 sm:px-6">
                <div className="w-[90%] mx-auto max-w-4xl">
                    <div className="bg-white border border-gray-200 rounded-xl p-6 md:p-8 lg:p-12 shadow-lg">
                        {job && (
                            <div className="mb-6 md:mb-8 pb-6 border-b border-gray-200">
                                <h2 className="text-2xl md:text-3xl font-bold text-blue-950 mb-2">
                                    {job.title}
                                </h2>
                                <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                                    <span className="px-3 py-1 bg-blue-50 text-blue-950 rounded-full font-semibold">
                                        {job.department}
                                    </span>
                                    <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full font-semibold">
                                        {job.type}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        {job.location}
                                    </span>
                                </div>
                            </div>
                        )}
                        
                        <h2 className="text-2xl md:text-3xl font-bold text-blue-950 mb-6 md:mb-8">
                            Application Form
                        </h2>

                        {/* Show error if job failed to load */}
                        {jobError && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                                <p className="font-semibold">Error loading job details</p>
                                <p className="text-sm mt-1">{jobError}</p>
                                <Link
                                    to="/job-opportunities"
                                    className="text-sm underline mt-2 inline-block"
                                >
                                    Go back to job listings
                                </Link>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8" style={{ display: jobError ? 'none' : 'block' }}>
                            {/* Personal Information */}
                            <div className="space-y-4">
                                <h3 className="text-lg md:text-xl font-semibold text-blue-950 border-b border-gray-200 pb-2">
                                    Personal Information
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                                    <div>
                                        <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                                            First Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            id="firstName"
                                            name="firstName"
                                            required
                                            value={formData.firstName}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#253C69] focus:border-transparent outline-none transition-colors"
                                            placeholder="John"
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                                            Last Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            id="lastName"
                                            name="lastName"
                                            required
                                            value={formData.lastName}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#253C69] focus:border-transparent outline-none transition-colors"
                                            placeholder="Doe"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                        Email Address <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        required
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#253C69] focus:border-transparent outline-none transition-colors"
                                        placeholder="john.doe@example.com"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                                        Phone Number <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="tel"
                                        id="phone"
                                        name="phone"
                                        required
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#253C69] focus:border-transparent outline-none transition-colors"
                                        placeholder="+33 1 23 45 67 89"
                                    />
                                </div>
                            </div>

                            {/* Professional Links */}
                            <div className="space-y-4">
                                <h3 className="text-lg md:text-xl font-semibold text-blue-950 border-b border-gray-200 pb-2">
                                    Professional Links
                                </h3>

                                <div>
                                    <label htmlFor="linkedin" className="block text-sm font-medium text-gray-700 mb-2">
                                        LinkedIn Profile
                                    </label>
                                    <input
                                        type="url"
                                        id="linkedin"
                                        name="linkedin"
                                        value={formData.linkedin}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#253C69] focus:border-transparent outline-none transition-colors"
                                        placeholder="https://linkedin.com/in/yourprofile"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="portfolio" className="block text-sm font-medium text-gray-700 mb-2">
                                        Portfolio / Website
                                    </label>
                                    <input
                                        type="url"
                                        id="portfolio"
                                        name="portfolio"
                                        value={formData.portfolio}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#253C69] focus:border-transparent outline-none transition-colors"
                                        placeholder="https://yourportfolio.com"
                                    />
                                </div>
                            </div>

                            {/* Resume Upload */}
                            <div className="space-y-4">
                                <h3 className="text-lg md:text-xl font-semibold text-blue-950 border-b border-gray-200 pb-2">
                                    Documents
                                </h3>

                                <div>
                                    <label htmlFor="resume" className="block text-sm font-medium text-gray-700 mb-2">
                                        Resume / CV <span className="text-red-500">*</span>
                                    </label>
                                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-[#253C69] transition-colors">
                                        <div className="space-y-1 text-center">
                                            <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                                                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                            <div className="flex text-sm text-gray-600">
                                                <label htmlFor="resume" className="relative cursor-pointer bg-white rounded-md font-medium text-[#253C69] hover:text-[#1e2f52] focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-[#253C69]">
                                                    <span>Upload a file</span>
                                                    <input
                                                        id="resume"
                                                        name="resume"
                                                        type="file"
                                                        accept=".pdf,.doc,.docx"
                                                        required
                                                        onChange={handleFileChange}
                                                        className="sr-only"
                                                    />
                                                </label>
                                                <p className="pl-1">or drag and drop</p>
                                            </div>
                                            <p className="text-xs text-gray-500">PDF, DOC, DOCX up to 10MB</p>
                                            {formData.resume && (
                                                <p className="text-sm text-green-600 mt-2">✓ {formData.resume.name}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Cover Letter */}
                            <div className="space-y-4">
                                <h3 className="text-lg md:text-xl font-semibold text-blue-950 border-b border-gray-200 pb-2">
                                    Cover Letter
                                </h3>

                                <div>
                                    <label htmlFor="coverLetter" className="block text-sm font-medium text-gray-700 mb-2">
                                        Why do you want to join Fittingbox? <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        id="coverLetter"
                                        name="coverLetter"
                                        required
                                        rows={6}
                                        value={formData.coverLetter}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#253C69] focus:border-transparent outline-none transition-colors resize-none"
                                        placeholder="Tell us about yourself and why you're interested in this position..."
                                    />
                                </div>
                            </div>

                            {/* Submit Error */}
                            {submitError && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                                    {submitError}
                                </div>
                            )}

                            {/* Submit Button */}
                            <div className="flex flex-col sm:flex-row gap-4 pt-4">
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-1 px-6 md:px-8 py-3 md:py-4 rounded-lg bg-[#253C69] text-white font-semibold hover:bg-[#1e2f52] transition-colors duration-300 text-sm md:text-base disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            <span>Submitting...</span>
                                        </>
                                    ) : (
                                        'Submit Application'
                                    )}
                                </button>
                                <Link
                                    to="/job-opportunities"
                                    className="flex-1 sm:flex-none px-6 md:px-8 py-3 md:py-4 rounded-lg border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors duration-300 text-sm md:text-base text-center"
                                >
                                    Cancel
                                </Link>
                            </div>
                        </form>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    )
}

export default JobApplication

