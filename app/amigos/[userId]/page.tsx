'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import CalorieRing from '@/components/CalorieRing'
import { MacroSummary } from '@/components/MacroBar'
import Navigation from '@/components/Navigation'
import { MealLog, MealLogItem, Marmita, MEAL_LABELS, MEAL_ICONS, calcNutrients, sumMarmita } from '@/types'
import { format, subDays, addDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface FriendProfile {
  id: string
  name: string
  calorie_goal: number
  protein_goal: number
  carbs_goal: number
  fat_goal: number
}

export default function FriendDataPage() {
  const router = useRouter()
  const { userId: friendId } = useParams() as { userId: string }

  const [friend, setFriend] = useState<FriendProfile | null>(null)
  const [date, setDate] = useState(new Date())
  const [meals, setMeals] = useState<MealLog[]>([])
  const [marmitas, setMarmitas] = useState<Marmita[]>([])
  const [loading, setLoading] = useState(true)
  const [unauthorized, setUnauthorized] = useState(false)
  const [tab, setTab] = useState<'diario' | 'marmitas'>('diario')

  const supabase = createClient()

  const loadData = useCallback(async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    // Verificar se são amigos
    const { data: friendship } = await supabase
      .from('friendships')
      .select('status')
      .or(`and(requester_id.eq.${user.id},target_id.eq.${friendId}),and(requester_id.eq.${friendId},target_id.eq.${user.id})`)
      .eq('status', 'accepted')
      .maybeSingle()

    if (!friendship) { setUnauthorized(true); setLoading(false); return }

    // Buscar perfil
    const { data: prof } = await supabase
      .from('profiles')
      .select('id, name, calorie_goal, protein_goal, carbs_goal, fat_goal')
      .eq('id', friendId)
      .single()
    if (prof) setFriend(prof)

    // Buscar refeições do dia
    const dateStr = format(date, 'yyyy-MM-dd')
    const { data: mealLogs } = await supabase
      .from('meal_logs')
      .select('*, meal_log_items(*, food:foods(*))')
      .eq('user_id', friendId)
      .eq('date', dateStr)

    setMeals(
      (mealLogs || []).map((m: any) => ({ ...m, items: m.meal_log_items || [] }))
    )

    // Buscar marmitas
    const { data: marms } = await supabase
      .from('marmitas')
      .select('*, marmita_items(*, food:foods(*))')
      .eq('user_id', friendId)
      .order('created_at', { ascending: false })

    setMarmitas((marms || []).map((m: any) => ({ ...m, items: m.marmita_items || [] })))
    setLoading(false)
  }, [friendId, date, router])

  useEffect(() => { loadData() }, [loadData])

  if (unauthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white rounded-2xl shadow-sm p-8 text-center max-w-sm space-y-3">
          <p className="text-4xl">🔒</p>
          <p className="font-semibold text-gray-700">Sem permissão</p>
          <p className="text-sm text-gray-400">
            Você não está conectado com este usuário.
          </p>
          <button
            onClick={() => router.push('/amigos')}
            className="text-emerald-600 text-sm font-medium hover:underline"
          >
            ← Ver amigos
          </button>
        </div>
      </div>
    )
  }

  const totals = meals.reduce(
    (acc, meal) => {
      meal.items.forEach((item: MealLogItem) => {
        const n = calcNutrients(item.food, item.quantity_g)
        acc.calories += n.calories
        acc.protein += n.protein
        acc.carbs += n.carbs
        acc.fat += n.fat
      })
      return acc
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  )

  const isToday = format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => router.push('/amigos')} className="text-gray-400 hover:text-gray-600 text-xl">←</button>
          <div>
            <h1 className="text-base font-bold text-gray-800">
              {loading || !friend ? 'Carregando...' : friend.name}
            </h1>
            <p className="text-xs text-gray-400">Dados compartilhados</p>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-4 space-y-4">
        {/* Tabs */}
        <div className="flex bg-white rounded-2xl shadow-sm overflow-hidden">
          {(['diario', 'marmitas'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                tab === t
                  ? 'bg-emerald-500 text-white'
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              {t === 'diario' ? '📋 Diário' : '🍱 Marmitas'}
            </button>
          ))}
        </div>

        {tab === 'diario' && (
          <>
            {/* Date nav */}
            <div className="flex items-center justify-between bg-white rounded-2xl px-4 py-3 shadow-sm">
              <button
                onClick={() => setDate(subDays(date, 1))}
                className="text-gray-400 hover:text-emerald-600 p-1 text-lg"
              >
                ‹
              </button>
              <div className="text-center">
                <p className="font-semibold text-gray-800 capitalize">
                  {isToday ? 'Hoje' : format(date, 'EEEE', { locale: ptBR })}
                </p>
                <p className="text-xs text-gray-400">
                  {format(date, "dd 'de' MMMM", { locale: ptBR })}
                </p>
              </div>
              <button
                onClick={() => setDate(addDays(date, 1))}
                disabled={isToday}
                className="text-gray-400 hover:text-emerald-600 disabled:opacity-30 p-1 text-lg"
              >
                ›
              </button>
            </div>

            {/* Calorie ring */}
            {!loading && friend && (
              <div className="bg-white rounded-2xl shadow-sm p-5">
                <div className="flex flex-col items-center gap-4">
                  <CalorieRing consumed={totals.calories} goal={friend.calorie_goal} />
                  <MacroSummary
                    protein={totals.protein}
                    carbs={totals.carbs}
                    fat={totals.fat}
                    proteinGoal={friend.protein_goal}
                    carbsGoal={friend.carbs_goal}
                    fatGoal={friend.fat_goal}
                  />
                </div>
              </div>
            )}

            {/* Meals */}
            {!loading && meals.filter((m) => m.items.length > 0).length > 0 ? (
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <p className="px-4 py-3 text-sm font-semibold text-gray-700 border-b border-gray-50">
                  Refeições do dia
                </p>
                {meals
                  .filter((m) => m.items.length > 0)
                  .map((meal) => {
                    const mealCals = meal.items.reduce(
                      (s, i) => s + calcNutrients(i.food, i.quantity_g).calories,
                      0
                    )
                    return (
                      <div key={meal.id} className="border-b border-gray-50 last:border-0">
                        <div className="flex items-center justify-between px-4 py-2 bg-gray-50">
                          <span className="text-sm font-medium text-gray-700 flex items-center gap-1">
                            <span>{MEAL_ICONS[meal.meal_type]}</span>
                            {MEAL_LABELS[meal.meal_type]}
                          </span>
                          <span className="text-xs font-semibold text-emerald-600">
                            {mealCals.toFixed(0)} kcal
                          </span>
                        </div>
                        <ul>
                          {meal.items.map((item: MealLogItem) => {
                            const n = calcNutrients(item.food, item.quantity_g)
                            return (
                              <li key={item.id} className="px-4 py-2 flex justify-between">
                                <div>
                                  <p className="text-sm text-gray-700">{item.food.name}</p>
                                  <p className="text-xs text-gray-400">{item.quantity_g}g</p>
                                </div>
                                <span className="text-sm text-gray-600">{n.calories} kcal</span>
                              </li>
                            )
                          })}
                        </ul>
                      </div>
                    )
                  })}
              </div>
            ) : (
              !loading && (
                <div className="bg-white rounded-2xl shadow-sm p-6 text-center text-sm text-gray-300">
                  Nenhuma refeição registrada neste dia.
                </div>
              )
            )}
          </>
        )}

        {tab === 'marmitas' && (
          <>
            {loading ? (
              <div className="bg-white rounded-2xl shadow-sm p-8 text-center text-gray-300 text-sm">
                Carregando...
              </div>
            ) : marmitas.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
                <p className="text-4xl mb-2">🍱</p>
                <p className="text-sm text-gray-300">{friend?.name} ainda não criou marmitas.</p>
              </div>
            ) : (
              marmitas.map((m) => {
                const totals = sumMarmita(m.items)
                return (
                  <div key={m.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                    <div className="px-4 py-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-800">{m.name}</h3>
                          {m.description && (
                            <p className="text-xs text-gray-400 mt-0.5">{m.description}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-emerald-600">{totals.calories.toFixed(0)}</p>
                          <p className="text-xs text-gray-400">kcal</p>
                        </div>
                      </div>
                      <div className="flex gap-4 mt-1 text-xs text-gray-500">
                        <span>P: <b className="text-blue-500">{totals.protein.toFixed(1)}g</b></span>
                        <span>C: <b className="text-amber-500">{totals.carbs.toFixed(1)}g</b></span>
                        <span>G: <b className="text-rose-400">{totals.fat.toFixed(1)}g</b></span>
                      </div>
                    </div>
                    {m.items.length > 0 && (
                      <ul className="border-t border-gray-50 divide-y divide-gray-50">
                        {m.items.map((item) => {
                          const n = calcNutrients(item.food, item.quantity_g)
                          return (
                            <li key={item.id} className="px-4 py-2 flex justify-between">
                              <div>
                                <p className="text-sm text-gray-700">{item.food.name}</p>
                                <p className="text-xs text-gray-400">{item.quantity_g}g</p>
                              </div>
                              <span className="text-sm text-gray-500">{n.calories} kcal</span>
                            </li>
                          )
                        })}
                      </ul>
                    )}
                  </div>
                )
              })
            )}
          </>
        )}
      </main>

      <Navigation />
    </div>
  )
}
