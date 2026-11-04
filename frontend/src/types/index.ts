export type Status = 'safe' | 'warning' | 'critical' | 'sos'

export interface Fisherman {
  id: string
  name: string
  vessel: string
  phone: string
  status: Status
}

export interface Location {
  fisherman_id: string
  lat: number
  lng: number
  speed_knots: number
  heading: number
  battery_pct: number
  signal_strength: number
  timestamp: string
}

export interface FishermanWithLocation extends Fisherman {
  location?: Location
}

export interface GeofenceZone {
  id: string
  name: string
  center_lat: number
  center_lng: number
  radius_km: number
  zone_type: 'restricted' | 'warning' | 'exclusion'
  description: string
}

export interface Alert {
  id: number
  fisherman_id: string
  alert_type: string
  severity: Status
  message: string
  zone_id?: string
  distance_km?: number
  time_to_boundary_min?: number
  acknowledged: boolean
  timestamp: string
}

export interface SOSEvent {
  id: number
  fisherman_id: string
  lat: number
  lng: number
  message: string
  status: 'active' | 'acknowledged' | 'resolved'
  priority: 'critical' | 'high' | 'medium'
  acknowledged_by?: string
  timestamp: string
  resolved_at?: string
}

export interface DashboardStats {
  total_fishermen: number
  active_devices: number
  safe: number
  warning: number
  critical: number
  sos: number
}

export interface AgentStatus {
  model_id: string
  region: string
  last_run?: string
  status: 'idle' | 'running' | 'ok' | 'error' | 'fallback'
  recommendations: Recommendation[]
  fallback: boolean
}

export interface Recommendation {
  fisherman_id: string
  fisherman_name: string
  risk_level: string
  message: string
  actions: string[]
  tamil_summary: string
}
