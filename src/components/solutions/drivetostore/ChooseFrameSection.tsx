import React from 'react'

const ChooseFrameSection: React.FC = () => {
    return (
        <section className="bg-white pt-0 pb-12 md:pb-16 lg:pb-20">
            <div className="w-[90%] mx-auto max-w-7xl">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-center">
                    {/* Left - Text Content */}
                    <div className="order-1">
                        <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-blue-950 mb-4 md:mb-6 leading-tight">
                            An Huge Help to Choose{' '}
                            <span className="relative inline-block">
                                a Frame
                                <span className="absolute bottom-0 left-0 right-0 h-0.5 sm:h-1 bg-blue-950"></span>
                            </span>
                        </h2>

                        <p className="text-lg md:text-xl text-blue-950 font-semibold mb-4 md:mb-6">
                            89% of glasses wearers found Virtual Try-On useful when it comes to choosing a frame.
                        </p>

                        <p className="text-base md:text-lg text-blue-950 leading-relaxed mb-6 md:mb-8">
                            The flexibility of shopping on a variety of electronic devices - phone, tablet, laptop- allows consumers to browse eyewear catalogs from the comfort of their home, to eventually <strong className="text-blue-950 font-bold">travel to a store to make their final purchase</strong>.
                        </p>

                        <button className="bg-transparent border-2 border-blue-950 text-blue-950 px-6 md:px-8 py-3 md:py-4 rounded-lg font-semibold text-base md:text-lg hover:bg-blue-950 hover:text-white transition-colors duration-300">
                            Learn more
                        </button>
                    </div>

                    {/* Right - Smartphone Image */}
                    <div className="order-2 flex justify-center lg:justify-end">
                        <div className="w-full max-w-[180px] md:max-w-[220px] lg:max-w-[260px]">
                            <img
                                src="/assets/images/mobile1.png"
                                alt="Smartphone showing virtual try-on application"
                                className="w-full h-auto object-contain"
                                onError={(e) => {
                                    const target = e.target as HTMLImageElement
                                    target.style.display = 'none'
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default ChooseFrameSection

