import React, { useState, useEffect } from 'react'
import { getCategories, getSubcategoriesByCategoryId, getNestedSubcategoriesByParentId, type Category } from '../../services/categoriesService'
import { getProducts, type ProductFilters } from '../../services/productsService'

const SubcategoryFilterTest: React.FC = () => {
    const [categories, setCategories] = useState<Category[]>([])
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
    const [subcategories, setSubcategories] = useState<Category[]>([])
    const [selectedSubcategory, setSelectedSubcategory] = useState<Category | null>(null)
    const [subSubcategories, setSubSubcategories] = useState<Category[]>([])
    const [selectedSubSubcategory, setSelectedSubSubcategory] = useState<Category | null>(null)
    const [products, setProducts] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [testResults, setTestResults] = useState<string[]>([])

    const addTestResult = (message: string) => {
        setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
    }

    // Load categories on mount
    useEffect(() => {
        const loadCategories = async () => {
            try {
                addTestResult('Loading categories...')
                const cats = await getCategories({ includeSubcategories: true })
                setCategories(cats)
                addTestResult(`Loaded ${cats.length} categories`)
                
                // Find contact-lenses category
                const contactLenses = cats.find(cat => cat.slug === 'contact-lenses')
                if (contactLenses) {
                    setSelectedCategory(contactLenses)
                    addTestResult(`Found contact-lenses category: ${contactLenses.name}`)
                } else {
                    addTestResult('Contact-lenses category not found')
                }
            } catch (error) {
                addTestResult(`Error loading categories: ${error}`)
            }
        }
        loadCategories()
    }, [])

    // Load subcategories when category is selected
    useEffect(() => {
        if (selectedCategory) {
            const loadSubcategories = async () => {
                try {
                    addTestResult(`Loading subcategories for ${selectedCategory.name}...`)
                    const subs = await getSubcategoriesByCategoryId(selectedCategory.id)
                    setSubcategories(subs)
                    addTestResult(`Loaded ${subs.length} subcategories`)
                    subs.forEach(sub => {
                        addTestResult(`  - ${sub.name} (${sub.children?.length || 0} children)`)
                    })
                } catch (error) {
                    addTestResult(`Error loading subcategories: ${error}`)
                }
            }
            loadSubcategories()
        }
    }, [selectedCategory])

    // Load sub-subcategories when subcategory is selected
    useEffect(() => {
        if (selectedSubcategory) {
            const loadSubSubcategories = async () => {
                try {
                    addTestResult(`Loading sub-subcategories for ${selectedSubcategory.name}...`)
                    const subSubs = await getNestedSubcategoriesByParentId(selectedSubcategory.id)
                    setSubSubcategories(subSubs)
                    addTestResult(`Loaded ${subSubs.length} sub-subcategories`)
                    subSubs.forEach(subSub => {
                        addTestResult(`  - ${subSub.name}`)
                    })
                } catch (error) {
                    addTestResult(`Error loading sub-subcategories: ${error}`)
                }
            }
            loadSubSubcategories()
        }
    }, [selectedSubcategory])

    // Test product filtering
    const testProductFiltering = async () => {
        if (!selectedCategory) return
        
        setLoading(true)
        try {
            const filters: ProductFilters = {
                category: selectedCategory.slug,
                page: 1,
                limit: 10
            }

            if (selectedSubSubcategory) {
                filters.subcategory = selectedSubSubcategory.slug
                addTestResult(`Testing filter: category=${selectedCategory.slug}, subcategory=${selectedSubSubcategory.slug}`)
            } else if (selectedSubcategory) {
                filters.subcategory = selectedSubcategory.slug
                addTestResult(`Testing filter: category=${selectedCategory.slug}, subcategory=${selectedSubcategory.slug}`)
            } else {
                addTestResult(`Testing filter: category=${selectedCategory.slug} (no subcategory)`)
            }

            const result = await getProducts(filters)
            if (result) {
                setProducts(result.products)
                addTestResult(`Found ${result.products.length} products`)
                result.products.forEach((product, index) => {
                    const subcatSlug = (product as any).subCategory?.slug || (product as any).sub_category?.slug || (product as any).subcategory?.slug
                    addTestResult(`  ${index + 1}. ${product.name} (subcategory: ${subcatSlug || 'none'})`)
                })
            } else {
                addTestResult('No results returned from API')
            }
        } catch (error) {
            addTestResult(`Error testing product filtering: ${error}`)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Subcategory Filter Test</h1>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Controls */}
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">Category:</label>
                        <select 
                            value={selectedCategory?.id || ''} 
                            onChange={(e) => setSelectedCategory(categories.find(cat => cat.id === parseInt(e.target.value)) || null)}
                            className="w-full p-2 border rounded"
                        >
                            <option value="">Select category</option>
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Subcategory:</label>
                        <select 
                            value={selectedSubcategory?.id || ''} 
                            onChange={(e) => setSelectedSubcategory(subcategories.find(sub => sub.id === parseInt(e.target.value)) || null)}
                            className="w-full p-2 border rounded"
                        >
                            <option value="">Select subcategory</option>
                            {subcategories.map(sub => (
                                <option key={sub.id} value={sub.id}>{sub.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Sub-subcategory:</label>
                        <select 
                            value={selectedSubSubcategory?.id || ''} 
                            onChange={(e) => setSelectedSubSubcategory(subSubcategories.find(subSub => subSub.id === parseInt(e.target.value)) || null)}
                            className="w-full p-2 border rounded"
                        >
                            <option value="">Select sub-subcategory</option>
                            {subSubcategories.map(subSub => (
                                <option key={subSub.id} value={subSub.id}>{subSub.name}</option>
                            ))}
                        </select>
                    </div>

                    <button
                        onClick={testProductFiltering}
                        disabled={loading || !selectedCategory}
                        className="w-full p-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300"
                    >
                        {loading ? 'Testing...' : 'Test Product Filtering'}
                    </button>
                </div>

                {/* Results */}
                <div className="space-y-4">
                    <div>
                        <h3 className="text-lg font-semibold mb-2">Test Results:</h3>
                        <div className="h-96 overflow-y-auto bg-gray-50 p-3 rounded border text-sm font-mono">
                            {testResults.map((result, index) => (
                                <div key={index} className="mb-1">{result}</div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold mb-2">Products Found:</h3>
                        <div className="h-64 overflow-y-auto bg-gray-50 p-3 rounded border">
                            {products.map((product, index) => (
                                <div key={product.id} className="mb-2 p-2 bg-white rounded border">
                                    <div className="font-medium">{product.name}</div>
                                    <div className="text-sm text-gray-600">
                                        Price: ${product.price} | 
                                        Category: {product.category?.name} | 
                                        Subcategory: {(product as any).subCategory?.name || (product as any).sub_category?.name || 'none'}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default SubcategoryFilterTest
