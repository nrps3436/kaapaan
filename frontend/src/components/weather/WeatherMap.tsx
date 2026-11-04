import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

interface WeatherMapProps {
  lat: number
  lng: number
  zoom?: number
}

export default function WeatherMap({ lat, lng, zoom = 6 }: WeatherMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    // Initialize map
    const map = L.map(mapRef.current).setView([lat, lng], zoom)

    // Use OpenStreetMap standard tiles (no API key required)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19
    }).addTo(map)

    // Add location marker
    const marker = L.marker([lat, lng], {
      icon: L.divIcon({
        className: 'custom-weather-marker',
        html: '<div style="position: relative; width: 40px; height: 40px;"><div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 16px; height: 16px; background: linear-gradient(135deg, #3B82F6, #2563EB); border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.6), 0 0 0 8px rgba(59, 130, 246, 0.2); animation: pulse 2s ease-in-out infinite;"></div></div>',
        iconSize: [40, 40],
        iconAnchor: [20, 20]
      })
    }).addTo(map)

    marker.bindPopup(`
      <div style="text-align: center; padding: 8px; min-width: 150px;">
        <strong style="font-size: 14px; color: #1F2937;">📍 Monitoring Station</strong><br>
        <span style="font-size: 12px; color: #6B7280;">
          ${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E
        </span>
      </div>
    `)

    // Add 50km monitoring radius
    L.circle([lat, lng], {
      radius: 50000,
      color: '#3B82F6',
      fillColor: '#3B82F6',
      fillOpacity: 0.1,
      weight: 2,
      dashArray: '10, 10'
    }).addTo(map)

    // Add scale control
    L.control.scale({
      imperial: false,
      metric: true,
      position: 'bottomleft'
    }).addTo(map)

    mapInstanceRef.current = map

    return () => {
      map.remove()
      mapInstanceRef.current = null
    }
  }, [lat, lng, zoom])

  return (
    <div className="relative w-full h-full rounded-lg overflow-hidden border border-gray-200">
      <div ref={mapRef} className="w-full h-full min-h-[500px]" />
      
      {/* Title Overlay */}
      <div className="absolute top-4 left-4 bg-gray-900/95 backdrop-blur-sm text-white px-4 py-2 rounded-lg text-sm font-medium z-[1000] shadow-lg border border-gray-700">
        <div className="flex items-center gap-2">
          <span className="text-lg">🌊</span>
          <span>Bay of Bengal Weather Map</span>
        </div>
      </div>
      
      {/* Live Badge */}
      <div className="absolute top-4 right-4 bg-green-500/95 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-xs font-semibold z-[1000] shadow-lg flex items-center gap-1">
        <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
        LIVE
      </div>

      {/* Weather Layer Controls */}
      <div className="absolute top-20 right-4 bg-white/95 backdrop-blur-sm rounded-xl shadow-xl border border-gray-200 z-[1000] overflow-hidden max-w-[200px]">
        <div className="p-3 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <p className="text-xs font-bold text-gray-700 uppercase tracking-wide flex items-center gap-2">
            <span>🌤️</span>
            Weather Layers
          </p>
        </div>
        <div className="p-2 space-y-1">
          <button className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium bg-blue-100 text-gray-900 shadow-sm ring-2 ring-blue-500">
            🗺️ Base Map
          </button>
          <button disabled className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-gray-400 cursor-not-allowed">
            ☁️ Cloud Cover
          </button>
          <button disabled className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-gray-400 cursor-not-allowed">
            🌧️ Precipitation
          </button>
          <button disabled className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-gray-400 cursor-not-allowed">
            📊 Pressure
          </button>
          <button disabled className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-gray-400 cursor-not-allowed">
            💨 Wind Speed
          </button>
          <button disabled className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-gray-400 cursor-not-allowed">
            🌡️ Temperature
          </button>
        </div>
        <div className="p-2 border-t border-gray-200 bg-yellow-50">
          <p className="text-xs text-yellow-800 flex items-center gap-2">
            <span>⚠️</span>
            <span className="font-medium">Demo Mode</span>
          </p>
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 z-[1000] p-3">
        <div className="text-xs">
          <div className="font-bold mb-2 text-gray-700 flex items-center gap-1">
            <span>📊</span> Map Legend
          </div>
          <div className="space-y-1.5 text-xs text-gray-600">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full border-2 border-white shadow"></div>
              <span>Monitoring Station</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 border border-dashed border-blue-500"></div>
              <span>50km Radius</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
