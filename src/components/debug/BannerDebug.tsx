import React, { useEffect, useState } from 'react'
import { getBanners } from '../../services/bannersService'
import type { Banner } from '../../services/bannersService'

const BannerDebug: React.FC = () => {
    const [homeBanners, setHomeBanners] = useState<Banner[]>([])
    const [categoryBanners, setCategoryBanners] = useState<Banner[]>([])
    const [eyeGlassesBanners, setEyeGlassesBanners] = useState<Banner[]>([])
    const [contactLensesBanners, setContactLensesBanners] = useState<Banner[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchAllBanners = async () => {
            try {
                setLoading(true)
                setError(null)

                // Fetch all banners without filters
                const allBanners = await getBanners()
                console.log('All banners:', allBanners)

                // Fetch home page banners
                const home = await getBanners({ page_type: 'home' })
                console.log('Home banners:', home)
                setHomeBanners(home)

                // Fetch category page banners (all categories)
                const category = await getBanners({ page_type: 'category' })
                console.log('Category banners:', category)
                setCategoryBanners(category)

                // Fetch eye glasses category banners (category_id: 23)
                const eyeGlasses = await getBanners({ page_type: 'category', category_id: 23 })
                console.log('Eye glasses banners:', eyeGlasses)
                setEyeGlassesBanners(eyeGlasses)

                // Fetch contact lenses category banners (category_id: 24)
                const contactLenses = await getBanners({ page_type: 'category', category_id: 24 })
                console.log('Contact lenses banners:', contactLenses)
                setContactLensesBanners(contactLenses)

            } catch (err) {
                console.error('Error fetching banners:', err)
                setError(err instanceof Error ? err.message : 'Unknown error')
            } finally {
                setLoading(false)
            }
        }

        fetchAllBanners()
    }, [])

    if (loading) {
        return <div>Loading banner debug info...</div>
    }

    if (error) {
        return <div>Error: {error}</div>
    }

    return (
        <div style={{ padding: '20px', fontFamily: 'monospace' }}>
            <h1>Banner Debug Information</h1>
            
            <div style={{ marginBottom: '30px' }}>
                <h2>Home Page Banners (page_type: "home")</h2>
                <pre>{JSON.stringify(homeBanners, null, 2)}</pre>
            </div>

            <div style={{ marginBottom: '30px' }}>
                <h2>All Category Banners (page_type: "category")</h2>
                <pre>{JSON.stringify(categoryBanners, null, 2)}</pre>
            </div>

            <div style={{ marginBottom: '30px' }}>
                <h2>Eye Glasses Category Banners (page_type: "category", category_id: 23)</h2>
                <pre>{JSON.stringify(eyeGlassesBanners, null, 2)}</pre>
            </div>

            <div style={{ marginBottom: '30px' }}>
                <h2>Contact Lenses Category Banners (page_type: "category", category_id: 24)</h2>
                <pre>{JSON.stringify(contactLensesBanners, null, 2)}</pre>
            </div>
        </div>
    )
}

export default BannerDebug
