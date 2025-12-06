import React, { useState } from 'react'

const VideoSection: React.FC = () => {
    const [isPlaying, setIsPlaying] = useState(false)

    // YouTube video ID from https://youtu.be/E1LW_MteTho?si=MY88QSvaVj2U6InJ
    const videoId = 'E1LW_MteTho'

    const handlePlay = () => {
        setIsPlaying(true)
    }

    return (
        <section className="bg-white py-6 md:py-8 px-4 sm:px-6">
            <div className="w-[90%] mx-auto">
                {/* Text Content */}
                <div className="text-center mb-6 md:mb-8">
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-blue-950 mb-3 md:mb-4">
                        Choose the best live and realistic virtual try-on,
                    </h2>
                    <p className="text-base sm:text-lg md:text-xl text-gray-600">
                        It has now become an essential experience for any online purchase.
                    </p>
                </div>

                {/* Video Player */}
                <div className="relative w-full max-w-5xl mx-auto bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '16/9', maxHeight: '600px' }}>
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
                                title="Virtual Try-On Video"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            ></iframe>
                        </>
                    )}
                </div>
            </div>
        </section>
    )
}

export default VideoSection

