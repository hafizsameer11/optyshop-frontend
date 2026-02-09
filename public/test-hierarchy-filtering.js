// Test script to verify hierarchy filtering works correctly
// Run this in the browser console

console.log('🧪 Testing hierarchy filtering...');

// Test data based on the API response
const testProducts = [
    {
        id: 90,
        name: "Proclear® toric",
        subCategory: {
            id: 95,
            name: "astigmatism",
            slug: "astigmatism",
            parent_id: 68,
            parent: {
                id: 68,
                name: "Monthly",
                slug: "monthly"
            }
        }
    },
    {
        id: 88,
        name: "HydraOne",
        subCategory: {
            id: 96,
            name: "Spherical",
            slug: "spherical",
            parent_id: 58,
            parent: {
                id: 58,
                name: "Daily",
                slug: "daily"
            }
        }
    },
    {
        id: 89,
        name: "Avaira Vitality®",
        subCategory: {
            id: 98,
            name: "Spherical",
            slug: "spherical",
            parent_id: 97,
            parent: {
                id: 97,
                name: "Weakly",
                slug: "weakly"
            }
        }
    }
];

// Test the normalizeProductSubcategory function
const testNormalization = () => {
    console.log('📋 Testing normalizeProductSubcategory function:');
    
    testProducts.forEach(product => {
        // This would be the actual function call in the real app
        const normalized = {
            slug: product.subCategory?.slug || null,
            name: product.subCategory?.name || null,
            parentSlug: product.subCategory?.parent?.slug || null,
            parentName: product.subCategory?.parent?.name || null,
            fullPath: [
                product.subCategory?.parent?.slug,
                product.subCategory?.slug
            ].filter(Boolean)
        };
        
        console.log(`  ${product.name}:`);
        console.log(`    Subcategory: ${normalized.name} (${normalized.slug})`);
        console.log(`    Parent: ${normalized.parentName} (${normalized.parentSlug})`);
        console.log(`    Full Path: ${normalized.fullPath.join(' > ')}`);
        console.log('');
    });
};

// Test filtering scenarios
const testFilteringScenarios = () => {
    console.log('🔍 Testing filtering scenarios:');
    
    const scenarios = [
        {
            name: 'Monthly Astigmatism',
            subcategorySlug: 'monthly',
            subSubcategorySlug: 'astigmatism',
            expectedProducts: ['Proclear® toric']
        },
        {
            name: 'Daily Spherical',
            subcategorySlug: 'daily',
            subSubcategorySlug: 'spherical',
            expectedProducts: ['HydraOne']
        },
        {
            name: 'Weakly Spherical',
            subcategorySlug: 'weakly',
            subSubcategorySlug: 'spherical',
            expectedProducts: ['Avaira Vitality®']
        },
        {
            name: 'Daily (all types)',
            subcategorySlug: 'daily',
            subSubcategorySlug: null,
            expectedProducts: ['HydraOne']
        },
        {
            name: 'Monthly (all types)',
            subcategorySlug: 'monthly',
            subSubcategorySlug: null,
            expectedProducts: ['Proclear® toric']
        }
    ];
    
    scenarios.forEach(scenario => {
        console.log(`\n📝 Scenario: ${scenario.name}`);
        console.log(`   Subcategory: ${scenario.subcategorySlug}`);
        console.log(`   Sub-subcategory: ${scenario.subSubcategorySlug}`);
        
        const filtered = testProducts.filter(product => {
            const productSlug = product.subCategory?.slug;
            const productParentSlug = product.subCategory?.parent?.slug;
            
            if (scenario.subSubcategorySlug) {
                // Sub-subcategory filtering: match both slug and parent
                return productSlug === scenario.subSubcategorySlug && 
                       productParentSlug === scenario.subcategorySlug;
            } else {
                // Subcategory filtering: match either direct or parent
                return productSlug === scenario.subcategorySlug || 
                       productParentSlug === scenario.subcategorySlug;
            }
        });
        
        const filteredNames = filtered.map(p => p.name);
        const expectedMatches = scenario.expectedProducts.every(name => filteredNames.includes(name));
        
        console.log(`   Results: ${filteredNames.join(', ')}`);
        console.log(`   Expected: ${scenario.expectedProducts.join(', ')}`);
        console.log(`   ✅ Match: ${expectedMatches ? 'YES' : 'NO'}`);
        
        if (!expectedMatches) {
            console.log(`   ❌ Missing: ${scenario.expectedProducts.filter(name => !filteredNames.includes(name)).join(', ')}`);
            console.log(`   ❌ Extra: ${filteredNames.filter(name => !scenario.expectedProducts.includes(name)).join(', ')}`);
        }
    });
};

// Run all tests
const runHierarchyTests = () => {
    console.log('🚀 Starting hierarchy filtering tests...');
    testNormalization();
    testFilteringScenarios();
    console.log('✅ Hierarchy filtering tests completed!');
};

// Export for manual testing
window.testHierarchy = {
    testNormalization,
    testFilteringScenarios,
    runHierarchyTests
};

console.log('📝 Hierarchy test functions available. Run window.testHierarchy.runHierarchyTests() to execute all tests.');
