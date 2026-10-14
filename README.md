# Smart Cloud Storage AI
### Full-Stack Intelligent Cloud Storage Platform with AI Classification & Semantic Search

Smart Cloud Storage AI connects an enterprise-grade web application to a high-performance **Python FastAPI** backend, **MongoDB** database, and dual-mode **Cloud / Local Object Storage Vault**. It features automated document text extraction, **Scikit-learn** machine learning classification, 384-dimensional **Sentence-Transformers** dense vector semantic search, and **SHA-256 cryptographic deduplication**.

---

## 🌟 Architecture & Features

```
┌─────────────────────────────────────────────────────────────┐
│    Frontend: React 19 + TanStack Start + Tailwind CSS v4    │
│    (Framer Motion animations, Lucide icons, Recharts)       │
└──────────────────────────────┬──────────────────────────────┘
                               │ REST / JSON (JWT Bearer)
┌──────────────────────────────▼──────────────────────────────┐
│                  FastAPI Application Server                 │
├──────────────────────────────┬──────────────────────────────┤
│  AI Engine:                  │  Storage & Data Engine:      │
│  - PyMuPDF, docx, openpyxl   │  - MongoDB (Users, Files,    │
│  - Scikit-Learn TF-IDF NB    │    Activities, Settings)     │
│  - all-MiniLM-L6-v2 Vectors  │  - Local Vault / AWS S3      │
│  - Cosine Distance Search    │  - SHA-256 Hash Deduplication│
└──────────────────────────────┴──────────────────────────────┘
```

1. **Intelligent Multi-Format Ingestion**: Ingests PDF, DOCX, XLSX, images, code, audio, and archives. Extracts text with PyMuPDF, python-docx, and openpyxl.
2. **Scikit-Learn Document Classification**: Categorizes files into `Educational`, `Business`, `Reports`, `Documents`, `Images`, and `Others` with calibrated confidence scoring.
3. **Dense Vector Semantic Search**: Natural language query search using `all-MiniLM-L6-v2` dense embeddings ($S_C(A,B) = \frac{A \cdot B}{\|A\|\|B\|}$) with keyword fallback.
4. **Similar Files Recommendation Graph**: Dynamic affinity network mapping document relationships by vector distance and domain taxonomy.
5. **SHA-256 Deduplication**: Identifies identical file fingerprints before storage and groups similarly named documents, calculating recoverable storage without automatic deletion.
6. **Live Dashboard & Analytics**: Aggregates MongoDB file volumes, category distribution, mime types, and monthly upload activity.
7. **Per-User Isolation & JWT Security**: Bcrypt password hashing, JWT access tokens, and strict per-user authorization on every private endpoint.

---

## 🚀 Quick Start Guide (Windows PowerShell)

### Prerequisites
- Python 3.10+ (Python 3.12 verified)
- Node.js 20+ or Bun 1.4+
- MongoDB Community Server (Running on `localhost:27017`)

---

### Step 1: Clone / Navigate to Workspace
```powershell
cd "C:\Users\veera\.gemini\antigravity\scratch\smart-cloud-storage-ai"
```

---

### Step 2: Configure Environment Variables
Copy `.env.example` in `backend/`:
```powershell
cd backend
Copy-Item .env.example .env
```

Default `.env` values work out-of-the-box for local development:
```env
HOST=127.0.0.1
PORT=8000
MONGODB_URI=mongodb://127.0.0.1:27017
DATABASE_NAME=smart_cloud_storage
JWT_SECRET=super-secret-jwt-key-scs-ai-local-dev-2026-antigravity
STORAGE_BACKEND=local
LOCAL_STORAGE_DIR=storage_vault
STORAGE_QUOTA_BYTES=107374182400
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:3000
```

---

### Step 3: Install Backend Dependencies & Seed Sample Data
```powershell
# Inside backend directory:
python -m pip install -r requirements.txt

# Seed initial documents, embeddings, demo account, and activity
python seed_data.py
```

Default Demo Credentials:
- **Email:** `demo@antigravity.ai`
- **Password:** `Demo123!`

---

### Step 4: Start FastAPI Backend Server
```powershell
# Inside backend directory:
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
- Interactive Swagger UI: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- Health Check: [http://127.0.0.1:8000/api/health](http://127.0.0.1:8000/api/health)

---

### Step 5: Install Frontend Dependencies & Start Frontend
Open a new PowerShell terminal:
```powershell
cd "C:\Users\veera\.gemini\antigravity\scratch\smart-cloud-storage-ai"

# Install dependencies (using Bun or npm)
bun install
# or: npm install

# Start development server
bun dev
# or: npm run dev
```
The application will be live at: [http://localhost:5173/](http://localhost:5173/) or [http://localhost:3000/](http://localhost:3000/).

---

## 🧪 Testing and Verification

### Backend Automated Test Suite (Pytest)
Run the 13 backend unit and API integration tests:
```powershell
cd backend
python -m pytest tests/test_api.py -v
```
Verified Test Suite:
- `test_health`: API diagnostics and storage backend status
- `test_auth_login_demo`: JWT authentication and credential validation
- `test_auth_register_and_isolation`: User registration and strict file access isolation
- `test_dashboard_data`: Live MongoDB aggregation of metrics, quotas, and recent uploads
- `test_files_listing_and_filtering`: Category, search, and favorite filtering
- `test_file_upload_and_lifecycle`: Ingestion, text extraction, binary download, rename, and deletion
- `test_duplicate_detection`: SHA-256 fingerprint matching and recoverable storage calculation
- `test_semantic_search`: Dense vector cosine similarity querying
- `test_similar_files`: Multi-factor affinity recommendations
- `test_analytics_data`: Storage breakdown, kind distribution, and upload history
- `test_settings_persistence`: User preference storage and updates
- `test_ai_classifier_unit`: Scikit-learn TF-IDF Naive Bayes model predictions
- `test_text_extractor_unit`: Document parsing and string extraction

### Frontend Route Verification (Vitest)
```powershell
bun run test
# or: npm run test
```

### Production Build
```powershell
bun run build
# or: npm run build
```

---

## ☁️ Amazon S3 Storage Configuration (Optional)
To switch from local vault storage to AWS S3:
1. Open `backend/.env`.
2. Configure:
   ```env
   STORAGE_BACKEND=s3
   AWS_ACCESS_KEY_ID=AKIAEXAMPLE123456789
   AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
   AWS_REGION=us-east-1
   S3_BUCKET_NAME=my-smart-cloud-storage-bucket
   ```
3. Restart the backend server. The storage adapter will automatically route binary uploads and downloads to your private S3 bucket.

---

## 📁 Repository Layout
```
smart-cloud-storage-ai/
├── backend/
│   ├── app/
│   │   ├── ai/
│   │   │   ├── classifier.py      # Scikit-learn TF-IDF classifier
│   │   │   ├── embeddings.py      # all-MiniLM-L6-v2 vector engine
│   │   │   └── extractor.py       # PyMuPDF, docx, openpyxl extractor
│   │   ├── routes/
│   │   │   ├── activity_routes.py # Audit trail endpoints
│   │   │   ├── analytics_routes.py# Storage and timeline metrics
│   │   │   ├── auth_routes.py     # JWT login and registration
│   │   │   ├── dashboard_routes.py# High-level overview metrics
│   │   │   ├── duplicate_routes.py# Fingerprint deduplication
│   │   │   ├── file_routes.py     # Ingest, stream download, rename, delete
│   │   │   ├── health_routes.py   # Diagnostics check
│   │   │   ├── search_routes.py   # Semantic document query
│   │   │   ├── settings_routes.py # Preferences persistence
│   │   │   └── similar_routes.py  # Affinity recommendations
│   │   ├── auth.py                # Bcrypt & JWT verification
│   │   ├── config.py              # Environment configuration
│   │   ├── database.py            # MongoDB connection & indexes
│   │   ├── main.py                # FastAPI entry & CORS
│   │   └── storage.py             # S3 & Local Vault adapter
│   ├── tests/
│   │   └── test_api.py            # Automated pytest suite
│   ├── requirements.txt           # Python dependencies
│   ├── seed_data.py               # Database seeder
│   ├── .env.example               # Template environment variables
│   └── .env                       # Local environment variables
├── src/
│   ├── components/app/
│   │   ├── AppShell.tsx           # Navigation sidebar & header
│   │   ├── HeroHands.tsx          # Procedural convergence visual
│   │   ├── Intro.tsx              # Opening modal
│   │   └── kit.tsx                # Reusable glass, button, icon UI kit
│   ├── lib/
│   │   ├── api.ts                 # Typed REST API client
│   │   ├── demo-store.tsx         # Reactive state synchronized with backend
│   │   └── mock-data.ts           # Types & fallback fixtures
│   └── routes/
│       ├── __root.tsx             # Root layout with QueryClient
│       ├── index.tsx              # Dashboard (Live DB)
│       ├── files.tsx              # My Files (Browse, Download, Delete)
│       ├── upload.tsx             # Smart Upload (Live multipart ingest)
│       ├── search.tsx             # Semantic Search (Dense vector queries)
│       ├── classify.tsx           # AI Classification (Scikit-learn)
│       ├── similar.tsx            # Similar Files (Vector graph)
│       ├── duplicates.tsx         # Duplicates (SHA-256 Radar)
│       ├── analytics.tsx          # Storage Analytics (Recharts)
│       ├── activity.tsx           # Recent Activity timeline
│       └── settings.tsx           # User preferences
├── package.json
├── vite.config.ts
└── README.md
```
