import React, { useState } from 'react'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'

const WebinarVideo: React.FC = () => {
    const [isPlaying, setIsPlaying] = useState(false)

    // YouTube video ID from https://youtu.be/Xji1BYVJe9Q?si=Mxi6t9EASCFnw8dL
    const videoId = 'Xji1BYVJe9Q'

    const handlePlay = () => {
        setIsPlaying(true)
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
                            Eyewear Virtual Try-On
                            </h1>
                            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-4xl font-bold text-white leading-tight">
                            5 Things To Keep in Mind
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
            {/* Content Section */}
            <section className="py-12 md:py-16 px-4 sm:px-6">
                <div className="w-[90%] mx-auto">
                    {/* Text Content */}
                    <div className="mb-8 md:mb-12 space-y-4">
                        <p className="text-base md:text-lg lg:text-xl text-blue-950 leading-relaxed">
                            At Fittingbox, by accompanying all types of customers every month, we know from experience the <strong className="font-bold">5 things</strong> you should to keep in mind <strong className="font-bold text-lg md:text-xl">before getting your virtual try-on.</strong>
                        </p>
                        <p className="text-base md:text-lg text-blue-950 leading-relaxed">
                            Matthieu Montpellier, Head of Customer Success at Fittingbox is going through these <strong className="font-bold">key success factors:</strong>
                        </p>
                        <p className="text-sm md:text-base text-gray-600">
                            &lt;Duration: 10 minutes&gt;
                        </p>
                    </div>

                    {/* Video Player */}
                    <div className="relative w-full max-w-5xl mx-auto bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
                        {!isPlaying ? (
                            <>
                                {/* Play Button Overlay */}
                                <button
                                    onClick={handlePlay}
                                    className="absolute inset-0 flex items-center justify-center bg-black/50 hover:bg-black/60 transition-colors duration-300 cursor-pointer group z-10"
                                >
                                    <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full bg-slate-700 hover:bg-slate-600 transition-all duration-300 flex items-center justify-center shadow-2xl transform group-hover:scale-110">
                                        <svg
                                            className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-gray-300 ml-1"
                                            fill="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path d="M8 5v14l11-7z" />
                                        </svg>
                                    </div>
                                </button>
                            </>
                        ) : (
                            <>
                                {/* YouTube Video Embed */}
                                <iframe
                                    className="w-full h-full"
                                    src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
                                    title="Eyewear Virtual Try-On: 5 Things To Keep in Mind"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                ></iframe>
                            </>
                        )}
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    )
}

export default WebinarVideo

