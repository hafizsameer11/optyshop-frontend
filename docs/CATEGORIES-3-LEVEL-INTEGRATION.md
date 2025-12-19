# Categories, Subcategories, and Sub-Subcategories Integration

## Overview
This document describes the complete integration of the 3-level category hierarchy (Category → Subcategory → Sub-subcategory) according to the Postman API collection.

## API Endpoints Integrated

### Categories

#### 1. Get All Categories
- **Endpoint**: `GET /api/categories?includeSubcategories=true`
- **Description**: Returns all active categories with optional nested subcategories
- **Query Parameters**:
  - `includeProducts` (optional): Include sample products (up to 5) for each category
  - `includeSubcategories` (optional): Include top-level subcategories with their children (sub-subcategories)

**Response Structure** (when `includeSubcategories=true`):
```json
[
  {
    "id": 1,
    "name": "Contact lenses",
    "subcategories": [
      {
        "id": 5,
        "name": "Giornaliere",
        "parent_id": null,
        "children": [
          {
            "id": 10,
            "name": "Sferiche",
            "parent_id": 5
          }
        ]
      }
    ]
  }
]
```

#### 2. Get Category by ID
- **Endpoint**: `GET /api/categories/:id`
- **Returns**: Category with products and subcategories (with 3-level hierarchy)

#### 3. Get Category by Slug
- **Endpoint**: `GET /api/categories/slug/:slug`
- **Returns**: Category by slug

### Subcategories

#### 1. Get All Subcategories
- **Endpoint**: `GET /api/subcategories?page=1&limit=50&category_id=1`
- **Query Parameters**:
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 50)
  - `category_id`: Filter by category ID (optional)
  - `search`: Search by name (optional)

**Response Structure**:
```json
{
  "subcategories": [...],
  "topLevelSubcategories": [...],
  "subSubcategories": [...],
  "pagination": {...}
}
```

#### 2. Get Subcategory by ID
- **Endpoint**: `GET /api/subcategories/:id?includeProducts=true`
- **Returns**: Subcategory with category, parent, and children information
- **Query Parameters**:
  - `includeProducts` (optional): Include products associated with this subcategory

#### 3. Get Subcategory by Slug
- **Endpoint**: `GET /api/subcategories/slug/:slug`
- **Returns**: Subcategory with category, parent, and children information

#### 4. Get Subcategories by Category ID
- **Endpoint**: `GET /api/subcategories/by-category/:categoryId`
- **Description**: Returns top-level subcategories (parent_id = null) with their sub-subcategories
- **Response**: Array of subcategories, each with a `children` field containing sub-subcategories

**Example Response**:
```json
[
  {
    "id": 5,
    "name": "Giornaliere",
    "parent_id": null,
    "children": [
      {
        "id": 10,
        "name": "Sferiche",
        "parent_id": 5
      },
      {
        "id": 11,
        "name": "Astigmatismo",
        "parent_id": 5
      }
    ]
  }
]
```

#### 5. Get Sub-SubCategories by Parent ID
- **Endpoint**: `GET /api/subcategories/by-parent/:parentId`
- **Description**: Returns sub-subcategories (children) of a specific parent subcategory
- **Response Structure**:
```json
{
  "parentSubcategory": {
    "id": 5,
    "name": "Giornaliere",
    ...
  },
  "subcategories": [
    {
      "id": 10,
      "name": "Sferiche",
      "parent_id": 5,
      ...
    }
  ]
}
```

#### 6. Get Products by SubCategory
- **Endpoint**: `GET /api/subcategories/:id/products?page=1&limit=12`
- **Description**: Returns products for a subcategory (including products from sub-subcategories if it's a parent)
- **Query Parameters**:
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 12)
  - `sortBy`: Sort field (created_at, price, name, rating, updated_at)
  - `sortOrder`: Sort order (asc or desc)

## Frontend Service Implementation

### File: `src/services/categoriesService.ts`

#### Key Functions:

1. **`getCategories(options?)`**
   - Fetches all categories with optional subcategories
   - When `includeSubcategories=true`, returns categories with nested subcategories that include `children` field
   - Automatically processes and sorts the hierarchy

2. **`getSubcategoriesByCategoryId(categoryId)`**
   - Fetches top-level subcategories for a category
   - Returns subcategories with their `children` field populated (sub-subcategories)
   - Filters and sorts both subcategories and children

3. **`getNestedSubcategoriesByParentId(parentId)`**
   - Fetches sub-subcategories for a parent subcategory
   - Used for cascading dropdowns
   - Returns array of sub-subcategories

4. **`getSubcategoryById(id, includeProducts?)`**
   - Fetches a single subcategory by ID
   - Returns subcategory with `category`, `parent`, and `children` fields

5. **`getSubcategoryBySlug(slug, categoryId?)`**
   - Fetches a subcategory by slug
   - Optional categoryId for client-side validation
   - Returns subcategory with full hierarchy information

## Data Structure

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
  parent_id?: number | null;  // null for categories and top-level subcategories
  created_at: string;
  updated_at: string;
  products?: CategoryProduct[];
  subcategories?: Category[];  // Top-level subcategories (for categories)
  children?: Category[];        // Sub-subcategories (for subcategories)
  parent?: Category | null;     // Parent subcategory (for sub-subcategories)
  category?: Category;          // Main category (for subcategories)
}
```

## Hierarchy Rules

1. **Categories**: Top level, no `parent_id`
2. **Subcategories**: Second level, `parent_id = null`, belong to a category via `category_id`
3. **Sub-subcategories**: Third level, `parent_id = [Subcategory.id]`, belong to a subcategory

## Usage Examples

### Fetching Categories with Full Hierarchy
```typescript
import { getCategories } from '../services/categoriesService';

const categories = await getCategories({ 
  includeSubcategories: true 
});

// categories[0].subcategories[0].children contains sub-subcategories
```

### Fetching Subcategories for a Category
```typescript
import { getSubcategoriesByCategoryId } from '../services/categoriesService';

const subcategories = await getSubcategoriesByCategoryId(1);
// Each subcategory has a 'children' field with sub-subcategories
```

### Fetching Sub-Subcategories
```typescript
import { getNestedSubcategoriesByParentId } from '../services/categoriesService';

const subSubcategories = await getNestedSubcategoriesByParentId(5);
// Returns array of sub-subcategories where parent_id = 5
```

## Component Integration

### Navbar Component
- Uses `getCategoriesWithSubcategories()` to fetch categories with nested subcategories
- Displays 3-level dropdown menu:
  - Category → Subcategory → Sub-subcategory
- Uses `children` field from API response when available to avoid unnecessary API calls

### CategoryPage Component
- Uses `getSubcategoriesByCategoryId()` to display subcategories
- Supports navigation to sub-subcategories
- Filters products by subcategory hierarchy

## Response Handling

The service handles multiple response structures:
1. Direct array: `response.data = [...]`
2. Nested object: `response.data.categories = [...]`
3. Wrapped in data: `response.data.data.categories = [...]`

All responses are normalized to ensure consistent structure with:
- Active filtering (`is_active !== false`)
- Sorting by `sort_order`
- Proper `children` field population

## Notes

- All endpoints are PUBLIC (no authentication required)
- The API automatically includes `children` field when fetching subcategories
- Products can be assigned to either subcategories or sub-subcategories
- The hierarchy is preserved in all API responses

