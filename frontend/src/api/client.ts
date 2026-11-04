const BASE = '/api'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`API ${res.status}: ${err}`)
  }
  return res.json()
}

export const api = {
  getDashboard: () => request<import('../types').DashboardStats>('/dashboard'),
  getFishermen: () => request<import('../types').FishermanWithLocation[]>('/fishermen'),
  getLocations: () => request<import('../types').Location[]>('/locations/latest'),
  getAlerts: () => request<import('../types').Alert[]>('/alerts'),
  getSOS: () => request<import('../types').SOSEvent[]>('/sos'),
  getAgentStatus: () => request<import('../types').AgentStatus>('/agents/status'),

  postTelemetry: (data: Partial<import('../types').Location>[]) =>
    request('/telemetry', { method: 'POST', body: JSON.stringify(data) }),

  postSOS: (data: { fisherman_id: string; lat: number; lng: number; message: string }) =>
    request<import('../types').SOSEvent>('/sos', { method: 'POST', body: JSON.stringify(data) }),

  patchSOS: (id: number, data: { status: string; acknowledged_by?: string }) =>
    request<import('../types').SOSEvent>(`/sos/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  runSimStep: () => request<{ updated: number }>('/simulation/step', { method: 'POST' }),
  resetSimulation: () => request<{ ok: boolean }>('/simulation/reset', { method: 'POST' }),
}
