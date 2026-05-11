'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Navigation from '@/components/Navigation'
import { ACTIVITIES, ACTIVITY_CATEGORIES, calcCaloriesBurned, type ActivityDef } from '@/lib/activities-data'
import { format, subDays, addDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface ActivityLog {
  id: string
  activity: string
  met: number
  duration_min: number
  calories: number
  notes?: string
}

export default function AtividadesPage() {
  const router = useRouter()
  const [date, setDate] = useState(new Date())
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [weightKg, setWeightKg] = useState(70)
  const [userId, setUserId] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [category, setCategory] = useState<string>('Todos')
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<ActivityDef | null>(null)
  const [duration, setDuration] = useState('30')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const supabase = createClient()

  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    setUserId(user.id)

    // Pegar peso salvo do TMB (ou default 70)
    const { data: prof } = await supabase.from('profiles').select('tmb_weight_kg').eq('id', user.id).single()
    if (prof?.tmb_weight_kg) setWeightKg(Number(prof.tmb_weight_kg))

    const dateStr = format(date, 'yyyy-MM-dd')
    const { data } = await supabase
      .from('activity_logs')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', dateStr)
      .order('created_at')

    setLogs(data || [])
  }, [date, router])

  useEffect(() => { loadData() }, [loadData])

  const preview = selected
    ? calcCaloriesBurned(selected.met, weightKg, Number(duration) || 0)
    : 0

  async function handleAdd() {
    if (!selected || !Number(duration)) return
    setSaving(true)
    await supabase.from('activity_logs').insert({
      user_id: userId,
      date: format(date, 'yyyy-MM-dd'),
      activity: selected.name,
      met: selected.met,
      duration_min: Number(duration),
      calories: preview,
      notes: notes.trim() || null,
    })
    setSelected(null)
    setDuration('30')
    setNotes('')
    setShowForm(false)
    setSaving(false)
    loadData()
  }

  async function handleRemove(id: string) {
    await supabase.from('activity_logs').delete().eq('id', id)
    loadData()
  }

  const totalCalories = logs.reduce((s, l) => s + l.calories, 0)
  const totalMinutes = logs.reduce((s, l) => s + l.duration_min, 0)
  const isToday = format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')

  const filteredActivities = ACTIVITIES.filter((a) => {
    const matchCat = category === 'Todos' || a.category === category
    const matchQ = a.name.toLowerCase().includes(query.toLowerCase())
    return matchCat && matchQ
  })

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-800">Atividades Físicas</h1>
            <p className="text-xs text-gray-400 capitalize">
              {isToday ? 'Hoje' : format(date, "EEEE, dd 'de' MMMM", { locale: ptBR })}
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
          >
            + Registrar
          </button>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-4 space-y-4">
        {/* Date nav */}
        <div className="flex items-center justify-between bg-white rounded-2xl px-4 py-3 shadow-sm">
          <button onClick={() => setDate(subDays(date, 1))} className="text-gray-400 hover:text-emerald-600 text-xl px-1">‹</button>
          <div className="text-center">
            <p className="font-semibold text-gray-800 capitalize">
              {isToday ? 'Hoje' : format(date, 'EEEE', { locale: ptBR })}
            </p>
            <p className="text-xs text-gray-400">{format(date, "dd 'de' MMMM", { locale: ptBR })}</p>
          </div>
          <button onClick={() => setDate(addDays(date, 1))} disabled={isToday} className="text-gray-400 hover:text-emerald-600 disabled:opacity-30 text-xl px-1">›</button>
        </div>

        {/* Resumo do dia */}
        {logs.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-orange-50 rounded-2xl p-4 text-center">
              <p className="text-2xl font-bold text-orange-600">{totalCalories}</p>
              <p className="text-xs text-gray-500 mt-0.5">kcal gastas</p>
            </div>
            <div className="bg-blue-50 rounded-2xl p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">{totalMinutes}</p>
              <p className="text-xs text-gray-500 mt-0.5">minutos ativos</p>
            </div>
          </div>
        )}

        {/* Lista de atividades do dia */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-700">
              {logs.length === 0 ? 'Nenhuma atividade registrada' : `${logs.length} atividade(s)`}
            </span>
          </div>
          {logs.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-3xl mb-2">🏃</p>
              <p className="text-sm text-gray-300">Toque "+ Registrar" para adicionar</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-50">
              {logs.map((log) => (
                <li key={log.id} className="px-4 py-3 flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800">{log.activity}</p>
                    <p className="text-xs text-gray-400">{log.duration_min} min · MET {log.met}</p>
                    {log.notes && <p className="text-xs text-gray-400 italic">{log.notes}</p>}
                  </div>
                  <div className="flex items-center gap-2 ml-2">
                    <span className="text-sm font-bold text-orange-500">{log.calories} kcal</span>
                    <button onClick={() => handleRemove(log.id)} className="text-gray-200 hover:text-red-400 text-lg leading-none">×</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {weightKg === 70 && (
          <p className="text-xs text-center text-gray-400">
            💡 Cadastre seu peso na seção TMB do perfil para cálculos mais precisos.
          </p>
        )}
      </main>

      {/* Modal de registro */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50">
          <div className="bg-white w-full max-w-lg rounded-t-2xl sm:rounded-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b">
              <h2 className="font-semibold text-gray-800">Registrar atividade</h2>
              <button onClick={() => { setShowForm(false); setSelected(null) }} className="text-gray-400 text-2xl leading-none">&times;</button>
            </div>

            {!selected ? (
              <>
                {/* Busca e filtro */}
                <div className="px-4 py-3 space-y-2">
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Buscar atividade..."
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    autoFocus
                  />
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {['Todos', ...ACTIVITY_CATEGORIES].map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setCategory(cat)}
                        className={`flex-none px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                          category === cat ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
                <ul className="overflow-y-auto flex-1 divide-y divide-gray-50">
                  {filteredActivities.map((a) => (
                    <li
                      key={a.name}
                      onClick={() => setSelected(a)}
                      className="px-4 py-3 flex items-center gap-3 hover:bg-emerald-50 cursor-pointer"
                    >
                      <span className="text-2xl w-8 text-center flex-shrink-0">{a.icon}</span>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{a.name}</p>
                        <p className="text-xs text-gray-400">
                          MET {a.met} · ~{calcCaloriesBurned(a.met, weightKg, 30)} kcal/30 min ({weightKg} kg)
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <div className="p-4 flex flex-col gap-4 overflow-y-auto">
                <div>
                  <button onClick={() => setSelected(null)} className="text-xs text-emerald-600 hover:underline">← Voltar</button>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-3xl">{selected.icon}</span>
                    <div>
                      <p className="font-semibold text-gray-800">{selected.name}</p>
                      <p className="text-xs text-gray-400">MET {selected.met} · {selected.category}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Duração</label>
                  <div className="flex gap-2 flex-wrap mb-2">
                    {[15, 20, 30, 45, 60, 90].map((d) => (
                      <button
                        key={d}
                        onClick={() => setDuration(String(d))}
                        className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                          duration === String(d)
                            ? 'bg-emerald-500 text-white border-emerald-500'
                            : 'border-gray-200 text-gray-600 hover:border-emerald-300'
                        }`}
                      >
                        {d} min
                      </button>
                    ))}
                    <input
                      type="number"
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      min={1}
                      className="w-20 border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    />
                  </div>
                </div>

                {preview > 0 && (
                  <div className="bg-orange-50 rounded-xl p-3 flex items-center justify-between">
                    <span className="text-sm text-gray-600">Gasto estimado</span>
                    <span className="text-xl font-bold text-orange-600">{preview} kcal</span>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Observações (opcional)</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Ex: 5 km, ritmo confortável..."
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                </div>

                <button
                  onClick={handleAdd}
                  disabled={!Number(duration) || saving}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-200 text-white font-semibold py-3 rounded-xl transition-colors"
                >
                  {saving ? 'Salvando...' : 'Registrar atividade'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <Navigation />
    </div>
  )
}
