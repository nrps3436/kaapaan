import { X, Wind, Waves, Eye, Compass, Droplets, CloudRain, Navigation } from 'lucide-react'

interface ForecastHour {
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
}

interface ForecastDetailModalProps {
  forecast: ForecastHour
  onClose: () => void
}

export default function ForecastDetailModal({ forecast, onClose }: ForecastDetailModalProps) {
  const getRiskColor = (score: number) => {
    if (score >= 86) return { color: '#DC2626', bg: '#FEE2E2', label: 'DANGEROUS' }
    if (score >= 61) return { color: '#F97316', bg: '#FFEDD5', label: 'HIGH RISK' }
    if (score >= 31) return { color: '#EAB308', bg: '#FEF9C3', label: 'MODERATE' }
    return { color: '#22C55E', bg: '#DCFCE7', label: 'SAFE' }
  }

  const risk = getRiskColor(forecast.risk_score)
  const forecastTime = new Date(forecast.timestamp)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden animate-slideUp">
        {/* Header */}
        <div className="relative p-6 border-b border-gray-200" style={{ background: `linear-gradient(135deg, ${risk.color}15, ${risk.color}05)` }}>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={24} className="text-gray-600" />
          </button>
          
          <div className="flex items-start gap-4">
            <div className="text-5xl">
              {forecast.sea_state === 'calm' ? '🌊' : forecast.sea_state === 'moderate' ? '🌊🌊' : '🌊🌊🌊'}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {forecast.hour_offset === 0 ? 'Current Conditions' : `Forecast +${forecast.hour_offset}h`}
              </h2>
              <p className="text-sm text-gray-600">
                {forecastTime.toLocaleString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Risk Badge */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-2">Overall Risk Assessment</p>
              <div className="flex items-center gap-3">
                <div 
                  className="text-5xl font-black"
                  style={{ color: risk.color }}
                >
                  {forecast.risk_score}
                </div>
                <div>
                  <div 
                    className="px-4 py-1.5 rounded-full font-bold text-sm"
                    style={{ color: risk.color, backgroundColor: risk.bg }}
                  >
                    {risk.label}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Risk Score (0-100)</p>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 mb-1">Sea State</p>
              <p className="text-lg font-bold text-gray-900 capitalize">{forecast.sea_state}</p>
            </div>
          </div>
        </div>

        {/* Detailed Metrics */}
        <div className="p-6 overflow-y-auto max-h-[400px]">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Detailed Conditions</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Wind Speed */}
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <Wind className="text-white" size={20} />
                </div>
                <div>
                  <p className="text-xs text-blue-600 font-semibold uppercase">Wind Speed</p>
                  <p className="text-2xl font-bold text-gray-900">{forecast.wind_speed_knots} kt</p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Gusts:</span>
                  <span className="font-semibold text-gray-900">{forecast.wind_gust_knots} kt</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Direction:</span>
                  <span className="font-semibold text-gray-900 flex items-center gap-1">
                    <Compass size={14} />
                    {forecast.wind_direction}
                  </span>
                </div>
              </div>
            </div>

            {/* Wave Height */}
            <div className="p-4 bg-cyan-50 rounded-xl border border-cyan-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-cyan-500 rounded-lg">
                  <Waves className="text-white" size={20} />
                </div>
                <div>
                  <p className="text-xs text-cyan-600 font-semibold uppercase">Wave Height</p>
                  <p className="text-2xl font-bold text-gray-900">{forecast.wave_height_m} m</p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Direction:</span>
                  <span className="font-semibold text-gray-900 flex items-center gap-1">
                    <Navigation size={14} />
                    {forecast.wave_direction}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">State:</span>
                  <span className="font-semibold text-gray-900 capitalize">{forecast.sea_state}</span>
                </div>
              </div>
            </div>

            {/* Visibility */}
            <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-purple-500 rounded-lg">
                  <Eye className="text-white" size={20} />
                </div>
                <div>
                  <p className="text-xs text-purple-600 font-semibold uppercase">Visibility</p>
                  <p className="text-2xl font-bold text-gray-900">{forecast.visibility_km} km</p>
                </div>
              </div>
              <div className="text-sm">
                <p className="text-gray-600">
                  {forecast.visibility_km >= 10 ? 'Excellent visibility' :
                   forecast.visibility_km >= 5 ? 'Good visibility' :
                   forecast.visibility_km >= 2 ? 'Moderate visibility' :
                   'Poor visibility - Exercise caution'}
                </p>
              </div>
            </div>

            {/* Precipitation */}
            <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-indigo-500 rounded-lg">
                  <CloudRain className="text-white" size={20} />
                </div>
                <div>
                  <p className="text-xs text-indigo-600 font-semibold uppercase">Precipitation</p>
                  <p className="text-2xl font-bold text-gray-900">{forecast.precipitation_mm} mm</p>
                </div>
              </div>
              <div className="text-sm">
                <p className="text-gray-600">
                  {forecast.precipitation_mm === 0 ? 'No rain expected' :
                   forecast.precipitation_mm < 2.5 ? 'Light rain' :
                   forecast.precipitation_mm < 10 ? 'Moderate rain' :
                   'Heavy rain expected'}
                </p>
              </div>
            </div>
          </div>

          {/* Safety Recommendations */}
          <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <span>⚠️</span>
              Safety Recommendations
            </h4>
            <ul className="space-y-2 text-sm text-gray-700">
              {forecast.risk_score >= 86 && (
                <>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500">•</span>
                    <span>⛔ <strong>DO NOT</strong> venture out - conditions are dangerous</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500">•</span>
                    <span>Return to port immediately if already at sea</span>
                  </li>
                </>
              )}
              {forecast.risk_score >= 61 && forecast.risk_score < 86 && (
                <>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-500">•</span>
                    <span>⚠️ High risk conditions - avoid going out if possible</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-500">•</span>
                    <span>If at sea, monitor conditions closely and prepare to return</span>
                  </li>
                </>
              )}
              {forecast.risk_score >= 31 && forecast.risk_score < 61 && (
                <>
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-500">•</span>
                    <span>⚡ Moderate conditions - exercise caution</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-500">•</span>
                    <span>Maintain communication and monitor weather updates</span>
                  </li>
                </>
              )}
              {forecast.risk_score < 31 && (
                <>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500">•</span>
                    <span>✅ Safe conditions for fishing operations</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500">•</span>
                    <span>Continue monitoring for any changes in conditions</span>
                  </li>
                </>
              )}
              <li className="flex items-start gap-2">
                <span className="text-gray-400">•</span>
                <span>Always carry safety equipment and communication devices</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-primary-500 text-white font-semibold rounded-lg hover:bg-primary-600 transition-colors"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  )
}
