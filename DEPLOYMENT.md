# FixMyRoad AI — Production Cloud & Local Deployment Guide

This guide details deployment options for **FixMyRoad AI**, ranging from local zero-config execution to production cloud deployment across Render, Vercel, and Cloudinary.

---

## 1. Environment Variables Master Checklist

The following environment variables can be set in `backend/.env` or in your cloud dashboard:

| Variable | Description | Default (Local Dev) | Production Example |
| :--- | :--- | :--- | :--- |
| `PROJECT_NAME` | Application name | `"FixMyRoad AI"` | `"FixMyRoad AI"` |
| `DATABASE_URL` | SQLAlchemy database URI | `"sqlite:///./fixmyroad.db"` | `"postgresql://user:pass@host:5432/dbname"` |
| `SECRET_KEY` | Cryptographic key for JWT | Dev secret | 64-char hex (`openssl rand -hex 32`) |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Access token lifespan | `1440` (24 hrs) | `60` (1 hr) |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary Cloud Name | `""` (local storage) | `"my-cloudinary-account"` |
| `CLOUDINARY_API_KEY` | Cloudinary API Key | `""` | `"123456789012345"` |
| `CLOUDINARY_API_SECRET`| Cloudinary Secret | `""` | `"abcdef1234567890"` |
| `USE_LOCAL_YOLO` | Enable YOLO inference | `true` | `true` |
| `ROBOFLOW_API_KEY` | Roboflow fallback API key | `""` | `"rf_yourApiKey"` |
| `ROBOFLOW_PROJECT` | Roboflow project name | `"pothole-detection-i00zy"` | `"pothole-detection-i00zy"` |
| `ROBOFLOW_VERSION` | Roboflow model version | `2` | `2` |

---

## 2. Option A: Local Development Setup (Quickest)

### 1. Run the Backend
```powershell
cd E:\FixMyRoad-main\backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
- Swagger UI Documentation: `http://localhost:8000/api/v1/docs`

### 2. Run the Frontend
```powershell
cd E:\FixMyRoad-main\frontend
npm.cmd run dev
```
- Open application: `http://localhost:3000`

---

## 3. Option B: Docker Compose Multi-Container Stack

Runs PostgreSQL + PostGIS, FastAPI, and Nginx in orchestrated containers:
```powershell
cd E:\FixMyRoad-main
docker-compose up --build
```
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8000`
- PostgreSQL: `localhost:5432`

---

## 4. Option C: Production Cloud Deployment

### 4.1. Cloudinary Setup (Image CDN)
1. Sign up for a free account at [Cloudinary](https://cloudinary.com/) (using `nirman1211@gmail.com`).
2. Navigate to your **Dashboard**.
3. Copy your **Cloud Name**, **API Key**, and **API Secret**.
4. Paste them into `backend/.env`:
   ```env
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```
5. Restart your backend. All newly uploaded road photos and annotated AI images will now be stored on Cloudinary's global CDN!

### 4.2. Render Deployment (Backend & Database)
1. **Create PostgreSQL on Render**:
   - Go to [render.com](https://render.com/).
   - Click **New +** $\to$ **PostgreSQL**.
   - Copy the **Internal Database URL** or **External Database URL**.
2. **Deploy FastAPI Web Service**:
   - Click **New +** $\to$ **Web Service**.
   - Connect your GitHub repository.
   - Set **Root Directory**: `backend`.
   - Set **Runtime**: `Python 3`.
   - Set **Build Command**: `pip install -r requirements.txt`.
   - Set **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.
   - Add Environment Variables:
     - `DATABASE_URL`: Your Render PostgreSQL connection string.
     - `SECRET_KEY`: A random 64-character secret.
     - `CLOUDINARY_*`: Your Cloudinary credentials.

### 4.3. Vercel Deployment (Frontend)
1. Go to [vercel.com](https://vercel.com/).
2. Import your GitHub repository.
3. Set **Root Directory**: `frontend`.
4. Framework Preset: `Vite`.
5. Set Environment Variable:
   - `VITE_API_BASE_URL`: `https://your-render-backend.onrender.com/api/v1`
6. Click **Deploy**.

