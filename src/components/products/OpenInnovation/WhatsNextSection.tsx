import React from 'react'
import { useNavigate } from 'react-router-dom'

const WhatsNextSection: React.FC = () => {
    const navigate = useNavigate()

    const handleContactUs = () => {
        navigate('/contact')
    }

    return (
        <section className="bg-white py-16 md:py-24">
            <div className="w-[90%] mx-auto">
                <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                    {/* Left - Text Content */}
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-purple-900 mb-4">
                                <span className="underline decoration-purple-900 decoration-2 underline-offset-4">
                                    What's
                                </span>{' '}
                                <span className="font-bold">next?</span>
                            </h2>
                        </div>

                        <div className="space-y-4 text-base md:text-lg text-slate-700 leading-relaxed">
                            <p>
                                We're working on some amazing,{' '}
                                <strong className="text-slate-900">top-secret projects</strong>! We'd love to share some exclusive details with you if you're interested.
                            </p>
                            <p>
                                In the meantime, if you have innovative ideas you'd like to share with us, we can{' '}
                                <strong className="text-slate-900">co-create together</strong>, even going as far as co-patenting as we've already done with some of our partners.
                            </p>
                        </div>

                        <div className="pt-4">
                            <button
                                onClick={handleContactUs}
                                className="px-8 py-3 border-2 border-purple-900 bg-white text-purple-900 font-semibold rounded-full hover:bg-purple-50 transition-colors duration-300 cursor-pointer"
                            >
                                Contact us
                            </button>
                        </div>
                    </div>

                    {/* Right - Image */}
                    <div className="flex justify-center lg:justify-end order-first lg:order-last">
                        <div className="relative w-full max-w-xl lg:max-w-2xl">
                            <img
                                src="/assets/images/graziella-mesh22.webp"
                                alt="What's next - Innovation and technology"
                                className="w-full h-auto object-contain rounded-2xl shadow-lg"
                                onError={(e) => {
                                    const target = e.target as HTMLImageElement
                                    target.src = '/assets/images/frame1.png'
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default WhatsNextSection

