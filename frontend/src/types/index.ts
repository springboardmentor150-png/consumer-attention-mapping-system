// TypeScript interfaces matching the CAMS API contract exactly

export type UserRole =
  | "super_admin"
  | "store_manager"
  | "retail_analyst"
  | "marketing_manager";

export interface User {
  id: string;
  email: string;
  role: UserRole;
  is_active: boolean;
}

export interface Zone {
  zone_id: number | string;
  name: string;
  coordinates: number[][];
}

export interface Store {
  layout_id: string;
  name: string;
  zones: Zone[];
}

export interface Shelf {
  id: string;
  store_id: string;
  zone_id?: string | null;
  name: string;
  aisle_number: string;
  shelf_level: number;
  coordinates: Record<string, number>;
  width_cm: number;
  height_cm: number;
  product_categories: string[];
  planogram_url?: string | null;
  created_at: string;
}

export interface Camera {
  id: string;
  store_id: string;
  zone_id?: string | null;
  shelf_id?: string | null;
  name: string;
  camera_type: string;
  rtsp_url: string;
  ip_address: string;
  location_description?: string | null;
  mount_height_cm?: number | null;
  field_of_view_degrees?: number | null;
  resolution: string;
  fps: number;
  status: "active" | "inactive" | "maintenance" | "error";
  last_heartbeat?: string | null;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: "bearer";
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  full_name: string;
  password: string;
  role: UserRole;
}

export interface ApiResponse<T> {
  data?: T;
  detail?: string;
  error?: string;
}

export interface ShelfAttentionSummary {
  shelf_id: string;
  shelf_name: string;
  total_attention_seconds: number;
  unique_viewers: number;
  avg_dwell_seconds: number;
  engagement_rank?: number;
}

export interface ZoneTrafficSummary {
  zone_id: string;
  zone_name: string;
  total_visitors: number;
  avg_time_seconds: number;
}

export interface HourlyTrafficPoint {
  hour: number;
  visitor_count: number;
  avg_dwell_seconds: number;
}

export interface DashboardAnalytics {
  store_id: string;
  period: string;
  total_visitors: number;
  avg_dwell_time_seconds: number;
  top_attention_shelves: ShelfAttentionSummary[];
  zone_traffic: ZoneTrafficSummary[];
  hourly_traffic: HourlyTrafficPoint[];
  active_shoppers_now: number;
}

export interface AttentionReportResponse {
  store_id: string;
  generated_at: string;
  period: string;
  data: DashboardAnalytics;
}

export interface TrackingSession {
  id: string;
  camera_id: string;
  store_id: string;
  video_source: string;
  status: string;
  started_at: string;
  ended_at?: string;
  total_frames_processed: number;
  unique_shoppers_count: number;
  avg_fps: number;
}

export interface ActiveShopperInfo {
  tracker_id: number;
  current_dwell_seconds: number;
  is_looking_at_shelf: boolean;
  head_yaw?: number;
}

// ==========================================
// Milestone 3 Types
// ==========================================

export type SegmentType =
  | "explorer"
  | "quick_buyer"
  | "comparison_shopper"
  | "impulse_buyer"
  | "brand_loyal";

export interface SegmentDistribution {
  segment_type: string;
  count: number;
  percentage: number;
  avg_dwell_seconds: number;
}

export interface StoreSegmentSummary {
  store_id: string;
  period: string;
  total_sessions: number;
  segments: SegmentDistribution[];
  most_common_segment: string;
}

export interface BehaviorSegmentResponse {
  id: string;
  session_id: string;
  store_id: string;
  segment_type: string;
  path_length_meters: number;
  total_store_dwell_seconds: number;
  unique_zones_visited: number;
  avg_gaze_shifts_per_minute: number;
  confidence_score: number;
  classification_method: string;
  created_at: string;
}

export type HeatmapType = "traffic" | "attention" | "dwell" | "engagement";

export interface HeatmapRecord {
  id: string;
  store_id: string;
  camera_id?: string | null;
  heatmap_type: string;
  file_path: string;
  file_name: string;
  resolution_width: number;
  resolution_height: number;
  data_points_count: number;
  period_start: string;
  period_end: string;
  is_current: boolean;
  generated_at: string;
  image_url: string;
}

export interface ProductScoreDetail {
  id?: string;
  product_id: string;
  product_name: string;
  sku: string;
  shelf_name?: string | null;
  attention_duration_score: number;
  interaction_frequency_score: number;
  pickup_rate_score: number;
  conversion_rate_score: number;
  repeat_engagement_score: number;
  composite_score: number;
  grade: string;
  total_viewers: number;
  total_interactions: number;
  calculated_at: string;
}

export interface ScoreRanking {
  rank: number;
  product: ProductScoreDetail;
}

export interface StoreScoreReport {
  store_id: string;
  period: string;
  generated_at: string;
  total_products_scored: number;
  avg_composite_score: number;
  top_performers: ScoreRanking[];
  low_performers: ScoreRanking[];
  score_distribution: Record<string, number>;
}

export type RecommendationType =
  | "shelf_optimization"
  | "product_placement"
  | "promotional_placement"
  | "pricing_review"
  | "layout_improvement"
  | "restock_alert"
  | "engagement_boost";

export type PriorityLevel = "high" | "medium" | "low";

export interface RecommendationItem {
  id: string;
  store_id: string;
  product_id?: string | null;
  shelf_id?: string | null;
  zone_id?: string | null;
  recommendation_type: RecommendationType;
  priority: PriorityLevel;
  title: string;
  description: string;
  trigger_reason: string;
  suggested_action: string;
  expected_impact?: string | null;
  composite_score_before?: number | null;
  is_active: boolean;
  created_at: string;
}

export interface StoreRecommendationSummary {
  store_id: string;
  generated_at: string;
  total_recommendations: number;
  high_priority_count: number;
  recommendations: RecommendationItem[];
}
