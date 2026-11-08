# PROJECT AUDIT: FixMyRoad AI
**Intelligent Road Infrastructure Monitoring & Predictive Maintenance Platform**

**Audit Date:** November 8, 2026  
**Auditor:** Senior Multidisciplinary Engineering Team (Full-Stack Architect, ML/CV Engineer, Data Scientist, Security Engineer, Database Architect)  
**Repository Inspected:** `E:\FixMyRoad-main`

---

## 1. Executive Summary

A comprehensive repository audit was conducted on the existing `FixMyRoad` codebase. The initial project is a prototype built on Python/Flask with MongoDB Atlas and Roboflow cloud API integration. 

While the concept demonstrates strong market relevance and initial prototyping effort (including an existing scikit-learn bridge lifespan model), the existing codebase has critical architectural, security, reliability, and functional gaps that prevent it from being a production-grade, resume-worthy platform.

### Summary Assessment Matrix

| Dimension | Current State | Target State | Severity |
| :--- | :--- | :--- | :--- |
| **Backend Architecture** | Monolithic single-file Flask (`app.py`, 601 lines) | Clean modular FastAPI with Pydantic v2, SQLAlchemy ORM, Alembic migrations | High |
| **Database** | MongoDB Atlas with plain JSON documents, hardcoded credentials | Normalized PostgreSQL + PostGIS spatial tables (with zero-config SQLite fallback) | Critical |
| **Security & Auth** | Hardcoded admin credentials (`admin@gmail.com` / `12345678`), hardcoded DB URI, Flask session cookies | JWT Access + Refresh tokens, bcrypt/argon2 hashing, RBAC (Citizen, Admin, Officer), Audit logging | Critical |
| **AI / CV Model** | 100% dependent on external Roboflow cloud API; no local model inference; raw predictions not visually annotated | Dual-engine: Local Ultralytics YOLOv8 inference + Roboflow fallback; annotated image generation; explainable visual severity | High |
| **Prioritization Engine** | Simplistic heuristic: `10*count + 3*area + 5*up - 5*down` | Normalized multi-factor explainable scoring engine (Severity, Community, Road tier, Age, Location Risk, Duplicates) | Medium |
| **Geospatial Intelligence** | Basic JS Leaflet map with manual lat/lng markers; O(N) client-side distance loop | PostGIS spatial queries, server-side DBSCAN clustering, heatmap density generation, radius search | High |
| **Data Science & Analytics** | Static cards with hardcoded count queries; no predictive analytics | Real-time analytics dashboard, time-series trend forecasting, repair resolution prediction ML model | High |
| **Bridge Health Module** | Working scikit-learn Random Forest model (`models/bridge_life_model.pkl`) | Preserved & upgraded into an experimental infrastructure health dashboard with uncertainty & feature importance | Low |
| **Frontend** | Jinja2 templates with Bootstrap 5, heavy global CSS | Next.js with App Router, TypeScript, Tailwind CSS, Lucide icons, Leaflet/MapLibre, Recharts | High |

---

## 2. Inventory of Existing Assets

### 2.1 File Structure
```
FixMyRoad-main/
├── app.py                       # 601 lines monolithic Flask backend
├── requirements.txt             # 46 unpinned/mixed Python dependencies
├── README.md                    # Project overview & basic instructions
├── assets/                      # Miscellaneous assets (.DS_Store)
├── models/                      # Pickled ML artifacts (Real working models)
│   ├── bridge_life_model.pkl
│   ├── cracks_detected_encoder.pkl
│   ├── environmental_conditions_encoder.pkl
│   ├── maintenance_level_encoder.pkl
│   ├── material_encoder.pkl
│   └── scaler.pkl
├── static/
│   ├── css/                     # 8 custom CSS files (base, bridge, header, login, main, style)
│   ├── images/                  # 100+ sample road damage images from previous tests
│   └── vendor/                  # Bootstrap 5, Swiper, GLightbox, AOS, Isotope, PureCounter
└── templates/                   # 11 Jinja2 HTML templates
    ├── home.html
    ├── file_complaint.html
    ├── view_complaints.html
    ├── your_complaint_status.html
    ├── predict_bridge.html
    ├── view_on_map.html
    ├── admin_home.html
    ├── admin_resolved.html
    ├── login.html
    ├── register.html
    └── Report.html (0 bytes - empty placeholder)
```

---

## 3. Feature-by-Feature Detailed Audit

### 3.1 Authentication & Authorization
- **Existing Implementation:**
  - Standard Flask session dictionary (`session['user']`, `session['is_admin']`).
  - Passwords hashed using `Flask-Bcrypt`.
- **Identified Problems:**
  - **Critical Security Flaw:** Hardcoded admin bypass in `app.py`:
    ```python
    if email == "admin@gmail.com" and password == "12345678":
        session['user'] = email
        session['is_admin'] = True
    ```
  - Flask `secret_key` is hardcoded to `'your_secret_key'`.
  - No JWT support, no refresh token mechanism, no API token validation for modern SPAs.
  - No role abstraction: roles are boolean flags (`is_admin: True/False`). Maintenance officers or field technicians do not exist in the authorization model.
  - No session expiry, no password reset flow, no email verification.

### 3.2 Database & Data Persistence
- **Existing Implementation:**
  - MongoDB Atlas via `pymongo.MongoClient`.
- **Identified Problems:**
  - **Exposed Secret:** Hardcoded connection string directly in source code:
    `mongodb+srv://anuj:anuj123@cluster0.qhhfsfp.mongodb.net/porthole_app?retryWrites=true&w=majority&appName=Cluster0`
  - When connection to MongoDB Atlas drops or credentials expire, the entire backend crashes on startup.
  - No schema enforcement or migration framework (Alembic/Mongoose).
  - Deletions are hard deletes: approving or resolving a complaint moves it between collections and deletes the original record (`complaints_collection.delete_one`), losing history and audit trails.
  - Upvote/Downvote lists store raw user email strings in arrays (`upvoted_by`, `downvoted_by`) without indexes, which degrades linearly ($O(N)$) as votes scale.

### 3.3 AI-Powered Pothole Detection & Computer Vision
- **Existing Implementation:**
  - Uses Roboflow REST API via Python SDK:
    ```python
    rf = Roboflow(api_key="ZYZiqRfxocCQlUyr6YW9")
    project = rf.workspace().project("pothole-detection-i00zy")
    model = project.version(2).model
    ```
- **Identified Problems:**
  - Hardcoded Roboflow API key in code.
  - **Zero offline capability:** If the user has no internet access, or the Roboflow monthly inference quota is exceeded, or the API key is revoked, image uploads fail completely.
  - **No Annotated Image Generation:** Although `supervision` is imported, the backend never draws bounding boxes onto the image or saves the annotated output! The user cannot see where the AI detected the pothole.
  - **No Explainable AI:** Returns only count and normalized area; provides no explanation of how confidence thresholds, pothole clusters, or road surface conditions influenced the decision.
  - **Brittle Image Format Handling:** Fails with silent 500 error if OpenCV fails to read modern phone images (HEIC/AVIF/WebP) or if image dimensions are irregular.

### 3.4 Damage Severity & Priority Scoring
- **Existing Implementation:**
  - Priority formula:
    `priority = 10 * pothole_count + 3 * normalized_area + 5 * upvotes - 5 * downvotes`
  - Map severity mapping:
    `if priority > 100: "severe" elif priority > 50: "medium" else: "low"`
- **Identified Problems:**
  - Dimensional inconsistency: `pothole_count` is an integer ($1, 2, 5\dots$), while `normalized_area` is a tiny fraction between $0.001$ and $0.2$. Multiplying by 3 means area contributes less than $0.6$ points, making the count and votes completely dominate the score.
  - Negative priority vulnerability: Downvotes can drive priority negative (`-5 * downvotes`), breaking sorting and priority thresholds.
  - Community manipulation: Votes alone can inflate low-severity potholes to "high priority" without road classification or safety risk weighting.
  - Missing factors: Report age, road class (Highway vs Residential), proximity to critical infrastructure (schools, hospitals), and duplicate detection are ignored.

### 3.5 Interactive Map & Geospatial Features
- **Existing Implementation:**
  - Single HTML page with Leaflet.js (`templates/view_on_map.html`).
  - Coordinates stored as loose strings in MongoDB.
- **Identified Problems:**
  - In `app.py`, duplicate detection does an in-memory loop over ALL complaints in the database:
    ```python
    existing_complaints = list(complaints_collection.find())
    for complaint in existing_complaints:
        distance = calculate_distance(latitude, longitude, ...)
    ```
    This is an $O(N)$ unindexed sequential scan in Python! With 5,000 complaints, this will time out the HTTP request.
  - No PostGIS spatial indexing (`ST_DWithin`, `ST_Point`).
  - No spatial clustering (DBSCAN) to identify recurring road failure corridors or cluster hotspots.
  - Heatmap is purely client-side rendering with no density quantification.

### 3.6 Citizen Reporting & Tracking Workflow
- **Existing Implementation:**
  - HTML form with single file upload, HTML5 geolocation button, and Leaflet pin dropper.
- **Identified Problems:**
  - Single image only; multiple angles or context shots not supported.
  - If AI detection returns 0 potholes, the report is rejected outright with an error rather than submitted as "Unverified / Pending Manual Review", frustrating citizens with subtle road cracks.
  - Report status tracking is a basic list without step progression, audit timestamps, or maintenance progress.

### 3.7 Administrator & Maintenance Officer Workflow
- **Existing Implementation:**
  - Basic table with three action buttons: Approve, Reject, Resolve.
- **Identified Problems:**
  - No assignment workflow: admins cannot assign a report to a contractor, public works department, or field officer.
  - No resolution evidence: when resolved, no repair completion photos, repair cost, materials used, or completion notes are recorded.
  - Rejecting simply deletes the complaint (`complaints_collection.delete_one`) without recording the rejection reason or notifying the citizen.

### 3.8 Data Science, Analytics & Predictive Maintenance
- **Existing Implementation:**
  - Only 4 basic counters in `admin_home.html`: Total Users, Verified, Approved, Resolved.
- **Identified Problems:**
  - Zero analytics on repair latency, recurring failure spots, road wear trends, or budget allocation.
  - No machine learning predictive models for road maintenance (e.g. predicting repair completion time or identifying high-risk cluster zones).

### 3.9 Bridge Health Analysis Module
- **Existing Implementation:**
  - Real trained model files found in `models/`:
    `bridge_life_model.pkl` (Random Forest), `scaler.pkl`, and 4 LabelEncoders.
  - Web form allows inputs: Age, Material, Span Length, Traffic Load, Maintenance Level, Environmental Conditions, Cracks Detected, Corrosion Level.
- **Identified Assessment:**
  - This is a genuine ML model with pickle weights. It works when scikit-learn and joblib are loaded.
  - Needs proper documentation, input validation via Pydantic, risk level classification, and an explainable disclaimer stating it is a decision-support prototype.

---

## 4. Key Engineering Deficiencies to Remediate

1. **Security Vulnerabilities:** Eliminate all hardcoded passwords, API keys, and connection strings; implement environment variable injection (`.env`), JWT authentication, and fine-grained RBAC.
2. **Offline-Ready AI Inference:** Implement local YOLOv8 inference with pretrained road damage weights so inference succeeds on CPU/GPU without cloud dependence, while maintaining Roboflow as an optional fallback.
3. **Robust Database Layer:** Transition from unstructured MongoDB to a normalized PostgreSQL schema with PostGIS spatial indexing (with zero-configuration SQLite/Spatial fallback for local developers without active PostgreSQL instances).
4. **Transparent Explainable Prioritization:** Replace the raw formula with a normalized, multi-factor scoring engine with explainable component breakdowns.
5. **Modern Professional Interface:** Build a high-performance Next.js application with TypeScript, Tailwind CSS, Lucide icons, responsive interactive maps, real-time analytics, and clean dashboards for Citizens, Officers, and Admins.
6. **Data Science Suite:** Implement DBSCAN clustering for road damage hotspots, resolution time prediction using supervised regression, and exploratory analytics.
7. **Production DevOps:** Provide Docker Compose orchestrating Frontend, Backend, PostgreSQL/PostGIS, Redis, unit tests, and comprehensive documentation.

---

## 5. Audit Conclusion

The FixMyRoad project possesses a solid conceptual foundation and valuable existing assets (bridge health ML model, existing road images, clear problem domain). By redesigning the backend around FastAPI, creating a normalized geospatial database layer, integrating local YOLOv8 inference with explainable severity scoring, and providing a modern Next.js interface with full role-based workflows, the platform will be elevated into a top-tier showcase project for AI and Data Science engineering.
