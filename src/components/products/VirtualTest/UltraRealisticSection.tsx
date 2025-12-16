import React, { useState } from 'react'
import VirtualTryOnModal from '../../home/VirtualTryOnModal'

const UltraRealisticSection: React.FC = () => {
    const [isTryOnOpen, setIsTryOnOpen] = useState(false)

    return (
        <section className="bg-white py-16 px-4">
            <div className="w-[90%] mx-auto grid gap-10 lg:grid-cols-2">
                {/* Left image panel */}
                <div className="relative overflow-hidden image-cover rounded-3xl shadow-2xl h-[630px]">
                    <img
                        src="/assets/images/virtual-try.jpg"
                        alt="Ultra-realistic virtual try-on"
                        className="h-full w-full object-cover"
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

                    <div className="absolute inset-0 flex flex-col items-center justify-end pb-10 px-6 text-white space-y-4 text-center">
                        <p className="text-lg font-medium max-w-xl">
                            <span className="block">Try our <strong>ultra-realistic virtual try-on</strong></span>
                            <span className="block">solution for glasses</span>
                        </p>
                        <button
                            onClick={() => setIsTryOnOpen(true)}
                            className="rounded-full bg-white/90 text-slate-900 px-8 py-3 font-semibold shadow-lg hover:bg-white transition-colors"
                        >
                            Try on glasses
                        </button>
                    </div>
                </div>

                {/* Right content panel */}
                <div className="bg-white rounded-3xl shadow-[0_20px_45px_rgba(14,30,37,0.08)] p-8 space-y-6 border border-slate-100 flex flex-col justify-center">
                    <div className="text-center lg:text-left space-y-4">
                        <h2 className="text-3xl font-semibold text-slate-800">
                            Experience the <span className="text-orange-500">future of eyewear</span>
                        </h2>
                        <p className="text-lg text-slate-600">
                            Our ultra-realistic virtual try-on solution uses advanced AR technology to help your customers make confident eyewear choices from anywhere.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div className="flex gap-4 items-start">
                            <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold flex-shrink-0 mt-1">✓</div>
                            <p className="text-slate-700">Real-time virtual fitting with accurate frame sizing</p>
                        </div>
                        <div className="flex gap-4 items-start">
                            <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold flex-shrink-0 mt-1">✓</div>
                            <p className="text-slate-700">Works on mobile, tablet, and desktop devices</p>
                        </div>
                        <div className="flex gap-4 items-start">
                            <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold flex-shrink-0 mt-1">✓</div>
                            <p className="text-slate-700">Boost customer confidence and reduce return rates</p>
                        </div>
                    </div>
                </div>
            </div>

            <VirtualTryOnModal open={isTryOnOpen} onClose={() => setIsTryOnOpen(false)} />
        </section>
    )
}

export default UltraRealisticSection
