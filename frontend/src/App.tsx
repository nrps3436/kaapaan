import { useState, useEffect, useCallback } from 'react'
import { Anchor, Activity, AlertTriangle, Map, Radio, Settings, RefreshCw, Play, Pause, RotateCcw, Zap } from 'lucide-react'
import { api } from './api/client'
import { DashboardStats, FishermanWithLocation, Alert, SOSEvent, AgentStatus } from './types'
import { useSimulation } from './hooks/useSimulation'
import MapView from './components/MapView'
import FishermanList from './components/FishermanList'
import AlertPanel from './components/AlertPanel'
import SOSPanel from './components/SOSPanel'
import AIRecommendations from './components/AIRecommendations'
import StatCard from './components/StatCard'

type Page = 'dashboard' | 'map' | 'alerts' | 'sos' | 'ai'

export default function App() {
  const [page, setPage] = useState<Page>('dashboard')
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [fishermen, setFishermen] = useState<FishermanWithLocation[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [sos, setSos] = useState<SOSEvent[]>([])
  const [agent, setAgent] = useState<AgentStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [agentLoading, setAgentLoading] = useState(false)
  const { running, tick, start, pause, reset } = useSimulation()

  const fetchAll = useCallback(async () => {
    try {
      const [s, f, a, sosData] = await Promise.all([
        api.getDashboard(),
        api.getFishermen(),
        api.getAlerts(),
        api.getSOS(),
      ])
      setStats(s)
      setFishermen(f)
      setAlerts(a)
      setSos(sosData)
      setError(null)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }, [])

  const runAgent = useCallback(async () => {
    setAgentLoading(true)
    try {
      const status = await api.getAgentStatus()
      setAgent(status)
    } catch (e) {
      console.error('agent error', e)
    } finally {
      setAgentLoading(false)
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll, tick])
  useEffect(() => { if (running) runAgent() }, [tick]) // eslint-disable-line

  const activeSOS = sos.filter(s => s.status === 'active').length

  const navItems: { id: Page; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <Activity size={18} /> },
    { id: 'map', label: 'Live Map', icon: <Map size={18} /> },
    { id: 'alerts', label: 'Alerts', icon: <AlertTriangle size={18} />, badge: alerts.filter(a => !a.acknowledged).length },
    { id: 'sos', label: 'SOS', icon: <Radio size={18} />, badge: activeSOS },
    { id: 'ai', label: 'AI Safety', icon: <Zap size={18} /> },
  ]

  return (
    <div className="flex h-screen bg-[#0a0f1e] text-slate-200 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-[#0d1526] border-r border-[#162040] flex flex-col">
        {/* Logo */}
        <div className="p-5 border-b border-[#162040]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Anchor size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-wider">KAAPPAAN</h1>
              <p className="text-xs text-blue-400">காப்பான் · Maritime Safety</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setPage(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                page === item.id
                  ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30'
                  : 'text-slate-400 hover:bg-[#162040] hover:text-slate-200'
              }`}
            >
              {item.icon}
              <span className="flex-1 text-left">{item.label}</span>
              {item.badge != null && item.badge > 0 && (
                <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                  item.id === 'sos' ? 'bg-red-500 text-white sos-blink' : 'bg-amber-500/20 text-amber-300'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Simulation Controls */}
        <div className="p-4 border-t border-[#162040]">
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-3 flex items-center gap-2">
            <Settings size={12} /> Simulation
          </p>
          <div className="flex gap-2">
            <button
              onClick={running ? pause : start}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all ${
                running
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30'
                  : 'bg-green-500/20 text-green-300 border border-green-500/30 hover:bg-green-500/30'
              }`}
            >
              {running ? <><Pause size={12} /> Pause</> : <><Play size={12} /> Start</>}
            </button>
            <button
              onClick={reset}
              className="flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-xs font-medium bg-slate-700/50 text-slate-400 border border-slate-600/30 hover:bg-slate-700 transition-all"
            >
              <RotateCcw size={12} />
            </button>
          </div>
          <div className={`mt-2 text-center text-xs ${running ? 'text-green-400' : 'text-slate-500'}`}>
            {running ? '● Simulation running' : '○ Simulation paused'}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-[#0d1526]/95 backdrop-blur border-b border-[#162040] px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">
              {navItems.find(n => n.id === page)?.label}
            </h2>
            <p className="text-xs text-slate-500">Bay of Bengal · Simulated tracking — not official maritime data</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchAll}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#162040] text-slate-400 hover:text-slate-200 text-sm transition-all"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
            {page === 'ai' && (
              <button
                onClick={runAgent}
                disabled={agentLoading}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-all disabled:opacity-50"
              >
                <Zap size={14} className={agentLoading ? 'animate-spin' : ''} />
                {agentLoading ? 'Analysing...' : 'Run AI Analysis'}
              </button>
            )}
          </div>
        </header>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-4 rounded-xl bg-red-900/20 border border-red-500/30 text-red-300 text-sm">
              ⚠ {error} — make sure the backend is running on port 8000.
            </div>
          )}

          {loading && page === 'dashboard' && (
            <div className="flex items-center justify-center h-64 text-slate-500">
              <RefreshCw size={24} className="animate-spin mr-3" /> Loading...
            </div>
          )}

          {/* Dashboard */}
          {page === 'dashboard' && !loading && (
            <div className="space-y-6">
              {/* Stats Grid */}
              {stats && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  <StatCard label="Total Fishermen" value={stats.total_fishermen} color="blue" icon="👤" />
                  <StatCard label="Active Devices" value={stats.active_devices} color="cyan" icon="📡" />
                  <StatCard label="Safe" value={stats.safe} color="green" icon="✅" />
                  <StatCard label="Warning" value={stats.warning} color="amber" icon="⚠️" />
                  <StatCard label="Critical" value={stats.critical} color="orange" icon="🔴" />
                  <StatCard label="SOS Active" value={stats.sos} color="red" icon="🆘" blink={stats.sos > 0} />
                </div>
              )}

              {/* Map + List side by side */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 rounded-2xl overflow-hidden border border-[#162040]" style={{ height: '420px' }}>
                  <MapView fishermen={fishermen} />
                </div>
                <div className="rounded-2xl bg-[#0d1526] border border-[#162040] overflow-hidden">
                  <div className="p-4 border-b border-[#162040]">
                    <h3 className="text-sm font-semibold text-white">Fishermen Status</h3>
                  </div>
                  <FishermanList fishermen={fishermen} onSOS={async (id) => {
                    const f = fishermen.find(f => f.id === id)
                    if (!f?.location) return
                    await api.postSOS({ fisherman_id: id, lat: f.location.lat, lng: f.location.lng, message: 'Manual SOS from dashboard' })
                    fetchAll()
                  }} />
                </div>
              </div>

              {/* Recent Alerts */}
              <div className="rounded-2xl bg-[#0d1526] border border-[#162040] overflow-hidden">
                <div className="p-4 border-b border-[#162040]">
                  <h3 className="text-sm font-semibold text-white">Recent Alerts</h3>
                </div>
                <AlertPanel alerts={alerts.slice(0, 6)} onAck={fetchAll} />
              </div>
            </div>
          )}

          {page === 'map' && (
            <div className="rounded-2xl overflow-hidden border border-[#162040]" style={{ height: 'calc(100vh - 160px)' }}>
              <MapView fishermen={fishermen} fullscreen />
            </div>
          )}

          {page === 'alerts' && (
            <div className="rounded-2xl bg-[#0d1526] border border-[#162040] overflow-hidden">
              <div className="p-4 border-b border-[#162040] flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">All Alerts ({alerts.length})</h3>
                <span className="text-xs text-amber-300 bg-amber-500/10 px-3 py-1 rounded-full">
                  {alerts.filter(a => !a.acknowledged).length} unacknowledged
                </span>
              </div>
              <AlertPanel alerts={alerts} onAck={fetchAll} />
            </div>
          )}

          {page === 'sos' && (
            <SOSPanel
              events={sos}
              fishermen={fishermen}
              onUpdate={async (id, data) => {
                await api.patchSOS(id, data)
                fetchAll()
              }}
              onNewSOS={async (fishermanId) => {
                const f = fishermen.find(f => f.id === fishermanId)
                if (!f?.location) return
                await api.postSOS({
                  fisherman_id: fishermanId,
                  lat: f.location.lat,
                  lng: f.location.lng,
                  message: 'Emergency SOS activated',
                })
                fetchAll()
              }}
            />
          )}

          {page === 'ai' && (
            <AIRecommendations
              agent={agent}
              loading={agentLoading}
              onRun={runAgent}
            />
          )}
        </div>
      </main>
    </div>
  )
}
