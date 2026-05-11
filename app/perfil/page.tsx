'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Navigation from '@/components/Navigation'
import { Profile } from '@/types'

export default function PerfilPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [form, setForm] = useState({ name: '', calorie_goal: 2000, protein_goal: 125, carbs_goal: 250, fat_goal: 55 })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [email, setEmail] = useState('')

  const supabase = createClient()

  const loadProfile = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    setEmail(user.email || '')

    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    if (data) {
      setProfile(data)
      setForm({
        name: data.name,
        calorie_goal: data.calorie_goal,
        protein_goal: data.protein_goal,
        carbs_goal: data.carbs_goal,
        fat_goal: data.fat_goal,
      })
    }
  }, [router])

  useEffect(() => { loadProfile() }, [loadProfile])

  function autoCalcMacros(kcal: number) {
    setForm((f) => ({
      ...f,
      calorie_goal: kcal,
      protein_goal: Math.round(kcal * 0.25 / 4),
      carbs_goal: Math.round(kcal * 0.50 / 4),
      fat_goal: Math.round(kcal * 0.25 / 9),
    }))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('profiles').upsert({ id: user.id, ...form })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    loadProfile()
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600 text-xl">←</button>
          <h1 className="text-lg font-bold text-gray-800">Perfil e Metas</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-5">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="bg-white rounded-2xl shadow-sm p-4 space-y-4">
            <h2 className="font-semibold text-gray-700">Dados pessoais</h2>

            {email && (
              <div>
                <label className="text-xs text-gray-500 block mb-0.5">E-mail</label>
                <p className="text-sm text-gray-600">{email}</p>
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Nome</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-700">Metas diárias</h2>
              <button
                type="button"
                onClick={() => autoCalcMacros(form.calorie_goal)}
                className="text-xs text-emerald-600 hover:underline"
              >
                Auto-calcular macros
              </button>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Calorias (kcal)</label>
              <div className="flex gap-2 flex-wrap mb-2">
                {[1500, 1800, 2000, 2200, 2500].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => autoCalcMacros(v)}
                    className={`px-2.5 py-1 rounded-lg text-xs border transition-colors ${
                      form.calorie_goal === v
                        ? 'bg-emerald-500 text-white border-emerald-500'
                        : 'border-gray-200 text-gray-600 hover:border-emerald-300'
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
              <input
                type="number"
                value={form.calorie_goal}
                onChange={(e) => setForm({ ...form, calorie_goal: Number(e.target.value) })}
                min={800}
                max={6000}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                { key: 'protein_goal', label: 'Proteína (g)', color: 'text-blue-500' },
                { key: 'carbs_goal', label: 'Carboidratos (g)', color: 'text-amber-500' },
                { key: 'fat_goal', label: 'Gordura (g)', color: 'text-rose-400' },
              ].map(({ key, label, color }) => (
                <div key={key}>
                  <label className={`text-xs font-medium ${color} block mb-1`}>{label}</label>
                  <input
                    type="number"
                    value={form[key as keyof typeof form]}
                    onChange={(e) => setForm({ ...form, [key]: Number(e.target.value) })}
                    min={0}
                    className="w-full border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                </div>
              ))}
            </div>

            <p className="text-xs text-gray-400">
              Estimativa calórica: {(form.protein_goal * 4 + form.carbs_goal * 4 + form.fat_goal * 9).toFixed(0)} kcal dos macros definidos
            </p>
          </div>

          <button
            type="submit"
            disabled={saving}
            className={`w-full font-semibold py-3 rounded-2xl transition-colors ${
              saved
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-200 text-white'
            }`}
          >
            {saved ? '✓ Salvo!' : saving ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </form>
      </main>

      <Navigation />
    </div>
  )
}
