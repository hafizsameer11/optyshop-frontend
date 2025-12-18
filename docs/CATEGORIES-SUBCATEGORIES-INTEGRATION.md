# Categories, Subcategories & Nested Subcategories Integration

## ✅ Complete Integration

All endpoints for categories, subcategories, and nested subcategories from the Postman collection are now fully integrated.

## 📋 Available Functions

### Categories

#### `getCategories(options?)`
Get all categories with optional products and subcategories.

```typescript
// Get all categories
const categories = await getCategories();

// Get categories with products
const categoriesWithProducts = await getCategories({ includeProducts: true });

// Get categories with subcategories (including nested)
const categoriesWithSubs = await getCategories({ includeSubcategories: true });

// Get categories with both products and subcategories
const fullCategories = await getCategories({ 
  includeProducts: true, 
  includeSubcategories: true 
});
```

#### `getCategoriesWithSubcategories(includeProducts?)`
Get categories organized with their subcategories nested.

```typescript
const categories = await getCategoriesWithSubcategories();
// Returns parent categories with subcategories nested in the `subcategories` property
```

#### `getCategoryById(id)`
Get a single category by ID.

```typescript
const category = await getCategoryById(1);
```

#### `getCategoryBySlug(slug)`
Get a single category by slug.

```typescript
const category = await getCategoryBySlug('prescription-glasses');
```

#### `getRelatedCategories(categoryId, limit?, includeNested?)`
Get categories that have similar subcategories.

```typescript
// Get related categories
const related = await getRelatedCategories(1);

// With limit and nested subcategories
const relatedWithNested = await getRelatedCategories(1, 5, true);
```

### Subcategories

#### `getAllSubcategories(options?)`
Get all subcategories with pagination and filtering.

```typescript
// Get all subcategories
const { subcategories, pagination } = await getAllSubcategories();

// Filter by category
const { subcategories } = await getAllSubcategories({ categoryId: 1 });

// With pagination
const { subcategories, pagination } = await getAllSubcategories({
  categoryId: 1,
  page: 1,
  limit: 20
});

// With search
const { subcategories } = await getAllSubcategories({
  search: 'daily'
});
```

#### `getSubcategoriesByCategoryId(categoryId)`
Get top-level subcategories for a category with their nested children.

```typescript
// Returns only top-level subcategories (parent_id = null)
// Each subcategory includes its children in the `children` property
const subcategories = await getSubcategoriesByCategoryId(1);
```

**Response Structure:**
```
Category: Contact Lenses
  ├─ SubCategory: Daily (parent_id: null)
  │   ├─ SubCategory: Spherical (parent_id: Daily.id) - in `children` array
  │   └─ SubCategory: Astigmatism (parent_id: Daily.id) - in `children` array
  └─ SubCategory: Monthly (parent_id: null)
      └─ SubCategory: Toric (parent_id: Monthly.id) - in `children` array
```

#### `getSubcategoryById(id, includeProducts?)`
Get a single subcategory by ID.

```typescript
// Get subcategory
const subcategory = await getSubcategoryById(1);

// Get subcategory with products
const subcategoryWithProducts = await getSubcategoryById(1, true);
```

**Response includes:**
- Subcategory details
- Parent subcategory (if nested) - in `parent` property
- Child subcategories (nested) - in `children` property
- Category information - in `category` property
- Products (if `includeProducts=true`)

#### `getSubcategoryBySlug(slug)`
Get a single subcategory by slug using the API endpoint directly.

```typescript
const subcategory = await getSubcategoryBySlug('daily-contact-lenses');
```

### Nested Subcategories

#### `getNestedSubcategories(subcategoryId)`
Get nested subcategories (children) of a specific subcategory.

```typescript
// Get children of subcategory ID 1
const nestedSubs = await getNestedSubcategories(1);
```

**Example:**
If subcategory ID 1 is 'Daily' contact lenses, this returns:
- Spherical
- Astigmatism
- Toric
- etc.

#### `getRelatedCategoriesForSubcategory(subcategoryId, includeNested?)`
Get categories that have subcategories with the same or similar name.

```typescript
// Get related categories
const related = await getRelatedCategoriesForSubcategory(1);

// Include nested subcategories in search
const relatedWithNested = await getRelatedCategoriesForSubcategory(1, true);
```

**Response Structure:**
```typescript
{
  subcategory: Category,
  relatedCategories: [
    {
      id: number,
      name: string,
      slug: string,
      matchingSubcategories: Category[]
    }
  ]
}
```

## 🏗️ Data Structure

### Category Interface

```typescript
interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  is_active: boolean;
  sort_order: number;
  parent_id?: number | null;
  created_at: string;
  updated_at: string;
  products?: CategoryProduct[];           // Products in this category
  subcategories?: Category[];             // Subcategories (for top-level categories)
  children?: Category[];                  // Nested subcategories (children of a subcategory)
  parent?: Category | null;                // Parent subcategory (if nested)
  category?: Category;                    // Main category this subcategory belongs to
}
```

## 📊 Hierarchy Structure

### Top-Level Categories
- `parent_id` is `null` or `undefined`
- Have `subcategories` array containing top-level subcategories

### Top-Level Subcategories
- `parent_id` points to a category ID
- Have `children` array containing nested subcategories
- Have `category` property pointing to the main category

### Nested Subcategories
- `parent_id` points to a subcategory ID (not a category ID)
- Have `parent` property pointing to the parent subcategory
- Have `category` property pointing to the main category
- Can have their own `children` (multi-level nesting supported)

## 🔄 Example Usage Flow

### 1. Get Categories with Nested Subcategories

```typescript
import { getCategories } from '../services/categoriesService';

// Get all categories with their subcategories (including nested)
const categories = await getCategories({ includeSubcategories: true });

categories.forEach(category => {
  console.log(`Category: ${category.name}`);
  
  // Top-level subcategories
  category.subcategories?.forEach(subcategory => {
    console.log(`  ├─ SubCategory: ${subcategory.name}`);
    
    // Nested subcategories (children)
    subcategory.children?.forEach(nested => {
      console.log(`  │   ├─ ${nested.name}`);
    });
  });
});
```

### 2. Get Subcategories for a Category

```typescript
import { getSubcategoriesByCategoryId } from '../services/categoriesService';

// Get top-level subcategories with nested children
const subcategories = await getSubcategoriesByCategoryId(1);

subcategories.forEach(subcategory => {
  console.log(`SubCategory: ${subcategory.name}`);
  
  // Nested subcategories
  subcategory.children?.forEach(nested => {
    console.log(`  └─ ${nested.name}`);
  });
});
```

### 3. Get Nested Subcategories

```typescript
import { getNestedSubcategories } from '../services/categoriesService';

// Get children of a subcategory
const nested = await getNestedSubcategories(1);
console.log('Nested subcategories:', nested);
```

### 4. Search and Filter

```typescript
import { getAllSubcategories } from '../services/categoriesService';

// Search subcategories
const { subcategories } = await getAllSubcategories({
  categoryId: 1,
  search: 'daily',
  page: 1,
  limit: 20
});
```

## 🎯 Key Features

1. **Multi-Level Nesting**: Supports unlimited nesting levels
2. **Hierarchical Structure**: Clear parent-child relationships
3. **Flexible Filtering**: Filter by category, search by name, pagination
4. **Related Categories**: Find categories with similar subcategories
5. **Performance**: Direct API endpoints for better performance
6. **Type Safety**: Full TypeScript support

## 📝 API Endpoints Used

- `GET /api/categories` - Get all categories
- `GET /api/categories/:id` - Get category by ID
- `GET /api/categories/slug/:slug` - Get category by slug
- `GET /api/categories/:id/related` - Get related categories
- `GET /api/subcategories` - Get all subcategories
- `GET /api/subcategories/by-category/:categoryId` - Get subcategories by category
- `GET /api/subcategories/:id` - Get subcategory by ID
- `GET /api/subcategories/slug/:slug` - Get subcategory by slug
- `GET /api/subcategories/:id/subcategories` - Get nested subcategories
- `GET /api/subcategories/:id/related-categories` - Get related categories for subcategory

## ✨ Benefits

1. **Complete Coverage**: All Postman collection endpoints are integrated
2. **Type Safety**: Full TypeScript interfaces
3. **Error Handling**: Comprehensive error handling
4. **Flexibility**: Multiple ways to fetch data based on use case
5. **Performance**: Direct API calls instead of client-side filtering
6. **Documentation**: Clear function signatures and examples

