import { FishermanWithLocation, Status } from '../types'
import { Radio } from 'lucide-react'

const statusConfig: Record<Status, { label: string; color: string; dot: string }> = {
  safe: { label: 'Safe', color: 'text-green-400 bg-green-500/10 border-green-500/20', dot: 'bg-green-400' },
  warning: { label: 'Warning', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20', dot: 'bg-amber-400' },
  critical: { label: 'Critical', color: 'text-red-400 bg-red-500/10 border-red-500/20', dot: 'bg-red-400' },
  sos: { label: 'SOS', color: 'text-red-400 bg-red-500/20 border-red-500/40', dot: 'bg-red-500 sos-blink' },
}

interface Props {
  fishermen: FishermanWithLocation[]
  onSOS: (id: string) => void
}

export default function FishermanList({ fishermen, onSOS }: Props) {
  return (
    <div className="divide-y divide-[#162040] overflow-auto" style={{ maxHeight: '380px' }}>
      {fishermen.length === 0 && (
        <div className="p-6 text-center text-slate-500 text-sm">No fishermen data</div>
      )}
      {fishermen.map(f => {
        const cfg = statusConfig[f.status]
        const loc = f.location
        return (
          <div key={f.id} className="p-4 hover:bg-[#162040]/50 transition-colors">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full border font-medium ${cfg.color}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                    {cfg.label}
                  </span>
                  <span className="text-xs text-slate-500">{f.id}</span>
                </div>
                <div className="font-medium text-sm text-white truncate">{f.name}</div>
                <div className="text-xs text-slate-500 truncate">{f.vessel}</div>
                {loc && (
                  <div className="mt-1.5 flex gap-3 text-xs text-slate-500">
                    <span>🔋 {loc.battery_pct}%</span>
                    <span>⚡ {loc.speed_knots.toFixed(1)}kn</span>
                    <span>📶 {loc.signal_strength}%</span>
                  </div>
                )}
              </div>
              {f.status !== 'sos' && (
                <button
                  onClick={() => onSOS(f.id)}
                  className="flex-shrink-0 flex items-center gap-1 px-2 py-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all text-xs font-medium"
                  title="Trigger SOS"
                >
                  <Radio size={12} />
                  SOS
                </button>
              )}
              {f.status === 'sos' && (
                <span className="flex-shrink-0 text-xs text-red-400 sos-blink font-bold">🆘 ACTIVE</span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
