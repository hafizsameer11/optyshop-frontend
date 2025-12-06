import React from 'react'

const WhyPDSection: React.FC = () => {
    return (
        <section className="bg-white py-12 md:py-16 lg:py-20">
            <div className="w-[90%] mx-auto max-w-7xl">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 lg:gap-16 items-center">
                    {/* Left - Image */}
                    <div className="order-2 lg:order-1 flex justify-center lg:justify-start">
                        <div className="rounded-2xl shadow-lg overflow-hidden w-full max-w-sm lg:max-w-md">
                            <img
                                src="/assets/images/PD-Measurement-Glasses-Optical-Center.webp"
                                alt="PD Measurement on woman with eyeglasses"
                                className="w-full h-auto object-cover  shadow-lg"
                                onError={(e) => {
                                    const target = e.target as HTMLImageElement
                                    target.style.display = 'none'
                                }}
                            />
                        </div>
                    </div>

                    {/* Right - Text Content */}
                    <div className="order-1 lg:order-2">
                        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-blue-950 mb-4 md:mb-6">
                            Why is pupillary distance (PD) important?
                        </h2>
                        <div className="w-20 h-1 bg-blue-950 mb-6 md:mb-8"></div>

                        <div className="space-y-5 md:space-y-6 text-blue-950 text-base md:text-lg leading-relaxed">
                            <p>
                                Pupillary distance (PD) is the <strong className="font-bold">distance between the centers of the pupils</strong> and is used to determine the <strong className="font-bold">position of the optical center of the lenses</strong> for your glasses.
                            </p>

                            <p>
                                An incorrect PD can lead to eye strain, headaches, and even vision distortion. That's why it's <strong className="font-bold">crucial</strong> to get an accurate measurement when purchasing eyeglasses.
                            </p>

                            <p>
                                The Fittingbox online PD measurement solution has a proven accuracy of <strong className="font-bold">1 mm for 7 out of 10 measurements</strong> and is accurate to within <strong className="font-bold">2 mm of the actual measurement in 96% of cases</strong>.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default WhyPDSection

