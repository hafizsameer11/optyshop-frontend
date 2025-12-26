/**
 * Setup Prescription Lens Types Script
 * 
 * This script creates the required prescription lens types in the database
 * via the admin API endpoints.
 * 
 * Usage:
 *   node scripts/setup-prescription-lens-types.js
 *   npm run setup-prescription-types
 * 
 * Requirements:
 *   - Backend server must be running
 *   - Admin token must be set in ADMIN_TOKEN environment variable
 *   - Or provide via command line: ADMIN_TOKEN=your_token node scripts/setup-prescription-lens-types.js
 *   - Node.js 18+ (for built-in fetch) or install node-fetch
 */

// Configuration
const API_BASE_URL = process.env.VITE_API_BASE_URL || 
  (process.env.NODE_ENV === 'production' 
    ? 'https://optyshop-frontend.hmstech.org/api'
    : 'http://localhost:5000/api'
  );

const ADMIN_TOKEN = process.env.ADMIN_TOKEN || process.argv[2];

if (!ADMIN_TOKEN) {
  console.error('❌ Error: Admin token is required');
  console.error('   Set ADMIN_TOKEN environment variable or pass as argument:');
  console.error('   ADMIN_TOKEN=your_token node scripts/setup-prescription-lens-types.js');
  process.exit(1);
}

// Prescription Lens Types to create
const PRESCRIPTION_LENS_TYPES = [
  {
    name: 'Distance Vision',
    slug: 'distance-vision',
    description: 'For distance (Thin, anti-glare, blue-cut options)',
    prescription_type: 'single_vision',
    base_price: 60.00,
    is_active: true,
    sort_order: 1
  },
  {
    name: 'Near Vision',
    slug: 'near-vision',
    description: 'For near/reading (Thin, anti-glare, blue-cut options)',
    prescription_type: 'single_vision',
    base_price: 60.00,
    is_active: true,
    sort_order: 2
  },
  {
    name: 'Progressive',
    slug: 'progressive',
    description: 'Progressives (For two powers in same lenses)',
    prescription_type: 'progressive',
    base_price: 60.00,
    is_active: true,
    sort_order: 3
  }
];

// Progressive Variants to create (after Progressive type is created)
const PROGRESSIVE_VARIANTS = [
  {
    name: 'Premium Progressive',
    slug: 'premium-progressive',
    description: 'High-quality progressive lenses with advanced technology',
    price: 150.00,
    is_recommended: true,
    viewing_range: 'Wide',
    use_cases: 'Maximum comfort & balanced vision',
    is_active: true,
    sort_order: 1
  },
  {
    name: 'Standard Progressive',
    slug: 'standard-progressive',
    description: 'Standard progressive lenses for everyday use',
    price: 100.00,
    is_recommended: false,
    viewing_range: 'Standard',
    use_cases: 'Perfect for everyday tasks',
    is_active: true,
    sort_order: 2
  },
  {
    name: 'Basic Progressive',
    slug: 'basic-progressive',
    description: 'Affordable progressive lens option',
    price: 75.00,
    is_recommended: false,
    viewing_range: 'Basic',
    use_cases: 'Budget-friendly option',
    is_active: true,
    sort_order: 3
  }
];

/**
 * Make API request
 */
async function apiRequest(method, endpoint, body = null) {
  const url = `${API_BASE_URL}${endpoint}`;
  const options = {
    method,
    headers: {
      'Authorization': `Bearer ${ADMIN_TOKEN}`,
      'Content-Type': 'application/json'
    }
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    // Use built-in fetch (Node 18+) or global fetch
    const fetchFn = typeof fetch !== 'undefined' ? fetch : globalThis.fetch;
    
    if (!fetchFn) {
      throw new Error('fetch is not available. Please use Node.js 18+ or install node-fetch');
    }

    const response = await fetchFn(url, options);
    const data = await response.json();
    return { status: response.status, data };
  } catch (error) {
    console.error(`❌ Network error:`, error.message);
    return { status: 0, error: error.message };
  }
}

/**
 * Check if prescription lens type exists
 */
async function checkTypeExists(slug) {
  const response = await apiRequest('GET', `/admin/prescription-lens-types?limit=100`);
  
  if (response.status === 200 && response.data?.success) {
    const types = response.data.data?.prescriptionLensTypes || 
                  response.data.data?.data || 
                  response.data.data || [];
    return types.find(type => type.slug === slug || type.slug === slug);
  }
  
  return null;
}

/**
 * Create prescription lens type
 */
async function createPrescriptionLensType(typeData) {
  console.log(`\n📝 Creating: ${typeData.name}...`);
  
  // Check if already exists
  const existing = await checkTypeExists(typeData.slug);
  if (existing) {
    console.log(`   ✅ Already exists (ID: ${existing.id}) - Skipping`);
    return existing;
  }

  const response = await apiRequest('POST', '/admin/prescription-lens-types', typeData);
  
  if (response.status === 201 || response.status === 200) {
    const created = response.data?.data || response.data;
    console.log(`   ✅ Created successfully (ID: ${created.id || 'N/A'})`);
    return created;
  } else {
    console.error(`   ❌ Failed: ${response.data?.message || response.data?.error || 'Unknown error'}`);
    return null;
  }
}

/**
 * Create progressive variant
 */
async function createProgressiveVariant(variantData, progressiveTypeId) {
  console.log(`\n📝 Creating variant: ${variantData.name}...`);
  
  const variantPayload = {
    ...variantData,
    prescription_lens_type_id: progressiveTypeId
  };

  const response = await apiRequest('POST', '/admin/prescription-lens-variants', variantPayload);
  
  if (response.status === 201 || response.status === 200) {
    const created = response.data?.data || response.data;
    console.log(`   ✅ Created successfully (ID: ${created.id || 'N/A'})`);
    return created;
  } else {
    console.error(`   ❌ Failed: ${response.data?.message || response.data?.error || 'Unknown error'}`);
    return null;
  }
}

/**
 * Main setup function
 */
async function setupPrescriptionLensTypes() {
  console.log('🚀 Starting Prescription Lens Types Setup...\n');
  console.log(`📍 API Base URL: ${API_BASE_URL}`);
  console.log(`🔑 Using Admin Token: ${ADMIN_TOKEN.substring(0, 10)}...\n`);

  const createdTypes = [];
  let progressiveTypeId = null;

  // Step 1: Create prescription lens types
  console.log('📋 Step 1: Creating Prescription Lens Types\n');
  console.log('─'.repeat(50));

  for (const typeData of PRESCRIPTION_LENS_TYPES) {
    const created = await createPrescriptionLensType(typeData);
    if (created) {
      createdTypes.push(created);
      
      // Store Progressive type ID for variants
      if (typeData.prescription_type === 'progressive') {
        progressiveTypeId = created.id;
      }
    }
  }

  // Step 2: Create progressive variants (if Progressive type was created)
  if (progressiveTypeId) {
    console.log('\n\n📋 Step 2: Creating Progressive Variants\n');
    console.log('─'.repeat(50));

    for (const variantData of PROGRESSIVE_VARIANTS) {
      await createProgressiveVariant(variantData, progressiveTypeId);
    }
  } else {
    console.log('\n⚠️  Progressive type not found - skipping variant creation');
  }

  // Summary
  console.log('\n\n' + '='.repeat(50));
  console.log('📊 Setup Summary');
  console.log('='.repeat(50));
  console.log(`✅ Created ${createdTypes.length} prescription lens types:`);
  createdTypes.forEach(type => {
    console.log(`   - ${type.name} (${type.prescription_type})`);
  });
  
  if (progressiveTypeId) {
    console.log(`\n✅ Progressive variants: ${PROGRESSIVE_VARIANTS.length} variants created`);
  }

  console.log('\n✨ Setup complete!');
  console.log('\n💡 Next steps:');
  console.log('   1. Verify types in admin panel');
  console.log('   2. Test frontend - warnings should be gone');
  console.log('   3. Check: GET /api/lens/prescription-lens-types');
}

// Run setup
setupPrescriptionLensTypes().catch(error => {
  console.error('\n❌ Setup failed:', error);
  process.exit(1);
});
