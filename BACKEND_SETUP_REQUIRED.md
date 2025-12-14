# Backend Setup Required for Job Application Form

## Error Message
```
"Storage not ready for submissions. Please run Prisma migrations and try again."
```

## Required Actions

### 1. Run Prisma Migrations
The backend database schema needs to be set up. Run:
```bash
npx prisma migrate dev
# or
npx prisma migrate deploy  # for production
```

### 2. Prisma Schema Requirements

The backend needs a Prisma model for job applications. Based on the frontend form, here's what the schema should include:

```prisma
model JobApplication {
  id              String   @id @default(cuid())
  jobId           String
  firstName       String
  lastName        String
  email           String
  phoneNumber     String
  whyJoinMessage  String   @db.Text
  resumeCv        String?  // Base64 encoded file or file path
  resumeFileName  String?
  resumeFileType  String?
  linkedin        String?
  portfolio       String?
  status          String   @default("pending") // pending, reviewed, accepted, rejected
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  // Relation to Job (if you have a Job model)
  job             Job?     @relation(fields: [jobId], references: [id])

  @@index([jobId])
  @@index([email])
  @@index([status])
}
```

### 3. Backend Controller/Route Requirements

The endpoint `POST /api/forms/job-application/submissions` should:

1. **Accept JSON payload** with Content-Type: `application/json`
2. **Validate required fields:**
   - `jobId` (string)
   - `firstName` (string, required)
   - `lastName` (string, required)
   - `email` (string, required, valid email)
   - `phoneNumber` (string, required)
   - `whyJoinMessage` (string, required)
   - `resumeCv` (string, base64 encoded, required)
   - `resumeFileName` (string, optional)
   - `resumeFileType` (string, optional)
   - `linkedin` (string, optional, valid URL)
   - `portfolio` (string, optional, valid URL)

3. **Handle file storage:**
   - Decode base64 `resumeCv` to binary
   - Save file to storage (local filesystem, S3, etc.)
   - Store file path/URL in database

4. **Create database record:**
   - Save all form data to `JobApplication` table
   - Return success response

### 4. Example Backend Controller (Node.js/Express)

```typescript
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

export async function submitJobApplication(req: Request, res: Response) {
  try {
    const {
      jobId,
      firstName,
      lastName,
      email,
      phoneNumber,
      whyJoinMessage,
      resumeCv,
      resumeFileName,
      resumeFileType,
      linkedin,
      portfolio
    } = req.body;

    // Validate required fields
    if (!jobId || !firstName || !lastName || !email || !phoneNumber || !whyJoinMessage || !resumeCv) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        data: {
          issues: [
            !firstName && '"firstName" is required',
            !lastName && '"lastName" is required',
            !email && '"email" is required',
            !phoneNumber && '"phoneNumber" is required',
            !resumeCv && '"resumeCv" is required',
            !whyJoinMessage && '"whyJoinMessage" is required'
          ].filter(Boolean)
        }
      });
    }

    // Decode base64 file and save
    const fileBuffer = Buffer.from(resumeCv, 'base64');
    const uploadsDir = path.join(__dirname, '../uploads/resumes');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    const fileName = `${Date.now()}-${resumeFileName || 'resume'}`;
    const filePath = path.join(uploadsDir, fileName);
    fs.writeFileSync(filePath, fileBuffer);

    // Save to database
    const application = await prisma.jobApplication.create({
      data: {
        jobId,
        firstName,
        lastName,
        email,
        phoneNumber,
        whyJoinMessage,
        resumeCv: filePath, // or store as base64 if preferred
        resumeFileName,
        resumeFileType,
        linkedin,
        portfolio,
        status: 'pending'
      }
    });

    return res.json({
      success: true,
      message: 'Application submitted successfully',
      data: {
        id: application.id
      }
    });
  } catch (error: any) {
    console.error('Job application error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to submit application',
      error: error.message
    });
  }
}
```

### 5. Quick Fix Commands

If you have access to the backend:

```bash
# Navigate to backend directory
cd ../backend  # or wherever your backend is

# Run migrations
npx prisma migrate dev --name add_job_application

# Or if migrations already exist, just push schema
npx prisma db push

# Generate Prisma Client
npx prisma generate
```

## Frontend Status

✅ Frontend is correctly configured and sending:
- JSON format with `application/json` Content-Type
- All required fields with correct names
- Base64 encoded resume file
- Optional fields (linkedin, portfolio)

The frontend is ready - the backend just needs the database schema set up.

