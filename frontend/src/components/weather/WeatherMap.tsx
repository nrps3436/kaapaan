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

    // Base map with labels
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map)

    // Add location marker with popup
    const marker = L.marker([lat, lng], {
      icon: L.divIcon({
        className: 'custom-marker',
        html: `
          <div style="
            background: linear-gradient(135deg, #3B82F6, #2563EB);
            width: 32px;
            height: 32px;
            border-radius: 50%;
            border: 4px solid white;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 18px;
          ">📍</div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      })
    }).addTo(map)

    marker.bindPopup(`
      <div style="text-align: center; padding: 8px;">
        <strong style="font-size: 14px;">Current Location</strong><br>
        <span style="font-size: 12px; color: #666;">
          ${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E
        </span>
      </div>
    `)

    // Add circle to show monitoring area (50km radius)
    L.circle([lat, lng], {
      radius: 50000, // 50km in meters
      color: '#3B82F6',
      fillColor: '#3B82F6',
      fillOpacity: 0.1,
      weight: 2,
      dashArray: '5, 5'
    }).addTo(map).bindPopup('50km Monitoring Radius')

    // Add Bay of Bengal label
    const bayOfBengalBounds = L.latLngBounds(
      L.latLng(5, 75),  // Southwest
      L.latLng(22, 95)  // Northeast
    )

    // Add legend using Control class
    const LegendControl = L.Control.extend({
      options: {
        position: 'bottomright'
      },
      onAdd: function() {
        const div = L.DomUtil.create('div', 'weather-map-legend')
        div.innerHTML = `
          <div style="
            background: rgba(255, 255, 255, 0.95);
            color: #1F2937;
            padding: 12px;
            border-radius: 8px;
            font-size: 11px;
            backdrop-filter: blur(10px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            border: 1px solid rgba(0,0,0,0.1);
          ">
            <div style="font-weight: bold; margin-bottom: 8px; font-size: 12px; color: #3B82F6;">
              📍 Monitoring Station
            </div>
            <div style="margin-bottom: 4px; display: flex; align-items: center; gap: 8px;">
              <div style="width: 12px; height: 12px; border-radius: 50%; background: #3B82F6; border: 2px solid white;"></div>
              <span>Current Location</span>
            </div>
            <div style="margin-bottom: 4px; display: flex; align-items: center; gap: 8px;">
              <div style="width: 12px; height: 2px; background: #3B82F6; border: 1px dashed #3B82F6;"></div>
              <span>50km Radius</span>
            </div>
            <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #E5E7EB; font-size: 10px; color: #6B7280;">
              Bay of Bengal Region
            </div>
          </div>
        `
        return div
      }
    })

    new LegendControl().addTo(map)

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
      <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm text-gray-900 px-4 py-2 rounded-lg text-sm font-medium z-[1000] shadow-lg border border-gray-200">
        <div className="flex items-center gap-2">
          <span className="text-lg">🌊</span>
          <span>Bay of Bengal Weather Map</span>
        </div>
      </div>
      <div className="absolute top-4 right-4 bg-green-500/95 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-xs font-semibold z-[1000] shadow-lg flex items-center gap-1">
        <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
        LIVE
      </div>
    </div>
  )
}
