'use client'

interface Props {
  consumed: number
  goal: number
  size?: number
}

export default function CalorieRing({ consumed, goal, size = 160 }: Props) {
  const radius = (size - 24) / 2
  const circumference = 2 * Math.PI * radius
  const pct = Math.min(consumed / goal, 1)
  const offset = circumference - pct * circumference
  const remaining = Math.max(goal - consumed, 0)
  const over = consumed > goal

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth={12}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={over ? '#ef4444' : '#10b981'}
            strokeWidth={12}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-500"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-2xl font-bold ${over ? 'text-red-500' : 'text-gray-800'}`}>
            {consumed.toFixed(0)}
          </span>
          <span className="text-xs text-gray-500">kcal</span>
        </div>
      </div>
      <div className="mt-2 text-center">
        <p className="text-sm text-gray-600">
          {over ? (
            <span className="text-red-500 font-medium">
              +{(consumed - goal).toFixed(0)} kcal acima
            </span>
          ) : (
            <span>
              <span className="font-semibold text-gray-800">{remaining.toFixed(0)}</span> kcal restantes
            </span>
          )}
        </p>
        <p className="text-xs text-gray-400">Meta: {goal} kcal</p>
      </div>
    </div>
  )
}
