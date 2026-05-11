'use client'

interface MacroBarProps {
  label: string
  value: number
  goal: number
  color: string
  unit?: string
}

export function MacroBar({ label, value, goal, color, unit = 'g' }: MacroBarProps) {
  const pct = Math.min((value / goal) * 100, 100)
  const over = value > goal

  return (
    <div className="flex-1">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-600 font-medium">{label}</span>
        <span className={over ? 'text-red-500' : 'text-gray-500'}>
          {value.toFixed(1)}/{goal}{unit}
        </span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${over ? 'bg-red-400' : color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

interface MacroSummaryProps {
  protein: number
  carbs: number
  fat: number
  proteinGoal: number
  carbsGoal: number
  fatGoal: number
}

export function MacroSummary({
  protein, carbs, fat,
  proteinGoal, carbsGoal, fatGoal,
}: MacroSummaryProps) {
  return (
    <div className="flex gap-3">
      <MacroBar label="Proteína" value={protein} goal={proteinGoal} color="bg-blue-400" />
      <MacroBar label="Carboidrato" value={carbs} goal={carbsGoal} color="bg-amber-400" />
      <MacroBar label="Gordura" value={fat} goal={fatGoal} color="bg-rose-400" />
    </div>
  )
}
