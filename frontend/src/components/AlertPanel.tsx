import { Alert, Status } from '../types'
import { CheckCircle, AlertTriangle, AlertOctagon, Radio } from 'lucide-react'
import { api } from '../api/client'
import { useState } from 'react'

const severityIcon = (s: Status) => {
  if (s === 'sos') return <Radio size={14} className="text-red-400" />
  if (s === 'critical') return <AlertOctagon size={14} className="text-orange-400" />
  if (s === 'warning') return <AlertTriangle size={14} className="text-amber-400" />
  return <CheckCircle size={14} className="text-green-400" />
}

const severityBg: Record<Status, string> = {
  safe: 'border-green-500/20 bg-green-500/5',
  warning: 'border-amber-500/20 bg-amber-500/5',
  critical: 'border-orange-500/20 bg-orange-500/5',
  sos: 'border-red-500/30 bg-red-500/10',
}

interface Props {
  alerts: Alert[]
  onAck: () => void
}

export default function AlertPanel({ alerts, onAck }: Props) {
  const [acking, setAcking] = useState<number | null>(null)

  const ack = async (id: number) => {
    setAcking(id)
    try {
      await api.patchSOS(id, { status: 'acknowledged' }).catch(() => {})
      // Fallback: just refetch
      onAck()
    } finally {
      setAcking(null)
    }
  }

  if (alerts.length === 0) {
    return <div className="p-6 text-center text-slate-500 text-sm">No alerts — all fishermen safe ✅</div>
  }

  return (
    <div className="divide-y divide-[#162040]">
      {alerts.map(alert => (
        <div key={alert.id} className={`p-4 border-l-2 ${severityBg[alert.severity]} ${alert.acknowledged ? 'opacity-50' : ''}`}
          style={{ borderLeftColor: alert.severity === 'sos' ? '#dc2626' : alert.severity === 'critical' ? '#f97316' : alert.severity === 'warning' ? '#f59e0b' : '#22c55e' }}>
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2 flex-1 min-w-0">
              <div className="mt-0.5">{severityIcon(alert.severity)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-white">{alert.fisherman_id}</span>
                  <span className="text-xs text-slate-500">{alert.alert_type}</span>
                  {alert.acknowledged && <span className="text-xs text-green-400 bg-green-500/10 px-2 rounded-full">Acknowledged</span>}
                </div>
                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{alert.message}</p>
                <div className="flex gap-3 mt-1 text-xs text-slate-500">
                  {alert.distance_km != null && <span>📍 {alert.distance_km.toFixed(1)} km to zone</span>}
                  {alert.time_to_boundary_min != null && alert.time_to_boundary_min > 0 && (
                    <span>⏱ ~{Math.round(alert.time_to_boundary_min)} min to boundary</span>
                  )}
                  <span>{new Date(alert.timestamp).toLocaleTimeString()}</span>
                </div>
              </div>
            </div>
            {!alert.acknowledged && (
              <button
                onClick={() => ack(alert.id)}
                disabled={acking === alert.id}
                className="flex-shrink-0 text-xs px-3 py-1 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-all"
              >
                {acking === alert.id ? '...' : 'Ack'}
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
