import type { Product, SizeVolumeVariant } from '../services/productsService'
import { getProxiedImageUrl } from '../services/imageProxyService'

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
        (typeof product.images === 'string' && (product.images as string).startsWith('[') === false ? product.images : null) || // Direct string URL (not an array)
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
        else if (typeof product.images === 'string' && (product.images as string).startsWith('[') === false) selectedField = 'product.images (string)'
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
        // Handle blob URLs - they are valid and can be displayed directly
        if (imgUrl.startsWith('blob:')) {
            if (import.meta.env.DEV) {
                console.log('🔗 Using blob URL for product image:', imgUrl)
            }
            return imgUrl
        }
        
        // Handle null/empty URLs
        if (!imgUrl || imgUrl.trim() === '') {
            if (import.meta.env.DEV) {
                console.warn('🚫 Empty URL detected, using fallback image')
            }
            return '/assets/images/frame1.png'
        }
        
        // If it's a full URL pointing to localhost:5000, convert to proxy path
        if (imgUrl.includes('http://localhost:5000/') || imgUrl.includes('https://localhost:5000/')) {
            // Extract the path after localhost:5000
            try {
                const urlObj = new URL(imgUrl)
                return urlObj.pathname + urlObj.search
            } catch (e) {
                // If URL parsing fails, try manual extraction
                const match = imgUrl.match(/https?:\/\/localhost:5000(\/.*)/)
                return match ? match[1] : '/assets/images/frame1.png'
            }
        }
        // If it's already a relative path starting with /assets/, use it as is
        if (imgUrl.startsWith('/assets/')) {
            return imgUrl
        }
        // If it's already a relative path, use it as is
        if (imgUrl.startsWith('/')) {
            return imgUrl
        }
        // If it's a full URL (other domain), use the image proxy service
        if (imgUrl.startsWith('http://') || imgUrl.startsWith('https://')) {
            // Use the image proxy service for all external images
            const proxiedUrl = getProxiedImageUrl(imgUrl)
            if (import.meta.env.DEV) {
                console.log('🌐 Using proxied URL:', {
                    original: imgUrl,
                    proxied: proxiedUrl
                })
            }
            return proxiedUrl || '/assets/images/frame1.png'
        }
        // If it's a relative path without leading slash, add it
        return '/' + imgUrl
    }
    
    return imgUrl || '/assets/images/frame1.png'
}

/**
 * Gets the appropriate image URL for a size/volume variant
 * Priority: variant.image_url > variant.images > product images
 * 
 * @param product - The product object
 * @param variant - The selected size/volume variant
 * @param imageIndex - Optional index for selecting a specific image from variant images array (default: 0)
 * @returns The image URL string
 */
export function getVariantImageUrl(product: Product, variant: SizeVolumeVariant | null, imageIndex: number = 0): string {
    // If no variant, fall back to product image
    if (!variant) {
        return getProductImageUrl(product, imageIndex)
    }
    
    // Priority 1: Use variant image_url (new field)
    if (variant.image_url) {
        // Handle blob URLs - they are valid and can be displayed directly
        if (variant.image_url.startsWith('blob:')) {
            if (import.meta.env.DEV) {
                console.log('🔗 Using blob URL for variant image:', {
                    variantId: variant.id,
                    sizeVolume: variant.size_volume,
                    blobUrl: variant.image_url,
                    urlLength: variant.image_url.length
                })
            }
            return variant.image_url
        }
        
        // Handle problematic placeholder images
        if (variant.image_url.includes('3d-glasses.png')) {
            if (import.meta.env.DEV) {
                console.warn('🚫 Problematic image detected in variant, using fallback:', variant.image_url)
            }
            // Use fallback based on size_volume
            let fallbackImage = '/assets/images/frame1.png';
            if (variant.size_volume) {
                const sizeVolume = variant.size_volume.toLowerCase();
                if (sizeVolume.includes('5ml')) {
                    fallbackImage = '/assets/images/eye-hygiene-5ml.png';
                } else if (sizeVolume.includes('10ml')) {
                    fallbackImage = '/assets/images/eye-hygiene-10ml.png';
                } else if (sizeVolume.includes('15ml')) {
                    fallbackImage = '/assets/images/eye-hygiene-10ml.png'; // Use 10ml as closest match
                } else if (sizeVolume.includes('30ml')) {
                    fallbackImage = '/assets/images/eye-hygiene-30ml.png';
                } else if (sizeVolume.includes('100ml')) {
                    fallbackImage = '/assets/images/eye-hygiene-30ml.png'; // Use 30ml as closest match
                } else if (sizeVolume.includes('550ml')) {
                    fallbackImage = '/assets/images/eye-hygiene-30ml.png'; // Use 30ml as closest match
                }
            }
            return fallbackImage;
        }
        
        // Handle external URLs for variant images
        if (variant.image_url.startsWith('http://') || variant.image_url.startsWith('https://')) {
            // Use the image proxy service for all external variant images
            const proxiedUrl = getProxiedImageUrl(variant.image_url)
            if (import.meta.env.DEV) {
                console.log('🌐 Using proxied URL for variant image:', {
                    original: variant.image_url,
                    proxied: proxiedUrl
                })
            }
            if (proxiedUrl) {
                return proxiedUrl
            }
            // Fallback if proxy fails
            let fallbackImage = '/assets/images/frame1.png';
            if (variant.size_volume) {
                const sizeVolume = variant.size_volume.toLowerCase();
                if (sizeVolume.includes('5ml')) {
                    fallbackImage = '/assets/images/eye-hygiene-5ml.png';
                } else if (sizeVolume.includes('10ml')) {
                    fallbackImage = '/assets/images/eye-hygiene-10ml.png';
                } else if (sizeVolume.includes('15ml')) {
                    fallbackImage = '/assets/images/eye-hygiene-10ml.png'; // Use 10ml as closest match
                } else if (sizeVolume.includes('30ml')) {
                    fallbackImage = '/assets/images/eye-hygiene-30ml.png';
                } else if (sizeVolume.includes('100ml')) {
                    fallbackImage = '/assets/images/eye-hygiene-30ml.png'; // Use 30ml as closest match
                } else if (sizeVolume.includes('550ml')) {
                    fallbackImage = '/assets/images/eye-hygiene-30ml.png'; // Use 30ml as closest match
                }
            }
            return fallbackImage;
        }
        
        if (import.meta.env.DEV) {
            console.log('🖼️ Using variant image_url:', {
                variantId: variant.id,
                sizeVolume: variant.size_volume,
                imageUrl: variant.image_url
            })
        }
        return variant.image_url
    }
    
    // Priority 2: Use variant images array (legacy - check if variant has images property)
    if ((variant as any).images && Array.isArray((variant as any).images) && (variant as any).images.length > 0) {
        const variantImages = (variant as any).images as string[]
        if (variantImages[imageIndex]) {
            if (import.meta.env.DEV) {
                console.log('🖼️ Using variant images array:', {
                    variantId: variant.id,
                    sizeVolume: variant.size_volume,
                    imageIndex,
                    imageUrl: variantImages[imageIndex]
                })
            }
            return variantImages[imageIndex]
        } else if (variantImages[0]) {
            // Fallback to first image if index doesn't exist
            if (import.meta.env.DEV) {
                console.log('🖼️ Using variant images array (fallback to first):', {
                    variantId: variant.id,
                    sizeVolume: variant.size_volume,
                    imageIndex: 0,
                    imageUrl: variantImages[0]
                })
            }
            return variantImages[0]
        }
    }
    
    // Priority 3: Fall back to product image
    if (import.meta.env.DEV) {
        console.log('🖼️ No variant image found, using product image:', {
            variantId: variant.id,
            sizeVolume: variant.size_volume,
            hasImageUrl: !!variant.image_url,
            hasImages: !!((variant as any).images && (variant as any).images.length > 0)
        })
    }
    
    return getProductImageUrl(product, imageIndex)
}

