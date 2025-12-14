import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
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
    requirements: string[] | string // Can be array or string (from API)
}

const JobOpportunities: React.FC = () => {
    const [jobs, setJobs] = useState<Job[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string>('')

    // Helper function to normalize requirements to always be an array
    const normalizeRequirements = (requirements: string[] | string | null | undefined): string[] => {
        if (!requirements) return []
        if (Array.isArray(requirements)) return requirements
        if (typeof requirements === 'string') {
            // Try to parse as JSON first (in case it's a JSON string)
            try {
                const parsed = JSON.parse(requirements)
                if (Array.isArray(parsed)) return parsed
            } catch {
                // Not JSON, continue with string parsing
            }
            // Split by newlines or commas
            return requirements
                .split(/\n|,/)
                .map(req => req.trim())
                .filter(req => req.length > 0)
        }
        return []
    }

    useEffect(() => {
        const fetchJobs = async () => {
            setIsLoading(true)
            setError('')
            try {
                const response = await apiClient.get<Job[]>(API_ROUTES.JOBS.LIST, false)
                if (response.success && response.data) {
                    const jobsData = Array.isArray(response.data) ? response.data : []
                    // Normalize requirements field - ensure it's always an array
                    const normalizedJobs = jobsData.map((job: any) => ({
                        ...job,
                        requirements: normalizeRequirements(job.requirements),
                    }))
                    setJobs(normalizedJobs)
                } else {
                    setError(response.message || 'Failed to load jobs')
                }
            } catch (err: any) {
                setError(err.message || 'Failed to load jobs')
            } finally {
                setIsLoading(false)
            }
        }

        fetchJobs()
    }, [])

    // Fallback static jobs if API fails (for development)
    const staticJobs: Job[] = [
        {
            id: 1,
            title: 'Senior Frontend Developer',
            department: 'Engineering',
            location: 'Paris, France / Remote',
            type: 'Full-time',
            description: 'We are looking for an experienced Frontend Developer to join our engineering team. You will work on cutting-edge virtual try-on technology and help shape the future of digital eyewear.',
            requirements: [
                '5+ years of experience in React/TypeScript',
                'Strong knowledge of 3D graphics and WebGL',
                'Experience with AR/VR technologies',
                'Excellent problem-solving skills'
            ]
        },
        {
            id: 2,
            title: 'Product Designer',
            department: 'Design',
            location: 'Paris, France',
            type: 'Full-time',
            description: 'Join our design team to create beautiful and intuitive user experiences for our virtual try-on platform. You will work closely with engineers and product managers.',
            requirements: [
                '3+ years of product design experience',
                'Proficiency in Figma and design tools',
                'Strong portfolio showcasing UX/UI work',
                'Experience with 3D design is a plus'
            ]
        },
        {
            id: 3,
            title: 'Customer Success Manager',
            department: 'Customer Success',
            location: 'Paris, France / Remote',
            type: 'Full-time',
            description: 'Help our clients succeed with Fittingbox solutions. You will be the main point of contact for our enterprise customers and ensure their satisfaction.',
            requirements: [
                '2+ years in customer success or account management',
                'Excellent communication skills',
                'Fluent in English and French',
                'Technical background is a plus'
            ]
        },
        {
            id: 4,
            title: 'Machine Learning Engineer',
            department: 'R&D',
            location: 'Paris, France',
            type: 'Full-time',
            description: 'Work on advanced AI/ML algorithms for face detection, 3D reconstruction, and virtual try-on technology. Join our innovative R&D team.',
            requirements: [
                'PhD or Master\'s in Computer Science or related field',
                'Strong background in computer vision and deep learning',
                'Experience with PyTorch or TensorFlow',
                'Published research papers are a plus'
            ]
        },
        {
            id: 5,
            title: 'Sales Manager',
            department: 'Sales',
            location: 'Paris, France / Remote',
            type: 'Full-time',
            description: 'Drive growth by acquiring new enterprise clients in the eyewear industry. You will work with major brands and retailers worldwide.',
            requirements: [
                '5+ years of B2B sales experience',
                'Experience in SaaS or technology sales',
                'Strong negotiation and closing skills',
                'Fluent in multiple languages preferred'
            ]
        },
        {
            id: 6,
            title: 'QA Engineer',
            department: 'Engineering',
            location: 'Paris, France',
            type: 'Full-time',
            description: 'Ensure the quality and reliability of our virtual try-on platform. You will design and execute test plans for web and mobile applications.',
            requirements: [
                '3+ years of QA experience',
                'Knowledge of automated testing frameworks',
                'Experience with web and mobile testing',
                'Attention to detail and analytical mindset'
            ]
        }
    ]

    // Use jobs from API, or fallback to static jobs if API fails
    // Ensure all jobs have normalized requirements
    const displayJobs = (jobs.length > 0 ? jobs : staticJobs).map(job => ({
        ...job,
        requirements: normalizeRequirements(job.requirements),
    }))

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
                            Job Opportunities
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
                        <span className="text-gray-900">JOB OPPORTUNITIES</span>
                    </nav>
                </div>
            </div>

            {/* Jobs Section */}
            <section className="bg-white py-12 md:py-16 lg:py-20 px-4 sm:px-6">
                <div className="w-[90%] mx-auto max-w-7xl">
                    <div className="space-y-8 md:space-y-12">
                        {/* Section Header */}
                        <div className="text-center">
                            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-blue-950 mb-4">
                                Open Positions
                            </h2>
                            <p className="text-lg md:text-xl text-gray-700 max-w-3xl mx-auto">
                                Explore our current job openings and find the perfect role for you
                            </p>
                        </div>

                        {/* Loading State */}
                        {isLoading && (
                            <div className="text-center py-12">
                                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#253C69]"></div>
                                <p className="mt-4 text-gray-600">Loading job opportunities...</p>
                            </div>
                        )}

                        {/* Error Message */}
                        {!isLoading && error && (
                            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg mb-6">
                                <p className="font-semibold">Note: {error}</p>
                                <p className="text-sm mt-1">Showing static job listings. Please check your backend connection.</p>
                            </div>
                        )}

                        {/* Jobs Grid */}
                        {!isLoading && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                            {displayJobs.map((job) => (
                                <div
                                    key={job.id}
                                    className="bg-white border border-gray-200 rounded-xl p-6 md:p-8 shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col"
                                >
                                    {/* Job Header */}
                                    <div className="mb-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="px-3 py-1 text-xs font-semibold text-blue-950 bg-blue-50 rounded-full">
                                                {job.department}
                                            </span>
                                            <span className="px-3 py-1 text-xs font-semibold text-gray-600 bg-gray-100 rounded-full">
                                                {job.type}
                                            </span>
                                        </div>
                                        <h3 className="text-xl md:text-2xl font-bold text-blue-950 mb-2">
                                            {job.title}
                                        </h3>
                                        <p className="text-sm md:text-base text-gray-600 flex items-center gap-1">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                            {job.location}
                                        </p>
                                    </div>

                                    {/* Job Description */}
                                    <p className="text-sm md:text-base text-gray-700 mb-4 flex-grow leading-relaxed">
                                        {job.description}
                                    </p>

                                    {/* Requirements Preview */}
                                    <div className="mb-4">
                                        <p className="text-xs md:text-sm font-semibold text-gray-900 mb-2">Key Requirements:</p>
                                        <ul className="space-y-1">
                                            {Array.isArray(job.requirements) && job.requirements.length > 0 ? (
                                                <>
                                                    {job.requirements.slice(0, 2).map((req, index) => (
                                                        <li key={index} className="text-xs md:text-sm text-gray-600 flex items-start">
                                                            <span className="text-blue-950 mr-2 mt-1">•</span>
                                                            <span>{req}</span>
                                                        </li>
                                                    ))}
                                                    {job.requirements.length > 2 && (
                                                        <li className="text-xs md:text-sm text-gray-500 italic">
                                                            + {job.requirements.length - 2} more requirements
                                                        </li>
                                                    )}
                                                </>
                                            ) : (
                                                <li className="text-xs md:text-sm text-gray-500 italic">
                                                    Requirements not specified
                                                </li>
                                            )}
                                        </ul>
                                    </div>

                                    {/* Apply Button */}
                                    <div className="mt-auto pt-4">
                                        <Link
                                            to={`/job-application/${job.id}`}
                                            className="block w-full px-6 py-3 rounded-lg bg-[#253C69] text-white font-semibold hover:bg-[#1e2f52] transition-colors duration-300 text-sm md:text-base text-center"
                                        >
                                            Apply Now
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                        )}

                        {/* No Jobs Message (if needed) */}
                        {!isLoading && displayJobs.length === 0 && (
                            <div className="text-center py-12">
                                <p className="text-lg md:text-xl text-gray-600">
                                    No open positions at the moment. Check back soon!
                                </p>
                            </div>
                        )}

                        {/* Contact Section */}
                        <div className="bg-gray-50 rounded-xl p-6 md:p-8 lg:p-12 text-center">
                            <h3 className="text-xl md:text-2xl font-bold text-blue-950 mb-3 md:mb-4">
                                Don't see a role that fits?
                            </h3>
                            <p className="text-base md:text-lg text-gray-700 mb-4 md:mb-6">
                                We're always looking for talented people. Send us your resume and we'll keep you in mind for future opportunities.
                            </p>
                            <Link
                                to="/contact"
                                className="inline-block px-6 md:px-8 py-3 md:py-4 rounded-lg bg-[#253C69] text-white font-semibold hover:bg-[#1e2f52] transition-colors duration-300 text-sm md:text-base"
                            >
                                Contact Us
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    )
}

export default JobOpportunities

