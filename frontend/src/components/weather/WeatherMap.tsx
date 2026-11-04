import { useEffect, useRef, useState } from 'react'
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
  const overlayRef = useRef<L.LayerGroup | null>(null)
  const [activeLayer, setActiveLayer] = useState<string>('none')

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    // Initialize map
    const map = L.map(mapRef.current).setView([lat, lng], zoom)

    // Use OpenStreetMap standard tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map)

    // Create overlay layer group for demo visualizations
    overlayRef.current = L.layerGroup().addTo(map)

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
      overlayRef.current = null
    }
  }, [lat, lng, zoom])

  const handleLayerChange = (layer: string) => {
    if (!mapInstanceRef.current || !overlayRef.current) return

    // Clear existing overlay
    overlayRef.current.clearLayers()

    if (layer === 'none') {
      setActiveLayer('none')
      return
    }

    // Demo mode: Add visual indicators for each layer type
    const map = mapInstanceRef.current
    const bounds = map.getBounds()
    
    // Create demo visualization based on layer type
    if (layer === 'clouds') {
      // Add semi-transparent circles to simulate cloud cover
      for (let i = 0; i < 15; i++) {
        const randomLat = bounds.getSouth() + Math.random() * (bounds.getNorth() - bounds.getSouth())
        const randomLng = bounds.getWest() + Math.random() * (bounds.getEast() - bounds.getWest())
        L.circle([randomLat, randomLng], {
          radius: Math.random() * 30000 + 20000,
          fillColor: '#FFFFFF',
          fillOpacity: 0.3,
          color: '#E5E7EB',
          weight: 1
        }).addTo(overlayRef.current)
      }
    } else if (layer === 'precipitation') {
      // Add markers for precipitation areas
      for (let i = 0; i < 8; i++) {
        const randomLat = bounds.getSouth() + Math.random() * (bounds.getNorth() - bounds.getSouth())
        const randomLng = bounds.getWest() + Math.random() * (bounds.getEast() - bounds.getWest())
        L.circle([randomLat, randomLng], {
          radius: Math.random() * 25000 + 15000,
          fillColor: '#3B82F6',
          fillOpacity: 0.2,
          color: '#2563EB',
          weight: 2
        }).addTo(overlayRef.current)
      }
    } else if (layer === 'wind') {
      // Add wind direction indicators
      const centerLat = (bounds.getNorth() + bounds.getSouth()) / 2
      const centerLng = (bounds.getEast() + bounds.getWest()) / 2
      for (let i = 0; i < 20; i++) {
        const angle = Math.random() * 360
        const distance = Math.random() * 100000
        const targetLat = centerLat + (distance / 111320) * Math.sin(angle * Math.PI / 180)
        const targetLng = centerLng + (distance / (111320 * Math.cos(centerLat * Math.PI / 180))) * Math.cos(angle * Math.PI / 180)
        L.polyline([[centerLat, centerLng], [targetLat, targetLng]], {
          color: '#06B6D4',
          weight: 2,
          opacity: 0.4
        }).addTo(overlayRef.current)
      }
    } else if (layer === 'temp') {
      // Add temperature zones
      L.circle([lat, lng], {
        radius: 75000,
        fillColor: '#EF4444',
        fillOpacity: 0.15,
        color: '#DC2626',
        weight: 1
      }).addTo(overlayRef.current)
      L.circle([lat, lng], {
        radius: 50000,
        fillColor: '#F59E0B',
        fillOpacity: 0.15,
        color: '#D97706',
        weight: 1
      }).addTo(overlayRef.current)
    } else if (layer === 'pressure') {
      // Add pressure contours
      for (let i = 1; i <= 3; i++) {
        L.circle([lat, lng], {
          radius: i * 40000,
          fillColor: 'transparent',
          color: '#8B5CF6',
          weight: 2,
          opacity: 0.4,
          dashArray: '10, 5'
        }).addTo(overlayRef.current)
      }
    }

    setActiveLayer(layer)
  }

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
          <button
            onClick={() => handleLayerChange('none')}
            className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-all ${
              activeLayer === 'none'
                ? 'bg-blue-100 text-gray-900 shadow-sm ring-2 ring-blue-500'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            🗺️ Base Map
          </button>
          <button
            onClick={() => handleLayerChange('clouds')}
            className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-all ${
              activeLayer === 'clouds'
                ? 'bg-blue-100 text-gray-900 shadow-sm ring-2 ring-blue-500'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            ☁️ Cloud Cover
          </button>
          <button
            onClick={() => handleLayerChange('precipitation')}
            className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-all ${
              activeLayer === 'precipitation'
                ? 'bg-indigo-100 text-gray-900 shadow-sm ring-2 ring-blue-500'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            🌧️ Precipitation
          </button>
          <button
            onClick={() => handleLayerChange('pressure')}
            className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-all ${
              activeLayer === 'pressure'
                ? 'bg-purple-100 text-gray-900 shadow-sm ring-2 ring-blue-500'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            📊 Pressure
          </button>
          <button
            onClick={() => handleLayerChange('wind')}
            className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-all ${
              activeLayer === 'wind'
                ? 'bg-cyan-100 text-gray-900 shadow-sm ring-2 ring-blue-500'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            💨 Wind Speed
          </button>
          <button
            onClick={() => handleLayerChange('temp')}
            className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-all ${
              activeLayer === 'temp'
                ? 'bg-orange-100 text-gray-900 shadow-sm ring-2 ring-blue-500'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
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
