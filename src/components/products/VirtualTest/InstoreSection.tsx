import React from 'react'
import { useNavigate } from 'react-router-dom'

const InstoreSection: React.FC = () => {
    const navigate = useNavigate()

    const handleNavigateToInStore = () => {
        navigate('/in-store')
    }

    return (
        <section className="bg-white text-[#0f172a] py-16 md:py-24">
            <div className="w-[90%] max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12">

                {/* Left - Text */}
                <div className="w-full lg:w-1/2 order-2 lg:order-1">
                    <h2 className="text-3xl md:text-4xl font-semibold mb-8">
                        For <span className="text-orange-500">Instore</span>
                    </h2>

                    <p className="text-base md:text-lg text-slate-700 mb-6 max-w-xl leading-relaxed">
                        To showcase your eyewear collections, nothing better than the "Plug & Play" Virtual Try-On and catalog manager.
                    </p>

                    <p className="text-base md:text-lg text-slate-700 mb-8 max-w-xl leading-relaxed">
                        <a href="#" className="text-blue-600 hover:text-blue-700 font-semibold underline">
                            The Standard Point of Sale service
                        </a>
                        {' '}is ideal for <span className="font-semibold text-[#0f172a]">optical professionals,</span> such as <span className="font-semibold text-[#0f172a]">opticians and optometrists,</span> who want to <span className="font-semibold text-[#0f172a]">engage their customers</span> as they visit the store.
                    </p>

                    <button
                        onClick={handleNavigateToInStore}
                        className="px-8 py-3 border-2 border-orange-500 text-orange-500 rounded-full font-semibold hover:bg-orange-50 transition-colors cursor-pointer"
                    >
                        Virtual Try-On for Instore
                    </button>
                </div>

                {/* Right - Image */}
                <div className="w-full lg:w-1/2 flex justify-center lg:justify-end order-1 lg:order-2">
                    <div className="w-[280px] md:w-[380px] lg:w-[420px] rounded-3xl shadow-2xl overflow-hidden">
                        <img src="/assets/images/image.png" alt="Virtual Try-On for Instore" className="w-full h-auto block" />
                    </div>
                </div>

            </div>
        </section>
    )
}

export default InstoreSection
