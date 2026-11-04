import { useState, useEffect } from 'react'
import { Radio, AlertTriangle, CheckCircle, Clock, MapPin, Phone, User } from 'lucide-react'

interface SOSEvent {
  id: number
  fisherman_id: string
  lat: number
  lng: number
  message: string
  status: 'active' | 'acknowledged' | 'resolved'
  priority: 'critical' | 'high' | 'medium'
  acknowledged_by?: string
  timestamp: string
  resolved_at?: string
}

interface Fisherman {
  id: string
  name: string
  vessel: string
  phone: string
  status: string
  location?: {
    lat: number
    lng: number
    battery_pct: number
    signal_strength: number
  }
}

const statusStyles = {
  active: 'bg-red-50 border-red-500 text-red-700',
  acknowledged: 'bg-yellow-50 border-yellow-500 text-yellow-700',
  resolved: 'bg-green-50 border-green-500 text-green-700',
}

export default function SOSSystem() {
  const [sosEvents, setSOSEvents] = useState<SOSEvent[]>([])
  const [fishermen, setFishermen] = useState<Fisherman[]>([])
  const [selectedFisherman, setSelectedFisherman] = useState('')
  const [customMessage, setCustomMessage] = useState('')
  const [responderName, setResponderName] = useState('Coast Guard Operations')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 3000) // Refresh every 3 seconds
    return () => clearInterval(interval)
  }, [])

  const fetchData = async () => {
    try {
      const [sosRes, fishermenRes] = await Promise.all([
        fetch('/api/sos'),
        fetch('/api/fishermen'),
      ])
      const sosData = await sosRes.json()
      const fishermenData = await fishermenRes.json()
      setSOSEvents(sosData)
      setFishermen(fishermenData)
    } catch (e) {
      console.error('Failed to fetch data:', e)
    }
  }

  const triggerSOS = async () => {
    if (!selectedFisherman) return
    
    const fisherman = fishermen.find(f => f.id === selectedFisherman)
    if (!fisherman?.location) {
      alert('No location data for selected fisherman')
      return
    }

    setLoading(true)
    try {
      await fetch('/api/sos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fisherman_id: selectedFisherman,
          lat: fisherman.location.lat,
          lng: fisherman.location.lng,
          message: customMessage || 'Emergency SOS - Immediate assistance required',
        }),
      })
      setSelectedFisherman('')
      setCustomMessage('')
      fetchData()
    } catch (e) {
      alert('Failed to trigger SOS')
    } finally {
      setLoading(false)
    }
  }

  const updateSOSStatus = async (id: number, status: string) => {
    try {
      await fetch(`/api/sos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          acknowledged_by: status !== 'active' ? responderName : undefined,
        }),
      })
      fetchData()
    } catch (e) {
      alert('Failed to update SOS status')
    }
  }

  const activeEvents = sosEvents.filter(e => e.status === 'active')
  const historyEvents = sosEvents.filter(e => e.status !== 'active')

  return (
    <div className="space-y-6">
      {/* Active SOS Alert Banner */}
      {activeEvents.length > 0 && (
        <div className="bg-red-100 border-l-4 border-red-600 p-4 rounded-r-lg animate-pulse">
          <div className="flex items-center">
            <AlertTriangle className="text-red-600 mr-3" size={24} />
            <div>
              <p className="font-bold text-red-900 text-lg">🚨 {activeEvents.length} ACTIVE EMERGENCY</p>
              <p className="text-red-700 text-sm">Immediate response required</p>
            </div>
          </div>
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="weather-card p-4">
          <div className="text-gray-600 text-sm mb-1">Total SOS Events</div>
          <div className="text-3xl font-bold text-gray-900">{sosEvents.length}</div>
        </div>
        <div className="weather-card p-4 border-l-4 border-red-500">
          <div className="text-gray-600 text-sm mb-1">Active</div>
          <div className="text-3xl font-bold text-red-600">{activeEvents.length}</div>
        </div>
        <div className="weather-card p-4 border-l-4 border-yellow-500">
          <div className="text-gray-600 text-sm mb-1">Acknowledged</div>
          <div className="text-3xl font-bold text-yellow-600">
            {sosEvents.filter(e => e.status === 'acknowledged').length}
          </div>
        </div>
        <div className="weather-card p-4 border-l-4 border-green-500">
          <div className="text-gray-600 text-sm mb-1">Resolved</div>
          <div className="text-3xl font-bold text-green-600">
            {sosEvents.filter(e => e.status === 'resolved').length}
          </div>
        </div>
      </div>

      {/* Trigger New SOS */}
      <div className="weather-card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Radio className="text-red-500" size={20} />
          Trigger Emergency SOS
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Fisherman
            </label>
            <select
              value={selectedFisherman}
              onChange={e => setSelectedFisherman(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
            >
              <option value="">Choose fisherman...</option>
              {fishermen.map(f => (
                <option key={f.id} value={f.id}>
                  {f.name} ({f.id}) - {f.vessel}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Emergency Message (Optional)
            </label>
            <input
              type="text"
              value={customMessage}
              onChange={e => setCustomMessage(e.target.value)}
              placeholder="e.g., Engine failure, medical emergency"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />
          </div>
        </div>
        <button
          onClick={triggerSOS}
          disabled={!selectedFisherman || loading}
          className="w-full md:w-auto px-8 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg"
        >
          <Radio size={20} />
          {loading ? 'SENDING SOS...' : 'SEND EMERGENCY SOS'}
        </button>
        <p className="text-xs text-gray-500 mt-2">
          ⚠️ This is a real SOS system. Use only for genuine emergencies in production.
        </p>
      </div>

      {/* Active SOS Events */}
      {activeEvents.length > 0 && (
        <div className="weather-card border-2 border-red-500">
          <div className="bg-red-50 p-4 border-b border-red-200">
            <h3 className="text-lg font-semibold text-red-900 flex items-center gap-2">
              <AlertTriangle size={20} />
              Active Emergency Events ({activeEvents.length})
            </h3>
          </div>
          <div className="divide-y divide-red-200">
            {activeEvents.map(event => {
              const fisherman = fishermen.find(f => f.id === event.fisherman_id)
              return (
                <div key={event.id} className="p-6 bg-red-50">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center text-white text-2xl animate-pulse">
                          🆘
                        </div>
                        <div>
                          <div className="text-xl font-bold text-red-900">
                            {fisherman?.name || event.fisherman_id}
                          </div>
                          <div className="text-sm text-red-700">
                            {fisherman?.vessel || 'Unknown vessel'}
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-gray-700">
                          <MapPin size={16} className="text-red-600" />
                          <span className="font-semibold">Position:</span>
                          <span>{event.lat.toFixed(4)}°N, {event.lng.toFixed(4)}°E</span>
                        </div>
                        {fisherman?.phone && (
                          <div className="flex items-center gap-2 text-gray-700">
                            <Phone size={16} className="text-red-600" />
                            <span className="font-semibold">Contact:</span>
                            <span>{fisherman.phone}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-gray-700">
                          <Clock size={16} className="text-red-600" />
                          <span className="font-semibold">Time:</span>
                          <span>{new Date(event.timestamp).toLocaleString()}</span>
                        </div>
                        <div className="mt-2 p-3 bg-white border border-red-300 rounded-lg">
                          <p className="text-gray-900 font-medium">{event.message}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 ml-4">
                      <button
                        onClick={() => updateSOSStatus(event.id, 'acknowledged')}
                        className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg text-sm font-semibold transition-all flex items-center gap-1"
                      >
                        <Clock size={16} />
                        Acknowledge
                      </button>
                      <button
                        onClick={() => updateSOSStatus(event.id, 'resolved')}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-semibold transition-all flex items-center gap-1"
                      >
                        <CheckCircle size={16} />
                        Resolve
                      </button>
                    </div>
                  </div>
                  {fisherman?.location && (
                    <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                      <div className="bg-white p-2 rounded border border-red-200">
                        <div className="text-gray-600">Battery</div>
                        <div className={`font-bold ${fisherman.location.battery_pct < 20 ? 'text-red-600' : 'text-gray-900'}`}>
                          {fisherman.location.battery_pct}%
                        </div>
                      </div>
                      <div className="bg-white p-2 rounded border border-red-200">
                        <div className="text-gray-600">Signal</div>
                        <div className={`font-bold ${fisherman.location.signal_strength < 40 ? 'text-red-600' : 'text-gray-900'}`}>
                          {fisherman.location.signal_strength}%
                        </div>
                      </div>
                      <div className="bg-white p-2 rounded border border-red-200">
                        <div className="text-gray-600">Priority</div>
                        <div className="font-bold text-red-600 uppercase">{event.priority}</div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {activeEvents.length === 0 && (
        <div className="weather-card p-12 text-center border-2 border-green-500">
          <CheckCircle className="mx-auto text-green-500 mb-4" size={64} />
          <h3 className="text-xl font-semibold text-green-900 mb-2">No Active Emergencies</h3>
          <p className="text-green-700">All vessels are safe and accounted for</p>
        </div>
      )}

      {/* Responder Info */}
      <div className="weather-card p-4">
        <div className="flex items-center gap-3">
          <User size={20} className="text-gray-600" />
          <div className="flex-1">
            <label className="text-sm text-gray-600">Responder ID</label>
            <input
              type="text"
              value={responderName}
              onChange={e => setResponderName(e.target.value)}
              className="w-full mt-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
      </div>

      {/* History */}
      {historyEvents.length > 0 && (
        <div className="weather-card">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Emergency History ({historyEvents.length})</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {historyEvents.slice(0, 10).map(event => {
              const fisherman = fishermen.find(f => f.id === event.fisherman_id)
              return (
                <div key={event.id} className={`p-4 border-l-4 ${statusStyles[event.status]}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">
                        {fisherman?.name || event.fisherman_id}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">{event.message}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(event.timestamp).toLocaleString()}
                        {event.acknowledged_by && ` • Handled by ${event.acknowledged_by}`}
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${statusStyles[event.status]}`}>
                      {event.status}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
