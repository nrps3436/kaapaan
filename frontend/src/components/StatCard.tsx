interface StatCardProps {
  label: string
  value: number
  color: 'blue' | 'cyan' | 'green' | 'amber' | 'orange' | 'red'
  icon: string
  blink?: boolean
}

const colorMap = {
  blue: 'from-blue-500/20 to-blue-600/10 border-blue-500/30 text-blue-300',
  cyan: 'from-cyan-500/20 to-cyan-600/10 border-cyan-500/30 text-cyan-300',
  green: 'from-green-500/20 to-green-600/10 border-green-500/30 text-green-300',
  amber: 'from-amber-500/20 to-amber-600/10 border-amber-500/30 text-amber-300',
  orange: 'from-orange-500/20 to-orange-600/10 border-orange-500/30 text-orange-300',
  red: 'from-red-500/20 to-red-600/10 border-red-500/30 text-red-300',
}

export default function StatCard({ label, value, color, icon, blink }: StatCardProps) {
  return (
    <div className={`rounded-2xl bg-gradient-to-br ${colorMap[color]} border p-5 ${blink && value > 0 ? 'sos-blink' : ''}`}>
      <div className="text-2xl mb-2">{icon}</div>
      <div className="text-3xl font-bold text-white">{value}</div>
      <div className="text-xs mt-1 opacity-80">{label}</div>
    </div>
  )
}
