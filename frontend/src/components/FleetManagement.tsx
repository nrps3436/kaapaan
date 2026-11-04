import { useState, useEffect, useRef } from 'react'
import { Ship, MapPin, Battery, Signal, Navigation as NavIcon, RefreshCw } from 'lucide-react'

declare global {
  interface Window {
    L: typeof import('leaflet')
  }
}

interface Vessel {
  id: string
  name: string
  vessel: string
  status: string
  location?: {
    lat: number
    lng: number
    speed_knots: number
    heading: number
    battery_pct: number
    signal_strength: number
    timestamp: string
  }
}

const STATUS_COLORS = {
  safe: '#22C55E',
  warning: '#EAB308',
  critical: '#F97316',
  sos: '#DC2626',
}

export default function FleetManagement() {
  const [vessels, setVessels] = useState<Vessel[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedVessel, setSelectedVessel] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const markersRef = useRef<Map<string, any>>(new Map())

  useEffect(() => {
    fetchVessels()
    const interval = setInterval(fetchVessels, 5000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    const L = window.L
    if (!L) return

    const map = L.map(containerRef.current, {
      center: [10.0, 80.0],
      zoom: 8,
      zoomControl: true,
    })

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
      maxZoom: 18,
    }).addTo(map)

    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  useEffect(() => {
    const L = window.L
    const map = mapRef.current
    if (!L || !map) return

    vessels.forEach(vessel => {
      const loc = vessel.location
      if (!loc) return

      const color = STATUS_COLORS[vessel.status as keyof typeof STATUS_COLORS] || STATUS_COLORS.safe

      const icon = L.divIcon({
        html: `<div style="width:32px;height:32px;background:${color};border:3px solid white;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:16px;box-shadow:0 2px 8px rgba(0,0,0,0.3)">🚢</div>`,
        className: '',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      })

      const popup = `
        <div style="min-width:220px;padding:4px">
          <div style="font-weight:bold;font-size:14px;color:${color};margin-bottom:8px">🚢 ${vessel.name}</div>
          <div style="font-size:12px;color:#4B5563;line-height:1.5">
            <div><strong>Vessel:</strong> ${vessel.vessel}</div>
            <div><strong>Position:</strong> ${loc.lat.toFixed(4)}°N, ${loc.lng.toFixed(4)}°E</div>
            <div><strong>Speed:</strong> ${loc.speed_knots.toFixed(1)} knots</div>
            <div><strong>Heading:</strong> ${loc.heading}°</div>
            <div><strong>Battery:</strong> ${loc.battery_pct}%</div>
            <div><strong>Signal:</strong> ${loc.signal_strength}%</div>
          </div>
          <div style="margin-top:8px;padding:4px 8px;background:${color}20;border-radius:4px;color:${color};font-size:11px;font-weight:600;text-transform:uppercase;text-align:center">${vessel.status}</div>
        </div>
      `

      if (markersRef.current.has(vessel.id)) {
        const marker = markersRef.current.get(vessel.id)
        marker.setLatLng([loc.lat, loc.lng])
        marker.setIcon(icon)
        marker.setPopupContent(popup)
      } else {
        const marker = L.marker([loc.lat, loc.lng], { icon })
          .bindPopup(popup, { maxWidth: 280 })
          .addTo(map)
        
        marker.on('click', () => setSelectedVessel(vessel.id))
        markersRef.current.set(vessel.id, marker)
      }
    })
  }, [vessels])

  const fetchVessels = async () => {
    try {
      const response = await fetch('/api/fishermen')
      const data = await response.json()
      setVessels(data)
      setLoading(false)
    } catch (e) {
      console.error('Failed to fetch vessels:', e)
      setLoading(false)
    }
  }

  const selectedVesselData = vessels.find(v => v.id === selectedVessel)

  return (
    <div className="space-y-6">
      {/* Fleet Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="weather-card p-4">
          <div className="text-gray-600 text-sm mb-1">Total Vessels</div>
          <div className="text-3xl font-bold text-gray-900">{vessels.length}</div>
        </div>
        <div className="weather-card p-4 border-l-4 border-green-500">
          <div className="text-gray-600 text-sm mb-1">Safe</div>
          <div className="text-3xl font-bold text-green-600">{vessels.filter(v => v.status === 'safe').length}</div>
        </div>
        <div className="weather-card p-4 border-l-4 border-yellow-500">
          <div className="text-gray-600 text-sm mb-1">Warning</div>
          <div className="text-3xl font-bold text-yellow-600">{vessels.filter(v => v.status === 'warning').length}</div>
        </div>
        <div className="weather-card p-4 border-l-4 border-red-500">
          <div className="text-gray-600 text-sm mb-1">Critical/SOS</div>
          <div className="text-3xl font-bold text-red-600">
            {vessels.filter(v => v.status === 'critical' || v.status === 'sos').length}
          </div>
        </div>
      </div>

      {/* Map and Vessel List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live Map */}
        <div className="lg:col-span-2 weather-card p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <MapPin size={20} className="text-primary-500" />
              Live Fleet Tracking
            </h3>
            <button
              onClick={fetchVessels}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
          <div className="relative">
            <div ref={containerRef} className="w-full h-[500px] rounded-lg overflow-hidden border border-gray-200" />
            <div className="absolute bottom-4 right-4 bg-white p-3 rounded-lg shadow-lg border border-gray-200 text-xs z-[1000]">
              <div className="font-semibold mb-2">Status</div>
              <div className="space-y-1">
                <div className="flex items-center gap-2"><div className="w-3 h-3 bg-green-500 rounded-full"></div><span>Safe</span></div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 bg-yellow-500 rounded-full"></div><span>Warning</span></div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 bg-orange-500 rounded-full"></div><span>Critical</span></div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 bg-red-500 rounded-full"></div><span>SOS</span></div>
              </div>
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-500 text-center">
            Bay of Bengal • Live GPS tracking • Updates every 5 seconds
          </div>
        </div>

        {/* Vessel List */}
        <div className="weather-card p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Ship size={20} className="text-primary-500" />
            Active Vessels ({vessels.length})
          </h3>
          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            {vessels.map(vessel => {
              const color = STATUS_COLORS[vessel.status as keyof typeof STATUS_COLORS] || STATUS_COLORS.safe
              const isSelected = selectedVessel === vessel.id

              return (
                <div
                  key={vessel.id}
                  onClick={() => setSelectedVessel(vessel.id)}
                  className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    isSelected ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                  style={{ borderLeftColor: color, borderLeftWidth: '4px' }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900 text-sm truncate">{vessel.name}</div>
                      <div className="text-xs text-gray-600 truncate">{vessel.vessel}</div>
                      {vessel.location && (
                        <div className="mt-2 space-y-1 text-xs text-gray-600">
                          <div className="flex items-center gap-1">
                            <Battery size={12} />
                            <span>{vessel.location.battery_pct}%</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Signal size={12} />
                            <span>{vessel.location.signal_strength}%</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <NavIcon size={12} />
                            <span>{vessel.location.speed_knots.toFixed(1)} kn</span>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex-shrink-0 ml-2">
                      <div
                        className="text-xs font-bold uppercase px-2 py-1 rounded"
                        style={{ backgroundColor: `${color}20`, color: color }}
                      >
                        {vessel.status}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Selected Vessel Details */}
      {selectedVesselData && selectedVesselData.location && (
        <div className="weather-card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Vessel Details: {selectedVesselData.name}</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Position</div>
              <div className="font-semibold text-gray-900">
                {selectedVesselData.location.lat.toFixed(4)}°N<br/>
                {selectedVesselData.location.lng.toFixed(4)}°E
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Speed / Heading</div>
              <div className="font-semibold text-gray-900">
                {selectedVesselData.location.speed_knots.toFixed(1)} knots<br/>
                {selectedVesselData.location.heading}°
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Battery</div>
              <div className={`font-semibold ${
                selectedVesselData.location.battery_pct < 20 ? 'text-red-600' :
                selectedVesselData.location.battery_pct < 40 ? 'text-yellow-600' : 'text-green-600'
              }`}>
                {selectedVesselData.location.battery_pct}%
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Signal</div>
              <div className={`font-semibold ${
                selectedVesselData.location.signal_strength < 40 ? 'text-red-600' :
                selectedVesselData.location.signal_strength < 70 ? 'text-yellow-600' : 'text-green-600'
              }`}>
                {selectedVesselData.location.signal_strength}%
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
