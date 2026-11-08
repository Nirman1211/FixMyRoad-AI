export type UserRole = 'CITIZEN' | 'OFFICER' | 'ADMIN';

export type ReportStatus = 'PENDING_REVIEW' | 'VERIFIED' | 'ASSIGNED' | 'IN_PROGRESS' | 'RESOLVED' | 'REJECTED';

export type DamageSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type RoadType = 'HIGHWAY' | 'PRIMARY' | 'SECONDARY' | 'RESIDENTIAL' | 'RURAL';

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
}

export interface BoundingBox {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  confidence: number;
  class_name: string;
}

export interface AIPrediction {
  id: number;
  model_name: string;
  model_version: string;
  inference_source: string;
  pothole_count: number;
  total_damage_area_ratio: number;
  average_confidence: number;
  bounding_boxes: BoundingBox[];
  visual_severity_label: string;
  explanation_text?: string;
  inference_time_ms: number;
  created_at: string;
}

export interface PriorityScoreBreakdown {
  id: number;
  total_score: number;
  severity_component: number;
  community_component: number;
  road_importance_component: number;
  age_component: number;
  location_risk_component: number;
  duplicate_component: number;
  calculated_at: string;
}

export interface ReportImage {
  id: number;
  original_url: string;
  annotated_url?: string;
  is_primary: boolean;
  uploaded_at: string;
}

export interface ReportComment {
  id: number;
  user_id: number;
  user_name: string;
  comment_text: string;
  created_at: string;
}

export interface ReportStatusHistory {
  id: number;
  previous_status?: ReportStatus;
  new_status: ReportStatus;
  notes?: string;
  changed_at: string;
}

export interface Report {
  id: number;
  report_code: string;
  user_id: number;
  title: string;
  description?: string;
  road_name?: string;
  landmark?: string;
  latitude: number;
  longitude: number;
  road_type: RoadType;
  status: ReportStatus;
  severity: DamageSeverity;
  priority_score: number;
  upvotes_count: number;
  downvotes_count: number;
  user_vote?: number;
  created_at: string;
  updated_at: string;
  images: ReportImage[];
  primary_image?: ReportImage;
  ai_prediction?: AIPrediction;
  priority_breakdown?: PriorityScoreBreakdown;
  comments?: ReportComment[];
  status_history?: ReportStatusHistory[];
}

export interface MapReportPoint {
  id: number;
  report_code: string;
  title: string;
  latitude: number;
  longitude: number;
  severity: DamageSeverity;
  status: ReportStatus;
  priority_score: number;
  road_type: RoadType;
  primary_image_url?: string;
}

export interface HotspotCluster {
  cluster_id: number;
  point_count: number;
  center_lat: number;
  center_lon: number;
  dominant_severity: string;
  average_priority: number;
  corridor_name: string;
  report_ids: number[];
}

export interface MaintenanceAssignment {
  id: number;
  report_id: number;
  officer_id: number;
  officer_name?: string;
  assigned_by_id: number;
  assigned_at: string;
  due_date?: string;
  priority_level: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  instructions?: string;
  report?: Report;
  repair_record?: RepairRecord;
}

export interface RepairRecord {
  id: number;
  assignment_id: number;
  report_id: number;
  officer_id: number;
  completed_at: string;
  repair_notes: string;
  completion_image_url?: string;
  materials_used?: string;
  cost_estimate?: number;
}

export interface AnalyticsOverview {
  total_reports: number;
  status_counts: Record<string, number>;
  severity_counts: Record<string, number>;
  road_type_counts: Record<string, number>;
  average_priority_score: number;
  verified_percentage: number;
  resolved_percentage: number;
  mttr_hours: number;
  total_potholes_detected: number;
  recent_trend: Array<{ date: string; count: number }>;
}

export interface BridgePredictionRequest {
  age: number;
  material: string;
  span_length: number;
  traffic_load: number;
  maintenance_level: string;
  environmental_conditions: string;
  cracks_detected: string;
  corrosion_level: number;
}

export interface BridgePredictionResponse {
  predicted_remaining_life_years: number;
  degradation_index: number;
  risk_category: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  confidence_score: number;
  explanation: string;
  feature_contributions: Record<string, any>;
  disclaimer: string;
}

