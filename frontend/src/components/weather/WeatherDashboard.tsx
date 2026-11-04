import { useState, useEffect } from 'react'
import { Cloud, Wind, Waves, Eye, AlertTriangle, TrendingUp } from 'lucide-react'
import { api } from '../../api/client'

interface WeatherForecast {
  location: { lat: number; lng: number }
  source: string
  demo_mode: boolean
  disclaimer?: string
  forecast_hours: Array<{
    timestamp: string
    hour_offset: number
    wind_speed_knots: number
    wind_gust_knots: number
    wind_direction: string
    wave_height_m: number
    wave_direction: string
    visibility_km: number
    sea_state: string
    risk_score: number
    precipitation_mm: number
  }>
  alerts: Array<{
    type: string
    severity: string
    message: string
    issued_at: string
  }>
}

export default function WeatherDashboard({ lat = 10.0, lng = 80.0 }: { lat?: number; lng?: number }) {
  const [weather, setWeather] = useState<WeatherForecast | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchWeather()
    const interval = setInterval(fetchWeather, 180000) // Refresh every 3 min
    return () => clearInterval(interval)
  }, [lat, lng])

  const fetchWeather = async () => {
    try {
      setLoading(true)
      const data = await fetch(`/api/weather/forecast?lat=${lat}&lng=${lng}&hours=24`)
      const json = await data.json()
      setWeather(json)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch weather')
    } finally {
      setLoading(false)
    }
  }

  if (loading && !weather) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner"></div>
        <span className="ml-3 text-gray-600">Loading weather data...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="weather-card p-6 text-center">
        <AlertTriangle className="mx-auto text-red-500 mb-2" size={40} />
        <p className="text-red-600">{error}</p>
        <button onClick={fetchWeather} className="mt-4 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600">
          Retry
        </button>
      </div>
    )
  }

  if (!weather) return null

  const current = weather.forecast_hours[0]
  const getRiskColor = (score: number) => {
    if (score >= 86) return 'dangerous'
    if (score >= 61) return 'high'
    if (score >= 31) return 'moderate'
    return 'safe'
  }

  const riskLevel = getRiskColor(current.risk_score)

  return (
    <div className="space-y-6">
      {/* Demo Mode Banner */}
      {weather.demo_mode && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
          <div className="flex items-center">
            <AlertTriangle className="text-yellow-600 mr-3" size={20} />
            <div>
              <p className="text-sm font-medium text-yellow-800">Demonstration Mode</p>
              <p className="text-xs text-yellow-700 mt-1">{weather.disclaimer}</p>
            </div>
          </div>
        </div>
      )}

      {/* Active Alerts */}
      {weather.alerts.length > 0 && (
        <div className="space-y-2">
          {weather.alerts.map((alert, i) => (
            <div key={i} className="alert-banner p-4 rounded-lg">
              <div className="flex items-start">
                <AlertTriangle className="text-red-600 mr-3 mt-0.5" size={20} />
                <div>
                  <p className="font-semibold text-red-900">{alert.type.replace(/_/g, ' ')}</p>
                  <p className="text-sm text-red-700">{alert.message}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Current Conditions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Wind */}
        <div className="weather-card p-5">
          <div className="flex items-center justify-between mb-3">
            <Wind className="text-primary-500" size={28} />
            <span className="text-xs text-gray-500 uppercase tracking-wider">Wind</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">{current.wind_speed_knots}</div>
          <div className="text-sm text-gray-600">knots {current.wind_direction}</div>
          <div className="text-xs text-gray-500 mt-1">Gusts: {current.wind_gust_knots}kt</div>
        </div>

        {/* Wave Height */}
        <div className="weather-card p-5">
          <div className="flex items-center justify-between mb-3">
            <Waves className="text-primary-500 wave-animate" size={28} />
            <span className="text-xs text-gray-500 uppercase tracking-wider">Waves</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">{current.wave_height_m}</div>
          <div className="text-sm text-gray-600">meters {current.wave_direction}</div>
          <div className="text-xs text-gray-500 mt-1">State: {current.sea_state}</div>
        </div>

        {/* Visibility */}
        <div className="weather-card p-5">
          <div className="flex items-center justify-between mb-3">
            <Eye className="text-primary-500" size={28} />
            <span className="text-xs text-gray-500 uppercase tracking-wider">Visibility</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">{current.visibility_km}</div>
          <div className="text-sm text-gray-600">kilometers</div>
          <div className="text-xs text-gray-500 mt-1">&nbsp;</div>
        </div>

        {/* Risk Score */}
        <div className={`weather-card p-5 border-2 status-${riskLevel}`}>
          <div className="flex items-center justify-between mb-3">
            <TrendingUp className={`text-${riskLevel}`} size={28} />
            <span className="text-xs uppercase tracking-wider font-semibold">Risk</span>
          </div>
          <div className="text-3xl font-bold">{current.risk_score}</div>
          <div className="text-sm font-semibold uppercase">{riskLevel}</div>
          <div className="text-xs mt-1">Conditions</div>
        </div>
      </div>

      {/* Forecast Timeline */}
      <div className="weather-card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">24-Hour Forecast</h3>
        <div className="overflow-x-auto">
          <div className="flex gap-4 min-w-max">
            {weather.forecast_hours.map((hour, i) => {
              const hourRisk = getRiskColor(hour.risk_score)
              return (
                <div key={i} className={`flex-shrink-0 w-24 p-3 rounded-lg border-2 status-${hourRisk}`}>
                  <div className="text-xs font-medium text-gray-600 mb-2">
                    {hour.hour_offset === 0 ? 'Now' : `+${hour.hour_offset}h`}
                  </div>
                  <div className="text-center mb-2">
                    <div className="text-2xl">
                      {hour.sea_state === 'calm' ? '🌊' : hour.sea_state === 'moderate' ? '🌊🌊' : '🌊🌊🌊'}
                    </div>
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Wind:</span>
                      <span className="font-semibold">{hour.wind_speed_knots}kt</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Wave:</span>
                      <span className="font-semibold">{hour.wave_height_m}m</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Risk:</span>
                      <span className={`font-semibold text-${hourRisk}`}>{hour.risk_score}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Source Info */}
      <div className="text-center text-xs text-gray-500">
        Data source: {weather.source} | Location: {weather.location.lat.toFixed(2)}°N, {weather.location.lng.toFixed(2)}°E
      </div>
    </div>
  )
}
