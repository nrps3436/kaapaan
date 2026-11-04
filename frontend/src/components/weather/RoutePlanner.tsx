import { useState } from 'react'
import { MapPin, Navigation, Clock, AlertTriangle, CheckCircle, Map } from 'lucide-react'
import RouteMap from './RouteMap'

interface RouteResult {
  total_distance_nm: number
  estimated_duration_hours: number
  overall_risk: {
    average_score: number
    maximum_score: number
    level: string
    color: string
    status: string
  }
  waypoints: Array<{
    lat: number
    lng: number
    risk_score: number
    risk_level: string
    risk_color: string
    weather: any
    eta: string
  }>
  demo_mode: boolean
}

export default function RoutePlanner() {
  const [route, setRoute] = useState<RouteResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Pre-filled demo locations (Rameshwaram to fishing zone)
  const [startLat, setStartLat] = useState('9.28')
  const [startLng, setStartLng] = useState('79.31')
  const [endLat, setEndLat] = useState('10.50')
  const [endLng, setEndLng] = useState('80.20')
  const [speed, setSpeed] = useState('6')

  const planRoute = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/routes/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          start_lat: parseFloat(startLat),
          start_lng: parseFloat(startLng),
          end_lat: parseFloat(endLat),
          end_lng: parseFloat(endLng),
          vessel_speed_knots: parseFloat(speed),
        }),
      })

      if (!response.ok) throw new Error('Route planning failed')
      
      const data = await response.json()
      setRoute(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to plan route')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Route Input Form */}
      <div className="weather-card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Map size={20} className="text-primary-500" />
          Plan Weather-Aware Route
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Start Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin className="inline mr-1" size={16} />
              Start Location
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                step="0.01"
                placeholder="Latitude"
                value={startLat}
                onChange={e => setStartLat(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
              <input
                type="number"
                step="0.01"
                placeholder="Longitude"
                value={startLng}
                onChange={e => setStartLng(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

          {/* End Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Navigation className="inline mr-1" size={16} />
              Destination
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                step="0.01"
                placeholder="Latitude"
                value={endLat}
                onChange={e => setEndLat(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
              <input
                type="number"
                step="0.01"
                placeholder="Longitude"
                value={endLng}
                onChange={e => setEndLng(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
        </div>

        {/* Vessel Speed */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Clock className="inline mr-1" size={16} />
            Vessel Speed (knots)
          </label>
          <input
            type="number"
            step="0.5"
            min="1"
            max="20"
            value={speed}
            onChange={e => setSpeed(e.target.value)}
            className="w-full md:w-48 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>

        <button
          onClick={planRoute}
          disabled={loading}
          className="w-full md:w-auto px-6 py-3 bg-primary-500 text-white font-semibold rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="spinner w-5 h-5 border-2"></div>
              Planning Route...
            </>
          ) : (
            <>
              <Navigation size={18} />
              Calculate Route with Weather
            </>
          )}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="weather-card p-4 border-l-4 border-red-500 bg-red-50">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Route Result */}
      {route && (
        <div className="space-y-6">
          {/* Route Summary */}
          <div className={`weather-card p-6 border-2 ${
            route.overall_risk.status === 'recommended'
              ? 'border-green-500 bg-green-50'
              : 'border-red-500 bg-red-50'
          }`}>
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Route Summary</h3>
                <div className="space-y-2">
                  <div className="flex items-center text-gray-700">
                    <Navigation className="mr-2" size={18} />
                    <span className="font-semibold">{route.total_distance_nm} nautical miles</span>
                  </div>
                  <div className="flex items-center text-gray-700">
                    <Clock className="mr-2" size={18} />
                    <span className="font-semibold">{route.estimated_duration_hours} hours</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                {route.overall_risk.status === 'recommended' ? (
                  <div className="flex items-center text-green-600">
                    <CheckCircle className="mr-2" size={24} />
                    <span className="font-bold text-lg">RECOMMENDED</span>
                  </div>
                ) : (
                  <div className="flex items-center text-red-600">
                    <AlertTriangle className="mr-2" size={24} />
                    <span className="font-bold text-lg">NOT RECOMMENDED</span>
                  </div>
                )}
                <div className="mt-2 text-sm text-gray-600">
                  Max Risk: <span className="font-bold text-2xl" style={{ color: route.overall_risk.color }}>
                    {route.overall_risk.maximum_score}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Map */}
          <div className="weather-card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Map size={20} className="text-primary-500" />
              Route Visualization with Weather Risk
            </h3>
            <RouteMap 
              waypoints={route.waypoints}
              startLabel={`Start (${startLat}, ${startLng})`}
              endLabel={`Destination (${endLat}, ${endLng})`}
            />
          </div>

          {/* Waypoints */}
          <div className="weather-card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Route Waypoints with Weather</h3>
            <div className="space-y-3">
              {route.waypoints.map((wp, i) => (
                <div key={i} className={`p-4 rounded-lg border-l-4`} style={{ borderColor: wp.risk_color, backgroundColor: `${wp.risk_color}10` }}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-semibold text-gray-900">
                        {i === 0 ? '🚢 Start' : i === route.waypoints.length - 1 ? '🎯 Destination' : `Waypoint ${i + 1}`}: {wp.lat.toFixed(3)}°N, {wp.lng.toFixed(3)}°E
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        Wind: {wp.weather.wind_speed_knots}kt | Wave: {wp.weather.wave_height_m}m | 
                        Visibility: {wp.weather.visibility_km}km | Sea: {wp.weather.sea_state}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        ETA: {new Date(wp.eta).toLocaleString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold" style={{ color: wp.risk_color }}>
                        {wp.risk_score}
                      </div>
                      <div className="text-xs uppercase font-semibold" style={{ color: wp.risk_color }}>
                        {wp.risk_level}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {route.demo_mode && (
            <div className="text-center text-xs text-yellow-700 bg-yellow-50 py-2 px-4 rounded-lg border border-yellow-200">
              🔶 Using demonstration weather data for route planning
            </div>
          )}
        </div>
      )}
    </div>
  )
}
