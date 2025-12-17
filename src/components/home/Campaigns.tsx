import React, { useEffect, useState } from 'react'
import { getCampaigns } from '../../services/campaignsService'
import type { Campaign } from '../../services/campaignsService'

const CampaignsComponent: React.FC = () => {
    const [campaigns, setCampaigns] = useState<Campaign[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let isCancelled = false
        
        const fetchCampaigns = async () => {
            try {
                setLoading(true)
                const data = await getCampaigns(true) // Get only active campaigns
                
                if (isCancelled) return
                
                setCampaigns(data)
            } catch (error) {
                if (!isCancelled) {
                    console.error('Error loading campaigns:', error)
                    setCampaigns([])
                }
            } finally {
                if (!isCancelled) {
                    setLoading(false)
                }
            }
        }

        fetchCampaigns()
        
        return () => {
            isCancelled = true
        }
    }, [])

    if (loading) {
        return (
            <div className="w-full py-12 bg-gray-50">
                <div className="w-[90%] mx-auto max-w-6xl">
                    <div className="h-64 bg-gray-200 animate-pulse rounded-lg"></div>
                </div>
            </div>
        )
    }

    if (campaigns.length === 0) {
        return null // Don't render anything if no campaigns
    }

    const handleCampaignClick = (campaign: Campaign) => {
        if (campaign.link_url) {
            window.open(campaign.link_url, '_blank', 'noopener,noreferrer')
        }
    }

    return (
        <section className="w-full py-12 md:py-16 bg-white">
            <div className="w-[90%] mx-auto max-w-6xl">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 text-center">
                    Special Campaigns
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {campaigns.map((campaign) => (
                        <div
                            key={campaign.id}
                            className={`bg-white rounded-lg shadow-md overflow-hidden transition-all duration-300 hover:shadow-xl ${
                                campaign.link_url ? 'cursor-pointer' : ''
                            }`}
                            onClick={() => handleCampaignClick(campaign)}
                        >
                            {campaign.image_url && (
                                <div className="relative h-48 bg-gray-200 overflow-hidden">
                                    <img
                                        src={campaign.image_url}
                                        alt={campaign.title}
                                        className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                                        onError={(e) => {
                                            // Fallback if image fails to load
                                            const target = e.target as HTMLImageElement;
                                            target.style.display = 'none';
                                        }}
                                    />
                                </div>
                            )}
                            
                            <div className="p-6">
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                    {campaign.title}
                                </h3>
                                
                                {campaign.description && (
                                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                                        {campaign.description}
                                    </p>
                                )}
                                
                                {campaign.link_url && (
                                    <div className="flex items-center text-blue-600 font-medium text-sm">
                                        <span>Learn More</span>
                                        <svg
                                            className="w-4 h-4 ml-2"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M9 5l7 7-7 7"
                                            />
                                        </svg>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}

export default CampaignsComponent

