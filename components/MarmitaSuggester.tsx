'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Food, sumMarmita, type MarmitaItem } from '@/types'

interface Ingrediente {
  alimento: string
  gramas: number
}

interface Sugestao {
  nome: string
  ingredientes: Ingrediente[]
  totais: { calorias: number; proteina: number; carboidrato: number; gordura: number }
  dica: string
}

interface Props {
  foods: Food[]
  userId: string
  onCreated: () => void
}

const MEAL_TYPE_OPTIONS = [
  'café da manhã', 'lanche da manhã', 'almoço', 'lanche da tarde', 'jantar', 'ceia'
]

export default function MarmitaSuggester({ foods, userId, onCreated }: Props) {
  const [open, setOpen] = useState(false)
  const [targetCalories, setTargetCalories] = useState('500')
  const [mealType, setMealType] = useState('almoço')
  const [restrictions, setRestrictions] = useState('')
  const [preferences, setPreferences] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sugestoes, setSugestoes] = useState<Sugestao[]>([])
  const [saving, setSaving] = useState<number | null>(null)
  const [saved, setSaved] = useState<number | null>(null)

  const supabase = createClient()

  async function handleGenerate() {
    setError('')
    setLoading(true)
    setSugestoes([])
    try {
      const res = await fetch('/api/suggest-marmita', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetCalories: Number(targetCalories), mealType, restrictions, preferences }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Erro ao gerar sugestões.'); return }
      setSugestoes(data.sugestoes || [])
    } catch {
      setError('Falha na conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  async function handleSave(s: Sugestao, idx: number) {
    setSaving(idx)
    // Criar marmita
    const { data: marmita } = await supabase.from('marmitas').insert({
      user_id: userId,
      name: s.nome,
      description: s.dica,
    }).select().single()

    if (marmita) {
      // Mapear ingredientes para IDs de foods (busca exata, case-insensitive)
      const items = s.ingredientes.flatMap((ing) => {
        const food = foods.find(
          (f) => f.name.toLowerCase() === ing.alimento.toLowerCase()
        )
        if (!food) return []
        return [{ marmita_id: marmita.id, food_id: food.id, quantity_g: ing.gramas }]
      })
      if (items.length) await supabase.from('marmita_items').insert(items)
    }

    setSaving(null)
    setSaved(idx)
    setTimeout(() => setSaved(null), 2500)
    onCreated()
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-emerald-300 text-emerald-600 hover:bg-emerald-50 font-medium py-3 rounded-2xl transition-colors text-sm"
      >
        ✨ Sugerir marmita com IA
      </button>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50 bg-gradient-to-r from-emerald-50 to-white">
        <div className="flex items-center gap-2">
          <span className="text-lg">✨</span>
          <span className="font-semibold text-gray-800 text-sm">Sugestão de Marmita com IA</span>
        </div>
        <button onClick={() => { setOpen(false); setSugestoes([]) }} className="text-gray-400 text-xl leading-none">&times;</button>
      </div>

      {sugestoes.length === 0 ? (
        <div className="p-4 space-y-4">
          <p className="text-xs text-gray-400">
            Powered by Gemini Flash. As sugestões usam os alimentos já cadastrados no app.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Meta calórica (kcal)</label>
              <div className="flex gap-1 flex-wrap mb-1">
                {['300', '400', '500', '600', '700'].map((v) => (
                  <button
                    key={v}
                    onClick={() => setTargetCalories(v)}
                    className={`px-2 py-0.5 rounded text-xs border transition-colors ${
                      targetCalories === v
                        ? 'bg-emerald-500 text-white border-emerald-500'
                        : 'border-gray-200 text-gray-600'
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
              <input
                type="number"
                value={targetCalories}
                onChange={(e) => setTargetCalories(e.target.value)}
                min={100}
                className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Tipo de refeição</label>
              <select
                value={mealType}
                onChange={(e) => setMealType(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              >
                {MEAL_TYPE_OPTIONS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">
              Restrições / alergias (opcional)
            </label>
            <input
              type="text"
              value={restrictions}
              onChange={(e) => setRestrictions(e.target.value)}
              placeholder="ex: sem glúten, sem lactose, sem carne"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">
              Preferências de sabor (opcional)
            </label>
            <input
              type="text"
              value={preferences}
              onChange={(e) => setPreferences(e.target.value)}
              placeholder="ex: comida mais temperada, frango, sem carne vermelha"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>

          {error && <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

          <button
            onClick={handleGenerate}
            disabled={loading || !targetCalories}
            className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-200 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="animate-spin">⟳</span> Gerando sugestões...
              </>
            ) : (
              '✨ Gerar 3 sugestões'
            )}
          </button>
        </div>
      ) : (
        <div className="divide-y divide-gray-50">
          <div className="px-4 py-2 flex items-center justify-between">
            <p className="text-xs text-gray-500">3 sugestões para ~{targetCalories} kcal</p>
            <button
              onClick={() => setSugestoes([])}
              className="text-xs text-emerald-600 hover:underline"
            >
              ← Refazer
            </button>
          </div>

          {sugestoes.map((s, idx) => (
            <div key={idx} className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-gray-800">{s.nome}</p>
                  <p className="text-xs text-gray-400 italic mt-0.5">{s.dica}</p>
                </div>
                <span className="flex-shrink-0 bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-0.5 rounded-full">
                  {s.totais.calorias} kcal
                </span>
              </div>

              <div className="flex gap-3 text-xs text-gray-500">
                <span>P: <b className="text-blue-500">{s.totais.proteina}g</b></span>
                <span>C: <b className="text-amber-500">{s.totais.carboidrato}g</b></span>
                <span>G: <b className="text-rose-400">{s.totais.gordura}g</b></span>
              </div>

              <ul className="text-xs text-gray-600 space-y-0.5">
                {s.ingredientes.map((ing, i) => (
                  <li key={i} className="flex justify-between">
                    <span>{ing.alimento}</span>
                    <span className="text-gray-400">{ing.gramas}g</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSave(s, idx)}
                disabled={saving === idx || saved === idx}
                className={`w-full py-2 rounded-xl text-sm font-medium transition-colors ${
                  saved === idx
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-200 text-white'
                }`}
              >
                {saved === idx
                  ? '✓ Marmita salva!'
                  : saving === idx
                  ? 'Salvando...'
                  : '+ Salvar esta marmita'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
