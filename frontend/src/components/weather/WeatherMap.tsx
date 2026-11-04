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
  const [activeLayer, setActiveLayer] = useState<string>('none')

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    // Initialize map with dark theme
    const map = L.map(mapRef.current).setView([lat, lng], zoom)

    // Dark base map (CartoDB Dark Matter)
    const darkLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
      subdomains: 'abcd',
      maxZoom: 20
    }).addTo(map)

    // Create weather overlay layers (these will show weather visualization)
    const weatherLayers: { [key: string]: L.TileLayer } = {
      clouds: L.tileLayer('https://tile.openweathermap.org/map/clouds_new/{z}/{x}/{y}.png?appid={apiKey}', {
        attribution: 'Weather data © OpenWeatherMap',
        opacity: 0.6,
        maxZoom: 19
      }),
      precipitation: L.tileLayer('https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid={apiKey}', {
        attribution: 'Weather data © OpenWeatherMap',
        opacity: 0.6,
        maxZoom: 19
      }),
      pressure: L.tileLayer('https://tile.openweathermap.org/map/pressure_new/{z}/{x}/{y}.png?appid={apiKey}', {
        attribution: 'Weather data © OpenWeatherMap',
        opacity: 0.6,
        maxZoom: 19
      }),
      wind: L.tileLayer('https://tile.openweathermap.org/map/wind_new/{z}/{x}/{y}.png?appid={apiKey}', {
        attribution: 'Weather data © OpenWeatherMap',
        opacity: 0.5,
        maxZoom: 19
      }),
      temp: L.tileLayer('https://tile.openweathermap.org/map/temp_new/{z}/{x}/{y}.png?appid={apiKey}', {
        attribution: 'Weather data © OpenWeatherMap',
        opacity: 0.6,
        maxZoom: 19
      })
    }

    // Add location marker with custom style
    const marker = L.marker([lat, lng], {
      icon: L.divIcon({
        className: 'custom-weather-marker',
        html: `
          <div style="
            position: relative;
            width: 40px;
            height: 40px;
          ">
            <div style="
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              width: 16px;
              height: 16px;
              background: linear-gradient(135deg, #3B82F6, #2563EB);
              border-radius: 50%;
              border: 3px solid white;
              box-shadow: 0 4px 12px rgba(59, 130, 246, 0.6), 0 0 0 8px rgba(59, 130, 246, 0.2);
              animation: pulse 2s ease-in-out infinite;
            "></div>
          </div>
        `,
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
      fillOpacity: 0.05,
      weight: 2,
      dashArray: '10, 10'
    }).addTo(map)

    // Layer control function
    const setWeatherLayer = (layerName: string) => {
      // Remove all weather layers
      Object.values(weatherLayers).forEach(layer => {
        if (map.hasLayer(layer)) {
          map.removeLayer(layer)
        }
      })
      
      // Add selected layer
      if (layerName !== 'none' && weatherLayers[layerName]) {
        weatherLayers[layerName].addTo(map)
      }
      
      setActiveLayer(layerName)
    }

    // Expose layer control to component
    (window as any).setWeatherLayer = setWeatherLayer

    // Add enhanced legend
    const LegendControl = L.Control.extend({
      options: {
        position: 'bottomright'
      },
      onAdd: function() {
        const div = L.DomUtil.create('div', 'weather-map-legend-enhanced')
        div.innerHTML = `
          <div style="
            background: rgba(31, 41, 55, 0.95);
            color: white;
            padding: 12px;
            border-radius: 12px;
            font-size: 11px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            min-width: 180px;
          ">
            <div style="font-weight: bold; margin-bottom: 10px; font-size: 12px; display: flex; align-items: center; gap: 6px;">
              <span style="font-size: 16px;">📊</span>
              <span>Weather Layers</span>
            </div>
            <div style="display: flex; flex-direction: column; gap: 6px;">
              <div style="display: flex; align-items: center; gap: 8px; font-size: 10px;">
                <div style="width: 12px; height: 12px; background: #3B82F6; border-radius: 50%; border: 2px solid white;"></div>
                <span>Monitoring Station</span>
              </div>
              <div style="display: flex; align-items: center; gap: 8px; font-size: 10px;">
                <div style="width: 12px; height: 2px; background: transparent; border: 1px dashed #3B82F6;"></div>
                <span>50km Radius</span>
              </div>
            </div>
            <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.2);">
              <div style="font-size: 9px; color: rgba(255,255,255,0.7);">
                Use layer controls to toggle<br/>weather visualization
              </div>
            </div>
          </div>
        `
        return div
      }
    })

    new LegendControl().addTo(map)

    // Add scale
    L.control.scale({
      imperial: false,
      metric: true,
      position: 'bottomleft'
    }).addTo(map)

    mapInstanceRef.current = map

    return () => {
      map.remove()
      mapInstanceRef.current = null
      delete (window as any).setWeatherLayer
    }
  }, [lat, lng, zoom])

  const handleLayerChange = (layer: string) => {
    if ((window as any).setWeatherLayer) {
      (window as any).setWeatherLayer(layer)
    }
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
      <div className="absolute top-20 right-4 bg-white/95 backdrop-blur-sm rounded-xl shadow-xl border border-gray-200 z-[1000] overflow-hidden">
        <div className="p-3 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <p className="text-xs font-bold text-gray-700 uppercase tracking-wide flex items-center gap-2">
            <span>🌤️</span>
            Weather Layers
          </p>
        </div>
        <div className="p-2 space-y-1">
          {[
            { value: 'none', label: '🗺️ Base Map', color: 'bg-gray-100' },
            { value: 'clouds', label: '☁️ Cloud Cover', color: 'bg-blue-100' },
            { value: 'precipitation', label: '🌧️ Precipitation', color: 'bg-indigo-100' },
            { value: 'pressure', label: '📊 Pressure', color: 'bg-purple-100' },
            { value: 'wind', label: '💨 Wind Speed', color: 'bg-cyan-100' },
            { value: 'temp', label: '🌡️ Temperature', color: 'bg-orange-100' }
          ].map(layer => (
            <button
              key={layer.value}
              onClick={() => handleLayerChange(layer.value)}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                activeLayer === layer.value
                  ? `${layer.color} text-gray-900 shadow-sm ring-2 ring-blue-500`
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              {layer.label}
            </button>
          ))}
        </div>
        <div className="p-2 border-t border-gray-200 bg-yellow-50">
          <p className="text-xs text-yellow-800 flex items-center gap-2">
            <span>⚠️</span>
            <span className="font-medium">Demo Mode</span>
          </p>
        </div>
      </div>
    </div>
  )
}
