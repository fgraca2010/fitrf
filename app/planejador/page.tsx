'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Navigation from '@/components/Navigation'
import { Marmita, MealType, MEAL_LABELS, sumMarmita, WeeklyPlan } from '@/types'
import { format, startOfWeek, addDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const MEAL_TYPES: MealType[] = ['cafe_manha', 'almoco', 'jantar']

export default function PlanejadorPage() {
  const router = useRouter()
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [plans, setPlans] = useState<WeeklyPlan[]>([])
  const [marmitas, setMarmitas] = useState<Marmita[]>([])
  const [userId, setUserId] = useState('')
  const [assignModal, setAssignModal] = useState<{ date: string; mealType: MealType } | null>(null)

  const supabase = createClient()

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    setUserId(user.id)

    const [{ data: planData }, { data: marmitaData }] = await Promise.all([
      supabase
        .from('weekly_plans')
        .select('*, marmita:marmitas(*, marmita_items(*, food:foods(*)))')
        .eq('user_id', user.id)
        .gte('date', format(weekStart, 'yyyy-MM-dd'))
        .lte('date', format(addDays(weekStart, 6), 'yyyy-MM-dd')),
      supabase
        .from('marmitas')
        .select('*, marmita_items(*, food:foods(*))')
        .eq('user_id', user.id)
        .order('name'),
    ])

    setPlans(
      (planData || []).map((p: any) => ({
        ...p,
        marmita: p.marmita
          ? { ...p.marmita, items: p.marmita.marmita_items || [] }
          : undefined,
      }))
    )
    setMarmitas((marmitaData || []).map((m: any) => ({ ...m, items: m.marmita_items || [] })))
  }, [weekStart, router])

  useEffect(() => { loadData() }, [loadData])

  function getPlan(date: string, mealType: MealType) {
    return plans.find((p) => p.date === date && p.meal_type === mealType)
  }

  async function assignMarmita(marmitaId: string | null) {
    if (!assignModal) return
    const { date, mealType } = assignModal
    setAssignModal(null)

    const existing = getPlan(date, mealType)
    if (existing) {
      if (marmitaId) {
        await supabase.from('weekly_plans').update({ marmita_id: marmitaId }).eq('id', existing.id)
      } else {
        await supabase.from('weekly_plans').delete().eq('id', existing.id)
      }
    } else if (marmitaId) {
      await supabase.from('weekly_plans').insert({
        user_id: userId,
        date,
        meal_type: mealType,
        marmita_id: marmitaId,
      })
    }
    loadData()
  }

  async function logDayToLog(dateStr: string) {
    const dayPlans = plans.filter((p) => p.date === dateStr)
    if (dayPlans.length === 0) return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    for (const plan of dayPlans) {
      if (!plan.marmita) continue
      const { data: log } = await supabase.from('meal_logs').insert({
        user_id: user.id,
        date: dateStr,
        meal_type: plan.meal_type,
      }).select().single()

      if (log) {
        const items = plan.marmita.items.map((i) => ({
          meal_log_id: log.id,
          food_id: i.food_id,
          quantity_g: i.quantity_g,
        }))
        if (items.length) await supabase.from('meal_log_items').insert(items)
      }
    }
    router.push(`/diario?date=${dateStr}`)
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-bold text-gray-800">Planejador Semanal 📅</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-4 space-y-3">
        {/* Week navigation */}
        <div className="flex items-center justify-between bg-white rounded-2xl px-4 py-3 shadow-sm">
          <button
            onClick={() => setWeekStart(addDays(weekStart, -7))}
            className="text-gray-400 hover:text-emerald-600 text-xl px-1"
          >
            ‹
          </button>
          <div className="text-center">
            <p className="text-sm font-semibold text-gray-700">
              {format(weekStart, "dd 'de' MMM", { locale: ptBR })} —{' '}
              {format(addDays(weekStart, 6), "dd 'de' MMM", { locale: ptBR })}
            </p>
          </div>
          <button
            onClick={() => setWeekStart(addDays(weekStart, 7))}
            className="text-gray-400 hover:text-emerald-600 text-xl px-1"
          >
            ›
          </button>
        </div>

        {/* Day cards */}
        {weekDays.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd')
          const isToday = dateStr === format(new Date(), 'yyyy-MM-dd')
          const dayPlans = plans.filter((p) => p.date === dateStr)
          const dayCalories = dayPlans.reduce((acc, p) => {
            if (!p.marmita) return acc
            return acc + sumMarmita(p.marmita.items).calories
          }, 0)

          return (
            <div
              key={dateStr}
              className={`bg-white rounded-2xl shadow-sm overflow-hidden ${isToday ? 'ring-2 ring-emerald-400' : ''}`}
            >
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-50">
                <div>
                  <span className={`text-sm font-bold capitalize ${isToday ? 'text-emerald-600' : 'text-gray-700'}`}>
                    {format(day, 'EEEE', { locale: ptBR })}
                    {isToday && ' (Hoje)'}
                  </span>
                  <span className="text-xs text-gray-400 ml-2">{format(day, 'dd/MM')}</span>
                </div>
                <div className="flex items-center gap-2">
                  {dayCalories > 0 && (
                    <span className="text-xs font-semibold text-emerald-600">{dayCalories.toFixed(0)} kcal</span>
                  )}
                  {dayPlans.length > 0 && (
                    <button
                      onClick={() => logDayToLog(dateStr)}
                      className="text-xs text-emerald-600 hover:underline font-medium"
                      title="Registrar no diário"
                    >
                      ✓ Registrar
                    </button>
                  )}
                </div>
              </div>

              <div className="divide-y divide-gray-50">
                {MEAL_TYPES.map((mealType) => {
                  const plan = getPlan(dateStr, mealType)
                  const marmita = plan?.marmita
                  const totals = marmita ? sumMarmita(marmita.items) : null

                  return (
                    <div key={mealType} className="flex items-center px-4 py-2">
                      <span className="text-xs text-gray-400 w-28">{MEAL_LABELS[mealType]}</span>
                      {marmita ? (
                        <div className="flex-1 flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-700">{marmita.name}</p>
                            <p className="text-xs text-gray-400">{totals?.calories.toFixed(0)} kcal</p>
                          </div>
                          <button
                            onClick={() => setAssignModal({ date: dateStr, mealType })}
                            className="text-gray-300 hover:text-emerald-500 text-xs ml-2"
                          >
                            trocar
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setAssignModal({ date: dateStr, mealType })}
                          className="text-xs text-gray-300 hover:text-emerald-500 flex-1 text-left"
                        >
                          + Atribuir marmita
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </main>

      {/* Assign modal */}
      {assignModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50">
          <div className="bg-white w-full max-w-sm rounded-t-2xl sm:rounded-2xl max-h-[70vh] flex flex-col">
            <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b">
              <h3 className="font-semibold text-gray-800">Escolher Marmita</h3>
              <button onClick={() => setAssignModal(null)} className="text-gray-400 text-2xl leading-none">&times;</button>
            </div>
            <ul className="overflow-y-auto flex-1">
              {getPlan(assignModal.date, assignModal.mealType) && (
                <li
                  onClick={() => assignMarmita(null)}
                  className="px-4 py-3 hover:bg-red-50 cursor-pointer border-b border-gray-50"
                >
                  <p className="text-sm text-red-400 font-medium">🗑️ Remover marmita</p>
                </li>
              )}
              {marmitas.map((m) => {
                const t = sumMarmita(m.items)
                return (
                  <li
                    key={m.id}
                    onClick={() => assignMarmita(m.id)}
                    className="px-4 py-3 hover:bg-emerald-50 cursor-pointer border-b border-gray-50"
                  >
                    <p className="text-sm font-medium text-gray-800">{m.name}</p>
                    <p className="text-xs text-gray-400">
                      {t.calories.toFixed(0)} kcal · {m.items.length} alimentos
                    </p>
                  </li>
                )
              })}
              {marmitas.length === 0 && (
                <li className="px-4 py-8 text-center text-sm text-gray-300">
                  Nenhuma marmita criada ainda
                </li>
              )}
            </ul>
          </div>
        </div>
      )}

      <Navigation />
    </div>
  )
}
