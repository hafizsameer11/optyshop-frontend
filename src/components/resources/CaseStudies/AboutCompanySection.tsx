import React from 'react'
import type { CaseStudy } from '../../../services/caseStudiesService'

interface AboutCompanySectionProps {
    study: CaseStudy
}

const AboutCompanySection: React.FC<AboutCompanySectionProps> = ({ study }) => {
    // Fielmann-specific content
    const fielmannContent = {
        about: {
            paragraph1: "Fielmann Group is a manufacturer, distributor, and retailer of visual aids and other optical products, as well as hearing aids and accessories. Over 27 million people wear Fielmann glasses.",
            paragraph2: "The publicly traded family business was founded in 1972 and is headquartered in Hamburg, Germany. Today, Fielmann operates more than 930 stores in 16 countries and sells online through its website.",
            paragraph3: "For over 50 years, the Fielmann name has been synonymous with stylish eyewear at fair prices. The company not only offers top international brands and designers, but also employs top in-house designers who set fashion standards for eyewear."
        },
        advantages: {
            quote1: "We compared the conversion of sunglasses purchases: with a Virtual Try-On experience, you get up to 3x more than those without VTO, depending on the country.",
            quote2: "After virtually trying on a pair of glasses, we observed that users are twice as likely to book an appointment in one of our stores."
        }
    }

    return (
        <section className="bg-white py-12 md:py-16 lg:py-20 px-4 sm:px-6">
            <div className="w-[90%] mx-auto max-w-4xl">
                {/* About Section */}
                <div className="mb-12 md:mb-16">
                    <h2 className="text-2xl md:text-3xl font-bold text-blue-900 mb-6 md:mb-8">
                        About the Fielmann Group
                    </h2>
                    <div className="space-y-4 md:space-y-6 text-base md:text-lg text-gray-800 leading-relaxed">
                        <p>
                            {fielmannContent.about.paragraph1}
                        </p>
                        <p>
                            {fielmannContent.about.paragraph2}
                        </p>
                        <p>
                            {fielmannContent.about.paragraph3}
                        </p>
                    </div>
                </div>

                {/* Advantages Section */}
                <div>
                    <h2 className="text-2xl md:text-3xl font-bold text-blue-900 mb-6 md:mb-8">
                        On the advantages that the Fielmann Group has achieved thanks to virtual try-ons in eyewear sales
                    </h2>
                    <div className="space-y-6 md:space-y-8">
                        <div className="bg-gray-50 rounded-lg p-6 md:p-8">
                            <p className="text-base md:text-lg text-gray-800 leading-relaxed italic">
                                "{fielmannContent.advantages.quote1}"
                            </p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-6 md:p-8">
                            <p className="text-base md:text-lg text-gray-800 leading-relaxed italic mb-4">
                                "{fielmannContent.advantages.quote2}"
                            </p>
                            {study.person && (
                                <p className="text-sm md:text-base text-gray-600">
                                    — {study.person.name}, {study.person.role}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default AboutCompanySection

