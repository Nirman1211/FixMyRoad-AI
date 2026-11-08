# IMPLEMENTATION PLAN: FixMyRoad AI
**Intelligent Road Infrastructure Monitoring & Predictive Maintenance Platform**

**Author:** Multidisciplinary Engineering Team  
**Status:** Approved for Execution  
**Target Architecture:** FastAPI (Python 3.11+) + PostgreSQL/PostGIS (with SQLite fallback) + Next.js App Router (TypeScript, Tailwind, Leaflet, Recharts) + Ultralytics YOLOv8 + Scikit-Learn

---

## 1. System Architecture Overview

```
                      ┌──────────────────────────────────────────────┐
                      │      Next.js 14+ Frontend (Port 3000)       │
                      │   TypeScript • Tailwind CSS • shadcn/ui      │
                      │       Leaflet Maps • Recharts Charts        │
                      └──────────────────────┬───────────────────────┘
                                             │ REST APIs (JSON / JWT)
                                             ▼
                      ┌──────────────────────────────────────────────┐
                      │         FastAPI Backend (Port 8000)          │
                      │   Pydantic v2 • SQLAlchemy 2.0 • Alembic     │
                      │     Argon2 / Bcrypt • OpenAPI Swagger        │
                      ├──────────────────────┬───────────────────────┤
                      │                      │                       │
                      ▼                      ▼                       ▼
           ┌────────────────────┐ ┌────────────────────┐ ┌────────────────────┐
           │ AI / CV Pipeline   │ │ Prioritization     │ │ Geospatial & DS    │
           │ • YOLOv8 Local Inf │ │ • Multi-factor     │ │ • DBSCAN Cluster   │
           │ • Roboflow API Fall│ │ • Explainable Wt   │ │ • Heatmap Density  │
           │ • Visual Severity  │ │ • Component Scores │ │ • Resolution Pred  │
           │ • Annotated BBoxes │ │ • Audit Log        │ │ • PostGIS / Spatial│
           └────────────────────┘ └────────────────────┘ └────────────────────┘
                      │                      │                       │
                      └──────────────────────┼───────────────────────┘
                                             │
                                             ▼
                      ┌──────────────────────────────────────────────┐
                      │    PostgreSQL 16 + PostGIS Extension         │
                      │  (Zero-config SQLite/Spatial for Local Dev)  │
                      └──────────────────────────────────────────────┘
```

---

## 2. Phase-by-Phase Roadmap

### PHASE 1: Repository Audit & Architecture Planning (Completed)
- Audit existing Flask monolithic implementation, MongoDB Atlas dependencies, and pickled ML models.
- Document vulnerabilities, performance bottlenecks, and architectural limitations in `PROJECT_AUDIT.md`.
- Formulate comprehensive engineering specification in `IMPLEMENTATION_PLAN.md`.

---

### PHASE 2: Database Design, Schema Modeling & Migrations
- Design normalized relational schema using SQLAlchemy 2.0 Declarative Base:
  1. `users`: ID, email, password_hash, first_name, last_name, role (`citizen`, `officer`, `admin`), phone, is_active, created_at.
  2. `reports`: ID, report_code (e.g. `FMR-2026-0012`), user_id, title, description, road_name, landmark, latitude, longitude, geom (Point), status (`SUBMITTED`, `AI_PROCESSED`, `PENDING_REVIEW`, `VERIFIED`, `ASSIGNED`, `IN_PROGRESS`, `RESOLVED`, `REJECTED`), severity (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`), priority_score (float), upvotes_count, downvotes_count, created_at, updated_at.
  3. `report_images`: ID, report_id, original_url, annotated_url, width, height, is_primary, created_at.
  4. `ai_predictions`: ID, report_id, model_name, model_version, pothole_count, total_damage_area_ratio, average_confidence, bounding_boxes_json, visual_severity_label, explanation_text, inference_time_ms, created_at.
  5. `priority_scores`: ID, report_id, total_score, severity_component, community_component, road_importance_component, age_component, location_risk_component, duplicate_component, weights_version, calculated_at.
  6. `report_votes`: ID, report_id, user_id, vote_type (`UP`, `DOWN`), created_at (Unique constraint on `report_id, user_id`).
  7. `report_comments`: ID, report_id, user_id, comment_text, created_at.
  8. `report_status_history`: ID, report_id, previous_status, new_status, changed_by_user_id, notes, created_at.
  9. `maintenance_assignments`: ID, report_id, officer_user_id, assigned_by_user_id, assigned_at, status (`ASSIGNED`, `IN_PROGRESS`, `COMPLETED`), deadline, notes.
  10. `repair_records`: ID, assignment_id, report_id, repair_notes, completion_image_url, materials_used, cost_estimate, completed_at.
  11. `bridge_records`: ID, age, material, span_length, traffic_load, maintenance_level, environmental_conditions, cracks_detected, corrosion_level, predicted_remaining_life, confidence_interval, submitted_by_user_id, created_at.
  12. `notifications`: ID, user_id, report_id, title, message, is_read, notification_type, created_at.
  13. `audit_logs`: ID, user_id, action, entity_type, entity_id, payload_json, ip_address, created_at.
- Configure hybrid engine supporting both PostgreSQL (with PostGIS `Geometry('POINT', 4326)`) and portable SQLite (with Haversine fallback) so the application runs anywhere immediately.

---

### PHASE 3: Authentication, Security & Role-Based Access Control
- JWT Token Service:
  - Access Token (short-lived, 60 minutes) + Refresh Token (long-lived, 7 days).
  - Secure bcrypt password hashing with salt.
  - Role-Based Access Control (RBAC):
    - `Citizen`: Report roads, upvote/downvote, comment, track personal submissions, view public map.
    - `Officer`: View assigned work orders, update progress, upload completion photos, add repair notes.
    - `Admin`: Full oversight, approve/reject reports, assign maintenance officers, view data science analytics, configure priority weights, audit logs.
- Security Headers & CORS configured for development and production domains.
- Input validation on all endpoints using Pydantic v2 with strict schemas.

---

### PHASE 4: Citizen Frontend & Multi-Step Reporting Flow
- Interactive Report Submission:
  - Multi-image dropzone with live preview and compression.
  - Interactive map picker (Leaflet) with auto-detect GPS location button (HTML5 Geolocation API).
  - Reverse geocoding helper (OpenStreetMap Nominatim) to automatically suggest road and neighborhood names.
  - Description, damage severity self-assessment, and road classification.
- Citizen Dashboard:
  - Real-time statistics: Total submitted, Pending verification, In Progress, Resolved.
  - Status progression stepper (`Submitted` → `AI Analyzed` → `Verified` → `Assigned` → `Resolved`).
  - Community contribution points and voting activity.

---

### PHASE 5: Real AI Pothole Detection & Explainable Computer Vision
- Architecture:
  1. Image validation (MIME type check, size validation up to 15MB, resolution check).
  2. Local YOLOv8 inference:
     - Uses Ultralytics YOLOv8 architecture fine-tuned on road damage / pothole datasets.
     - Auto-downloads or loads pretrained weights (`yolov8n.pt` / fine-tuned pothole weights).
     - Robust fallback to Roboflow API if configured in `.env`.
  3. Bounding box and metric extraction:
     - Detects bounding boxes $[x_1, y_1, x_2, y_2]$, confidence scores, and class labels.
     - Computes bounding box areas and normalized damage ratio:
       $$\text{Damage Ratio} = \frac{\sum (\text{box\_width} \times \text{box\_height})}{\text{image\_width} \times \text{image\_height}}$$
  4. Annotated Image Generation:
     - Uses OpenCV to draw professional high-contrast bounding boxes with labels, confidence tags, and semi-transparent damage masks.
     - Saves annotated image to `uploads/annotated/`.
  5. Explainable AI Assessment:
     - Generates transparent natural-language explanation justifying why severity was assigned (e.g. *"Detected 3 potholes covering 8.4% of road surface with high confidence (91.2%). Multiple deep craters identified in driving lane."*).

---

### PHASE 6: Intelligent Report Prioritization Engine
- Normalized multi-factor weighted scoring formula:
  $$\text{Priority} = (0.30 \times S) + (0.20 \times C) + (0.15 \times R) + (0.15 \times A) + (0.10 \times L) + (0.10 \times D)$$
  Where:
  - $S$ (Visual Severity, 0–100): Calculated from pothole count, damage area ratio, and detection confidence.
  - $C$ (Community Evidence, 0–100): Scaled logarithmic ratio of verified upvotes minus downvotes ($\min(100, 20 \times \ln(1 + \max(0, \text{up} - \text{down})))$).
  - $R$ (Road Importance, 0–100): Highway/Arterial (100), Primary Road (80), Secondary Road (60), Residential (40), Alley/Unpaved (20).
  - $A$ (Report Age, 0–100): Normalized waiting time factor ($100 \times (1 - e^{-t/14\text{ days}})$).
  - $L$ (Location Risk, 0–100): High score for proximity to hospitals, schools, transit corridors, or accident zones.
  - $D$ (Duplicate Evidence, 0–100): Number of nearby complaints within 30 meters corroborating the failure.
- Returns comprehensive breakdown of all 6 components so administrators understand exactly why a report was ranked high.

---

### PHASE 7: Interactive Geospatial Mapping & Community Engagement
- High-performance Leaflet / MapLibre visualization:
  - Marker clustering with severity-based chromatic grading (Red = Critical, Orange = High, Yellow = Medium, Green = Resolved).
  - Real-time filters: Severity, Status, Date Range, Road Classification.
  - Clickable report popup with thumbnail, AI metrics, and direct link to report details.
  - Interactive radius search ("Find reports within 2 km of my location").
  - Proximity warning banner for citizens walking/driving near active road hazards.
- Community voting system:
  - Database-enforced uniqueness: 1 vote per user per report.
  - Ability to toggle vote (Upvote, Downvote, or Neutralize).
  - Real-time priority score recalculation upon vote changes.

---

### PHASE 8: Administrator & Maintenance Officer Workflows
- Admin Control Center:
  - Overview metrics: Critical road hazards, Pending verifications, In-progress repairs, Average time to repair (MTTR).
  - Controlled status transitions with validation rules:
    `SUBMITTED` $\to$ `AI_PROCESSED` $\to$ `VERIFIED` $\to$ `ASSIGNED` $\to$ `IN_PROGRESS` $\to$ `RESOLVED`.
  - Officer dispatch modal with estimated completion target.
- Field Officer Workspace:
  - Filtered view of work orders assigned to current officer.
  - "Update Progress" workflow: Change status to `IN_PROGRESS`, add field notes.
  - "Complete Repair" workflow: Upload post-repair photograph, log materials used and contractor details, transition report to `RESOLVED`.
  - Immutable audit trail recording every state change and actor.

---

### PHASE 9: Data Science & Predictive Analytics Module
- Exploratory Analytics:
  - Damage distribution by borough/ward and road type.
  - Weekly and monthly submission vs. resolution velocity.
  - Mean Time to Resolution (MTTR) by severity tier.
- Advanced Machine Learning:
  1. **Geospatial Hotspot Clustering (DBSCAN):** Groups proximate potholes into continuous road degradation corridors ($eps \approx 100\text{m}, min\_samples = 3$).
  2. **Resolution Time Predictor:** Trained Random Forest Regressor predicting expected days to repair based on severity, damage ratio, road type, and municipal work backlog.
  3. **High-Risk Road Segment Ranking:** Aggregates recurring damage within geographical bounding cells to identify chronic asphalt failure zones requiring full resurfacing rather than patch jobs.

---

### PHASE 10: Bridge Structural Health Assessment Module
- Preserves and upgrades the existing trained Scikit-Learn Random Forest model (`bridge_life_model.pkl`):
  - Validates all 8 input features (Age, Material, Span Length, Traffic Load, Maintenance Level, Environmental Conditions, Cracks Detected, Corrosion Level).
  - Scaler normalization via `scaler.pkl` and categorical encoding via preserved label encoders.
  - Computes predicted remaining lifespan (years) with uncertainty estimates.
  - Visual feature importance plot demonstrating which physical parameters contribute most to degradation.
  - Explicit engineering disclaimer regarding decision-support prototype limitations.

---

### PHASE 11: Testing, Security & Quality Assurance
- Automated Backend Test Suite (Pytest):
  - `test_auth.py`: User registration, login, JWT validation, role permission checks.
  - `test_reports.py`: Report submission, image upload, status transitions, ownership checks.
  - `test_ai_pipeline.py`: YOLOv8 inference, bounding box extraction, annotated image creation.
  - `test_prioritization.py`: Multi-factor scoring mathematical correctness and edge cases.
  - `test_geospatial.py`: Haversine distance, radius search, duplicate detection, DBSCAN clustering.
  - `test_bridge_model.py`: Model loading, feature encoding, inference execution.
- Security Hardening:
  - SQL injection protection via SQLAlchemy ORM parameterization.
  - Safe file upload handling (extension validation, file signature check, uuid renaming, path traversal prevention).
  - Rate limiting on public and AI inference endpoints.

---

### PHASE 12: Docker Containerization, Deployment & Documentation
- Multi-container Docker Compose (`docker-compose.yml`):
  - `backend`: FastAPI service with Uvicorn.
  - `frontend`: Next.js production build.
  - `db`: PostgreSQL 16 with PostGIS extension.
  - `redis`: In-memory cache for geospatial queries and rate limiting.
- Complete documentation suite:
  - `README.md`: Professional project showcase with diagrams, badges, and quickstart.
  - `ARCHITECTURE.md`: Deep architectural dive.
  - `DATABASE_SCHEMA.md`: Complete relational data dictionary.
  - `API_DOCUMENTATION.md`: REST API specification and Swagger guidance.
  - `ML_PIPELINE.md` & `MODEL_TRAINING_GUIDE.md`: Computer vision and predictive model details.
  - `DEPLOYMENT.md`: Cloud deployment instructions (Render, Vercel, Supabase, AWS).
  - `FINAL_IMPLEMENTATION_REPORT.md`: Comprehensive completion audit.
