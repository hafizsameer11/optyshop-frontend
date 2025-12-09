import React from 'react'
import { Link } from 'react-router-dom'

interface InterviewCard {
    id: number
    image: string
    gradient: string
    overlayTitle: string
    overlaySubtitle: string
    overlayRole?: string
    title: string
    description: string
    hasIcon: boolean
}

const InterviewsSection: React.FC = () => {
    const interviews: InterviewCard[] = [
        {
            id: 1,
            image: '/assets/images/maxime-interview.webp',
            gradient: 'from-orange-500 to-red-500',
            overlayTitle: 'ENRICHING TOOLS FOR SPECIFIC 3D MODELING FOR FRAMES',
            overlaySubtitle: 'With Maxime Chambefort',
            overlayRole: 'Lead C++ Developer',
            title: 'Enrichment of tools for specific 3D modeling of frames',
            description: 'Today Maxime Chambefort, Lead C++ Developer at Fittingbox, discusses how we use our expertise to advance design tools like Blender by developing add-ons for the specific needs of 3D structural modeling.',
            hasIcon: true
        },
        {
            id: 2,
            image: '/assets/images/Portrait-rond-ariel.webp',
            gradient: 'from-purple-500 to-pink-500',
            overlayTitle: 'The Power of ARTIFICIAL INTELLIGENCE',
            overlaySubtitle: 'ARIEL CHOUKROUN',
            title: 'The Power of Artificial Intelligence, from co-founder Ariel Choukroun',
            description: 'Ariel Choukroun, co-founder and CTO of Fittingbox, tackles a topic that\'s more relevant than ever: Artificial Intelligence. He offers a clear and concise overview, illustrating its current relevance.',
            hasIcon: false
        },
        {
            id: 3,
            image: '/assets/images/christophe-interview.webp',
            gradient: 'from-blue-500 to-green-500',
            overlayTitle: 'ADVANCED TECHNIQUES FOR REALISTIC RENDERING IN VIRTUAL TRY-ON',
            overlaySubtitle: 'With Christophe Dehais',
            overlayRole: 'Computer Graphics Manager',
            title: 'Advanced techniques for realistic rendering',
            description: 'Christophe Dehais, Computer Graphics Manager, explains how we continue to improve our real-time Virtual Try-On solutions to make them as realistic as possible. What are the challenges when dealing with complex materials? What are the next steps to achieve even more realistic renderings?',
            hasIcon: true
        }
    ]

    return (
        <section className="bg-white py-12 md:py-16 lg:py-20 px-4 sm:px-6">
            <div className="w-[90%] mx-auto max-w-7xl">
                <div className="space-y-8 md:space-y-12">
                    {/* Top Button/Title */}
                    <div className="text-center">
                        <div className="inline-block px-6 md:px-8 py-3 md:py-4 rounded-lg border border-gray-300 bg-white text-gray-900 font-semibold text-sm md:text-base">
                            Interviews with experts
                        </div>
                    </div>

                    {/* Interview Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                        {interviews.map((interview) => (
                            <div
                                key={interview.id}
                                className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden"
                            >
                                {/* Image with Overlay */}
                                <div className="relative h-64 md:h-72 overflow-hidden">
                                    <img
                                        src={interview.image}
                                        alt={interview.overlaySubtitle}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement
                                            target.src = '/assets/images/profil.webp'
                                        }}
                                    />

                                    {/* Gradient Overlay */}
                                    <div className={`absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-r ${interview.gradient} opacity-90`}></div>

                                    {/* Overlay Text */}
                                    <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 text-white z-10">
                                        {interview.id === 2 && (
                                            <div className="text-xs md:text-sm mb-2 opacity-90">BEYOND</div>
                                        )}
                                        <h3 className="text-sm md:text-base lg:text-lg font-bold mb-1 md:mb-2 uppercase leading-tight">
                                            {interview.overlayTitle}
                                        </h3>
                                        <p className="text-xs md:text-sm font-semibold mb-1">
                                            {interview.overlaySubtitle}
                                        </p>
                                        {interview.overlayRole && (
                                            <p className="text-xs md:text-sm opacity-90">
                                                {interview.overlayRole}
                                            </p>
                                        )}
                                    </div>

                                    {/* Megaphone Icon */}
                                    {interview.hasIcon && (
                                        <div className="absolute bottom-4 right-4 z-20">
                                            <svg
                                                className="w-8 h-8 md:w-10 md:h-10 text-white opacity-90"
                                                fill="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                                            </svg>
                                        </div>
                                    )}
                                </div>

                                {/* Content Below Image */}
                                <div className="p-4 md:p-6 space-y-3 md:space-y-4">
                                    {/* Title */}
                                    <h4 className="text-lg md:text-xl font-bold text-blue-950 leading-tight">
                                        {interview.id === 1 || interview.id === 3 ? (
                                            <span className="underline">{interview.title}</span>
                                        ) : (
                                            interview.title
                                        )}
                                    </h4>

                                    {/* Description */}
                                    <p className="text-sm md:text-base text-gray-700 leading-relaxed">
                                        {interview.description}
                                    </p>

                                    {/* Learn More Link */}
                                    <div className="pt-2">
                                        <Link
                                            to="/blog"
                                            className="text-blue-600 hover:text-blue-800 underline font-medium text-sm md:text-base cursor-pointer"
                                        >
                                            Learn more
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    )
}

export default InterviewsSection

