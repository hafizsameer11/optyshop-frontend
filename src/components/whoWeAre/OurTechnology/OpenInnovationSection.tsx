import React from 'react'
import { useNavigate } from 'react-router-dom'

const OpenInnovationSection: React.FC = () => {
    const navigate = useNavigate()

    const handleCoCreate = () => {
        navigate('/open-innovation')
    }
    return (
        <section className="py-12 md:py-16 lg:py-20 px-4 sm:px-6" style={{ backgroundColor: '#253C69' }}>
            <div className="w-[90%] mx-auto max-w-7xl">
                <div className="space-y-8 md:space-y-12">
                    {/* Section Title */}
                    <div className="text-center">
                        <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white">
                            Open Innovation: Co-creating the Future of Optics
                        </h2>
                    </div>

                    {/* Two Columns */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-start">
                        {/* Left Column - Co-Creation */}
                        <div className="space-y-6 md:space-y-8 flex flex-col">
                            <div>
                                <h3 className="text-xl md:text-2xl lg:text-3xl font-bold text-white mb-2">
                                    <span className="border-b-2 border-cyan-400 pb-1">Co-Creation</span>
                                </h3>
                            </div>

                            <div className="space-y-4 text-base md:text-lg text-white/90 leading-relaxed">
                                <p>
                                    If you have innovative ideas to share with us, we can <strong className="text-white font-bold">co-create together</strong>. From brainstorming to prototyping to co-registration of patents, we collaborate closely with our partners to turn innovation into reality. We co-create the future.
                                </p>
                            </div>

                            {/* Image */}
                            <div className="bg-white rounded-xl p-4 shadow-lg">
                                <img
                                    src="/assets/images/closeup-1100x734-2.webp"
                                    alt="3D rendered eyeglasses"
                                    className="w-full h-auto rounded-lg object-contain"
                                    onError={(e) => {
                                        const target = e.target as HTMLImageElement
                                        target.style.display = 'none'
                                    }}
                                />
                            </div>
                        </div>

                        {/* Right Column - Previews */}
                        <div className="space-y-6 md:space-y-8 flex flex-col">
                            <div>
                                <h3 className="text-xl md:text-2xl lg:text-3xl font-bold text-white mb-2">
                                    <span className="border-b-2 border-cyan-400 pb-1">Previews</span>
                                </h3>
                            </div>

                            <div className="space-y-4 text-base md:text-lg text-white/90 leading-relaxed">
                                <p>
                                    Join our pilot programs, where cutting-edge optical science meets advanced engineering. We're developing <strong className="text-white font-bold">groundbreaking, top-secret projects</strong>! If you're curious, we'd be happy to share what's coming.
                                </p>
                            </div>

                            {/* Image */}
                            <div className="bg-white rounded-xl p-4 shadow-lg mt-[30px]">
                                <img
                                    src="/assets/images/566475__Graziella01_DSC1237_STUDIOLAB.webp"
                                    alt="Woman wearing sunglasses"
                                    className="w-full h-auto rounded-lg object-contain"
                                    onError={(e) => {
                                        const target = e.target as HTMLImageElement
                                        target.style.display = 'none'
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Call to Action Button */}
                    <div className="text-center pt-4">
                        <button 
                            onClick={handleCoCreate}
                            className="px-8 md:px-10 py-3 md:py-4 rounded-lg border-2 border-white text-white font-semibold hover:bg-white hover:text-[#253C69] transition-colors duration-300 text-sm md:text-base cursor-pointer"
                        >
                            Let's co-create together!
                        </button>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default OpenInnovationSection

