'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Navigation from '@/components/Navigation'
import { Food, FoodCategory, CATEGORY_LABELS } from '@/types'

const ALL_CATEGORIES = Object.keys(CATEGORY_LABELS) as FoodCategory[]

export default function AlimentosPage() {
  const router = useRouter()
  const [foods, setFoods] = useState<Food[]>([])
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<FoodCategory | 'todos'>('todos')
  const [showAddForm, setShowAddForm] = useState(false)
  const [userId, setUserId] = useState('')
  const [form, setForm] = useState({
    name: '', calories: '', protein: '', carbs: '', fat: '', fiber: '', category: 'outros' as FoodCategory,
  })
  const [saving, setSaving] = useState(false)

  const supabase = createClient()

  const loadFoods = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    setUserId(user.id)
    const { data } = await supabase.from('foods').select('*').order('name')
    setFoods(data || [])
  }, [router])

  useEffect(() => { loadFoods() }, [loadFoods])

  const filtered = foods.filter((f) => {
    const matchQuery = f.name.toLowerCase().includes(query.toLowerCase())
    const matchCat = category === 'todos' || f.category === category
    return matchQuery && matchCat
  })

  async function handleAddFood(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await supabase.from('foods').insert({
      name: form.name,
      calories_per_100g: Number(form.calories),
      protein_per_100g: Number(form.protein),
      carbs_per_100g: Number(form.carbs),
      fat_per_100g: Number(form.fat),
      fiber_per_100g: Number(form.fiber) || 0,
      category: form.category,
      source: 'custom',
      created_by: userId,
    })
    setForm({ name: '', calories: '', protein: '', carbs: '', fat: '', fiber: '', category: 'outros' })
    setShowAddForm(false)
    setSaving(false)
    loadFoods()
  }

  async function handleDelete(id: string) {
    if (!confirm('Remover este alimento?')) return
    await supabase.from('foods').delete().eq('id', id).eq('created_by', userId)
    loadFoods()
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-bold text-gray-800">Alimentos</h1>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
          >
            + Adicionar
          </button>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-4 space-y-4">
        {/* Add form */}
        {showAddForm && (
          <form
            onSubmit={handleAddFood}
            className="bg-white rounded-2xl shadow-sm p-4 space-y-3"
          >
            <h2 className="font-semibold text-gray-800">Novo alimento personalizado</h2>
            <p className="text-xs text-gray-400">Valores por 100g</p>

            <input
              required
              placeholder="Nome do alimento"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />

            <div className="grid grid-cols-2 gap-2">
              {[
                { key: 'calories', label: 'Calorias (kcal)' },
                { key: 'protein', label: 'Proteína (g)' },
                { key: 'carbs', label: 'Carboidratos (g)' },
                { key: 'fat', label: 'Gordura (g)' },
                { key: 'fiber', label: 'Fibra (g)' },
              ].map(({ key, label }) => (
                <div key={key}>
                  <label className="text-xs text-gray-500 block mb-0.5">{label}</label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    required={key !== 'fiber'}
                    placeholder="0"
                    value={form[key as keyof typeof form] as string}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                </div>
              ))}

              <div>
                <label className="text-xs text-gray-500 block mb-0.5">Categoria</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value as FoodCategory })}
                  className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                >
                  {ALL_CATEGORIES.map((c) => (
                    <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-200 text-white font-semibold py-2.5 rounded-xl text-sm"
              >
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 border border-gray-200 text-gray-600 rounded-xl text-sm hover:bg-gray-50"
              >
                Cancelar
              </button>
            </div>
          </form>
        )}

        {/* Search and filter */}
        <div className="space-y-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar alimento..."
            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 shadow-sm"
          />
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <button
              onClick={() => setCategory('todos')}
              className={`flex-none px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                category === 'todos' ? 'bg-emerald-500 text-white' : 'bg-white text-gray-600 border border-gray-200'
              }`}
            >
              Todos
            </button>
            {ALL_CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`flex-none px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  category === c ? 'bg-emerald-500 text-white' : 'bg-white text-gray-600 border border-gray-200'
                }`}
              >
                {CATEGORY_LABELS[c].split(' ')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Food list */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <p className="text-xs text-gray-400 px-4 py-2 border-b border-gray-50">
            {filtered.length} alimento(s) encontrado(s)
          </p>
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-sm text-gray-300">
              Nenhum alimento encontrado
            </div>
          ) : (
            <ul className="divide-y divide-gray-50">
              {filtered.map((food) => (
                <li key={food.id} className="px-4 py-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-800">{food.name}</p>
                        {food.source === 'custom' && (
                          <span className="text-xs bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded-full">
                            custom
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        <span className="text-emerald-600 font-semibold">{food.calories_per_100g} kcal</span>
                        {' · '}P {food.protein_per_100g}g · C {food.carbs_per_100g}g · G {food.fat_per_100g}g
                      </p>
                      <p className="text-xs text-gray-300">{CATEGORY_LABELS[food.category]} · por 100g</p>
                    </div>
                    {food.source === 'custom' && food.created_by === userId && (
                      <button
                        onClick={() => handleDelete(food.id)}
                        className="text-gray-200 hover:text-red-400 ml-2 text-lg leading-none"
                      >
                        ×
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>

      <Navigation />
    </div>
  )
}
