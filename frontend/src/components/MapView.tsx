import { useEffect, useRef } from 'react'
import { FishermanWithLocation } from '../types'

declare global {
  interface Window {
    L: typeof import('leaflet')
  }
}

// Geofence zones (simulated — not official maritime borders)
const GEOFENCE_ZONES = [
  { id: 'z1', name: 'Restricted Zone Alpha', lat: 10.5, lng: 80.2, radius: 25, color: '#ef4444', type: 'exclusion' },
  { id: 'z2', name: 'Warning Zone Beta', lat: 10.0, lng: 80.8, radius: 35, color: '#f59e0b', type: 'warning' },
  { id: 'z3', name: 'Caution Zone Gamma', lat: 9.6, lng: 79.5, radius: 20, color: '#f97316', type: 'restricted' },
]

const STATUS_COLORS = {
  safe: '#22c55e',
  warning: '#f59e0b',
  critical: '#ef4444',
  sos: '#dc2626',
}

interface Props {
  fishermen: FishermanWithLocation[]
  fullscreen?: boolean
}

export default function MapView({ fishermen, fullscreen }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<import('leaflet').Map | null>(null)
  const markersRef = useRef<Map<string, import('leaflet').Marker>>(new Map())
  const circlesRef = useRef<import('leaflet').Circle[]>([])

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
      attribution: '© OpenStreetMap contributors',
      maxZoom: 18,
    }).addTo(map)

    // Draw geofence zones
    GEOFENCE_ZONES.forEach(zone => {
      const circle = L.circle([zone.lat, zone.lng], {
        radius: zone.radius * 1000,
        color: zone.color,
        fillColor: zone.color,
        fillOpacity: 0.08,
        weight: 2,
        dashArray: '6 6',
      }).addTo(map)

      circle.bindTooltip(
        `<div style="background:#0d1526;color:#e2e8f0;padding:6px 10px;border-radius:8px;border:1px solid ${zone.color}40;font-size:12px">
          ⚠ ${zone.name}<br><span style="color:${zone.color};font-size:11px">Simulated zone — not official</span>
        </div>`,
        { permanent: false, sticky: true }
      )
      circlesRef.current.push(circle)
    })

    // Legend via simple DomUtil
    const legendDiv = L.DomUtil.create('div', 'leaflet-legend')
    legendDiv.style.cssText = 'background:#0d1526;border:1px solid #162040;border-radius:10px;padding:10px;font-size:11px;color:#94a3b8;position:absolute;bottom:30px;right:10px;z-index:1000'
    legendDiv.innerHTML = `
      <div style="font-weight:600;color:#e2e8f0;margin-bottom:6px">📍 Fisherman Status</div>
      <div>🟢 Safe &nbsp;&nbsp; 🟡 Warning</div>
      <div>🔴 Critical &nbsp;&nbsp; 🆘 SOS</div>
      <div style="margin-top:6px;border-top:1px solid #162040;padding-top:6px;font-size:10px;color:#64748b">
        ⚠ Zones are simulated only
      </div>
    `
    containerRef.current?.appendChild(legendDiv)

    mapRef.current = map
    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  // Update markers when fishermen data changes
  useEffect(() => {
    const L = window.L
    const map = mapRef.current
    if (!L || !map) return

    fishermen.forEach(f => {
      const loc = f.location
      if (!loc) return
      const color = STATUS_COLORS[f.status] || STATUS_COLORS.safe

      const svgIcon = `
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 32 40">
          <ellipse cx="16" cy="36" rx="8" ry="3" fill="${color}" opacity="0.3"/>
          <path d="M16 2 C8 2 4 8 4 14 C4 22 16 36 16 36 C16 36 28 22 28 14 C28 8 24 2 16 2Z"
            fill="${color}" stroke="white" stroke-width="1.5" opacity="0.9"/>
          <circle cx="16" cy="14" r="5" fill="white" opacity="0.9"/>
          <text x="16" y="18" text-anchor="middle" font-size="8" font-weight="bold" fill="${color}">${f.id.slice(-2)}</text>
        </svg>
      `

      const icon = L.divIcon({
        html: svgIcon,
        className: '',
        iconSize: [32, 40],
        iconAnchor: [16, 40],
        popupAnchor: [0, -40],
      })

      const popup = `
        <div style="background:#0d1526;color:#e2e8f0;padding:12px;border-radius:10px;border:1px solid #162040;min-width:200px">
          <div style="font-weight:700;font-size:14px;color:${color};margin-bottom:8px">⚓ ${f.name}</div>
          <div style="font-size:12px;color:#94a3b8">Vessel: ${f.vessel}</div>
          <div style="font-size:12px;margin-top:6px">
            <span style="color:#64748b">📍</span> ${loc.lat.toFixed(4)}°N, ${loc.lng.toFixed(4)}°E<br>
            <span style="color:#64748b">⚡</span> ${loc.speed_knots.toFixed(1)} knots &nbsp;
            <span style="color:#64748b">🧭</span> ${loc.heading}°<br>
            <span style="color:#64748b">🔋</span> ${loc.battery_pct}% &nbsp;
            <span style="color:#64748b">📶</span> ${loc.signal_strength}%
          </div>
          <div style="margin-top:8px;padding:4px 8px;background:${color}20;border-radius:6px;color:${color};font-size:11px;font-weight:600;text-transform:uppercase">
            ${f.status}
          </div>
        </div>
      `

      if (markersRef.current.has(f.id)) {
        const m = markersRef.current.get(f.id)!
        m.setLatLng([loc.lat, loc.lng])
        m.setIcon(icon)
        m.setPopupContent(popup)
      } else {
        const marker = L.marker([loc.lat, loc.lng], { icon })
          .bindPopup(popup, { maxWidth: 280 })
          .addTo(map)
        markersRef.current.set(f.id, marker)
      }
    })
  }, [fishermen])

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full" style={{ minHeight: fullscreen ? 'calc(100vh - 160px)' : '400px' }} />
      <div className="absolute top-3 left-3 z-[1000] bg-[#0d1526]/90 border border-[#162040] rounded-lg px-3 py-1.5 text-xs text-slate-400">
        🗺 Bay of Bengal — Simulated GPS positions, not live data
      </div>
    </div>
  )
}
