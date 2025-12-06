import React from 'react'

const AccurateMeasurementsSection: React.FC = () => {
    return (
        <section className="bg-stone-50 py-12 md:py-16 lg:py-20">
            <div className="w-[90%] mx-auto max-w-7xl">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 lg:gap-16 items-center">
                    {/* Left - Text Content */}
                    <div>
                        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-blue-950 mb-4 md:mb-6">
                            Accurate measurements to ensure a{' '}
                            <span className="relative inline-block">
                                proper fit
                                <span className="absolute bottom-0 left-0 right-0 h-0.5 sm:h-1 bg-blue-950"></span>
                            </span>
                        </h2>

                        <div className="space-y-5 md:space-y-6 text-blue-950 text-base md:text-lg leading-relaxed">
                            <p>
                                PD is necessary for <strong className="font-bold">lens configuration</strong>, ensuring optimal vision through the correct part of the lens. There are two types of PD measurements:
                            </p>

                            <ul className="space-y-4 md:space-y-5 list-none pl-0">
                                <li className="flex items-start">
                                    <span className="text-blue-950 mr-3 mt-1">•</span>
                                    <span>
                                        <strong className="font-bold">Single or binocular PD</strong> measures the distance between the centers of the two pupils. It is the most commonly used measurement because it provides a more accurate representation of overall visual needs.
                                    </span>
                                </li>
                                <li className="flex items-start">
                                    <span className="text-blue-950 mr-3 mt-1">•</span>
                                    <span>
                                        <strong className="font-bold">Double or monocular PD</strong> measures the distance between each pupil and the center of the bridge of the nose.
                                    </span>
                                </li>
                            </ul>

                            <p>
                                The Fittingbox PD measurement solution provides accurate and instant <strong className="font-bold">single PD results</strong> for any user + <strong className="font-bold">dual PD</strong> if the user wears glasses during the measurement.
                            </p>
                        </div>
                    </div>

                    {/* Right - Image */}
                    <div className="flex justify-center lg:justify-end">
                        <div className="rounded-2xl shadow-lg overflow-hidden w-full max-w-md">
                            <img
                                src="/assets/images/PD-Measurement-Single-and-Dual-PD-explication.webp"
                                alt="Single and Dual PD Measurement explanation"
                                className="w-full h-auto object-cover"
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

export default AccurateMeasurementsSection

