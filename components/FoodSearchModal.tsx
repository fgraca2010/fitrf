'use client'

import { useState, useEffect, useRef } from 'react'
import { Food, CATEGORY_LABELS, calcNutrients } from '@/types'

interface Props {
  foods: Food[]
  onAdd: (food: Food, grams: number) => void
  onClose: () => void
}

export default function FoodSearchModal({ foods, onAdd, onClose }: Props) {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Food | null>(null)
  const [grams, setGrams] = useState('100')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const filtered = foods.filter((f) =>
    f.name.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 50)

  const nutrients = selected ? calcNutrients(selected, Number(grams) || 0) : null

  function handleAdd() {
    if (!selected || !Number(grams)) return
    onAdd(selected, Number(grams))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50">
      <div className="bg-white w-full max-w-lg rounded-t-2xl sm:rounded-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b">
          <h2 className="font-semibold text-gray-800">Adicionar Alimento</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>

        {!selected ? (
          <>
            <div className="px-4 py-3">
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar alimento..."
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
            </div>
            <ul className="overflow-y-auto flex-1 divide-y divide-gray-50">
              {filtered.map((food) => (
                <li
                  key={food.id}
                  onClick={() => setSelected(food)}
                  className="px-4 py-3 hover:bg-emerald-50 cursor-pointer"
                >
                  <p className="text-sm font-medium text-gray-800">{food.name}</p>
                  <p className="text-xs text-gray-500">
                    {food.calories_per_100g} kcal · P {food.protein_per_100g}g · C {food.carbs_per_100g}g · G {food.fat_per_100g}g por 100g
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{CATEGORY_LABELS[food.category]}</p>
                </li>
              ))}
              {filtered.length === 0 && (
                <li className="px-4 py-8 text-center text-sm text-gray-400">
                  Nenhum alimento encontrado
                </li>
              )}
            </ul>
          </>
        ) : (
          <div className="p-4 flex flex-col gap-4">
            <div>
              <button
                onClick={() => setSelected(null)}
                className="text-xs text-emerald-600 hover:underline"
              >
                ← Voltar
              </button>
              <h3 className="text-base font-semibold mt-1">{selected.name}</h3>
              <p className="text-xs text-gray-400">{CATEGORY_LABELS[selected.category]}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">
                Quantidade (gramas)
              </label>
              <div className="flex gap-2">
                {[50, 100, 150, 200].map((g) => (
                  <button
                    key={g}
                    onClick={() => setGrams(String(g))}
                    className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                      grams === String(g)
                        ? 'bg-emerald-500 text-white border-emerald-500'
                        : 'border-gray-200 text-gray-600 hover:border-emerald-300'
                    }`}
                  >
                    {g}g
                  </button>
                ))}
                <input
                  type="number"
                  value={grams}
                  onChange={(e) => setGrams(e.target.value)}
                  min={1}
                  className="w-20 border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>
            </div>

            {nutrients && (
              <div className="bg-emerald-50 rounded-xl p-3 grid grid-cols-4 gap-2 text-center">
                <div>
                  <p className="text-base font-bold text-emerald-700">{nutrients.calories}</p>
                  <p className="text-xs text-gray-500">kcal</p>
                </div>
                <div>
                  <p className="text-base font-bold text-blue-600">{nutrients.protein}g</p>
                  <p className="text-xs text-gray-500">Prot.</p>
                </div>
                <div>
                  <p className="text-base font-bold text-amber-600">{nutrients.carbs}g</p>
                  <p className="text-xs text-gray-500">Carb.</p>
                </div>
                <div>
                  <p className="text-base font-bold text-rose-500">{nutrients.fat}g</p>
                  <p className="text-xs text-gray-500">Gord.</p>
                </div>
              </div>
            )}

            <button
              onClick={handleAdd}
              disabled={!Number(grams)}
              className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              Adicionar
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
