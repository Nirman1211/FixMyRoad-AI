import {
  AuthTokens,
  User,
  Report,
  MapReportPoint,
  HotspotCluster,
  MaintenanceAssignment,
  AnalyticsOverview,
  BridgePredictionRequest,
  BridgePredictionResponse
} from '../types';

// Dynamically support remote backend (e.g. Render) or local Vite proxy
const rawBackend = (import.meta.env.VITE_API_URL || '').trim().replace(/\/$/, '');
export const BACKEND_URL = rawBackend
  ? (rawBackend.startsWith('http://') || rawBackend.startsWith('https://') ? rawBackend : `https://${rawBackend}`)
  : '';
const API_BASE = BACKEND_URL ? `${BACKEND_URL}/api/v1` : '/api/v1';

export const formatImageUrl = (url?: string | null): string => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  return BACKEND_URL ? `${BACKEND_URL}${url}` : url;
};

class ApiService {
  private getToken(): string | null {
    return localStorage.getItem('fixmyroad_token');
  }

  private getHeaders(contentType: boolean = true): HeadersInit {
    const headers: Record<string, string> = {};
    if (contentType) {
      headers['Content-Type'] = 'application/json';
    }
    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      let errMsg = `Request failed with status ${response.status}`;
      try {
        const errorData = await response.json();
        errMsg = errorData.detail || errorData.message || errMsg;
      } catch {
        // Fallback to status text
      }
      throw new Error(errMsg);
    }
    return response.json();
  }

  // --- Auth Endpoints ---
  async login(formData: FormData): Promise<AuthTokens> {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      body: formData,
    });
    return this.handleResponse<AuthTokens>(response);
  }

  async register(userData: Record<string, any>): Promise<User> {
    const response = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(userData),
    });
    return this.handleResponse<User>(response);
  }

  async getCurrentUser(): Promise<User> {
    const response = await fetch(`${API_BASE}/auth/me`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse<User>(response);
  }

  // --- Reports Endpoints ---
  async getReports(params: Record<string, any> = {}): Promise<Report[]> {
    const query = new URLSearchParams(params).toString();
    const url = query ? `${API_BASE}/reports?${query}` : `${API_BASE}/reports`;
    const response = await fetch(url, {
      headers: this.getHeaders(),
    });
    return this.handleResponse<Report[]>(response);
  }

  async getMyReports(): Promise<Report[]> {
    const response = await fetch(`${API_BASE}/reports/my-reports`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse<Report[]>(response);
  }

  async getReportById(id: number): Promise<Report> {
    const response = await fetch(`${API_BASE}/reports/${id}`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse<Report>(response);
  }

  async createReport(formData: FormData): Promise<Report> {
    const response = await fetch(`${API_BASE}/reports`, {
      method: 'POST',
      headers: this.getHeaders(false), // FormData sets its own multipart boundary
      body: formData,
    });
    return this.handleResponse<Report>(response);
  }

  async voteReport(reportId: number, voteType: 1 | -1): Promise<{ upvotes: number; downvotes: number; new_priority_score: number }> {
    const response = await fetch(`${API_BASE}/reports/${reportId}/vote`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ vote: voteType }),
    });
    return this.handleResponse(response);
  }

  async addComment(reportId: number, commentText: string): Promise<any> {
    const response = await fetch(`${API_BASE}/reports/${reportId}/comments`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ comment_text: commentText }),
    });
    return this.handleResponse(response);
  }

  // --- AI Standalone Endpoints ---
  async scanDamage(imageFile: File): Promise<any> {
    const formData = new FormData();
    formData.append('image', imageFile);
    const response = await fetch(`${API_BASE}/ai/detect`, {
      method: 'POST',
      body: formData,
    });
    return this.handleResponse(response);
  }

  async getModelInfo(): Promise<any> {
    const response = await fetch(`${API_BASE}/ai/model-info`);
    return this.handleResponse(response);
  }

  // --- Maps Endpoints ---
  async getMapPoints(): Promise<MapReportPoint[]> {
    const response = await fetch(`${API_BASE}/maps/reports`);
    return this.handleResponse<MapReportPoint[]>(response);
  }

  async getNearbyReports(lat: number, lon: number, radiusKm: number = 5.0): Promise<MapReportPoint[]> {
    const response = await fetch(`${API_BASE}/maps/nearby?lat=${lat}&lon=${lon}&radius_km=${radiusKm}`);
    return this.handleResponse<MapReportPoint[]>(response);
  }

  async getClusters(): Promise<HotspotCluster[]> {
    const response = await fetch(`${API_BASE}/maps/clusters`);
    return this.handleResponse<HotspotCluster[]>(response);
  }

  // --- Admin Endpoints ---
  async updateReportStatus(reportId: number, status: string, notes?: string): Promise<Report> {
    const response = await fetch(`${API_BASE}/admin/reports/${reportId}/status`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify({ status, notes }),
    });
    return this.handleResponse<Report>(response);
  }

  async assignReport(reportId: number, officerId: number, instructions?: string, dueDate?: string): Promise<any> {
    const response = await fetch(`${API_BASE}/admin/reports/${reportId}/assign`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        officer_id: officerId,
        instructions,
        due_date: dueDate,
        priority_level: 'HIGH',
      }),
    });
    return this.handleResponse(response);
  }

  async getOfficers(): Promise<User[]> {
    const response = await fetch(`${API_BASE}/admin/officers`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse<User[]>(response);
  }

  // --- Maintenance & Officer Endpoints ---
  async getOfficerAssignments(): Promise<MaintenanceAssignment[]> {
    const response = await fetch(`${API_BASE}/maintenance/assigned`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse<MaintenanceAssignment[]>(response);
  }

  async completeRepair(assignmentId: number, formData: FormData): Promise<any> {
    const response = await fetch(`${API_BASE}/maintenance/assignments/${assignmentId}/complete`, {
      method: 'POST',
      headers: this.getHeaders(false),
      body: formData,
    });
    return this.handleResponse(response);
  }

  // --- Analytics Endpoints ---
  async getAnalyticsOverview(): Promise<AnalyticsOverview> {
    const response = await fetch(`${API_BASE}/analytics/overview`);
    return this.handleResponse<AnalyticsOverview>(response);
  }

  async predictRepairDuration(roadType: string, severity: string, potholeCount: number): Promise<any> {
    const response = await fetch(`${API_BASE}/analytics/predict-duration`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        road_type: roadType,
        severity,
        pothole_count: potholeCount,
      }),
    });
    return this.handleResponse(response);
  }

  // --- Bridge ML Endpoints ---
  async predictBridgeLife(data: BridgePredictionRequest): Promise<BridgePredictionResponse> {
    const response = await fetch(`${API_BASE}/bridge/predict`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse<BridgePredictionResponse>(response);
  }
}

export const api = new ApiService();

