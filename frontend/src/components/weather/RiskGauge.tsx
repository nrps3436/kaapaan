interface RiskGaugeProps {
  riskScore: number
  size?: number
}

export default function RiskGauge({ riskScore, size = 200 }: RiskGaugeProps) {
  // Clamp risk score between 0 and 100
  const score = Math.min(100, Math.max(0, riskScore))
  
  // Calculate needle angle (180 degrees total, from -90 to +90)
  // 0 = left (-90deg), 50 = top (0deg), 100 = right (+90deg)
  const needleAngle = -90 + (score * 1.8)
  
  // Determine risk level and color
  const getRiskLevel = (score: number) => {
    if (score < 30) return { level: 'SAFE', color: '#22C55E', bgColor: '#DCFCE7' }
    if (score < 60) return { level: 'MODERATE', color: '#EAB308', bgColor: '#FEF9C3' }
    if (score < 85) return { level: 'HIGH', color: '#F97316', bgColor: '#FFEDD5' }
    return { level: 'DANGEROUS', color: '#DC2626', bgColor: '#FEE2E2' }
  }
  
  const risk = getRiskLevel(score)
  
  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size * 0.6 }}>
        <svg width={size} height={size * 0.6} viewBox={`0 0 ${size} ${size * 0.6}`}>
          {/* Background arc segments */}
          {/* Green zone (0-30) */}
          <path
            d={describeArc(size / 2, size * 0.55, size * 0.35, -90, -36)}
            fill="none"
            stroke="#22C55E"
            strokeWidth="20"
            opacity="0.3"
          />
          
          {/* Yellow zone (30-60) */}
          <path
            d={describeArc(size / 2, size * 0.55, size * 0.35, -36, 18)}
            fill="none"
            stroke="#EAB308"
            strokeWidth="20"
            opacity="0.3"
          />
          
          {/* Orange zone (60-85) */}
          <path
            d={describeArc(size / 2, size * 0.55, size * 0.35, 18, 63)}
            fill="none"
            stroke="#F97316"
            strokeWidth="20"
            opacity="0.3"
          />
          
          {/* Red zone (85-100) */}
          <path
            d={describeArc(size / 2, size * 0.55, size * 0.35, 63, 90)}
            fill="none"
            stroke="#DC2626"
            strokeWidth="20"
            opacity="0.3"
          />
          
          {/* Active arc up to current value */}
          <path
            d={describeArc(size / 2, size * 0.55, size * 0.35, -90, needleAngle)}
            fill="none"
            stroke={risk.color}
            strokeWidth="20"
            strokeLinecap="round"
          />
          
          {/* Center circle */}
          <circle
            cx={size / 2}
            cy={size * 0.55}
            r="8"
            fill="#1F2937"
          />
          
          {/* Needle */}
          <line
            x1={size / 2}
            y1={size * 0.55}
            x2={size / 2 + (size * 0.3) * Math.cos((needleAngle - 90) * Math.PI / 180)}
            y2={size * 0.55 + (size * 0.3) * Math.sin((needleAngle - 90) * Math.PI / 180)}
            stroke="#1F2937"
            strokeWidth="3"
            strokeLinecap="round"
          />
          
          {/* Tick marks */}
          {[0, 25, 50, 75, 100].map(tick => {
            const angle = -90 + (tick * 1.8)
            const outerRadius = size * 0.35 + 10
            const innerRadius = size * 0.35 - 10
            const x1 = size / 2 + outerRadius * Math.cos((angle - 90) * Math.PI / 180)
            const y1 = size * 0.55 + outerRadius * Math.sin((angle - 90) * Math.PI / 180)
            const x2 = size / 2 + innerRadius * Math.cos((angle - 90) * Math.PI / 180)
            const y2 = size * 0.55 + innerRadius * Math.sin((angle - 90) * Math.PI / 180)
            
            return (
              <g key={tick}>
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="#6B7280"
                  strokeWidth="2"
                />
                <text
                  x={size / 2 + (outerRadius + 20) * Math.cos((angle - 90) * Math.PI / 180)}
                  y={size * 0.55 + (outerRadius + 20) * Math.sin((angle - 90) * Math.PI / 180)}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="#6B7280"
                  fontSize="12"
                  fontWeight="600"
                >
                  {tick}
                </text>
              </g>
            )
          })}
        </svg>
        
        {/* Center score display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ top: '45%' }}>
          <div 
            className="text-5xl font-bold"
            style={{ color: risk.color }}
          >
            {Math.round(score)}
          </div>
          <div 
            className="text-xs font-semibold uppercase mt-1 px-3 py-1 rounded-full"
            style={{ color: risk.color, backgroundColor: risk.bgColor }}
          >
            {risk.level}
          </div>
        </div>
      </div>
      
      {/* Legend */}
      <div className="flex gap-4 mt-4 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span className="text-gray-600">Safe (0-30)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <span className="text-gray-600">Moderate (30-60)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-orange-500"></div>
          <span className="text-gray-600">High (60-85)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <span className="text-gray-600">Dangerous (85-100)</span>
        </div>
      </div>
    </div>
  )
}

// Helper function to describe an SVG arc
function describeArc(x: number, y: number, radius: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(x, y, radius, endAngle)
  const end = polarToCartesian(x, y, radius, startAngle)
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1'
  
  return [
    'M', start.x, start.y,
    'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y
  ].join(' ')
}

function polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number) {
  const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0
  
  return {
    x: centerX + (radius * Math.cos(angleInRadians)),
    y: centerY + (radius * Math.sin(angleInRadians))
  }
}
