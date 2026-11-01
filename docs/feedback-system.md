# In-App Feedback, Support & Issue Reporting System

A production-grade, end-to-end in-app feedback and issue reporting system for SaaS applications. Built with React, Express, MongoDB (Mongoose), Supabase Storage, and Microsoft Teams Workflows (Adaptive Cards).

---

## 📑 Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Sequence & Data Flow](#2-sequence--data-flow)
3. [Technology Stack](#3-technology-stack)
4. [MongoDB Data Model & Indexes](#4-mongodb-data-model--indexes)
5. [Storage Architecture (Supabase)](#5-storage-architecture-supabase)
6. [Notifications & Outbox Worker (MS Teams)](#6-notifications--outbox-worker-ms-teams)
7. [API Contract & Specifications](#7-api-contract--specifications)
8. [Frontend Features & Design System](#8-frontend-features--design-system)
9. [Security, Privacy & Idempotency](#9-security-privacy--idempotency)
10. [Environment Variables Reference](#10-environment-variables-reference)
11. [Setup Instructions: Supabase Private Bucket](#11-setup-instructions-supabase-private-bucket)
12. [Setup Instructions: Microsoft Teams Workflow](#12-setup-instructions-microsoft-teams-workflow)
13. [Setup Instructions: MongoDB Atlas](#13-setup-instructions-mongodb-atlas)
14. [Running the Application Locally](#14-running-the-application-locally)
15. [Testing & Quality Assurance](#15-testing--quality-assurance)

---

## 1. Architecture Overview

```mermaid
flowchart TD
    User([Authenticated Client]) -->|1. Clicks Floating Support Icon| Widget[FeedbackWidget]
    Widget -->|2. Captures Page Viewport| H2C[html2canvas]
    Widget -->|3. Compresses Attachments| Comp[browser-image-compression]
    Widget -->|4. Requests Signed Upload URL| BackendAPI[Express API Server]
    BackendAPI -->|5. Generates Expiring Upload URL| Supabase[(Supabase Storage: feedback-attachments)]
    Widget -->|6. Direct Upload to Signed URL| Supabase
    Widget -->|7. Submits Report + Idempotency-Key| BackendAPI
    
    subgraph Atomic Transaction
        BackendAPI -->|8a. Inserts Report & Reference ID| MongoFeedback[(MongoDB: feedback_submissions)]
        BackendAPI -->|8b. Inserts Notification Job| MongoOutbox[(MongoDB: notification_outbox)]
    end

    BackendAPI -->|9. Returns Success & Ref ID| Widget
    
    subgraph Background Worker
        Worker[Notification Worker] -->|10. Claims Pending Jobs Atomically| MongoOutbox
        Worker -->|11. Dispatches Adaptive Card| TeamsWebhook[Power Automate / MS Teams Workflow]
        TeamsWebhook -->|12. Notifies Support Team| TeamsChannel[Teams: Product Support / Customer Feedback]
        Worker -->|13. Marks Job SENT or Schedules Retry| MongoOutbox
    end
```

### Core Architecture Principles:
- **Resilient Outbox Pattern**: Submitting feedback never calls Teams synchronously. A Teams outage or rate-limit will **never** lose or fail a customer feedback submission.
- **Zero-Storage-Pass-Through**: Heavy screenshots are uploaded directly from the browser to private cloud storage (Supabase) via short-lived signed URLs. Raw binary data never traverses or bogs down the API server.
- **Strict Server-Derived Identity**: User and Organization identities are derived exclusively from verified JWT authentication tokens. Client-provided IDs are never trusted.
- **Single Global Mount**: The `FeedbackWidget` is mounted exactly once at the root authenticated layout and persists across client-side SPA navigation.
- **Multi-Instance Safe**: Outbox worker claims jobs using atomic `findOneAndUpdate` queries, preventing duplicate notification delivery even with multiple backend replicas.

---

## 2. Sequence & Data Flow

```mermaid
sequenceDiagram
    autonumber
    actor User as Client User
    participant Widget as Frontend Widget
    participant API as Backend API
    participant Storage as Supabase Storage
    participant DB as MongoDB Atlas
    participant Worker as Outbox Worker
    participant Teams as Microsoft Teams

    User->>Widget: Opens widget & clicks "Capture Current Page"
    Widget->>Widget: html2canvas captures viewport (modal temporarily hidden)
    Widget->>API: POST /api/feedback/upload-url (filename, mimeType, size)
    API->>Storage: Create signed upload URL for path feedback/{org}/{user}/{uuid}.png
    Storage-->>API: Signed URL + token
    API-->>Widget: Signed upload URL & ownership-bound storage key
    Widget->>Storage: PUT image bytes directly to signed URL
    Storage-->>Widget: 200 OK
    Widget->>API: POST /api/feedback (Idempotency-Key, category, description, attachments, context)
    
    rect rgb(240, 248, 255)
        Note over API,DB: Mongoose Session Transaction
        API->>DB: Atomic increment counter -> Generate FB-YYYY-NNNNN
        API->>DB: Insert feedback report into feedback_submissions
        API->>API: Build Teams Adaptive Card (sanitizing text & adding signed download links)
        API->>DB: Insert job into notification_outbox (status: pending)
    end

    API-->>Widget: 201 Created (referenceId: FB-2026-00042)
    Widget-->>User: Displays polished Success Screen with Ref ID & copy button

    loop Outbox Worker (Every 5s)
        Worker->>DB: findOneAndUpdate({ status: pending, nextRetryAt <= now }) -> status: processing
        Worker->>Teams: POST Adaptive Card to Power Automate Webhook
        alt Successful Delivery (200 / 202)
            Worker->>DB: update status: sent, sentAt: now
        else Delivery Failed / Timeout
            Worker->>DB: Increment attempts, calculate backoff, update nextRetryAt
        end
    end
```

---

## 3. Technology Stack

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| **Frontend Framework** | React | 18.3.1 | Core UI library |
| **Build Tool** | Vite | 5.4.11 | Fast HMR dev server and optimized production bundler |
| **Routing** | React Router DOM | 6.28.0 | Authenticated SPA routing |
| **Icons** | Lucide React | 0.460.0 | High-contrast, lightweight SVG icons |
| **Screenshot Capture** | html2canvas | 1.4.1 | Client-side DOM-to-canvas rendering (user-initiated) |
| **Image Compression** | browser-image-compression | 2.0.2 | Downscales oversized screenshots before upload |
| **Backend Framework** | Node.js + Express | 4.21.1 (Node 24) | High-performance REST API |
| **Database ODM** | Mongoose | 8.8.1 | MongoDB ODM with replica set transactions |
| **Validation** | Express-Validator & Zod | 7.2.0 / 3.23.8 | Strict server-side request & env validation |
| **Authentication** | JSON Web Tokens (JWT) | 9.0.2 | `httpOnly` cookie + Bearer token auth |
| **Cloud Storage** | Supabase Storage Client | 2.45.4 | Private bucket `feedback-attachments` abstraction |
| **Background Scheduling** | node-cron | 3.0.3 | Reliable outbox polling, stuck-job recovery, orphan cleanup |
| **Testing** | Jest + Supertest / Vitest | 29.7.0 / 2.1.9 | Comprehensive unit and integration test suites |

---

## 4. MongoDB Data Model & Indexes

### Collection: `feedback_submissions`
Stores all submitted feedback reports, attached metadata, and diagnostic environment context.

```javascript
{
  _id: ObjectId("..."),
  referenceId: "FB-2026-00042",               // Unique human-readable reference ID
  userId: ObjectId("..."),                    // Ref: User collection
  organizationId: ObjectId("..."),            // Ref: Organization collection (nullable for personal)
  category: "bug",                            // 'bug' | 'ui_ux' | 'feature_request' | 'general' | 'other'
  description: "Checkout fails on submit...", // Trimmed string (10 to 5000 characters)
  context: {
    pageUrl: "https://app.example.com/checkout",
    pageTitle: "Checkout | Dumroo",
    browser: "Chrome 128",
    os: "Windows 11",
    screenResolution: "1920x1080",
    viewport: "1440x900",
    environment: "production",
    timezone: "Asia/Kolkata",
    timestamp: ISODate("2026-10-31T02:00:00Z")
  },
  status: "open",                             // 'open' | 'under_review' | 'in_progress' | 'resolved' | 'closed'
  idempotencyKey: "b8a8b16c-e3a4-4a25-...",  // Client-generated UUID
  attachments: [                              // Embedded bounded array (max 5)
    {
      _id: ObjectId("..."),
      storageProvider: "supabase",
      storageKey: "feedback/60d5ec/60d5eb/a41c19...png",
      originalFilename: "screen-error.png",
      mimeType: "image/png",
      fileSize: 1048576,                     // Size in bytes (max 5MB)
      uploadedBy: ObjectId("..."),
      createdAt: ISODate("...")
    }
  ],
  createdAt: ISODate("..."),
  updatedAt: ISODate("...")
}
```

#### Indexes:
- `referenceId`: `{ unique: true }`
- `userId`: `1`
- `organizationId`: `1`
- `status`: `1`
- `category`: `1`
- `createdAt`: `-1`
- Compound: `{ organizationId: 1, createdAt: -1 }`
- Unique Sparse: `{ userId: 1, idempotencyKey: 1 }` (guarantees idempotency per user)

---

### Collection: `notification_outbox`
Stores notifications waiting to be dispatched to external webhooks.

```javascript
{
  _id: ObjectId("..."),
  feedbackId: ObjectId("..."),                // Ref: Feedback
  notificationType: "teams",                  // 'teams'
  destination: "https://prod-00.westus.logic.azure.com/workflows/...",
  payload: { ... },                           // Microsoft Teams Adaptive Card v1.4 JSON
  status: "pending",                          // 'pending' | 'processing' | 'sent' | 'failed'
  attempts: 0,                                // Current execution attempt count (max 5)
  lastError: null,                            // Message from last failed attempt
  nextRetryAt: ISODate("..."),                // When this job is eligible to run next
  sentAt: null,                               // Timestamp of successful delivery
  createdAt: ISODate("..."),
  updatedAt: ISODate("...")
}
```

#### Indexes:
- Compound: `{ status: 1, nextRetryAt: 1 }` (enables lightning-fast atomic claiming)
- `feedbackId`: `1`

---

### Collection: `counters`
Atomic sequence generator ensuring monotonic reference ID generation without collisions.

```javascript
{
  _id: "feedback-2026",                       // Scoped per calendar year
  seq: 42
}
```

---

## 5. Storage Architecture (Supabase)

### Storage Abstraction (`StorageInterface`)
All storage operations are mediated through `StorageService`, abstracting the cloud provider:
- `createSignedUploadUrl(storageKey, expiresIn)`
- `createSignedDownloadUrl(storageKey, expiresIn)`
- `deleteFile(storageKey)`
- `deleteFiles(storageKeys)`
- `listFiles(prefix)`

### Strict Key Structure & Ownership
Storage keys are structured to enforce user and organization boundaries:
```text
feedback/{organizationId | 'personal'}/{userId}/{uuid}.{ext}
```

Before saving or downloading, `storageService.verifyKeyOwnership(storageKey, userId)` parses the key and verifies that the key path contains the exact authenticated `userId`. Any attempt by a user to reference or manipulate keys belonging to another user is rejected with an HTTP 403 / error.

### Orphaned Upload Cleanup
Users may occasionally upload a screenshot and close the tab without submitting the feedback report. The background worker runs a scheduled job (`0 * * * *` - every hour) that:
1. Lists all files in the `feedback/` storage bucket.
2. Identifies files created more than `FEEDBACK_ORPHAN_CLEANUP_GRACE_MINUTES` (default: 60 minutes) ago.
3. Cross-references with the `feedback_submissions` collection in MongoDB.
4. Permanently deletes any files that are not attached to any saved report.

---

## 6. Notifications & Outbox Worker (MS Teams)

### Microsoft Teams Adaptive Card v1.4
The notification sent to Teams is formatted as a rich, structured Adaptive Card containing:
- **Header**: Category-colored emphasis container (`Bug Report`, `UI / UX Issue`, `Feature Request`, `General Feedback`).
- **FactSet**:
  - Reference ID (e.g. `FB-2026-00042`)
  - Status (e.g. `OPEN`)
  - Submitted By (Name and Email)
  - Organization Name
  - Timestamp (UTC)
  - Page URL where the issue occurred
  - Browser and Operating System
  - Screen Resolution / Viewport
- **Description Block**: Preserves user line breaks with HTML tags and script injections fully sanitized.
- **Attachment Links**: Secure, expiring signed download URLs (7 days validity) embedded as actionable buttons (`View Screenshot 1`, `View Screenshot 2`).

### Atomic Polling & Worker Concurrency
Multiple server instances can poll the `notification_outbox` simultaneously without race conditions:
```javascript
const job = await Outbox.findOneAndUpdate(
  {
    status: 'pending',
    nextRetryAt: { $lte: new Date() }
  },
  {
    $set: {
      status: 'processing',
      updatedAt: new Date()
    }
  },
  { sort: { nextRetryAt: 1 }, new: true }
);
```

### Exponential Backoff Retry Schedule
If the Teams webhook fails (HTTP 429, 500, network timeout, or service disruption):

| Attempt | Delay | Wait Time | Behavior |
|---|---|---|---|
| **1** | Immediate | 0s | First attempt right after creation |
| **2** | 30 seconds | 30s | Quick retry for momentary network blips |
| **3** | 2 minutes | 120s | Short recovery window |
| **4** | 10 minutes | 600s | Extended recovery window |
| **5** | 30 minutes | 1800s | Final retry attempt |
| **Failed** | N/A | Permanently FAILED | Logged to console; actionable via Admin Retry endpoint |

### Stuck-Job Self-Healing
If a server container crashes while actively dispatching a job, the job is left in `status: 'processing'`. Every 5 minutes, the worker runs `recoverStuckJobs(olderThanMinutes = 5)`, which detects any job stuck in `processing` for over 5 minutes and transitions it back to `pending`.

---

## 7. API Contract & Specifications

All feedback endpoints require an authenticated session (via `httpOnly` JWT cookie or `Authorization: Bearer <token>` header).

### 1. Request Signed Upload URL
- **Endpoint**: `POST /api/feedback/upload-url`
- **Rate Limit**: 20 requests per 15 minutes per user
- **Request Body**:
  ```json
  {
    "originalFilename": "screenshot-bug.png",
    "mimeType": "image/png",
    "fileSize": 1048576
  }
  ```
- **Validation**:
  - `mimeType`: Must be `image/png`, `image/jpeg`, or `image/webp`.
  - `fileSize`: Must be between 1 byte and 5 MB (5,242,880 bytes).
  - Extension must match the declared MIME type.
- **Success Response** (`200 OK`):
  ```json
  {
    "success": true,
    "message": "Signed upload URL generated successfully",
    "data": {
      "uploadUrl": "https://xyz.supabase.co/storage/v1/object/upload/sign/feedback/...",
      "storageKey": "feedback/org123/user456/uuid.png",
      "expiresIn": 300
    }
  }
  ```

---

### 2. Submit Feedback Report
- **Endpoint**: `POST /api/feedback`
- **Required Header**: `Idempotency-Key: <UUID>`
- **Rate Limit**: 20 requests per 15 minutes per user
- **Request Body**:
  ```json
  {
    "category": "bug",
    "description": "Clicking the payment button triggers an unexpected error 500.",
    "context": {
      "pageUrl": "https://app.example.com/billing",
      "pageTitle": "Billing & Invoices",
      "browser": "Chrome 128",
      "os": "Windows 11",
      "screenResolution": "1920x1080",
      "viewport": "1440x900",
      "environment": "production"
    },
    "attachments": [
      {
        "storageKey": "feedback/org123/user456/uuid.png",
        "originalFilename": "screenshot-bug.png",
        "mimeType": "image/png",
        "fileSize": 1048576
      }
    ]
  }
  ```
- **Success Response** (`201 Created`):
  ```json
  {
    "success": true,
    "message": "Feedback submitted successfully",
    "data": {
      "feedbackId": "67243912a7bf...",
      "referenceId": "FB-2026-00042",
      "status": "open",
      "category": "bug",
      "createdAt": "2026-10-31T02:00:00.000Z"
    }
  }
  ```
- **Idempotent Duplicate Response** (`200 OK`):
  If the exact same `Idempotency-Key` is submitted again, the backend returns the original submission data immediately without creating a duplicate database record.

---

### 3. List My Feedback Reports
- **Endpoint**: `GET /api/feedback/my-reports?page=1&limit=20&category=bug&status=open`
- **Access Control**: Scoped to the authenticated user and their organization.
- **Success Response** (`200 OK`):
  ```json
  {
    "success": true,
    "data": {
      "items": [
        {
          "_id": "67243912a7bf...",
          "referenceId": "FB-2026-00042",
          "category": "bug",
          "description": "Clicking the payment button...",
          "status": "open",
          "attachments": [
            {
              "originalFilename": "screenshot-bug.png",
              "signedDownloadUrl": "https://xyz.supabase.co/storage/v1/object/sign/feedback/..."
            }
          ],
          "createdAt": "2026-10-31T02:00:00.000Z"
        }
      ],
      "total": 1,
      "page": 1,
      "limit": 20,
      "totalPages": 1
    }
  }
  ```

---

### 4. Get Feedback Details
- **Endpoint**: `GET /api/feedback/:id`
- **Access Control**: Returns report with freshly signed attachment download URLs. Rejects access if the report belongs to a different user/organization (404).

---

### 5. Update Feedback Status (Admin Only)
- **Endpoint**: `PATCH /api/feedback/:id/status`
- **Guard**: `requireAdmin` (`role === 'admin'`)
- **Request Body**:
  ```json
  {
    "status": "in_progress"
  }
  ```
- **Allowed Values**: `open`, `under_review`, `in_progress`, `resolved`, `closed`.

---

### 6. Retry Failed Notification (Admin Only)
- **Endpoint**: `POST /api/feedback/notifications/:id/retry`
- **Guard**: `requireAdmin` (`role === 'admin'`)
- **Behavior**: Resets outbox job `attempts: 0`, `status: 'pending'`, `nextRetryAt: now`.

---

## 8. Frontend Features & Design System

### Design Philosophy
The UI is built according to a custom SaaS design system:
- **Palette**: Deep Royal Indigo primary (`#4f46e5`, `#6366f1`) paired with electric violet gradient accents (`#8b5cf6` to `#d946ef`).
- **Aurora Mesh Glow**: Soft radial gradients behind the drawer header for depth without visual noise.
- **Distinct Category Accents**:
  - `bug`: Warm Coral / Rose (`#f43f5e`, `#fb7185`)
  - `ui_ux`: Electric Violet (`#8b5cf6`, `#c084fc`)
  - `feature_request`: Emerald / Mint (`#10b981`, `#34d399`)
  - `general`: Warm Amber (`#f59e0b`, `#fbbf24`)
  - `other`: Slate (`#64748b`, `#94a3b8`)
- **Micro-Interactions**:
  - Floating trigger hover lift and rotation.
  - Active category card animated selection ring and colored elevation.
  - Animated circular SVG character counter ring that turns rose when approaching limits.
  - Attachment preview cards with scale-in transitions and upload progress spinners.
  - Success screen with celebration checkmark badge.

### Accessibility (a11y) & Responsiveness
- **Focus Trap & Keyboard Controls**: `Esc` closes the drawer; visible focus rings on all interactive elements.
- **Screen Reader Support**: ARIA dialog roles (`role="dialog"`, `aria-modal="true"`, `role="radiogroup"`).
- **Responsive Layout**:
  - Desktop: Slides smoothly as a 500px right-hand side drawer.
  - Mobile (≤ 640px): Adapts seamlessly into an interactive bottom-sheet with a native pull handle.
- **Dark Mode**: Automatically respects OS preference (`prefers-color-scheme: dark`) and supports manual toggle (`data-theme="dark"`).

---

## 9. Security, Privacy & Idempotency

### Security Guarantees
1. **Secrets Isolation**: Secrets (`SUPABASE_SERVICE_ROLE_KEY`, `TEAMS_FEEDBACK_WEBHOOK_URL`, `JWT_SECRET`) reside strictly on the server and are never delivered to the client.
2. **Private Bucket**: Supabase bucket `feedback-attachments` is created with `public: false`. Files can only be accessed with short-lived HMAC-signed URLs generated server-side.
3. **Storage Key Integrity**: Users can only upload and reference files inside their own designated key path (`feedback/{orgId}/{userId}/...`).
4. **Content Sanitization**: All user descriptions are sanitized before being rendered into Microsoft Teams Adaptive Cards, preventing markdown/HTML injection.

### Privacy Guarantee
The `collectContext` utility gathers only high-level diagnostic data:
- `pageUrl`, `pageTitle`, `browser`, `os`, `screenResolution`, `viewport`, `environment`, `timezone`.
- **Zero Sensitive Data**: Form inputs, cookies, tokens, and passwords are never inspected, captured, or transmitted.
- **Visible Disclosure**: Users can expand the "Diagnostic metadata included" accordion on the form to view exactly what metadata is attached before clicking Submit.

### Idempotency
- When a user opens the feedback modal, a unique UUID is assigned.
- If network latency causes the user to retry submission, the identical `Idempotency-Key` is sent.
- The unique sparse index `{ userId: 1, idempotencyKey: 1 }` in MongoDB prevents duplicate submissions, and the API returns the original record with HTTP 200.

---

## 10. Environment Variables Reference

Create a `.env` file in the `backend/` directory using `backend/.env.example` as a template:

| Variable | Description | Example / Default |
|---|---|---|
| `NODE_ENV` | Runtime environment (`development`, `production`, `test`) | `development` |
| `PORT` | Backend HTTP listening port | `5000` |
| `FRONTEND_URL` | Frontend origin for CORS policy | `http://localhost:5173` |
| `JWT_SECRET` | Secret key for signing session tokens (min 32 chars) | `dumroo_secret_key_...` |
| `JWT_EXPIRES_IN` | Token validity duration | `7d` |
| `JWT_COOKIE_MAX_AGE_MS` | Max age for httpOnly cookie in milliseconds | `604800000` (7 days) |
| `MONGODB_URI` | MongoDB Atlas replica set URI or local replica set connection | `mongodb+srv://user:pass@cluster.mongodb.net/...` |
| `SUPABASE_URL` | Supabase project URL | `https://your-project.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service-role secret key (SERVER ONLY) | `eyJhbGciOi...` |
| `SUPABASE_STORAGE_BUCKET` | Private bucket name for feedback screenshots | `feedback-attachments` |
| `TEAMS_FEEDBACK_WEBHOOK_URL` | Power Automate / Workflows HTTP trigger webhook URL | `https://prod-00.westus.logic.azure.com/...` |
| `FEEDBACK_MAX_ATTACHMENTS` | Maximum screenshots permitted per report | `5` |
| `FEEDBACK_MAX_FILE_SIZE_MB` | Maximum size in MB per attachment | `5` |
| `FEEDBACK_DESCRIPTION_MIN_LENGTH` | Minimum required character count for description | `10` |
| `FEEDBACK_DESCRIPTION_MAX_LENGTH` | Maximum character count for description | `5000` |
| `FEEDBACK_SIGNED_URL_EXPIRES_SECONDS` | Lifetime for signed download links | `3600` (1 hour) |
| `FEEDBACK_UPLOAD_URL_EXPIRES_SECONDS` | Lifetime for signed upload links | `300` (5 minutes) |
| `FEEDBACK_ORPHAN_CLEANUP_GRACE_MINUTES` | Grace period before unattached uploads are cleaned up | `60` |
| `FEEDBACK_RATE_LIMIT_WINDOW_MS` | Rate limiting sliding window in ms | `900000` (15 min) |
| `FEEDBACK_RATE_LIMIT_MAX_REQUESTS` | Allowed requests per sliding window | `20` |

---

## 11. Setup Instructions: Supabase Private Bucket

1. Log in to [Supabase Dashboard](https://supabase.com/dashboard).
2. Open your project (or create a new free tier project).
3. In the left navigation, click **Storage**.
4. Click **New Bucket**:
   - Bucket Name: `feedback-attachments`
   - **Public Bucket**: Ensure this toggle is **OFF** (Private).
5. Go to **Project Settings** -> **API**:
   - Copy **Project URL** -> Set as `SUPABASE_URL` in `.env`.
   - Under *Project API keys*, find `service_role` (secret) -> Set as `SUPABASE_SERVICE_ROLE_KEY` in `.env`.
6. *Note*: Never expose the `service_role` key in frontend code or repository commits.

---

## 12. Setup Instructions: Microsoft Teams Workflow

To receive rich feedback cards in your Teams channel ("Product Support" > "Customer Feedback"):

1. Open **Microsoft Teams**.
2. Navigate to your target team (e.g. *Product Support*) and channel (e.g. *Customer Feedback*).
3. Click the three dots `...` next to the channel name and select **Workflows** (or search for Workflows in Teams apps).
4. Select the template: **"Post to a channel when a webhook request is received"** (Power Automate HTTP trigger).
5. Name the workflow: `Customer Feedback Receiver`.
6. Confirm the Team and Channel destination, then click **Create Flow**.
7. Power Automate will generate a unique HTTP POST URL:
   `https://prod-XX.westus.logic.azure.com/workflows/XXXXXXXX...`
8. Copy this URL and set it as `TEAMS_FEEDBACK_WEBHOOK_URL` in your `.env`.

---

## 13. Setup Instructions: MongoDB Atlas

MongoDB Atlas free tier (M0) provides a replica set out of the box, which is required for Mongoose multi-document transactions.

1. Go to [MongoDB Atlas](https://cloud.mongodb.com/).
2. Under **Security** -> **Network Access**:
   - Click **Add IP Address**.
   - For local development / testing, add `0.0.0.0/0` (Allow Access from Anywhere) or add your current public IP address.
3. Under **Security** -> **Database Access**:
   - Ensure you have a database user with `readWriteAnyDatabase` privileges.
4. Under **Database** -> **Connect** -> **Drivers**:
   - Copy the SRV connection string:
     ```text
     mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/feedback_system?retryWrites=true&w=majority
     ```
   - Set as `MONGODB_URI` in `backend/.env`.

---

## 14. Running the Application Locally

### Prerequisites
- Node.js >= 18.0.0 (Tested on Node.js v24.15)
- npm >= 9.0.0

### Step 1: Start the Backend API
```bash
cd backend
npm install
npm run dev
```
The backend starts on `http://localhost:5000` and automatically starts the background notification worker.

### Step 2: Start the Frontend Application
In a separate terminal window:
```bash
cd frontend
npm install
npm run dev
```
The frontend dev server starts on `http://localhost:5173`.

### Step 3: Test the App
1. Open `http://localhost:5173` in your browser.
2. On the login screen, click **Demo User** (`user@acme.com`) or **Demo Admin** (`admin@acme.com`).
3. You will land on the interactive Dashboard with the floating **Feedback** button in the bottom-right corner.
4. Click **Feedback**, choose a category, click **Capture Current Page**, add comments, and click **Submit Feedback**.
5. Navigate to **My Reports** in the navbar to view your submission and verify its status.

---

## 15. Testing & Quality Assurance

### Run Backend Unit & Integration Tests (Jest)
```bash
cd backend
npm test
```
**Test Coverage Includes (25 tests)**:
- Reference ID atomic sequential generation (`FB-YYYY-NNNNN`)
- Storage key ownership validation & boundary enforcement
- Teams Adaptive Card v1.4 builder and user text sanitization
- Exponential backoff retry logic and delays (`[0s, 30s, 2m, 10m, 30m]`)
- Health check API (`GET /api/health`)
- Upload URL validation, MIME inspection, and file size limits
- Feedback submission and atomic outbox creation
- Idempotency key deduplication (returns original report on retry)
- Access-controlled report listing and signed download URLs
- Admin status update authorization (`PATCH /api/feedback/:id/status`)

### Run Frontend Component Tests (Vitest)
```bash
cd frontend
npm test
```
**Test Coverage Includes (11 tests)**:
- `CategorySelector`: Category rendering, click selection, ARIA radio attributes
- `DescriptionField`: Text input, character counter, SVG progress ring, min-length warning
- `ContextDisclosure`: Accordion expansion, diagnostic metadata, privacy guarantee
- `FeedbackSuccess`: Reference ID display, copy-to-clipboard, completion action

### Production Frontend Build
```bash
cd frontend
npm run build
```
Generates an optimized, tree-shaken static bundle in `frontend/dist/`.

