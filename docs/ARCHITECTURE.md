# Architecture Documentation

## Overview

Social Experiment is a full-stack web application built with Next.js 14, designed to run AI-powered classification studies on social media data. The architecture follows a modern serverless approach with clear separation of concerns.

## Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **UI Library**: React 18
- **Styling**: TailwindCSS + Shadcn UI components
- **State Management**: Zustand (minimal usage, mostly server state)
- **Form Handling**: React Hook Form
- **Type Safety**: TypeScript

### Backend
- **API**: Next.js API Routes (serverless functions)
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js (Credentials provider)
- **File Storage**: S3-compatible (MinIO local, AWS S3 production)
- **AI Provider**: OpenAI API

### Infrastructure
- **Local Development**: Docker Compose (MinIO, PostgreSQL optional)
- **Production**: AWS (ECS Fargate, RDS, S3, ALB)
- **IaC**: Terraform

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Client (Browser)                     │
│                      Next.js App Router                      │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  │ HTTP/HTTPS
                  │
┌─────────────────▼───────────────────────────────────────────┐
│                    Next.js Server                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Server     │  │     API      │  │  Middleware  │     │
│  │  Components  │  │    Routes    │  │  (NextAuth)  │     │
│  └──────────────┘  └──────┬───────┘  └──────────────┘     │
└──────────────────────────┬┴──────────────────────────────────┘
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
         ▼                 ▼                 ▼
┌────────────────┐  ┌────────────┐  ┌──────────────┐
│   PostgreSQL   │  │  S3/MinIO  │  │  OpenAI API  │
│   (Prisma)     │  │  Storage   │  │              │
└────────────────┘  └────────────┘  └──────────────┘
```

## Core Components

### 1. Data Layer (Prisma + PostgreSQL)

**Schema Overview:**

```prisma
User
├── ApiKey (encrypted)
├── Dataset
├── Classifier
├── ModelConstraint
└── Study
    └── StudyResult
```

**Key Entities:**

- **User**: Authentication and API key ownership
- **Dataset**: CSV files stored in S3, metadata in database
- **Classifier**: Reusable AI prompts for classification tasks
- **ModelConstraint**: System-level instructions for AI behavior
- **Study**: Combines dataset + classifiers to run batch classifications
- **StudyResult**: Individual classification results per row

### 2. API Layer (Next.js API Routes)

Located in `src/app/api/`, organized by resource:

```
api/
├── auth/
│   ├── [...nextauth]/     # Authentication
│   └── register/          # User registration
├── apikeys/               # API key CRUD
├── datasets/              # Dataset upload/download
├── classifiers/           # Classifier CRUD
├── constraints/           # Constraint CRUD
└── studies/               # Study execution and export
```

**Authentication Flow:**

1. User submits credentials
2. NextAuth validates against database
3. Session token issued via JWT
4. Protected routes check session via middleware

**API Key Security:**

- Stored encrypted (AES-256-CBC)
- Encrypted at rest in database
- Decrypted only when making AI requests
- Never exposed to client

### 3. Adapter Pattern

External services are abstracted behind adapters in `src/lib/adapters/`:

#### AI Provider Adapter

```typescript
interface AIProvider {
  batchClassify(
    text: string,
    prompts: { id: string; prompt: string }[]
  ): Promise<Record<string, { score: number; reasoning: string }>>;
}
```

**Implementation**: OpenAI with structured JSON output

**Flow:**
1. Receives text + multiple classifier prompts
2. Constructs system message with all tasks
3. Requests JSON-formatted response
4. Parses and validates response
5. Returns classification + confidence for each task

#### Storage Adapter

```typescript
interface StorageAdapter {
  uploadFile(key: string, buffer: Buffer, contentType: string): Promise<void>;
  getFileUrl(key: string): Promise<string>;
  deleteFile(key: string): Promise<void>;
}
```

**Implementations:**
- S3 (production)
- MinIO (local development)

### 4. Study Execution Engine

Located in `src/app/api/studies/[id]/run/route.ts`

**Execution Flow:**

```
1. Load study configuration
   ├── Dataset metadata
   ├── Selected classifiers
   ├── Model constraints
   └── Sample size

2. Download dataset from storage
   └── Parse CSV

3. Sample rows (if sample size < total)

4. For each row:
   ├── Extract text field
   ├── Batch classify with all classifiers
   ├── Store results in database
   └── Handle errors gracefully

5. Mark study as completed/failed
   └── Store error details if failed
```

**Error Handling:**
- Individual row failures don't stop execution
- Errors stored in StudyResult table
- Study marked as failed if critical error occurs

### 5. Frontend Architecture

Using Next.js App Router with Server/Client Components:

**Server Components** (default):
- Data fetching pages
- Layout components
- Static content

**Client Components** ('use client'):
- Forms with interactivity
- Real-time updates
- Browser-only features

**Key Patterns:**

1. **Server Actions**: Not used (removed in favor of API routes)
2. **Route Handlers**: All mutations via POST to API routes
3. **Streaming**: Not currently implemented
4. **Suspense**: Used for loading states

## Data Flow Examples

### Creating a Study

```
User Input (Form)
    ↓
API Route (/api/studies POST)
    ↓
Prisma Create
    ↓
Database Write
    ↓
Response (Study ID)
    ↓
Client (Redirect to study page)
```

### Running a Study

```
User Click "Run Study"
    ↓
API Route (/api/studies/[id]/run POST)
    ↓
Load Configuration (DB)
    ↓
Download Dataset (S3)
    ↓
For Each Row:
    ├── AI Classification (OpenAI)
    └── Store Result (DB)
    ↓
Update Study Status (DB)
    ↓
Response (Success/Failure)
    ↓
Client (Auto-refresh shows results)
```

### Exporting Results

```
User Click "Download"
    ↓
API Route (/api/studies/[id]/export GET)
    ↓
Load Study Results (DB)
    ↓
Join with Dataset Rows
    ↓
Format as CSV
    ↓
Stream Response
    ↓
Client (Browser downloads file)
```

## Security Considerations

### Authentication
- Password hashing with bcrypt
- JWT sessions via NextAuth
- HTTP-only cookies
- CSRF protection via NextAuth

### API Keys
- AES-256-CBC encryption
- Unique IV per encryption
- Keys never sent to client
- Decrypted only when needed

### Data Access
- Row-level security via userId
- All queries scoped to current user
- No cross-user data access

### File Storage
- Pre-signed URLs for downloads
- Limited-time URL validity
- Bucket policies restrict access

## Scalability Considerations

### Current Limitations
- Single-threaded study execution
- In-memory CSV parsing
- No queue system

### Scaling Options

**Horizontal Scaling:**
- Stateless API routes (can run multiple instances)
- Database connection pooling
- CDN for static assets

**Study Execution:**
- Move to queue (BullMQ, AWS SQS)
- Parallel processing workers
- Streaming CSV parsing for large files

**Database:**
- Read replicas for queries
- Connection pooling (PgBouncer)
- Batch inserts for results

## Development Workflow

### Local Setup
1. Docker Compose for MinIO
2. Local PostgreSQL or Docker
3. `npm run dev` for development server
4. Prisma Studio for database inspection

### Database Migrations
1. Update `prisma/schema.prisma`
2. `npm run db:generate` (regenerate client)
3. `npm run db:migrate` (create migration)
4. Commit migration files

### Testing
- Vitest for unit tests
- Focus on adapters and business logic
- Coverage reporting via Codecov

## Deployment

### AWS Architecture

```
Internet
    ↓
Application Load Balancer
    ↓
ECS Fargate (Next.js)
    ├→ RDS PostgreSQL
    ├→ S3 Bucket
    └→ OpenAI API
```

**Resources Created by Terraform:**
- VPC with public/private subnets
- ECS Cluster + Fargate Service
- ALB with health checks
- RDS PostgreSQL instance
- S3 bucket with policies
- CloudWatch logs

### Environment Variables

**Required:**
- `DATABASE_URL`: PostgreSQL connection string
- `NEXTAUTH_SECRET`: Session encryption key
- `NEXTAUTH_URL`: Application URL
- `STORAGE_ENDPOINT`: S3 endpoint
- `STORAGE_ACCESS_KEY`: S3 credentials
- `STORAGE_SECRET_KEY`: S3 credentials
- `STORAGE_BUCKET`: S3 bucket name
- `ENCRYPTION_KEY`: API key encryption key

## Future Improvements

### Performance
- [ ] Implement job queue for studies
- [ ] Streaming CSV processing
- [ ] Caching layer (Redis)
- [ ] Batch AI requests

### Features
- [ ] Study templates
- [ ] Collaborative workspaces
- [ ] Visualization dashboard
- [ ] Export to various formats
- [ ] Custom AI model support

### Infrastructure
- [ ] Auto-scaling policies
- [ ] Multi-region deployment
- [ ] Database backup automation
- [ ] Monitoring and alerting