import { prefetchFlashOfferWithProducts } from '../services/flashOffersService'

let landingChunkRequested = false

function prefetchFlashOfferLandingChunk(): void {
    if (landingChunkRequested) return
    landingChunkRequested = true
    void import('../pages/shop/FlashOfferLanding')
}

/**
 * When the user is likely to open a flash-offer landing page, preload the JS chunk and API data.
 * Call from pointerenter / focus / idle — safe to invoke repeatedly.
 */
export function prefetchFlashOfferShopIntent(offerId: number, destinationHref: string): void {
    if (/^https?:\/\//i.test(destinationHref)) return
    if (!destinationHref.startsWith('/flash-offers/')) return
    prefetchFlashOfferLandingChunk()
    prefetchFlashOfferWithProducts(offerId)
}
