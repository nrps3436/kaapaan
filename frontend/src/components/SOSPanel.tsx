import { useState } from 'react'
import { SOSEvent, FishermanWithLocation } from '../types'
import { Radio, CheckCircle, Clock, AlertOctagon } from 'lucide-react'

interface Props {
  events: SOSEvent[]
  fishermen: FishermanWithLocation[]
  onUpdate: (id: number, data: { status: string; acknowledged_by?: string }) => void
  onNewSOS: (fishermanId: string) => void
}

const statusStyle = {
  active: 'bg-red-500/20 text-red-300 border-red-500/30 sos-blink',
  acknowledged: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  resolved: 'bg-green-500/20 text-green-300 border-green-500/30',
}

const priorityStyle = {
  critical: 'text-red-400',
  high: 'text-orange-400',
  medium: 'text-amber-400',
}

export default function SOSPanel({ events, fishermen, onUpdate, onNewSOS }: Props) {
  const [responder, setResponder] = useState('Coast Guard Ops')
  const [selectedFisherman, setSelectedFisherman] = useState('')

  const active = events.filter(e => e.status === 'active')
  const history = events.filter(e => e.status !== 'active')

  return (
    <div className="space-y-6">
      {/* Trigger SOS */}
      <div className="rounded-2xl bg-[#0d1526] border border-[#162040] p-5">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Radio size={16} className="text-red-400" /> Trigger Emergency SOS
        </h3>
        <div className="flex gap-3">
          <select
            value={selectedFisherman}
            onChange={e => setSelectedFisherman(e.target.value)}
            className="flex-1 bg-[#162040] text-slate-200 border border-[#1a2650] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
          >
            <option value="">Select fisherman...</option>
            {fishermen.map(f => (
              <option key={f.id} value={f.id}>{f.name} ({f.id})</option>
            ))}
          </select>
          <button
            onClick={() => { if (selectedFisherman) { onNewSOS(selectedFisherman); setSelectedFisherman('') } }}
            disabled={!selectedFisherman}
            className="flex items-center gap-2 px-5 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm font-bold transition-all disabled:opacity-40 shadow-lg shadow-red-500/20"
          >
            <Radio size={14} />
            SEND SOS
          </button>
        </div>
        <p className="text-xs text-slate-500 mt-2">⚠ This is a simulated SOS for demo purposes only</p>
      </div>

      {/* Active SOS */}
      {active.length > 0 && (
        <div className="rounded-2xl bg-[#0d1526] border border-red-500/30 overflow-hidden">
          <div className="p-4 border-b border-red-500/20 bg-red-500/10">
            <h3 className="text-sm font-semibold text-red-300 flex items-center gap-2">
              <AlertOctagon size={16} /> Active SOS Emergencies ({active.length})
            </h3>
          </div>
          <div className="divide-y divide-[#162040]">
            {active.map(evt => (
              <div key={evt.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-bold ${statusStyle[evt.status]}`}>
                        🆘 {evt.status.toUpperCase()}
                      </span>
                      <span className={`text-xs font-semibold ${priorityStyle[evt.priority]}`}>
                        Priority: {evt.priority.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-white font-semibold">{evt.fisherman_id}</div>
                    <p className="text-sm text-slate-400 mt-1">{evt.message}</p>
                    <div className="mt-2 flex gap-4 text-xs text-slate-500">
                      <span>📍 {evt.lat.toFixed(4)}°N, {evt.lng.toFixed(4)}°E</span>
                      <span>🕐 {new Date(evt.timestamp).toLocaleTimeString()}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => onUpdate(evt.id, { status: 'acknowledged', acknowledged_by: responder })}
                      className="flex items-center gap-1 px-3 py-2 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 transition-all text-xs font-medium"
                    >
                      <Clock size={12} /> Acknowledge
                    </button>
                    <button
                      onClick={() => onUpdate(evt.id, { status: 'resolved', acknowledged_by: responder })}
                      className="flex items-center gap-1 px-3 py-2 rounded-lg bg-green-500/20 text-green-300 border border-green-500/30 hover:bg-green-500/30 transition-all text-xs font-medium"
                    >
                      <CheckCircle size={12} /> Resolve
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="p-3 bg-[#0d1526] border-t border-[#162040]">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Responder ID:</span>
              <input
                value={responder}
                onChange={e => setResponder(e.target.value)}
                className="bg-[#162040] text-slate-200 border border-[#1a2650] rounded px-2 py-1 text-xs focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      )}

      {active.length === 0 && (
        <div className="rounded-2xl bg-[#0d1526] border border-green-500/20 p-8 text-center">
          <CheckCircle size={32} className="text-green-400 mx-auto mb-3" />
          <p className="text-green-300 font-medium">No active SOS emergencies</p>
          <p className="text-slate-500 text-sm mt-1">All fishermen accounted for</p>
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <div className="rounded-2xl bg-[#0d1526] border border-[#162040] overflow-hidden">
          <div className="p-4 border-b border-[#162040]">
            <h3 className="text-sm font-semibold text-white">Emergency History ({history.length})</h3>
          </div>
          <div className="divide-y divide-[#162040]">
            {history.map(evt => (
              <div key={evt.id} className="p-4 flex items-center gap-3 opacity-70">
                <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${statusStyle[evt.status]}`}>
                  {evt.status}
                </span>
                <div className="flex-1 min-w-0">
                  <span className="text-sm text-white">{evt.fisherman_id}</span>
                  <span className="text-xs text-slate-500 ml-2">{evt.message}</span>
                </div>
                <span className="text-xs text-slate-500">{new Date(evt.timestamp).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
