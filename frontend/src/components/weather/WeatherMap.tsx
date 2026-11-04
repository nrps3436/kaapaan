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
  const weatherLayersRef = useRef<{ [key: string]: L.TileLayer }>({})
  const [activeLayer, setActiveLayer] = useState<string>('none')
  const [apiKeyStatus, setApiKeyStatus] = useState<'checking' | 'valid' | 'invalid'>('invalid')

  // Safely get API key from environment
  const API_KEY = typeof import.meta !== 'undefined' && import.meta.env ? 
    (import.meta.env.VITE_OPENWEATHER_API_KEY as string) || 'demo' : 
    'demo'

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    // Check API key validity
    const checkApiKey = async () => {
      if (API_KEY === 'demo' || !API_KEY) {
        setApiKeyStatus('invalid')
        return
      }
      
      try {
        const response = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${API_KEY}`
        )
        setApiKeyStatus(response.ok ? 'valid' : 'invalid')
      } catch {
        setApiKeyStatus('invalid')
      }
    }
    
    checkApiKey()

    // Initialize map
    const map = L.map(mapRef.current).setView([lat, lng], zoom)

    // Use OpenStreetMap standard tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19
    }).addTo(map)

    // Create weather overlay layers
    weatherLayersRef.current = {
      clouds: L.tileLayer(
        `https://tile.openweathermap.org/map/clouds_new/{z}/{x}/{y}.png?appid=${API_KEY}`,
        { attribution: 'Weather © OpenWeatherMap', opacity: 0.6, maxZoom: 19 }
      ),
      precipitation: L.tileLayer(
        `https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=${API_KEY}`,
        { attribution: 'Weather © OpenWeatherMap', opacity: 0.6, maxZoom: 19 }
      ),
      pressure: L.tileLayer(
        `https://tile.openweathermap.org/map/pressure_new/{z}/{x}/{y}.png?appid=${API_KEY}`,
        { attribution: 'Weather © OpenWeatherMap', opacity: 0.6, maxZoom: 19 }
      ),
      wind: L.tileLayer(
        `https://tile.openweathermap.org/map/wind_new/{z}/{x}/{y}.png?appid=${API_KEY}`,
        { attribution: 'Weather © OpenWeatherMap', opacity: 0.5, maxZoom: 19 }
      ),
      temp: L.tileLayer(
        `https://tile.openweathermap.org/map/temp_new/{z}/{x}/{y}.png?appid=${API_KEY}`,
        { attribution: 'Weather © OpenWeatherMap', opacity: 0.6, maxZoom: 19 }
      )
    }

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
  }, [lat, lng, zoom, API_KEY])

  const handleLayerChange = (layer: string) => {
    if (!mapInstanceRef.current) return

    // Remove all weather layers
    Object.values(weatherLayersRef.current).forEach(weatherLayer => {
      if (mapInstanceRef.current!.hasLayer(weatherLayer)) {
        mapInstanceRef.current!.removeLayer(weatherLayer)
      }
    })

    // Add selected layer
    if (layer !== 'none' && weatherLayersRef.current[layer]) {
      weatherLayersRef.current[layer].addTo(mapInstanceRef.current)
    }

    setActiveLayer(layer)
  }

  const isLayerDisabled = apiKeyStatus !== 'valid'

  return (
    <div className="relative w-full h-full rounded-lg overflow-hidden border border-gray-200">
      <div ref={mapRef} className="w-full h-full min-h-[500px]" role="application" aria-label="Weather map of Bay of Bengal" />
      
      {/* Title Overlay */}
      <div className="absolute top-4 left-4 bg-gray-900/95 backdrop-blur-sm text-white px-4 py-2 rounded-lg text-sm font-medium z-[1000] shadow-lg border border-gray-700">
        <div className="flex items-center gap-2">
          <span className="text-lg" role="img" aria-label="Wave">🌊</span>
          <span>Bay of Bengal Weather Map</span>
        </div>
      </div>
      
      {/* Live Badge */}
      <div className="absolute top-4 right-4 bg-green-500/95 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-xs font-semibold z-[1000] shadow-lg flex items-center gap-1">
        <span className="w-2 h-2 bg-white rounded-full animate-pulse" aria-hidden="true"></span>
        LIVE
      </div>

      {/* Weather Layer Controls */}
      <div 
        className="absolute top-20 right-4 bg-white/95 backdrop-blur-sm rounded-xl shadow-xl border border-gray-200 z-[1000] overflow-hidden max-w-[200px]"
        role="group"
        aria-label="Weather layer controls"
      >
        <div className="p-3 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <p className="text-xs font-bold text-gray-700 uppercase tracking-wide flex items-center gap-2">
            <span role="img" aria-label="Weather">🌤️</span>
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
            aria-pressed={activeLayer === 'none'}
          >
            🗺️ Base Map
          </button>
          <button
            onClick={() => handleLayerChange('clouds')}
            disabled={isLayerDisabled}
            className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-all ${
              activeLayer === 'clouds'
                ? 'bg-blue-100 text-gray-900 shadow-sm ring-2 ring-blue-500'
                : isLayerDisabled
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
            aria-pressed={activeLayer === 'clouds'}
            aria-disabled={isLayerDisabled}
          >
            ☁️ Cloud Cover
          </button>
          <button
            onClick={() => handleLayerChange('precipitation')}
            disabled={isLayerDisabled}
            className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-all ${
              activeLayer === 'precipitation'
                ? 'bg-indigo-100 text-gray-900 shadow-sm ring-2 ring-blue-500'
                : isLayerDisabled
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
            aria-pressed={activeLayer === 'precipitation'}
            aria-disabled={isLayerDisabled}
          >
            🌧️ Precipitation
          </button>
          <button
            onClick={() => handleLayerChange('pressure')}
            disabled={isLayerDisabled}
            className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-all ${
              activeLayer === 'pressure'
                ? 'bg-purple-100 text-gray-900 shadow-sm ring-2 ring-blue-500'
                : isLayerDisabled
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
            aria-pressed={activeLayer === 'pressure'}
            aria-disabled={isLayerDisabled}
          >
            📊 Pressure
          </button>
          <button
            onClick={() => handleLayerChange('wind')}
            disabled={isLayerDisabled}
            className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-all ${
              activeLayer === 'wind'
                ? 'bg-cyan-100 text-gray-900 shadow-sm ring-2 ring-blue-500'
                : isLayerDisabled
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
            aria-pressed={activeLayer === 'wind'}
            aria-disabled={isLayerDisabled}
          >
            💨 Wind Speed
          </button>
          <button
            onClick={() => handleLayerChange('temp')}
            disabled={isLayerDisabled}
            className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-all ${
              activeLayer === 'temp'
                ? 'bg-orange-100 text-gray-900 shadow-sm ring-2 ring-blue-500'
                : isLayerDisabled
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
            aria-pressed={activeLayer === 'temp'}
            aria-disabled={isLayerDisabled}
          >
            🌡️ Temperature
          </button>
        </div>
        {apiKeyStatus !== 'valid' && (
          <div className="p-2 border-t border-gray-200 bg-yellow-50">
            <p className="text-xs text-yellow-800 flex items-center gap-2">
              <span role="img" aria-label="Warning">⚠️</span>
              <span className="font-medium">
                {apiKeyStatus === 'checking' ? 'Checking API...' : 'Demo Mode'}
              </span>
            </p>
          </div>
        )}
      </div>

      {/* Legend */}
      <div 
        className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 z-[1000] p-3"
        role="region"
        aria-label="Map legend"
      >
        <div className="text-xs">
          <div className="font-bold mb-2 text-gray-700 flex items-center gap-1">
            <span role="img" aria-label="Chart">📊</span> Map Legend
          </div>
          <div className="space-y-1.5 text-xs text-gray-600">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full border-2 border-white shadow" aria-hidden="true"></div>
              <span>Monitoring Station</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 border border-dashed border-blue-500" aria-hidden="true"></div>
              <span>50km Radius</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
