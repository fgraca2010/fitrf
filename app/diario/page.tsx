'use client'

import { useEffect, useState, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Navigation from '@/components/Navigation'
import FoodSearchModal from '@/components/FoodSearchModal'
import {
  Food, MealLog, MealLogItem, MealType,
  MEAL_LABELS, MEAL_ICONS, calcNutrients,
} from '@/types'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const MEAL_ORDER: MealType[] = ['cafe_manha', 'lanche_manha', 'almoco', 'lanche_tarde', 'jantar', 'ceia']

function DiarioContent() {
  const router = useRouter()
  const params = useSearchParams()
  const dateParam = params.get('date') || format(new Date(), 'yyyy-MM-dd')

  const [foods, setFoods] = useState<Food[]>([])
  const [meals, setMeals] = useState<Record<MealType, MealLog | null>>({
    cafe_manha: null, lanche_manha: null, almoco: null,
    lanche_tarde: null, jantar: null, ceia: null,
  })
  const [showModal, setShowModal] = useState(false)
  const [activeMealType, setActiveMealType] = useState<MealType>('almoco')
  const [userId, setUserId] = useState<string>('')

  const supabase = createClient()

  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    setUserId(user.id)

    const { data: foodList } = await supabase.from('foods').select('*').order('name')
    setFoods(foodList || [])

    const { data: mealLogs } = await supabase
      .from('meal_logs')
      .select('*, meal_log_items(*, food:foods(*))')
      .eq('user_id', user.id)
      .eq('date', dateParam)

    const map: Record<MealType, MealLog | null> = {
      cafe_manha: null, lanche_manha: null, almoco: null,
      lanche_tarde: null, jantar: null, ceia: null,
    }
    ;(mealLogs || []).forEach((m: any) => {
      map[m.meal_type as MealType] = { ...m, items: m.meal_log_items || [] }
    })
    setMeals(map)
  }, [dateParam, router])

  useEffect(() => { loadData() }, [loadData])

  function openModal(mealType: MealType) {
    setActiveMealType(mealType)
    setShowModal(true)
  }

  async function handleAddFood(food: Food, grams: number) {
    setShowModal(false)
    let meal = meals[activeMealType]

    if (!meal) {
      const { data } = await supabase.from('meal_logs').insert({
        user_id: userId,
        date: dateParam,
        meal_type: activeMealType,
      }).select().single()
      if (!data) return
      meal = { ...data, items: [] }
    }

    if (!meal) return
    await supabase.from('meal_log_items').insert({
      meal_log_id: meal.id,
      food_id: food.id,
      quantity_g: grams,
    })

    await loadData()
  }

  async function handleRemoveItem(itemId: string) {
    await supabase.from('meal_log_items').delete().eq('id', itemId)
    await loadData()
  }

  const dayCalories = Object.values(meals).reduce((acc, meal) => {
    if (!meal) return acc
    return acc + meal.items.reduce((s, item) => s + calcNutrients(item.food, item.quantity_g).calories, 0)
  }, 0)

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-800">Diário Alimentar</h1>
            <p className="text-xs text-gray-400 capitalize">
              {format(new Date(dateParam + 'T12:00:00'), "EEEE, dd 'de' MMMM", { locale: ptBR })}
            </p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-emerald-600">{dayCalories.toFixed(0)}</p>
            <p className="text-xs text-gray-400">kcal total</p>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-4 space-y-3">
        {MEAL_ORDER.map((mealType) => {
          const meal = meals[mealType]
          const items = meal?.items || []
          const mealCals = items.reduce((s, i) => s + calcNutrients(i.food, i.quantity_g).calories, 0)

          return (
            <div key={mealType} className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{MEAL_ICONS[mealType]}</span>
                  <span className="font-semibold text-gray-800 text-sm">{MEAL_LABELS[mealType]}</span>
                </div>
                <div className="flex items-center gap-3">
                  {mealCals > 0 && (
                    <span className="text-xs font-semibold text-emerald-600">{mealCals.toFixed(0)} kcal</span>
                  )}
                  <button
                    onClick={() => openModal(mealType)}
                    className="text-emerald-500 hover:text-emerald-700 text-2xl leading-none font-light"
                  >
                    +
                  </button>
                </div>
              </div>

              {items.length > 0 ? (
                <ul className="divide-y divide-gray-50">
                  {items.map((item: MealLogItem) => {
                    const n = calcNutrients(item.food, item.quantity_g)
                    return (
                      <li key={item.id} className="px-4 py-2.5 flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-800 truncate">{item.food.name}</p>
                          <p className="text-xs text-gray-400">
                            {item.quantity_g}g · P {n.protein}g · C {n.carbs}g · G {n.fat}g
                          </p>
                        </div>
                        <div className="flex items-center gap-2 ml-2">
                          <span className="text-sm font-semibold text-gray-700">{n.calories} kcal</span>
                          <button
                            onClick={() => handleRemoveItem(item.id)}
                            className="text-gray-300 hover:text-red-400 text-lg leading-none"
                          >
                            ×
                          </button>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              ) : (
                <div className="px-4 py-3 text-xs text-gray-300 text-center">
                  Toque + para adicionar alimentos
                </div>
              )}
            </div>
          )
        })}
      </main>

      {showModal && (
        <FoodSearchModal
          foods={foods}
          onAdd={handleAddFood}
          onClose={() => setShowModal(false)}
        />
      )}

      <Navigation />
    </div>
  )
}

export default function DiarioPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen text-gray-400">Carregando...</div>}>
      <DiarioContent />
    </Suspense>
  )
}
