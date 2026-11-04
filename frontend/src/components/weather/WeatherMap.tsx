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

    // Dark base map
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
      subdomains: 'abcd',
      maxZoom: 20
    }).addTo(map)

    // Add OpenWeatherMap weather overlay layers (demo mode - requires API key for production)
    const API_KEY = 'demo'
    
    // Clouds layer
    L.tileLayer(`https://tile.openweathermap.org/map/clouds_new/{z}/{x}/{y}.png?appid=${API_KEY}`, {
      attribution: 'Weather from OpenWeatherMap',
      opacity: 0.6
    }).addTo(map)

    // Precipitation layer
    L.tileLayer(`https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=${API_KEY}`, {
      attribution: 'Weather from OpenWeatherMap',
      opacity: 0.5
    }).addTo(map)

    // Wind speed layer
    L.tileLayer(`https://tile.openweathermap.org/map/wind_new/{z}/{x}/{y}.png?appid=${API_KEY}`, {
      attribution: 'Weather from OpenWeatherMap',
      opacity: 0.4
    }).addTo(map)

    // Add location marker
    L.marker([lat, lng], {
      icon: L.divIcon({
        className: 'custom-marker',
        html: '<div style="background: #3B82F6; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>',
        iconSize: [16, 16],
        iconAnchor: [8, 8]
      })
    }).addTo(map)

    // Add legend using Control class properly
    const LegendControl = L.Control.extend({
      options: {
        position: 'bottomright'
      },
      onAdd: function() {
        const div = L.DomUtil.create('div', 'weather-map-legend')
        div.innerHTML = `
          <div style="background: rgba(31, 41, 55, 0.95); color: white; padding: 12px; border-radius: 8px; font-size: 11px; backdrop-filter: blur(10px);">
            <div style="font-weight: bold; margin-bottom: 8px; font-size: 12px;">Weather Layers</div>
            <div style="margin-bottom: 4px;">🌥️ Cloud Cover</div>
            <div style="margin-bottom: 4px;">🌧️ Precipitation</div>
            <div>💨 Wind Speed</div>
          </div>
        `
        return div
      }
    })

    new LegendControl().addTo(map)

    mapInstanceRef.current = map

    return () => {
      map.remove()
      mapInstanceRef.current = null
    }
  }, [lat, lng, zoom])

  return (
    <div className="relative w-full h-full rounded-lg overflow-hidden">
      <div ref={mapRef} className="w-full h-full min-h-[500px]" />
      <div className="absolute top-4 left-4 bg-gray-900/90 backdrop-blur-sm text-white px-4 py-2 rounded-lg text-sm font-medium z-[1000]">
        🌊 Bay of Bengal Weather Map
      </div>
    </div>
  )
}
