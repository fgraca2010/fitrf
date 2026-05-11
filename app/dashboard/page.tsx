'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import CalorieRing from '@/components/CalorieRing'
import { MacroSummary } from '@/components/MacroBar'
import Navigation from '@/components/Navigation'
import { Profile, MealLog, MealLogItem, MEAL_LABELS, calcNutrients } from '@/types'
import { format, addDays, subDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface DayTotals {
  calories: number
  protein: number
  carbs: number
  fat: number
}

export default function DashboardPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [date, setDate] = useState(new Date())
  const [meals, setMeals] = useState<MealLog[]>([])
  const [totals, setTotals] = useState<DayTotals>({ calories: 0, protein: 0, carbs: 0, fat: 0 })
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState('')
  const [pendingFriends, setPendingFriends] = useState(0)

  const supabase = createClient()

  const loadData = useCallback(async (d: Date) => {
    setLoading(true)
    const dateStr = format(d, 'yyyy-MM-dd')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { data: prof } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (prof) {
      setProfile(prof)
      setUserName(prof.name)
    }

    // Solicitações de amizade pendentes recebidas
    const { count: pendingCount } = await supabase
      .from('friendships')
      .select('*', { count: 'exact', head: true })
      .eq('target_id', user.id)
      .eq('status', 'pending')
    setPendingFriends(pendingCount || 0)

    const { data: mealLogs } = await supabase
      .from('meal_logs')
      .select('*, meal_log_items(*, food:foods(*))')
      .eq('user_id', user.id)
      .eq('date', dateStr)

    const logs: MealLog[] = (mealLogs || []).map((m: any) => ({
      ...m,
      items: (m.meal_log_items || []) as MealLogItem[],
    }))
    setMeals(logs)

    const t = logs.reduce(
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
    setTotals(t)
    setLoading(false)
  }, [router])

  useEffect(() => { loadData(date) }, [date, loadData])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const isToday = format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')

  const mealsWithItems = meals.filter((m) => m.items.length > 0)

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-800">🥗 FitRF</h1>
            {userName && <p className="text-xs text-gray-400">Olá, {userName}!</p>}
          </div>
          <div className="flex gap-2 items-center">
            <Link href="/amigos" className="relative text-xs text-gray-500 hover:text-emerald-600 px-2 py-1">
              👥 Amigos
              {pendingFriends > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {pendingFriends}
                </span>
              )}
            </Link>
            <Link href="/perfil" className="text-xs text-gray-500 hover:text-emerald-600 px-2 py-1">
              ⚙️ Perfil
            </Link>
            <button
              onClick={handleLogout}
              className="text-xs text-gray-500 hover:text-red-500 px-2 py-1"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-5 space-y-5">
        {/* Date Navigation */}
        <div className="flex items-center justify-between bg-white rounded-2xl px-4 py-3 shadow-sm">
          <button
            onClick={() => setDate(subDays(date, 1))}
            className="text-gray-400 hover:text-emerald-600 p-1 text-lg"
          >
            ‹
          </button>
          <div className="text-center">
            <p className="font-semibold text-gray-800 capitalize">
              {isToday ? 'Hoje' : format(date, "EEEE", { locale: ptBR })}
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

        {/* Calorie Ring + Macros */}
        {!loading && profile && (
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <div className="flex flex-col items-center gap-4">
              <CalorieRing consumed={totals.calories} goal={profile.calorie_goal} />
              <MacroSummary
                protein={totals.protein}
                carbs={totals.carbs}
                fat={totals.fat}
                proteinGoal={profile.protein_goal}
                carbsGoal={profile.carbs_goal}
                fatGoal={profile.fat_goal}
              />
            </div>
          </div>
        )}

        {loading && (
          <div className="bg-white rounded-2xl shadow-sm p-8 text-center text-gray-400">
            Carregando...
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Link
            href={`/diario?date=${format(date, 'yyyy-MM-dd')}`}
            className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl p-4 text-center transition-colors"
          >
            <div className="text-2xl mb-1">📋</div>
            <div className="font-semibold text-sm">Ver Diário</div>
            <div className="text-xs opacity-80">Adicionar refeições</div>
          </Link>
          <Link
            href="/marmitas"
            className="bg-white hover:bg-gray-50 text-gray-700 rounded-2xl p-4 text-center shadow-sm transition-colors border border-gray-100"
          >
            <div className="text-2xl mb-1">🍱</div>
            <div className="font-semibold text-sm">Marmitas</div>
            <div className="text-xs text-gray-400">Gerenciar preparos</div>
          </Link>
        </div>

        {/* Today's Meals Summary */}
        {!loading && mealsWithItems.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <h2 className="font-semibold text-gray-800 mb-3">Refeições do dia</h2>
            <div className="space-y-3">
              {mealsWithItems.map((meal) => {
                const mealTotals = meal.items.reduce(
                  (acc, item) => {
                    const n = calcNutrients(item.food, item.quantity_g)
                    return { ...acc, calories: acc.calories + n.calories }
                  },
                  { calories: 0 }
                )
                return (
                  <div key={meal.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-700">
                        {MEAL_LABELS[meal.meal_type]}
                      </p>
                      <p className="text-xs text-gray-400">{meal.items.length} alimento(s)</p>
                    </div>
                    <span className="text-sm font-semibold text-emerald-600">
                      {mealTotals.calories.toFixed(0)} kcal
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {!loading && mealsWithItems.length === 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-6 text-center">
            <p className="text-gray-400 text-sm">Nenhuma refeição registrada hoje.</p>
            <Link
              href={`/diario?date=${format(date, 'yyyy-MM-dd')}`}
              className="inline-block mt-3 text-emerald-600 text-sm font-medium hover:underline"
            >
              Registrar primeira refeição →
            </Link>
          </div>
        )}
      </main>

      <Navigation />
    </div>
  )
}
