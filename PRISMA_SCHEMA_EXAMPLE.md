# Prisma Schema Updates for MM Calibers and Eye Hygiene Variants

## Updated Product Model

Add the `mm_calibers` field to the existing Product model:

```prisma
model Product {
  id                        Int      @id @default(autoincrement())
  name                      String
  slug                      String   @unique
  description               String?  @db.Text
  price                     Decimal  @db.Decimal(10, 2)
  sale_price                Decimal? @db.Decimal(10, 2)
  sku                       String?  @unique
  stock_quantity            Int      @default(0)
  in_stock                  Boolean  @default(true)
  category_id               Int?
  subcategory_id            Int?
  brand_id                  Int?
  frame_shape               String?
  frame_material            String?
  gender                    String?
  product_type              String?  // 'sunglasses', 'eyeglasses', 'contact-lenses', 'eye-hygiene'
  is_featured               Boolean  @default(false)
  is_active                 Boolean  @default(true)
  sort_order                Int      @default(0)
  model_3d_url              String?  @db.Text
  images                    Json?    // Array of image URLs
  thumbnail                 String?
  rating                    Decimal? @db.Decimal(3, 2)
  review_count             Int      @default(0)
  created_at                DateTime @default(now())
  updated_at                DateTime @updatedAt
  
  // MM Caliber System (for frames/glasses)
  mm_calibers              Json?    // Array of caliber objects with images
  
  // Eye Hygiene specific fields (legacy - for backward compatibility)
  size_volume               String?  // e.g., "5ml", "10ml", "30ml"
  pack_type                String?  // e.g., "Single", "Pack of 2", "Pack of 3"
  expiry_date              DateTime?
  
  // Relations
  category                  Category?    @relation(fields: [category_id], references: [id])
  subcategory              Subcategory? @relation(fields: [subcategory_id], references: [id])
  brand                    Brand?       @relation(fields: [brand_id], references: [id])
  eyeHygieneVariants       EyeHygieneVariant[]
  cartItems                CartItem[]
  orderItems               OrderItem[]
  productGifts             ProductGift[]

  @@map("products")
}
```

## New EyeHygieneVariant Model

```prisma
model EyeHygieneVariant {
  id            Int      @id @default(autoincrement())
  product_id    Int
  name          String
  description   String?  @db.Text
  size_volume   String   // e.g., "5ml", "10ml", "30ml"
  pack_type     String?  // e.g., "Single", "Pack of 2", "Pack of 3"
  price         Decimal  @db.Decimal(10, 2)
  compare_at_price Decimal? @db.Decimal(10, 2)  // For showing discounts
  cost_price    Decimal? @db.Decimal(10, 2)     // Internal cost
  stock_quantity Int     @default(0)
  stock_status  String   @default("in_stock")    // 'in_stock', 'out_of_stock', 'backorder'
  sku           String?  @unique
  expiry_date   DateTime?
  image_url     String?  @db.VarChar(500)
  is_active     Boolean  @default(true)
  sort_order    Int      @default(0)
  created_at    DateTime @default(now())
  updated_at    DateTime @updatedAt

  // Relations
  product       Product @relation(fields: [product_id], references: [id], onDelete: Cascade)
  cartItems     CartItem[]
  orderItems    OrderItem[]

  @@map("eye_hygiene_variants")
}
```

## MM Calibers JSON Structure

The `mm_calibers` field stores an array of caliber objects:

```json
[
  {
    "mm": 58,
    "image_url": "https://example.com/images/ray-ban-58mm.jpg",
    "price": 180.00,
    "stock_quantity": 10,
    "is_active": true
  },
  {
    "mm": 62,
    "image_url": "https://example.com/images/ray-ban-62mm.jpg", 
    "price": 185.00,
    "stock_quantity": 5,
    "is_active": true
  }
]
```

## Database Migration Commands

```bash
# Generate Prisma client
npx prisma generate

# Create migration
npx prisma migrate dev --name add-mm-calibers-eye-hygiene-variants

# For production
npx prisma migrate deploy
```

## Sample Data Seeding

```typescript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Create a product with MM calibers
  const rayBanProduct = await prisma.product.create({
    data: {
      name: 'Ray Ban Aviator 3025',
      slug: 'ray-ban-aviator-3025',
      description: 'Classic aviator sunglasses',
      price: 180.00,
      category_id: 1, // Sunglasses category
      product_type: 'sunglasses',
      frame_shape: 'Aviator',
      frame_material: 'Metal',
      gender: 'Unisex',
      mm_calibers: [
        {
          mm: 58,
          image_url: 'https://example.com/ray-ban-58mm.jpg',
          price: 180.00,
          stock_quantity: 10,
          is_active: true
        },
        {
          mm: 62,
          image_url: 'https://example.com/ray-ban-62mm.jpg',
          price: 185.00,
          stock_quantity: 5,
          is_active: true
        }
      ]
    }
  })

  // Create an eye hygiene product with variants
  const eyeDropsProduct = await prisma.product.create({
    data: {
      name: 'Premium Eye Drops',
      slug: 'premium-eye-drops',
      description: 'Lubricating eye drops for dry eyes',
      price: 15.99,
      category_id: 5, // Eye hygiene category
      product_type: 'eye-hygiene',
      size_volume: '10ml',
      pack_type: 'Single',
      expiry_date: new Date('2025-12-31'),
      eyeHygieneVariants: {
        create: [
          {
            name: 'Premium Eye Drops - 5ml',
            description: 'Travel size eye drops',
            size_volume: '5ml',
            pack_type: 'Single',
            price: 8.99,
            stock_quantity: 50,
            sku: 'EYE-DROPS-5ML',
            expiry_date: new Date('2025-12-31'),
            image_url: 'https://example.com/eye-drops-5ml.jpg',
            sort_order: 1
          },
          {
            name: 'Premium Eye Drops - 10ml',
            description: 'Regular size eye drops',
            size_volume: '10ml',
            pack_type: 'Single',
            price: 15.99,
            stock_quantity: 30,
            sku: 'EYE-DROPS-10ML',
            expiry_date: new Date('2025-12-31'),
            image_url: 'https://example.com/eye-drops-10ml.jpg',
            sort_order: 2
          },
          {
            name: 'Premium Eye Drops - Pack of 2',
            description: 'Value pack of 2 bottles',
            size_volume: '10ml',
            pack_type: 'Pack of 2',
            price: 29.99,
            compare_at_price: 31.98,
            stock_quantity: 20,
            sku: 'EYE-DROPS-2PACK',
            expiry_date: new Date('2025-12-31'),
            image_url: 'https://example.com/eye-drops-2pack.jpg',
            sort_order: 3
          }
        ]
      }
    }
  })

  console.log('Sample data created successfully')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
```

## Indexes for Performance

Add these indexes to improve query performance:

```sql
-- Index for eye hygiene variants
CREATE INDEX idx_eye_hygiene_variants_product_id ON eye_hygiene_variants(product_id);
CREATE INDEX idx_eye_hygiene_variants_active ON eye_hygiene_variants(is_active);
CREATE INDEX idx_eye_hygiene_variants_sort_order ON eye_hygiene_variants(sort_order);

-- Index for products by type
CREATE INDEX idx_products_product_type ON products(product_type);
CREATE INDEX idx_products_category_active ON products(category_id, is_active);

-- Index for mm_calibers (JSON field - MySQL 5.7+)
CREATE INDEX idx_products_mm_calibers ON products((CAST(mm_calibers AS CHAR(255) ARRAY)));
```

## Validation Rules

### MM Calibers Validation
- `mm` must be a positive integer between 40 and 80
- `image_url` must be a valid URL (max 500 characters)
- `price` must be positive decimal
- `stock_quantity` must be non-negative integer

### Eye Hygiene Variants Validation
- `name` required (max 255 characters)
- `size_volume` required (max 50 characters)
- `price` required positive decimal
- `sku` unique if provided (max 100 characters)
- `image_url` valid URL if provided (max 500 characters)

## API Response Format

The frontend expects these specific field names:

### MM Calibers Response
```json
{
  "mm": 58,
  "image_url": "https://example.com/image.jpg",
  "price": 180.00,
  "stock_quantity": 10,
  "is_active": true
}
```

### Eye Hygiene Variants Response
```json
{
  "id": 1,
  "product_id": 123,
  "name": "Premium Eye Drops - 10ml",
  "description": "Regular size eye drops",
  "size_volume": "10ml",
  "pack_type": "Single",
  "price": 15.99,
  "compare_at_price": null,
  "cost_price": 8.50,
  "stock_quantity": 30,
  "stock_status": "in_stock",
  "sku": "EYE-DROPS-10ML",
  "expiry_date": "2025-12-31T00:00:00.000Z",
  "image_url": "https://example.com/eye-drops-10ml.jpg",
  "is_active": true,
  "sort_order": 2,
  "created_at": "2024-01-01T00:00:00.000Z",
  "updated_at": "2024-01-01T00:00:00.000Z"
}
```

## Notes

1. **Backward Compatibility**: The `size_volume`, `pack_type`, and `expiry_date` fields in the Product model are kept for backward compatibility with existing eye hygiene products that don't use variants.

2. **JSON Storage**: MM calibers are stored as JSON for flexibility and easy querying. Consider your database's JSON capabilities when implementing queries.

3. **Cascade Delete**: Eye hygiene variants are set to cascade delete when the parent product is deleted.

4. **Sorting**: Both systems use `sort_order` for custom display ordering.

5. **Active Status**: Both calibers and variants support soft delete via `is_active` flag.
