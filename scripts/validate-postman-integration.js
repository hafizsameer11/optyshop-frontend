/**
 * Postman Collection Integration Validator
 * 
 * This script validates that all endpoints in the Postman collection
 * are properly integrated in the frontend codebase.
 * 
 * Usage: node scripts/validate-postman-integration.js
 */

const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

// Read Postman collection
const postmanCollectionPath = path.join(__dirname, '..', 'OptyShop_API.postman_collection.json');
const apiRoutesPath = path.join(__dirname, '..', 'src', 'config', 'apiRoutes.ts');

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function extractEndpointsFromPostman(collection) {
  const endpoints = [];
  
  function traverseItems(items, section = '') {
    if (!items) return;
    
    items.forEach(item => {
      if (item.request) {
        // Extract endpoint information
        const method = item.request.method || 'GET';
        const url = item.request.url;
        
        if (url && typeof url === 'object') {
          const pathParts = url.path || [];
          const fullPath = '/' + pathParts.join('/');
          
          // Determine if it's public or authenticated
          const headers = item.request.header || [];
          const requiresAuth = headers.some(h => 
            h.key === 'Authorization' && h.value && h.value.includes('{{access_token}}')
          );
          
          endpoints.push({
            name: item.name,
            method,
            path: fullPath,
            section: section || 'Unknown',
            requiresAuth,
            description: item.request.description || ''
          });
        }
      }
      
      // Recursively traverse nested items
      if (item.item) {
        const newSection = section ? `${section} > ${item.name}` : item.name;
        traverseItems(item.item, newSection);
      }
    });
  }
  
  if (collection.item) {
    traverseItems(collection.item);
  }
  
  return endpoints;
}

function extractRoutesFromApiRoutes(fileContent) {
  const routes = [];
  
  // Extract route definitions using regex
  // This is a simple parser - may need refinement
  const routePatterns = [
    /LIST:\s*`([^`]+)`/g,
    /BY_ID:\s*\([^)]+\)\s*=>\s*`([^`]+)`/g,
    /BY_SLUG:\s*\([^)]+\)\s*=>\s*`([^`]+)`/g,
    /REGISTER:\s*`([^`]+)`/g,
    /LOGIN:\s*`([^`]+)`/g,
    /REFRESH:\s*`([^`]+)`/g,
    /ME:\s*`([^`]+)`/g,
    /PROFILE:\s*`([^`]+)`/g,
    /CHANGE_PASSWORD:\s*`([^`]+)`/g,
    /LOGOUT:\s*`([^`]+)`/g,
    /CREATE:\s*`([^`]+)`/g,
    /CANCEL:\s*\([^)]+\)\s*=>\s*`([^`]+)`/g,
    /APPLY:\s*`([^`]+)`/g,
    /CHECK:\s*`([^`]+)`/g,
    /API_INFO:\s*`([^`]+)`/g,
  ];
  
  routePatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(fileContent)) !== null) {
      routes.push(match[1]);
    }
  });
  
  return routes;
}

function normalizePath(path) {
  // Remove leading/trailing slashes and normalize
  return path.replace(/^\/+|\/+$/g, '').replace(/\/+/g, '/');
}

function main() {
  log('\n🔍 Postman Collection Integration Validator\n', colors.cyan);
  
  // Check if files exist
  if (!fs.existsSync(postmanCollectionPath)) {
    log(`❌ Postman collection not found: ${postmanCollectionPath}`, colors.red);
    process.exit(1);
  }
  
  if (!fs.existsSync(apiRoutesPath)) {
    log(`❌ API routes file not found: ${apiRoutesPath}`, colors.red);
    process.exit(1);
  }
  
  // Read files
  log('📖 Reading files...', colors.blue);
  const postmanCollection = JSON.parse(fs.readFileSync(postmanCollectionPath, 'utf8'));
  const apiRoutesContent = fs.readFileSync(apiRoutesPath, 'utf8');
  
  // Extract endpoints
  log('🔎 Extracting endpoints from Postman collection...', colors.blue);
  const postmanEndpoints = extractEndpointsFromPostman(postmanCollection);
  
  log('🔎 Extracting routes from API routes file...', colors.blue);
  const apiRoutes = extractRoutesFromApiRoutes(apiRoutesContent);
  
  // Filter out admin endpoints (we don't integrate those)
  const publicEndpoints = postmanEndpoints.filter(ep => {
    // Exclude admin endpoints
    if (ep.path.includes('/admin/')) return false;
    if (ep.path.includes('/analytics/')) return false;
    if (ep.path.includes('/overview')) return false;
    return true;
  });
  
  log(`\n📊 Summary:`, colors.cyan);
  log(`   Total Postman endpoints: ${postmanEndpoints.length}`, colors.reset);
  log(`   Public endpoints (to validate): ${publicEndpoints.length}`, colors.reset);
  log(`   API routes found: ${apiRoutes.length}`, colors.reset);
  
  // Check coverage
  log(`\n✅ Validation Results:\n`, colors.cyan);
  
  let covered = 0;
  let missing = [];
  
  publicEndpoints.forEach(endpoint => {
    const normalizedPath = normalizePath(endpoint.path.replace('/api', ''));
    const isCovered = apiRoutes.some(route => {
      const normalizedRoute = normalizePath(route);
      // Simple matching - could be improved
      return normalizedRoute === normalizedPath || 
             normalizedPath.includes(normalizedRoute) ||
             normalizedRoute.includes(normalizedPath);
    });
    
    if (isCovered) {
      covered++;
    } else {
      missing.push({
        name: endpoint.name,
        path: endpoint.path,
        method: endpoint.method,
        section: endpoint.section
      });
    }
  });
  
  const coverage = ((covered / publicEndpoints.length) * 100).toFixed(1);
  
  if (missing.length === 0) {
    log(`   ✅ All endpoints are covered! (${covered}/${publicEndpoints.length})`, colors.green);
  } else {
    log(`   ⚠️  Coverage: ${coverage}% (${covered}/${publicEndpoints.length})`, colors.yellow);
    log(`   ❌ Missing endpoints: ${missing.length}\n`, colors.red);
    
    log(`   Missing Endpoints:`, colors.yellow);
    missing.forEach(ep => {
      log(`     - ${ep.method} ${ep.path} (${ep.section})`, colors.reset);
    });
  }
  
  log(`\n📝 Note: This is a basic validation. Manual review is recommended.`, colors.blue);
  log(`\n✨ Validation complete!\n`, colors.cyan);
  
  process.exit(missing.length > 0 ? 1 : 0);
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { main };

