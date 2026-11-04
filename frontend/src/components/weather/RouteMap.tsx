import { useEffect, useRef } from 'react'

declare global {
  interface Window {
    L: typeof import('leaflet')
  }
}

interface RouteMapProps {
  waypoints: Array<{
    lat: number
    lng: number
    risk_score: number
    risk_level: string
    risk_color: string
  }>
  startLabel?: string
  endLabel?: string
}

export default function RouteMap({ waypoints, startLabel = 'Start', endLabel = 'End' }: RouteMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)

  useEffect(() => {
    if (!containerRef.current || mapRef.current || waypoints.length === 0) return
    const L = window.L
    if (!L) return

    const avgLat = waypoints.reduce((sum, w) => sum + w.lat, 0) / waypoints.length
    const avgLng = waypoints.reduce((sum, w) => sum + w.lng, 0) / waypoints.length

    const map = L.map(containerRef.current, {
      center: [avgLat, avgLng],
      zoom: 8,
      zoomControl: true,
    })

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 18,
    }).addTo(map)

    const latLngs = waypoints.map(w => [w.lat, w.lng] as [number, number])
    
    // Draw route segments with risk colors
    for (let i = 0; i < waypoints.length - 1; i++) {
      const start = waypoints[i]
      const end = waypoints[i + 1]
      const avgRisk = (start.risk_score + end.risk_score) / 2
      
      let color = '#22C55E'
      if (avgRisk >= 86) color = '#DC2626'
      else if (avgRisk >= 61) color = '#F97316'
      else if (avgRisk >= 31) color = '#EAB308'

      L.polyline([[start.lat, start.lng], [end.lat, end.lng]], {
        color: color,
        weight: 4,
        opacity: 0.8,
      }).addTo(map)
    }

    // Add waypoint markers
    waypoints.forEach((wp, i) => {
      const isStart = i === 0
      const isEnd = i === waypoints.length - 1
      
      const icon = L.divIcon({
        html: `
          <div style="
            width: ${isStart || isEnd ? '32px' : '24px'};
            height: ${isStart || isEnd ? '32px' : '24px'};
            background: ${wp.risk_color};
            border: 3px solid white;
            border-radius: 50%;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: ${isStart || isEnd ? '14px' : '11px'};
            color: white;
          ">
            ${isStart ? '🚢' : isEnd ? '🎯' : i + 1}
          </div>
        `,
        className: '',
        iconSize: [isStart || isEnd ? 32 : 24, isStart || isEnd ? 32 : 24],
        iconAnchor: [isStart || isEnd ? 16 : 12, isStart || isEnd ? 16 : 12],
      })

      const marker = L.marker([wp.lat, wp.lng], { icon }).addTo(map)
      
      marker.bindPopup(`
        <div style="min-width: 200px;">
          <div style="font-weight: bold; color: ${wp.risk_color}; margin-bottom: 8px;">
            ${isStart ? startLabel : isEnd ? endLabel : `Waypoint ${i + 1}`}
          </div>
          <div style="font-size: 12px;">
            <strong>Position:</strong> ${wp.lat.toFixed(4)}°N, ${wp.lng.toFixed(4)}°E<br>
            <strong>Risk Score:</strong> <span style="color: ${wp.risk_color}; font-weight: bold;">${wp.risk_score}</span><br>
            <strong>Risk Level:</strong> <span style="color: ${wp.risk_color}; text-transform: uppercase;">${wp.risk_level}</span>
          </div>
        </div>
      `, { maxWidth: 250 })
    })

    const bounds = L.latLngBounds(latLngs)
    map.fitBounds(bounds, { padding: [50, 50] })

    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [waypoints, startLabel, endLabel])

  if (waypoints.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-100 rounded-lg">
        <p className="text-gray-500">No route data to display</p>
      </div>
    )
  }

  return (
    <div className="relative w-full h-96 rounded-lg overflow-hidden border border-gray-200 shadow-sm">
      <div ref={containerRef} className="w-full h-full" />
      <div className="absolute bottom-4 right-4 bg-white p-3 rounded-lg shadow-lg border border-gray-200 text-xs z-[1000]">
        <div className="font-semibold mb-2">Risk Levels</div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-4 h-1 bg-green-500 rounded"></div>
            <span>Safe (0-30)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-1 bg-yellow-500 rounded"></div>
            <span>Moderate (31-60)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-1 bg-orange-500 rounded"></div>
            <span>High (61-85)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-1 bg-red-500 rounded"></div>
            <span>Dangerous (86-100)</span>
          </div>
        </div>
      </div>
    </div>
  )
}
