import { AgentStatus, Recommendation } from '../types'
import { Zap, AlertTriangle, CheckCircle, RefreshCw, Bot } from 'lucide-react'

const riskColors: Record<string, string> = {
  high: 'text-red-400 bg-red-500/10 border-red-500/20',
  medium: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  low: 'text-green-400 bg-green-500/10 border-green-500/20',
  critical: 'text-red-400 bg-red-500/20 border-red-500/40',
}

interface Props {
  agent: AgentStatus | null
  loading: boolean
  onRun: () => void
}

function RecommendationCard({ rec }: { rec: Recommendation }) {
  const riskStyle = riskColors[rec.risk_level.toLowerCase()] || riskColors.low
  return (
    <div className="rounded-xl bg-[#111d35] border border-[#162040] p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <div className="font-semibold text-white">{rec.fisherman_name}</div>
          <div className="text-xs text-slate-500">{rec.fisherman_id}</div>
        </div>
        <span className={`text-xs px-3 py-1 rounded-full border font-bold uppercase ${riskStyle}`}>
          {rec.risk_level}
        </span>
      </div>
      <p className="text-sm text-slate-300 leading-relaxed mb-3">{rec.message}</p>
      {rec.tamil_summary && (
        <div className="mb-3 p-3 rounded-lg bg-[#162040] border border-[#1a2650]">
          <p className="text-xs text-blue-300 font-medium mb-1">தமிழ் சுருக்கம் (Tamil Summary)</p>
          <p className="text-sm text-slate-300">{rec.tamil_summary}</p>
        </div>
      )}
      {rec.actions.length > 0 && (
        <div>
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-2">Recommended Actions</p>
          <ul className="space-y-1">
            {rec.actions.map((action, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-slate-400">
                <span className="text-blue-400 mt-0.5">→</span>
                {action}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default function AIRecommendations({ agent, loading, onRun }: Props) {
  return (
    <div className="space-y-6">
      {/* Agent Info Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-blue-900/30 to-cyan-900/20 border border-blue-500/20 p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
            <Bot size={20} className="text-blue-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Strands AI Safety Agent</h3>
            <p className="text-xs text-slate-400">Amazon Bedrock · {agent?.model_id || 'us.amazon.nova-2-lite-v1:0'} · {agent?.region || 'us-east-1'}</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {agent?.fallback && (
              <span className="text-xs px-2 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                ⚠ Deterministic fallback
              </span>
            )}
            {agent?.status === 'ok' && !agent.fallback && (
              <span className="text-xs px-2 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 flex items-center gap-1">
                <CheckCircle size={10} /> Bedrock OK
              </span>
            )}
          </div>
        </div>
        <p className="text-sm text-slate-400 leading-relaxed">
          The AI agent uses the Strands Agents SDK to analyse simulated telemetry data, assess geofence risks,
          and generate safety recommendations for each fisherman. Results are powered by Amazon Bedrock Nova 2 Lite.
          If Bedrock is unavailable, a clearly labelled deterministic fallback is used.
        </p>
      </div>

      {!agent && !loading && (
        <div className="rounded-2xl bg-[#0d1526] border border-[#162040] p-12 text-center">
          <Zap size={40} className="text-blue-400 mx-auto mb-4 opacity-60" />
          <h3 className="text-white font-semibold mb-2">Run AI Safety Analysis</h3>
          <p className="text-slate-500 text-sm mb-6">The Strands agent will analyse all fishermen and generate safety recommendations.</p>
          <button
            onClick={onRun}
            disabled={loading}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-all shadow-lg shadow-blue-500/20"
          >
            <Zap size={16} />
            Run AI Analysis
          </button>
        </div>
      )}

      {loading && (
        <div className="rounded-2xl bg-[#0d1526] border border-[#162040] p-12 text-center">
          <RefreshCw size={32} className="text-blue-400 mx-auto mb-4 animate-spin" />
          <p className="text-white font-medium">Strands agent analysing fishermen...</p>
          <p className="text-slate-500 text-sm mt-2">Calling Amazon Bedrock Nova 2 Lite</p>
        </div>
      )}

      {agent && !loading && agent.recommendations.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">
              AI Recommendations ({agent.recommendations.length} fishermen)
            </h3>
            {agent.last_run && (
              <span className="text-xs text-slate-500">
                Last run: {new Date(agent.last_run).toLocaleTimeString()}
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {agent.recommendations.map(rec => (
              <RecommendationCard key={rec.fisherman_id} rec={rec} />
            ))}
          </div>
        </>
      )}

      {agent && !loading && agent.recommendations.length === 0 && (
        <div className="rounded-2xl bg-[#0d1526] border border-[#162040] p-8 text-center">
          <AlertTriangle size={24} className="text-amber-400 mx-auto mb-3" />
          <p className="text-slate-400">No recommendations generated. Try running the analysis again.</p>
        </div>
      )}
    </div>
  )
}
