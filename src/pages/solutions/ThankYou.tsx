import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'

const ThankYou: React.FC = () => {
    const navigate = useNavigate()
    const [currentSlide, setCurrentSlide] = useState(0)

    const solutions = [
        {
            title: 'Optical Instruments',
            description: 'We bring your optical experience into the digital world and provide high-quality service to your customers while they shop.',
            image: '/assets/images/virtual-try.jpg',
            link: '/optical-instruments'
        },
        {
            title: 'Open Innovation',
            description: 'Our Open Innovation program was created to enable companies to develop new features and custom products together with us, focusing on their needs.',
            image: '/assets/images/virtual-try.jpg',
            link: '/open-innovation'
        },
        {
            title: 'Virtual Try-On',
            description: 'This cutting-edge tool offers your customers an immersive eyewear experience on Website-Store-Storefront-Advertising',
            image: '/assets/images/virtual-try.jpg',
            link: '/virtual-test'
        }
    ]

    const nextSlide = () => {
        setCurrentSlide((prev) => (prev + 1) % solutions.length)
    }

    const prevSlide = () => {
        setCurrentSlide((prev) => (prev - 1 + solutions.length) % solutions.length)
    }

    return (
        <div className="bg-white min-h-screen">
            <Navbar />

            {/* Hero Banner */}
            <section className="relative bg-gradient-to-r from-blue-950 via-blue-900 to-purple-900 py-16 md:py-24 px-4 sm:px-6">
                <div className="absolute inset-0 bg-black/30"></div>
                <div className="relative w-[90%] mx-auto max-w-6xl">
                    <div className="grid md:grid-cols-2 gap-8 items-center">
                        <div className="text-white space-y-6">
                            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold">
                                Thank you for your demo request!
                            </h1>
                            <p className="text-lg md:text-xl text-white/90">
                                Our team will contact you within 2 business days to schedule a demonstration appointment.
                            </p>
                            <p className="text-sm md:text-base text-white/70 italic">
                                If you don't receive a response, please check your spam folder.
                            </p>
                        </div>
                        <div className="relative">
                            <img
                                src="/assets/images/virtual-try.jpg"
                                alt="Thank you"
                                className="w-full h-auto rounded-2xl object-cover"
                                onError={(e) => {
                                    const target = e.target as HTMLImageElement
                                    target.style.display = 'none'
                                }}
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Solutions Section */}
            <section className="py-12 md:py-16 lg:py-20 px-4 sm:px-6 bg-gray-50">
                <div className="w-[90%] mx-auto max-w-7xl">
                    <h2 className="text-2xl md:text-3xl font-bold text-blue-950 text-center mb-8 md:mb-12">
                        Meanwhile, you can continue to explore our solutions
                    </h2>

                    {/* Solutions Carousel */}
                    <div className="relative">
                        {/* Navigation Arrows */}
                        <button
                            onClick={prevSlide}
                            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-3 shadow-lg hover:bg-gray-100 transition-colors"
                            aria-label="Previous slide"
                        >
                            <svg className="w-6 h-6 text-blue-950" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>

                        <button
                            onClick={nextSlide}
                            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-3 shadow-lg hover:bg-gray-100 transition-colors"
                            aria-label="Next slide"
                        >
                            <svg className="w-6 h-6 text-blue-950" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>

                        {/* Carousel Container */}
                        <div className="overflow-hidden">
                            <div
                                className="flex transition-transform duration-500 ease-in-out"
                                style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                            >
                                {solutions.map((solution, index) => (
                                    <div
                                        key={index}
                                        className="min-w-full px-4"
                                    >
                                        <div className="bg-gradient-to-br from-blue-950 to-blue-900 rounded-3xl overflow-hidden shadow-xl">
                                            <div className="grid md:grid-cols-2 gap-0">
                                                {/* Image */}
                                                <div className="relative h-64 md:h-96">
                                                    <img
                                                        src={solution.image}
                                                        alt={solution.title}
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => {
                                                            const target = e.target as HTMLImageElement
                                                            target.src = '/assets/images/virtual-try.jpg'
                                                        }}
                                                    />
                                                </div>

                                                {/* Content */}
                                                <div className="p-8 md:p-12 flex flex-col justify-center text-white">
                                                    <h3 className="text-2xl md:text-3xl font-bold mb-4">
                                                        {solution.title}
                                                    </h3>
                                                    <p className="text-white/90 mb-6 text-base md:text-lg leading-relaxed">
                                                        {solution.description}
                                                    </p>
                                                    <Link
                                                        to={solution.link}
                                                        className="inline-block px-6 py-3 bg-white text-blue-950 font-semibold rounded-lg border-2 border-white hover:bg-blue-50 transition-colors duration-300 text-center"
                                                    >
                                                        Discover
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Dots Indicator */}
                        <div className="flex justify-center gap-2 mt-6">
                            {solutions.map((_, index) => (
                                <button
                                    key={index}
                                    onClick={() => setCurrentSlide(index)}
                                    className={`w-2 h-2 rounded-full transition-all ${index === currentSlide ? 'bg-blue-950 w-8' : 'bg-gray-300'
                                        }`}
                                    aria-label={`Go to slide ${index + 1}`}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    )
}

export default ThankYou

