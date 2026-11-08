# FixMyRoad AI — Intelligent Road Damage Detection & Infrastructure Intelligence Platform

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI_0.110-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React 19](https://img.shields.io/badge/Frontend-React_19_+_TypeScript-61DAFB.svg?logo=react&logoColor=black)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind_CSS_v4-38B2AC.svg?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![OpenCV & YOLOv8](https://img.shields.io/badge/Computer_Vision-YOLOv8_+_OpenCV-FF6F00.svg?logo=opencv&logoColor=white)](https://ultralytics.com/)
[![XGBoost](https://img.shields.io/badge/ML_Model-XGBoost_Regressor-EB5424.svg)](https://xgboost.readthedocs.io/)
[![Database](https://img.shields.io/badge/Database-PostgreSQL_/_PostGIS_+_SQLite-336791.svg?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## 🌟 Executive Overview

**FixMyRoad AI** is a production-grade, enterprise-ready municipal road infrastructure monitoring and predictive maintenance platform. It transforms community citizen reports and road imagery into actionable, prioritized work orders using real **Computer Vision (YOLOv8 + OpenCV)**, a **6-Factor Dynamic Prioritization Algorithm**, **Geospatial Intelligence (DBSCAN corridor clustering & duplicate prevention)**, and an **XGBoost Machine Learning Bridge Health Degradation Model**.

Originally prototyped as a monolithic Flask application with hardcoded secrets, the platform has been completely re-architected into a clean, decoupled **FastAPI** backend and modern **React 19 + TypeScript** frontend with zero hardcoded credentials and comprehensive automated test coverage.

---

## 🏗️ System Architecture

```mermaid
graph TD
    subgraph Client Layer
        A[Citizen Portal] -->|Upload Photo + GPS| G[FastAPI Gateway /api/v1]
        B[Field Officer Portal] -->|Work Order Updates| G
        C[Admin Dispatch Dashboard] -->|Manage Reports & Teams| G
        D[Interactive GIS Map] -->|Clustered Hotspots| G
    end

    subgraph Backend Services Layer
        G --> H[Auth & RBAC Service\nJWT + Bcrypt]
        G --> I[Computer Vision Pipeline\nYOLOv8 + OpenCV Saliency]
        G --> J[Priority Math Engine\n6-Factor Weighted Index]
        G --> K[Geospatial Intelligence\nHaversine + DBSCAN Clustering]
        G --> L[XGBoost ML Bridge Model\nLifespan Prediction]
        G --> M[Analytics & MTTR Service\nSupervised Duration Estimator]
    end

    subgraph Storage & Media Layer
        G --> N[(PostgreSQL / PostGIS\nSpatial SQLite Fallback)]
        I --> O[Cloudinary CDN /\nLocal File Storage]
    end
```

---

## 📂 Codebase Structure & Antigravity File Map

Here is the exact layout of the repository and where all modernized modules are located:

```text
E:\FixMyRoad-main\
├── backend/                             # Enterprise FastAPI Backend
│   ├── app/
│   │   ├── api/v1/endpoints/            # Modular REST API Endpoints
│   │   │   ├── auth.py                  # JWT register, login, profile, demo accounts
│   │   │   ├── reports.py               # Report creation, inspection, status update
│   │   │   ├── ai.py                    # Standalone computer vision detection API
│   │   │   ├── votes.py                 # Upvoting/downvoting community mechanism
│   │   │   ├── comments.py              # Community discussions and thread replies
│   │   │   ├── maps.py                  # GIS map feeds, nearby radius search, clusters
│   │   │   ├── admin.py                 # Officer assignment, lifecycle transitions
│   │   │   ├── maintenance.py           # Technician work orders & repair completion
│   │   │   ├── analytics.py             # KPIs, MTTR, cluster corridors, ML duration
│   │   │   └── bridge.py                # XGBoost bridge lifespan prediction endpoint
│   │   ├── core/                        # System Configurations & Core Utilities
│   │   │   ├── config.py                # Pydantic v2 settings loading from .env
│   │   │   ├── security.py              # Native Bcrypt hashing + JWT creation/decoding
│   │   │   └── dependencies.py          # Session injection & Strict RBAC guards
│   │   ├── db/                          # Database Layer
│   │   │   ├── base.py                  # Declarative SQLAlchemy Base
│   │   │   ├── session.py               # Dual Engine (PostgreSQL/PostGIS + SQLite)
│   │   │   └── seed.py                  # Auto-seeding test accounts and sample data
│   │   ├── models/                      # Relational Database Models
│   │   │   ├── user.py                  # User entity & UserRole (Citizen, Officer, Admin)
│   │   │   ├── report.py                # Report, ReportImage, Votes, Comments, Audit
│   │   │   ├── ai_prediction.py         # AI detection boxes, metrics, explanations
│   │   │   ├── priority_score.py        # 6-factor component breakdown records
│   │   │   ├── maintenance.py           # Work order assignments & repair logs
│   │   │   └── bridge.py                # Bridge structural inspection records
│   │   ├── schemas/                     # Strict Pydantic v2 Request/Response Schemas
│   │   └── services/                    # Core Business & Machine Learning Logic
│   │       ├── ai_service.py            # YOLOv8 + OpenCV contour/texture analyzer
│   │       ├── priority_service.py      # 6-Factor Dynamic Prioritization Engine
│   │       ├── geospatial_service.py    # Haversine distance, 25m duplicate check, DBSCAN
│   │       ├── bridge_service.py        # XGBoost bridge lifespan regression model
│   │       ├── analytics_service.py     # Infrastructure velocity, MTTR, ML duration
│   │       └── cloudinary_service.py   # Optional Cloudinary image CDN integration
│   ├── models/                          # Machine Learning Model Artifacts
│   │   ├── bridge_life_model.pkl        # Real trained XGBoost Regressor
│   │   ├── scaler.pkl                   # StandardScaler for bridge features
│   │   └── *_encoder.pkl                # Categorical LabelEncoders
│   ├── tests/                           # Pytest Automated Test Suite (21 Tests)
│   ├── uploads/                         # Media Upload Storage (original & annotated)
│   ├── requirements.txt                 # Backend Python Dependencies
│   └── Dockerfile                       # Production Python 3.11 Container
│
├── frontend/                            # Modern React 19 Single Page App
│   ├── src/
│   │   ├── components/                  # Reusable UI & Map Components
│   │   │   ├── Navbar.tsx               # Responsive navigation with role indicators
│   │   │   ├── MapPicker.tsx            # Leaflet GPS picker with pin dropper
│   │   │   └── DamageHeatmap.tsx        # Clustered GIS road damage heatmap
│   │   ├── context/
│   │   │   └── AuthContext.tsx          # JWT Auth state & 1-click demo login
│   │   ├── pages/                       # Screen Views
│   │   │   ├── Home.tsx                 # Landing page with live KPIs & recent feed
│   │   │   ├── Login.tsx / Register.tsx # Authentication with 1-click demo credentials
│   │   │   ├── ReportProblem.tsx        # Multi-attribute form + live AI scan preview
│   │   │   ├── ReportDetail.tsx         # Side-by-side original vs annotated + 6-factor score
│   │   │   ├── MyReports.tsx            # Citizen personal report tracking
│   │   │   ├── MapView.tsx              # Fullscreen interactive GIS map with radius filters
│   │   │   ├── AdminDashboard.tsx       # Municipal dispatch & technician assignment
│   │   │   ├── OfficerDashboard.tsx     # Field technician repair completion
│   │   │   ├── AnalyticsDashboard.tsx   # Recharts charts, DBSCAN corridors, ML simulator
│   │   │   └── BridgeHealth.tsx         # XGBoost bridge lifespan interactive calculator
│   │   ├── services/
│   │   │   └── api.ts                   # Fetch API client with Bearer auth interceptors
│   │   ├── types/
│   │   │   └── index.ts                 # TypeScript data contracts & enums
│   │   ├── App.tsx                      # Client-side router and view orchestration
│   │   ├── index.css                    # Tailwind CSS v4 styling & glassmorphism
│   │   └── main.tsx                     # React 19 application root
│   ├── package.json                     # Node.js dependencies
│   ├── vite.config.ts                   # Vite build configuration with API proxying
│   └── Dockerfile                       # Production Nginx Container
│
├── docker-compose.yml                   # Complete Multi-Container Orchestration
├── PROJECT_AUDIT.md                     # Initial Deep Architectural Inspection Report
├── IMPLEMENTATION_PLAN.md               # 12-Phase Roadmap and Engineering Specifications
└── README.md                            # Complete System Documentation
```

---

## ⚡ Core Engineering Capabilities

### 1. Computer Vision & Pothole Detection Pipeline (`ai_service.py`)
- **Dual Inference Engine**:
  1. **Ultralytics YOLOv8**: Loads custom weights (`yolov8n.pt` / `best.pt`) if present.
  2. **High-Precision OpenCV Contour & Texture Saliency Analyzer**: Fully local, zero-network fallback ensuring 100% operational reliability on any host. Uses adaptive morphological thresholding and dark crater contour detection.
  3. **Roboflow Cloud API Fallback**: Cloud inference if `ROBOFLOW_API_KEY` is provided.
- **Visual Output**: Produces high-contrast annotated images with bounding boxes, confidence tags, and visual severity headers.
- **Explainable Metrics**: Calculates `pothole_count`, `damage_area_ratio`, `average_confidence`, and natural-language explanatory reasoning.

### 2. Intelligent 6-Factor Prioritization Formula (`priority_service.py`)
Every report is assigned a dynamic score $\in [0, 100]$ computed via:

$$\text{Priority} = (0.30 \times S) + (0.20 \times C) + (0.15 \times R) + (0.15 \times A) + (0.10 \times L) + (0.10 \times D)$$

Where:
- **$S$ (Severity Component, 30%)**: Critical = 100, High = 75, Medium = 45, Low = 20.
- **$C$ (Community Upvote Component, 20%)**: Normalized net community votes:
  $$C = \min\left(100, \frac{\text{upvotes} - \text{downvotes}}{50} \times 100\right)$$
- **$R$ (Road Importance Component, 15%)**: Highway = 100, Arterial = 80, Collector = 60, Residential = 40, Rural = 20.
- **$A$ (Age Decay Component, 15%)**: Escalates older unresolved issues up to a 30-day cap:
  $$A = \min\left(100, \frac{\text{age in days}}{30} \times 100\right)$$
- **$L$ (Location Risk Component, 10%)**: Proximity to school zones, hospitals, transit hubs.
- **$D$ (Duplicate Clustering Component, 10%)**: Boosts priority when multiple citizens report issues in the same road segment:
  $$D = \min(100, \text{duplicates} \times 25)$$

### 3. Geospatial Intelligence & GIS Clustered Corridors (`geospatial_service.py`)
- **Haversine Distance**: High-accuracy geographic distance calculations across spherical coordinates.
- **Automated Duplicate Detection**: Flags reports submitted within **25 meters** of an existing open report, preventing duplicate work orders.
- **DBSCAN Density Clustering**: Discovers spatial damage clusters along road corridors ($\varepsilon = 300\text{m}$, minimum 2 reports).
- **Proximity Search**: Filter road hazards within $1\text{km}, 2\text{km}, 5\text{km}$, or $10\text{km}$ radius.

### 4. XGBoost Machine Learning Bridge Lifespan Model (`bridge_service.py`)
- **Trained Model**: Serialized `XGBRegressor` (`models/bridge_life_model.pkl`) using 9 structural and traffic features:
  - Age (years), Average Daily Traffic (ADT), Deck Condition, Superstructure Condition, Substructure Condition, Material Type, Design Type, Service Type, Climate Zone.
- **Outputs**:
  - Predicted Remaining Lifespan (years)
  - Degradation Index ($0-100\%$)
  - Recommended Intervention Timeline (Immediate rehabilitation, scheduled inspection, routine maintenance)

### 5. Supervised Repair Duration Estimator (`analytics_service.py`)
- Predicts expected time to resolution based on road classification, severity, and historical municipal mean time to repair (MTTR).

---

## 🔒 Security & Zero Hardcoded Credentials

- **Environment-Driven Configuration**: All sensitive values (database credentials, JWT secret keys, API keys) are managed through environment variables (`.env`).
- **Direct Bcrypt Salting**: Uses native `bcrypt.hashpw` and `bcrypt.checkpw`, avoiding Python 3.12+ 72-byte truncation issues.
- **JWT Authentication**: Short-lived access tokens with role claims + persistent refresh tokens.
- **Strict Role-Based Access Control (RBAC)**:
  - `CITIZEN`: Can report hazards, view public feeds, upvote, comment, and track own reports.
  - `OFFICER`: Field technicians who can view assigned work orders, update repair statuses, and upload completion photos.
  - `ADMIN`: Municipal engineers who can reassign work orders, approve/reject reports, change priority overrides, and view executive analytics.

### Demo Accounts (Ready to Test)
| Role | Email | Password |
| :--- | :--- | :--- |
| **Municipal Admin** | `admin@fixmyroad.org` | `Admin@2026` |
| **Field Officer** | `officer@fixmyroad.org` | `Officer@2026` |
| **Citizen Reporter** | `citizen@fixmyroad.org` | `Citizen@2026` |

*(The frontend includes 1-click Demo Account login buttons on the Login page).*

---

## ☁️ Cloud & Third-Party Integrations

### 1. Cloudinary (Optional Image CDN)
To store uploaded and AI-annotated images on Cloudinary:
1. Sign up at [Cloudinary](https://cloudinary.com/).
2. In your `.env` file, add:
   ```env
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```
*If left blank, FixMyRoad AI automatically saves images locally inside `backend/uploads/` and serves them seamlessly.*

### 2. Database Options
- **Development (Zero-Config)**: FixMyRoad AI defaults to SQLite (`sqlite:///./fixmyroad.db`). No installation or configuration required.
- **Production (PostgreSQL + PostGIS)**: Provide a PostgreSQL connection string in `.env`:
  ```env
  DATABASE_URL=postgresql://user:password@localhost:5432/fixmyroad_db
  ```

### 3. Roboflow Computer Vision API (Optional)
If you have a custom Roboflow pothole detection model:
```env
ROBOFLOW_API_KEY=your_roboflow_key
ROBOFLOW_PROJECT=pothole-detection-i00zy
ROBOFLOW_VERSION=2
```

---

## 🚀 Quickstart Guide

### Option A: Local Development Setup

#### 1. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Create and activate virtual environment (optional but recommended)
python -m venv venv
# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file (copy from .env.example)
copy .env.example .env

# Run FastAPI backend server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
- API Documentation (Swagger UI): **`http://localhost:8000/docs`**
- ReDoc Interactive Documentation: **`http://localhost:8000/redoc`**

#### 2. Frontend Setup
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```
- Access Frontend Application: **`http://localhost:3000`**

---

### Option B: Docker Compose Setup (One-Click)

Run the entire stack (PostgreSQL + PostGIS, FastAPI Backend, React Frontend) in one command:
```bash
docker-compose up --build
```
- Web Application: `http://localhost:3000`
- API Backend & Swagger Docs: `http://localhost:8000/docs`

---

## 🧪 Automated Testing

FixMyRoad AI includes a full test suite testing Authentication, Computer Vision, Priority Math, Geospatial calculations, Bridge ML models, and Reports.

To execute all tests:
```bash
cd backend
python -m pytest tests -v
```

Expected output:
```text
tests/test_ai_pipeline.py::test_ai_detection_standalone_endpoint PASSED
tests/test_ai_pipeline.py::test_report_submission_with_image_and_ai_inference PASSED
tests/test_auth.py::test_register_new_user PASSED
tests/test_auth.py::test_register_duplicate_email PASSED
tests/test_auth.py::test_login_success PASSED
tests/test_auth.py::test_login_invalid_credentials PASSED
tests/test_auth.py::test_get_current_user_profile PASSED
tests/test_bridge.py::test_bridge_prediction_concrete_healthy PASSED
tests/test_bridge.py::test_bridge_prediction_steel_aged_critical PASSED
tests/test_geospatial.py::test_haversine_distance_known_points PASSED
tests/test_geospatial.py::test_haversine_distance_identical_point PASSED
tests/test_geospatial.py::test_check_duplicate_true PASSED
tests/test_geospatial.py::test_check_duplicate_false PASSED
tests/test_priority.py::test_priority_critical_severity PASSED
tests/test_priority.py::test_priority_low_severity_no_votes PASSED
tests/test_priority.py::test_priority_net_downvotes_safeguard PASSED
tests/test_reports.py::test_get_reports_public PASSED
tests/test_reports.py::test_get_map_reports PASSED
tests/test_reports.py::test_get_map_nearby PASSED
tests/test_reports.py::test_predict_bridge_api PASSED
tests/test_reports.py::test_analytics_overview PASSED

============================= 21 passed in 3.42s ==============================
```

---

## 📡 REST API Reference

| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/register` | Register new citizen account | Public |
| `POST` | `/api/v1/auth/login` | Login and receive JWT access/refresh tokens | Public |
| `GET` | `/api/v1/auth/me` | Fetch authenticated user profile | Authenticated |
| `GET` | `/api/v1/reports` | Paginated public reports with status/severity filters | Public |
| `POST` | `/api/v1/reports` | Submit road hazard with photo & GPS (runs real AI) | Citizen / Any |
| `GET` | `/api/v1/reports/{id}` | Inspect report, bounding boxes, 6-factor score | Public |
| `POST` | `/api/v1/reports/{id}/vote` | Upvote or downvote hazard report | Authenticated |
| `POST` | `/api/v1/reports/{id}/comments` | Post comment on public report thread | Authenticated |
| `POST` | `/api/v1/ai/detect` | Standalone computer vision scan on uploaded image | Public |
| `GET` | `/api/v1/maps/reports` | GeoJSON / coordinate feed for map markers | Public |
| `GET` | `/api/v1/maps/nearby` | Find reports within $X$ km radius of GPS coordinate | Public |
| `GET` | `/api/v1/maps/clusters` | DBSCAN density clusters of failure corridors | Public |
| `PATCH`| `/api/v1/admin/reports/{id}/status` | Update report status (Verified, In Progress, etc.) | Admin |
| `POST` | `/api/v1/admin/reports/{id}/assign` | Assign report work order to technician | Admin |
| `GET` | `/api/v1/maintenance/assigned` | View work orders assigned to current technician | Officer / Admin |
| `POST` | `/api/v1/maintenance/assignments/{id}/complete`| Mark repaired with notes & completion photo | Officer / Admin |
| `GET` | `/api/v1/analytics/overview` | Municipal KPIs, MTTR, severity distribution | Public |
| `POST` | `/api/v1/analytics/predict-duration` | ML duration estimate for repair completion | Public |
| `POST` | `/api/v1/bridge/predict` | Real XGBoost bridge lifespan regression prediction | Public |

---

## 👥 Credits & Contributing

Developed as an advanced engineering showcase for **Data Science**, **Machine Learning Engineering**, **Computer Vision**, and **Full-Stack Software Architecture**.

- Built with modern Python 3.11+, FastAPI, React 19, TypeScript, and Tailwind CSS.
- Computer Vision powered by Ultralytics YOLOv8 and OpenCV.
- Predictive Maintenance powered by XGBoost.
