# Backend Prisma Schema Fix - PrescriptionLensVariant Colors Relation

## 🚨 Problem

The backend is trying to include `colors` in a `PrescriptionLensVariant` query, but the Prisma schema doesn't have this relation defined.

**Error:**
```
Unknown field `colors` for include statement on model `PrescriptionLensVariant`. 
Available options are marked with ?.
```

**Location:** `/app/controllers/prescriptionLensVariantController.js:73:36`

---

## ✅ Solution

Add the `colors` relation to the `PrescriptionLensVariant` model in your Prisma schema.

---

## 📋 Prisma Schema Update

### Current Schema (Missing Relation)

```prisma
model PrescriptionLensVariant {
  id                        Int      @id @default(autoincrement())
  prescription_lens_type_id Int
  name                      String
  slug                      String   @unique
  description               String?
  price                     Decimal  @db.Decimal(10, 2)
  is_recommended            Boolean  @default(false)
  viewing_range             String?
  use_cases                 String?
  is_active                 Boolean  @default(true)
  sort_order                Int      @default(0)
  created_at                DateTime @default(now())
  updated_at                DateTime @updatedAt

  prescriptionLensType PrescriptionLensType @relation(fields: [prescription_lens_type_id], references: [id])
  cartItems            CartItem[]

  @@map("prescription_lens_variants")
}
```

### Updated Schema (With Colors Relation)

```prisma
model PrescriptionLensVariant {
  id                        Int      @id @default(autoincrement())
  prescription_lens_type_id Int
  name                      String
  slug                      String   @unique
  description               String?
  price                     Decimal  @db.Decimal(10, 2)
  is_recommended            Boolean  @default(false)
  viewing_range             String?
  use_cases                 String?
  is_active                 Boolean  @default(true)
  sort_order                Int      @default(0)
  created_at                DateTime @default(now())
  updated_at                DateTime @updatedAt

  prescriptionLensType PrescriptionLensType @relation(fields: [prescription_lens_type_id], references: [id])
  colors                  PrescriptionLensColor[]  // ✅ ADD THIS LINE
  cartItems               CartItem[]

  @@map("prescription_lens_variants")
}
```

### PrescriptionLensColor Model (Verify This Exists)

Make sure your `PrescriptionLensColor` model has the reverse relation:

```prisma
model PrescriptionLensColor {
  id                          Int      @id @default(autoincrement())
  prescription_lens_type_id   Int?
  prescription_lens_variant_id Int?     // ✅ This field should exist
  name                        String
  color_code                  String?
  hex_code                    String?
  image_url                   String?
  price_adjustment            Decimal?  @db.Decimal(10, 2)
  is_active                   Boolean   @default(true)
  sort_order                  Int       @default(0)
  created_at                  DateTime  @default(now())
  updated_at                  DateTime  @updatedAt

  prescriptionLensType   PrescriptionLensType?   @relation(fields: [prescription_lens_type_id], references: [id])
  prescriptionLensVariant PrescriptionLensVariant? @relation(fields: [prescription_lens_variant_id], references: [id])  // ✅ ADD THIS LINE

  @@map("prescription_lens_colors")
}
```

---

## 🔧 Steps to Fix

### 1. Update Prisma Schema

1. Open your `schema.prisma` file
2. Add the `colors` relation to `PrescriptionLensVariant`:
   ```prisma
   colors PrescriptionLensColor[]
   ```
3. Add the reverse relation to `PrescriptionLensColor`:
   ```prisma
   prescriptionLensVariant PrescriptionLensVariant? @relation(fields: [prescription_lens_variant_id], references: [id])
   ```

### 2. Generate Prisma Client

```bash
npx prisma generate
```

### 3. Create Migration (if needed)

If the database table already has the `prescription_lens_variant_id` column in `prescription_lens_colors`:

```bash
npx prisma migrate dev --name add_prescription_lens_variant_colors_relation
```

If the column doesn't exist, you may need to add it first:

```bash
# Create a migration to add the foreign key column
npx prisma migrate dev --name add_prescription_lens_variant_id_to_colors
```

### 4. Verify the Fix

After updating the schema, the controller code should work:

```javascript
const [variants, total] = await Promise.all([
  prisma.prescriptionLensVariant.findMany({
    where: {
      prescription_lens_type_id: 3,
      is_active: true
    },
    include: {
      colors: {  // ✅ This will now work
        where: {
          is_active: true
        },
        orderBy: {
          sort_order: "asc"
        }
      },
      prescriptionLensType: true,
      cartItems: true
    },
    orderBy: [
      {
        sort_order: "asc"
      },
      {
        created_at: "asc"
      }
    ],
    skip: 0,
    take: 100
  })
])
```

---

## 📊 Database Structure

The `prescription_lens_colors` table should have:

- `prescription_lens_variant_id` (INT, nullable, foreign key to `prescription_lens_variants.id`)

If this column doesn't exist, you'll need to:

1. **Add the column:**
   ```sql
   ALTER TABLE prescription_lens_colors 
   ADD COLUMN prescription_lens_variant_id INT NULL;
   ```

2. **Add foreign key constraint:**
   ```sql
   ALTER TABLE prescription_lens_colors
   ADD CONSTRAINT fk_prescription_lens_variant
   FOREIGN KEY (prescription_lens_variant_id)
   REFERENCES prescription_lens_variants(id)
   ON DELETE SET NULL;
   ```

3. **Add index for performance:**
   ```sql
   CREATE INDEX idx_prescription_lens_colors_variant_id 
   ON prescription_lens_colors(prescription_lens_variant_id);
   ```

---

## 🎯 Expected API Response

After the fix, the API should return variants with colors:

```json
{
  "success": true,
  "data": {
    "variants": [
      {
        "id": 1,
        "prescriptionLensTypeId": 3,
        "name": "Premium Progressive",
        "slug": "premium-progressive",
        "description": "High-quality progressive lenses",
        "price": 150.00,
        "isRecommended": true,
        "viewingRange": "Wide",
        "useCases": "Maximum comfort & balanced vision",
        "isActive": true,
        "sortOrder": 1,
        "colors": [
          {
            "id": 1,
            "name": "Clear",
            "colorCode": "clear",
            "hexCode": "#FFFFFF",
            "priceAdjustment": 0,
            "isActive": true,
            "sortOrder": 1
          }
        ]
      }
    ]
  }
}
```

---

## 🔍 Verification

1. **Check Prisma Schema:**
   ```bash
   npx prisma validate
   ```

2. **Test the API:**
   ```bash
   GET /api/lens/prescription-lens-types/3/variants
   ```

3. **Check Frontend Console:**
   - Should no longer see: `❌ Failed to fetch prescription lens variants`
   - Should see: `✅ Fetched X variants for type ID 3`

---

## 📝 Notes

- The `colors` relation is **optional** (one-to-many), so variants can exist without colors
- Colors can belong to either:
  - A `PrescriptionLensType` (via `prescription_lens_type_id`)
  - A `PrescriptionLensVariant` (via `prescription_lens_variant_id`)
- Both relations should be optional (`?`) in the Prisma schema

---

## 🚀 Related Files

- **Frontend Service:** `src/services/prescriptionLensService.ts`
- **Frontend Interface:** `PrescriptionLensVariant` (line 28-44)
- **Backend Controller:** `/app/controllers/prescriptionLensVariantController.js`
- **API Route:** `GET /api/lens/prescription-lens-types/:id/variants`

---

**Last Updated:** 2025-01-26  
**Version:** 1.0.0

