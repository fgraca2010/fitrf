'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Navigation from '@/components/Navigation'
import FoodSearchModal from '@/components/FoodSearchModal'
import MarmitaSuggester from '@/components/MarmitaSuggester'
import { Food, Marmita, MarmitaItem, calcNutrients, sumMarmita } from '@/types'
import { format } from 'date-fns'

type PageMode = 'list' | 'create' | 'edit'

export default function MarmitasPage() {
  const router = useRouter()
  const [marmitas, setMarmitas] = useState<Marmita[]>([])
  const [foods, setFoods] = useState<Food[]>([])
  const [mode, setMode] = useState<PageMode>('list')
  const [editing, setEditing] = useState<Marmita | null>(null)
  const [draftName, setDraftName] = useState('')
  const [draftDesc, setDraftDesc] = useState('')
  const [draftItems, setDraftItems] = useState<MarmitaItem[]>([])
  const [showModal, setShowModal] = useState(false)
  const [userId, setUserId] = useState('')
  const [saving, setSaving] = useState(false)
  const [addToLogDate, setAddToLogDate] = useState<string | null>(null)
  const [addToLogMarmita, setAddToLogMarmita] = useState<Marmita | null>(null)
  const [mealTypeForLog, setMealTypeForLog] = useState('almoco')

  const supabase = createClient()

  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    setUserId(user.id)

    const [{ data: ms }, { data: fs }] = await Promise.all([
      supabase.from('marmitas').select('*, marmita_items(*, food:foods(*))').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('foods').select('*').order('name'),
    ])

    setMarmitas((ms || []).map((m: any) => ({ ...m, items: m.marmita_items || [] })))
    setFoods(fs || [])
  }, [router])

  useEffect(() => { loadData() }, [loadData])

  function startCreate() {
    setEditing(null)
    setDraftName('')
    setDraftDesc('')
    setDraftItems([])
    setMode('create')
  }

  function startEdit(m: Marmita) {
    setEditing(m)
    setDraftName(m.name)
    setDraftDesc(m.description || '')
    setDraftItems(m.items)
    setMode('edit')
  }

  function handleAddFood(food: Food, grams: number) {
    const item: MarmitaItem = {
      id: Math.random().toString(),
      marmita_id: editing?.id || '',
      food_id: food.id,
      food,
      quantity_g: grams,
    }
    setDraftItems((prev) => [...prev, item])
    setShowModal(false)
  }

  function removeItem(id: string) {
    setDraftItems((prev) => prev.filter((i) => i.id !== id))
  }

  async function handleSave() {
    if (!draftName.trim()) return
    setSaving(true)

    if (mode === 'create') {
      const { data: m } = await supabase.from('marmitas').insert({
        user_id: userId,
        name: draftName.trim(),
        description: draftDesc.trim() || null,
      }).select().single()

      if (m) {
        const itemsToInsert = draftItems.map((i) => ({
          marmita_id: m.id,
          food_id: i.food_id,
          quantity_g: i.quantity_g,
        }))
        if (itemsToInsert.length) await supabase.from('marmita_items').insert(itemsToInsert)
      }
    } else if (mode === 'edit' && editing) {
      await supabase.from('marmitas').update({
        name: draftName.trim(),
        description: draftDesc.trim() || null,
      }).eq('id', editing.id)

      await supabase.from('marmita_items').delete().eq('marmita_id', editing.id)
      const itemsToInsert = draftItems.map((i) => ({
        marmita_id: editing.id,
        food_id: i.food_id,
        quantity_g: i.quantity_g,
      }))
      if (itemsToInsert.length) await supabase.from('marmita_items').insert(itemsToInsert)
    }

    setSaving(false)
    setMode('list')
    loadData()
  }

  async function handleDelete(id: string) {
    if (!confirm('Deletar esta marmita?')) return
    await supabase.from('marmitas').delete().eq('id', id)
    loadData()
  }

  async function handleAddToLog() {
    if (!addToLogMarmita || !addToLogDate) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: log } = await supabase.from('meal_logs').insert({
      user_id: user.id,
      date: addToLogDate,
      meal_type: mealTypeForLog,
    }).select().single()

    if (log) {
      const items = addToLogMarmita.items.map((i) => ({
        meal_log_id: log.id,
        food_id: i.food_id,
        quantity_g: i.quantity_g,
      }))
      if (items.length) await supabase.from('meal_log_items').insert(items)
    }

    setAddToLogMarmita(null)
    setAddToLogDate(null)
    router.push(`/diario?date=${addToLogDate}`)
  }

  const draftTotals = sumMarmita(draftItems)

  if (mode === 'create' || mode === 'edit') {
    return (
      <div className="min-h-screen bg-gray-50 pb-24">
        <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
          <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
            <button onClick={() => setMode('list')} className="text-gray-400 hover:text-gray-600 text-xl">←</button>
            <h1 className="text-lg font-bold text-gray-800">
              {mode === 'create' ? 'Nova Marmita' : 'Editar Marmita'}
            </h1>
          </div>
        </header>

        <main className="max-w-lg mx-auto px-4 py-4 space-y-4">
          <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
            <input
              placeholder="Nome da marmita (ex: Almoço fitness)"
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
            <input
              placeholder="Descrição (opcional)"
              value={draftDesc}
              onChange={(e) => setDraftDesc(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>

          {/* Nutrient summary */}
          {draftItems.length > 0 && (
            <div className="bg-emerald-50 rounded-2xl p-3 grid grid-cols-4 gap-2 text-center">
              <div>
                <p className="text-lg font-bold text-emerald-700">{draftTotals.calories.toFixed(0)}</p>
                <p className="text-xs text-gray-500">kcal</p>
              </div>
              <div>
                <p className="text-lg font-bold text-blue-600">{draftTotals.protein.toFixed(1)}g</p>
                <p className="text-xs text-gray-500">Prot.</p>
              </div>
              <div>
                <p className="text-lg font-bold text-amber-600">{draftTotals.carbs.toFixed(1)}g</p>
                <p className="text-xs text-gray-500">Carb.</p>
              </div>
              <div>
                <p className="text-lg font-bold text-rose-500">{draftTotals.fat.toFixed(1)}g</p>
                <p className="text-xs text-gray-500">Gord.</p>
              </div>
            </div>
          )}

          {/* Items */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
              <span className="font-semibold text-sm text-gray-700">Alimentos ({draftItems.length})</span>
              <button
                onClick={() => setShowModal(true)}
                className="text-emerald-500 hover:text-emerald-700 text-2xl leading-none font-light"
              >
                +
              </button>
            </div>
            {draftItems.length === 0 ? (
              <p className="text-center text-xs text-gray-300 py-6">Adicione alimentos à marmita</p>
            ) : (
              <ul className="divide-y divide-gray-50">
                {draftItems.map((item) => {
                  const n = calcNutrients(item.food, item.quantity_g)
                  return (
                    <li key={item.id} className="px-4 py-2.5 flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-800 truncate">{item.food.name}</p>
                        <p className="text-xs text-gray-400">{item.quantity_g}g · {n.calories} kcal</p>
                      </div>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-gray-200 hover:text-red-400 text-lg ml-2"
                      >
                        ×
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          <button
            onClick={handleSave}
            disabled={!draftName.trim() || saving}
            className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-200 text-white font-semibold py-3 rounded-2xl transition-colors"
          >
            {saving ? 'Salvando...' : 'Salvar Marmita'}
          </button>
        </main>

        {showModal && (
          <FoodSearchModal foods={foods} onAdd={handleAddFood} onClose={() => setShowModal(false)} />
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-bold text-gray-800">Marmitas 🍱</h1>
          <button
            onClick={startCreate}
            className="bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
          >
            + Nova
          </button>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-4 space-y-3">
        <MarmitaSuggester foods={foods} userId={userId} onCreated={loadData} />

        {marmitas.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
            <div className="text-5xl mb-3">🍱</div>
            <p className="text-gray-500 text-sm">Nenhuma marmita criada.</p>
            <button
              onClick={startCreate}
              className="mt-4 text-emerald-600 font-medium text-sm hover:underline"
            >
              Criar primeira marmita →
            </button>
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
                      <p className="text-xs text-gray-400 mt-0.5">{m.items.length} alimento(s)</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-emerald-600">{totals.calories.toFixed(0)}</p>
                      <p className="text-xs text-gray-400">kcal</p>
                    </div>
                  </div>

                  <div className="flex gap-4 mt-2 text-xs text-gray-500">
                    <span>P: <b className="text-blue-500">{totals.protein.toFixed(1)}g</b></span>
                    <span>C: <b className="text-amber-500">{totals.carbs.toFixed(1)}g</b></span>
                    <span>G: <b className="text-rose-400">{totals.fat.toFixed(1)}g</b></span>
                  </div>
                </div>

                <div className="flex border-t border-gray-50">
                  <button
                    onClick={() => {
                      setAddToLogMarmita(m)
                      setAddToLogDate(format(new Date(), 'yyyy-MM-dd'))
                    }}
                    className="flex-1 py-2.5 text-xs font-medium text-emerald-600 hover:bg-emerald-50 transition-colors"
                  >
                    ✓ Registrar no diário
                  </button>
                  <button
                    onClick={() => startEdit(m)}
                    className="flex-1 py-2.5 text-xs font-medium text-gray-500 hover:bg-gray-50 border-l border-gray-50 transition-colors"
                  >
                    ✏️ Editar
                  </button>
                  <button
                    onClick={() => handleDelete(m.id)}
                    className="flex-1 py-2.5 text-xs font-medium text-red-400 hover:bg-red-50 border-l border-gray-50 transition-colors"
                  >
                    🗑️ Remover
                  </button>
                </div>
              </div>
            )
          })
        )}
      </main>

      {/* Add to log modal */}
      {addToLogMarmita && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50">
          <div className="bg-white w-full max-w-sm rounded-t-2xl sm:rounded-2xl p-5 space-y-4">
            <h3 className="font-semibold text-gray-800">Registrar no Diário</h3>
            <p className="text-sm text-gray-600">
              Adicionar <b>{addToLogMarmita.name}</b> ao diário
            </p>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Data</label>
              <input
                type="date"
                value={addToLogDate || ''}
                onChange={(e) => setAddToLogDate(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Refeição</label>
              <select
                value={mealTypeForLog}
                onChange={(e) => setMealTypeForLog(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              >
                <option value="cafe_manha">Café da Manhã</option>
                <option value="lanche_manha">Lanche da Manhã</option>
                <option value="almoco">Almoço</option>
                <option value="lanche_tarde">Lanche da Tarde</option>
                <option value="jantar">Jantar</option>
                <option value="ceia">Ceia</option>
              </select>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleAddToLog}
                className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-2.5 rounded-xl"
              >
                Registrar
              </button>
              <button
                onClick={() => { setAddToLogMarmita(null); setAddToLogDate(null) }}
                className="px-4 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      <Navigation />
    </div>
  )
}
