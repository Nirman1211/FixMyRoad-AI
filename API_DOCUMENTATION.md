# FixMyRoad AI — REST API Documentation

Base URL: `http://localhost:8000/api/v1`  
OpenAPI / Swagger UI: `http://localhost:8000/api/v1/docs`  
ReDoc UI: `http://localhost:8000/api/v1/redoc`

---

## 1. Authentication & Security

All authenticated endpoints require an `Authorization` header containing a valid Bearer token:
```http
Authorization: Bearer <your_jwt_access_token>
```

Tokens are obtained via the `/auth/login` endpoint.

---

## 2. API Endpoints

### 2.1. Authentication
#### `POST /auth/register`
Creates a new Citizen account.
- **Request Body (JSON)**:
  ```json
  {
    "email": "citizen@example.com",
    "password": "SecurePassword123",
    "first_name": "Elena",
    "last_name": "Rostova",
    "phone": "+1 555-0199"
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "id": 4,
    "email": "citizen@example.com",
    "first_name": "Elena",
    "last_name": "Rostova",
    "role": "CITIZEN",
    "is_active": true,
    "created_at": "2026-11-08T12:00:00Z"
  }
  ```

#### `POST /auth/login`
Authenticates user credentials and returns JWT tokens.
- **Request (OAuth2 Form / `multipart/form-data`)**:
  - `username`: `citizen@fixmyroad.org`
  - `password`: `Citizen@2026`
- **Response (200 OK)**:
  ```json
  {
    "access_token": "eyJhbGciOi...",
    "refresh_token": "eyJhbGciOi...",
    "token_type": "bearer",
    "user": {
      "id": 3,
      "email": "citizen@fixmyroad.org",
      "first_name": "Elena",
      "role": "CITIZEN"
    }
  }
  ```

#### `GET /auth/me`
Fetches authenticated user profile.
- **Headers**: `Authorization: Bearer <token>`
- **Response (200 OK)**: User profile object.

---

### 2.2. Road Damage Reports
#### `GET /reports`
Public paginated listing of hazard reports with optional filters.
- **Query Parameters**:
  - `skip` (int, default: 0)
  - `limit` (int, default: 20, max: 100)
  - `status` (string, optional: `VERIFIED`, `IN_PROGRESS`, `RESOLVED`)
  - `severity` (string, optional: `CRITICAL`, `HIGH`, `MEDIUM`, `LOW`)
  - `road_type` (string, optional: `HIGHWAY`, `PRIMARY`, `RESIDENTIAL`)
- **Response (200 OK)**: Array of `ReportResponse` objects.

#### `POST /reports`
Submits a road hazard report. Executes real Computer Vision inference, computes 6-factor priority score, and checks for 25m duplicate reports.
- **Headers**: `Authorization: Bearer <token>`
- **Content-Type**: `multipart/form-data`
- **Form Fields**:
  - `title` (string, required): Summary headline
  - `description` (string, optional): Detailed text
  - `road_name` (string, optional): Street or highway name
  - `landmark` (string, optional): Cross-street or building
  - `latitude` (float, required): WGS84 latitude (e.g. `40.7128`)
  - `longitude` (float, required): WGS84 longitude (e.g. `-74.0060`)
  - `road_type` (string, default: `RESIDENTIAL`): `HIGHWAY`, `PRIMARY`, `SECONDARY`, `RESIDENTIAL`, `RURAL`
  - `image` (file, required): Image file (JPG, PNG, WEBP)
- **Response (201 Created)**: Complete `ReportDetailResponse` with AI prediction metrics and 6-factor priority score.

#### `GET /reports/{id}`
Inspects a specific report including side-by-side images, bounding boxes, 6-factor score, comments, and status history.
- **Response (200 OK)**: `ReportDetailResponse`.

#### `POST /reports/{id}/vote`
Upvotes or downvotes a report. Updates priority score dynamically.
- **Request Body (JSON)**:
  ```json
  { "vote": 1 }
  ```
  *(Pass `1` for upvote, `-1` for downvote).*
- **Response (200 OK)**:
  ```json
  {
    "report_id": 1,
    "upvotes": 43,
    "downvotes": 1,
    "new_priority_score": 89.2
  }
  ```

#### `POST /reports/{id}/comments`
Appends a community discussion comment to a report thread.
- **Request Body (JSON)**:
  ```json
  { "comment_text": "Road crew is currently on site setting up safety cones." }
  ```

---

### 2.3. Computer Vision & AI Inference
#### `POST /ai/detect`
Standalone road damage scan without creating a permanent database report.
- **Content-Type**: `multipart/form-data`
- **Form Field**: `image` (file)
- **Response (200 OK)**:
  ```json
  {
    "pothole_count": 3,
    "damage_area_ratio": 0.084,
    "average_confidence": 0.89,
    "bounding_boxes": [
      { "x1": 45.2, "y1": 88.0, "x2": 190.5, "y2": 210.3, "confidence": 0.91, "class_name": "pothole" }
    ],
    "visual_severity": "HIGH",
    "explanation": "High visual severity: Detected 3 potholes covering 8.4% of road surface.",
    "annotated_image_url": "/uploads/annotated/8a7c_annotated.jpg",
    "inference_source": "yolov8_local",
    "inference_time_ms": 32.4
  }
  ```

---

### 2.4. Geospatial Intelligence & Maps
#### `GET /maps/reports`
Returns lightweight GeoJSON coordinates and severity markers for map rendering.
- **Response (200 OK)**: Array of points with `latitude`, `longitude`, `severity`, `priority_score`, `report_code`.

#### `GET /maps/nearby`
Finds road hazards within a specific radius of a user's GPS coordinate.
- **Query Parameters**:
  - `lat` (float, required): User latitude
  - `lon` (float, required): User longitude
  - `radius_km` (float, default: 5.0): Search radius in kilometers
- **Response (200 OK)**: Array of nearby hazard points.

#### `GET /maps/clusters`
Runs DBSCAN spatial density clustering ($\varepsilon = 300\text{m}$) to detect high-frequency road failure corridors.
- **Response (200 OK)**:
  ```json
  [
    {
      "cluster_id": 0,
      "point_count": 6,
      "center_lat": 40.7128,
      "center_lon": -74.0060,
      "dominant_severity": "CRITICAL",
      "average_priority": 84.2,
      "corridor_name": "Interstate Route 95 Corridor",
      "report_ids": [1, 5, 8, 12, 14, 19]
    }
  ]
  ```

---

### 2.5. Bridge Health Assessment (XGBoost ML)
#### `POST /bridge/predict`
Evaluates bridge structural health degradation using the real trained XGBoost Regressor model.
- **Request Body (JSON)**:
  ```json
  {
    "age": 28,
    "material": "Concrete",
    "span_length": 45.0,
    "traffic_load": 18500,
    "maintenance_level": "Fair",
    "environmental_conditions": "Moderate",
    "cracks_detected": "Moderate",
    "corrosion_level": 4
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "predicted_remaining_life_years": 81.7,
    "degradation_index": 29.8,
    "risk_category": "LOW",
    "confidence_score": 0.88,
    "explanation": "Healthy structural condition. Estimated 81.7 years of remaining operational life.",
    "feature_contributions": { "age_years": 28, "traffic_load_daily": 18500 },
    "disclaimer": "Decision-support prototype only. Must not substitute for physical engineering inspections."
  }
  ```

---

### 2.6. Municipal Administration & Field Maintenance
#### `PATCH /admin/reports/{id}/status`
*(Admin Only)* Updates report lifecycle status (`VERIFIED`, `IN_PROGRESS`, `RESOLVED`, `REJECTED`).
#### `POST /admin/reports/{id}/assign`
*(Admin Only)* Dispatches a report to a maintenance officer / technician.
#### `GET /maintenance/assigned`
*(Officer / Admin)* Lists work orders assigned to the logged-in technician.
#### `POST /maintenance/assignments/{id}/complete`
*(Officer / Admin)* Completes a work order by uploading a post-repair verification photo, materials used, and repair notes.

