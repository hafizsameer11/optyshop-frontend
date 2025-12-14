import type { Product } from '../services/productsService'

/**
 * Extracts the primary product image URL using the same comprehensive logic
 * as the product card display. This ensures consistency between what's shown
 * on the product card and what's saved to the cart.
 * 
 * @param product - The product object
 * @param imageIndex - Optional index for selecting a specific image from an array (default: 0)
 * @returns The image URL string
 */
export function getProductImageUrl(product: Product, imageIndex: number = 0): string {
    const p = product as any
    
    // Handle images field - it might be a JSON string or array
    let imagesArray: string[] = []
    if (product.images) {
        if (typeof product.images === 'string') {
            // Parse JSON string
            try {
                imagesArray = JSON.parse(product.images)
            } catch (e) {
                // If parsing fails, treat as single URL string
                imagesArray = [product.images]
            }
        } else if (Array.isArray(product.images)) {
            imagesArray = product.images
        }
    }
    
    // Debug: Log all available image fields in development
    if (import.meta.env.DEV) {
        console.log('🖼️ Image Selection for Product:', product.id, product.name, {
            'product.image': product.image,
            'product.image_url': product.image_url,
            'product.thumbnail': product.thumbnail,
            'product.images': product.images,
            'imagesArray': imagesArray,
            'primary_image': p.primary_image,
            'main_image': p.main_image,
            'product_image': p.product_image,
            'photo': p.photo,
            'photo_url': p.photo_url,
            'image_path': p.image_path,
            'media': p.media,
            'attachments': p.attachments,
        })
    }
    
    // Try all possible image field names from API
    // Priority: Individual image fields first (they're usually the primary/main image),
    // then images array (which might contain multiple images including wrong ones)
    let imgUrl = 
        product.image ||                                    // Single image string (highest priority - usually the main image)
        product.image_url ||                                // image_url field
        product.thumbnail ||                                // thumbnail field
        p.primary_image ||                                  // primary_image
        p.main_image ||                                    // main_image
        p.product_image ||                                  // product_image
        p.photo ||                                         // photo
        p.photo_url ||                                     // photo_url
        p.image_path ||                                    // image_path
        (typeof product.images === 'string' && !product.images.startsWith('[') ? product.images : null) || // Direct string URL (not an array)
        imagesArray[imageIndex] ||                          // Selected image from parsed array
        imagesArray[0] ||                                   // First image from parsed array
        p.media?.[imageIndex] ||                            // media array at index
        p.media?.[0] ||                                    // media array first item
        p.media?.[0]?.url ||                               // media array with url
        p.attachments?.[imageIndex] ||                       // attachments array at index
        p.attachments?.[0] ||                              // attachments array first item
        p.attachments?.[0]?.url ||                          // attachments with url
        '/assets/images/frame1.png'                         // Fallback
    
    // Debug: Log which field was selected
    if (import.meta.env.DEV) {
        let selectedField = 'fallback'
        if (product.image) selectedField = 'product.image'
        else if (product.image_url) selectedField = 'product.image_url'
        else if (product.thumbnail) selectedField = 'product.thumbnail'
        else if (p.primary_image) selectedField = 'primary_image'
        else if (p.main_image) selectedField = 'main_image'
        else if (p.product_image) selectedField = 'product_image'
        else if (p.photo) selectedField = 'photo'
        else if (p.photo_url) selectedField = 'photo_url'
        else if (p.image_path) selectedField = 'image_path'
        else if (typeof product.images === 'string' && !product.images.startsWith('[')) selectedField = 'product.images (string)'
        else if (imagesArray[imageIndex]) selectedField = `imagesArray[${imageIndex}]`
        else if (imagesArray[0]) selectedField = 'imagesArray[0]'
        else if (p.media?.[imageIndex]) selectedField = `media[${imageIndex}]`
        else if (p.media?.[0]) selectedField = 'media[0]'
        else if (p.attachments?.[imageIndex]) selectedField = `attachments[${imageIndex}]`
        else if (p.attachments?.[0]) selectedField = 'attachments[0]'
        
        console.log('✅ Selected image from field:', selectedField, 'URL:', imgUrl)
    }
    
    // Convert full URLs to proxy paths to avoid CORS issues
    if (imgUrl && typeof imgUrl === 'string') {
        // If it's a full URL pointing to localhost:5000, convert to proxy path
        if (imgUrl.includes('http://localhost:5000/') || imgUrl.includes('https://localhost:5000/')) {
            // Extract the path after localhost:5000
            try {
                const urlObj = new URL(imgUrl)
                return urlObj.pathname + urlObj.search
            } catch (e) {
                // If URL parsing fails, try manual extraction
                const match = imgUrl.match(/https?:\/\/localhost:5000(\/.*)/)
                return match ? match[1] : imgUrl
            }
        }
        // If it's already a relative path, use it as is
        if (imgUrl.startsWith('/')) {
            return imgUrl
        }
        // If it's a full URL (other domain), use it directly
        if (imgUrl.startsWith('http://') || imgUrl.startsWith('https://')) {
            return imgUrl
        }
        // If it's a relative path without leading slash, add it
        return '/' + imgUrl
    }
    
    return imgUrl || '/assets/images/frame1.png'
}

