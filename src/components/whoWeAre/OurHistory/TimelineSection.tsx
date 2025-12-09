import React from 'react'

interface TimelineEvent {
    year: string
    events: string[]
}

const timelineEvents: TimelineEvent[] = [
    {
        year: '2006',
        events: [
            'Ariel & Benjamin create Fittingbox, students at the time.',
            'Winner of the IT prize of Petit Poucet - Microsoft.'
        ]
    },
    {
        year: '2007',
        events: [
            'Publication of the first online virtual mirror based on photos.',
            'Winner of the "Création Développement" trophy - Competition organized by the French Ministry.'
        ]
    },
    {
        year: '2008',
        events: [
            'Publication of the first online virtual mirror.',
            'Innovation award from the Midi-Pyrénées Region - Innovation competition.',
            'Award for company creation at the "HEC et Challenges Competition".'
        ]
    },
    {
        year: '2009',
        events: [
            'Winner of the "Economic Recovery Plan - web 2.0" from the French Ministry of Economy.',
            'Creation of a studio for digitizing frames in Augmented Reality.'
        ]
    },
    {
        year: '2012',
        events: [
            'Special Jury Prize - "TOP 250 Software providers - Syntec Numérique and Ernst & Young".'
        ]
    },
    {
        year: '2015',
        events: [
            'Fittingbox Inc. opens in Miami.',
            'Award "Digital Economy Trophies".',
            'Winners of the competition for digital innovation from BPI France.'
        ]
    }
]

const TimelineSection: React.FC = () => {
    return (
        <section id="timeline-section" className="bg-white py-12 md:py-16 lg:py-20 px-4 sm:px-6">
            <div className="w-[90%] mx-auto max-w-7xl">
                <div className="grid lg:grid-cols-2 gap-8 md:gap-12 items-start">
                    {/* Left - Image */}
                    <div className="flex justify-center lg:justify-start order-2 lg:order-1">
                        <div className="relative w-full max-w-lg lg:max-w-xl">
                            <img
                                src="/assets/images/test-ariel-et-benjamin.webp"
                                alt="Ariel and Benjamin, founders of Fittingbox"
                                className="w-full h-auto rounded-lg shadow-lg object-cover"
                                onError={(e) => {
                                    const target = e.target as HTMLImageElement
                                    target.style.display = 'none'
                                }}
                            />
                        </div>
                    </div>

                    {/* Right - Timeline */}
                    <div className="order-1 lg:order-2 space-y-6 md:space-y-8">
                        <div>
                            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-blue-950 mb-6 md:mb-8">
                                From the pioneers...
                            </h2>
                        </div>

                        <div className="space-y-6 md:space-y-8">
                            {timelineEvents.map((event, index) => (
                                <div key={index} className="border-l-4 border-blue-950 pl-4 md:pl-6">
                                    <h3 className="text-xl md:text-2xl font-bold text-blue-950 mb-3 md:mb-4">
                                        {event.year}
                                    </h3>
                                    <ul className="space-y-2 md:space-y-3">
                                        {event.events.map((item, itemIndex) => (
                                            <li key={itemIndex} className="text-sm md:text-base text-gray-700 leading-relaxed flex items-start">
                                                <span className="text-blue-950 mr-2 mt-1">•</span>
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default TimelineSection

