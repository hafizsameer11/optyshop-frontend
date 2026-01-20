// Simple test to verify the spherical filtering logic
const filterSubcategoriesByType = (subcategories, currentSubcategory) => {
    if (!currentSubcategory || !subcategories || subcategories.length === 0) {
        return subcategories || []
    }

    const currentName = (currentSubcategory.name || '').toLowerCase()
    
    // Determine the type of the current subcategory
    const isSpherical = /spherical|sferiche|sferica/i.test(currentName)
    const isAstigmatism = /astigmatism|astigmatismo|toric|torica/i.test(currentName)
    const isColored = /colored|coloured|color|colour/i.test(currentName)
    
    // Filter subcategories based on the detected type
    return subcategories.filter(sub => {
        const subName = (sub.name || '').toLowerCase()
        
        if (isSpherical) {
            // For spherical pages, show ONLY spherical-related subcategories
            // Exclude anything that is clearly not spherical (replacement frequency, colors, astigmatism)
            const isReplacementFrequency = /daily|weekly|monthly|disposable|frequent/i.test(subName)
            const isColoredType = /colored|coloured|color|colour/i.test(subName)
            const isAstigmatismType = /astigmatism|astigmatismo|toric|torica/i.test(subName)
            
            // Include if it's spherical OR if it doesn't match any excluded categories
            return /spherical|sferiche|sferica/i.test(subName) || 
                   (!isReplacementFrequency && !isColoredType && !isAstigmatismType)
        } else if (isAstigmatism) {
            // For astigmatism pages, show only astigmatism-related subcategories
            return /astigmatism|astigmatismo|toric|torica/i.test(subName)
        } else if (isColored) {
            // For colored pages, show only colored-related subcategories
            return /colored|coloured|color|colour/i.test(subName)
        } else {
            // For other types, show all subcategories
            return true
        }
    })
}

// Test data
const testSubcategories = [
    { name: 'Spherical', slug: 'spherical' },
    { name: 'Daily', slug: 'daily' },
    { name: 'Weekly', slug: 'weekly' },
    { name: 'Monthly', slug: 'monthly' },
    { name: 'Coloured Lenses', slug: 'coloured-lenses' },
    { name: 'Toric', slug: 'toric' },
    { name: 'Astigmatism', slug: 'astigmatism' },
    { name: 'Standard Lenses', slug: 'standard-lenses' },
    { name: 'Regular Lenses', slug: 'regular-lenses' }
]

// Test spherical filtering
const sphericalCurrent = { name: 'Spherical', slug: 'spherical' }
const sphericalFiltered = filterSubcategoriesByType(testSubcategories, sphericalCurrent)

console.log('Original subcategories:', testSubcategories.map(s => s.name))
console.log('Filtered for spherical page:', sphericalFiltered.map(s => s.name))
console.log('Should exclude: Daily, Weekly, Monthly, Coloured Lenses, Toric, Astigmatism')
console.log('Should include: Spherical, Standard Lenses, Regular Lenses')

// Test astigmatism filtering
const astigmatismCurrent = { name: 'Astigmatism', slug: 'astigmatism' }
const astigmatismFiltered = filterSubcategoriesByType(testSubcategories, astigmatismCurrent)

console.log('\nFiltered for astigmatism page:', astigmatismFiltered.map(s => s.name))
console.log('Should include: Toric, Astigmatism')

// Test colored filtering
const coloredCurrent = { name: 'Coloured Lenses', slug: 'coloured-lenses' }
const coloredFiltered = filterSubcategoriesByType(testSubcategories, coloredCurrent)

console.log('\nFiltered for colored page:', coloredFiltered.map(s => s.name))
console.log('Should include: Coloured Lenses')
