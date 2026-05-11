'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Navigation from '@/components/Navigation'
import { Profile } from '@/types'
import {
  calcTmb, suggestCalories,
  ACTIVITY_LABELS, GOAL_LABELS,
  type ActivityLevel, type Sex, type Goal,
} from '@/lib/tmb'

type Section = 'dados' | 'metas' | 'tmb' | 'amigos' | 'exportar' | 'excluir'

const MAX_AVATAR_BYTES = 5 * 1024 * 1024 // 5 MB

export default function PerfilPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [form, setForm] = useState({
    name: '', calorie_goal: 2000, protein_goal: 125, carbs_goal: 250, fat_goal: 55,
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [email, setEmail] = useState('')
  const [isGoogleUser, setIsGoogleUser] = useState(false)
  const [activeSection, setActiveSection] = useState<Section>('dados')
  const [userId, setUserId] = useState('')
  const [profileUrl, setProfileUrl] = useState('')

  // Avatar state
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [avatarLoading, setAvatarLoading] = useState(false)
  const [avatarError, setAvatarError] = useState('')

  // TMB state
  const [tmbForm, setTmbForm] = useState({
    weight_kg: '', height_cm: '', age_years: '',
    sex: 'masculino' as Sex, activity: 'moderado' as ActivityLevel,
  })
  const [tmbGoal, setTmbGoal] = useState<Goal>('manter')
  const [tmbResult, setTmbResult] = useState<ReturnType<typeof calcTmb> | null>(null)

  // Delete state
  const [deleteStep, setDeleteStep] = useState<'idle' | 'confirm' | 'password'>('idle')
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deletePassword, setDeletePassword] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  // Export state
  const [exportLoading, setExportLoading] = useState(false)

  const supabase = createClient()

  const loadProfile = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    setEmail(user.email || '')
    setUserId(user.id)
    setIsGoogleUser(user.app_metadata?.provider === 'google')
    setProfileUrl(`${window.location.origin}/u/${user.id}`)

    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    if (data) {
      setProfile(data)
      if (data.avatar_url) setAvatarUrl(data.avatar_url)
      setForm({
        name: data.name, calorie_goal: data.calorie_goal,
        protein_goal: data.protein_goal, carbs_goal: data.carbs_goal, fat_goal: data.fat_goal,
      })
      if (data.tmb_weight_kg || data.tmb_height_cm || data.tmb_age_years) {
        setTmbForm({
          weight_kg: data.tmb_weight_kg?.toString() ?? '',
          height_cm: data.tmb_height_cm?.toString() ?? '',
          age_years: data.tmb_age_years?.toString() ?? '',
          sex: (data.tmb_sex as Sex) || 'masculino',
          activity: (data.tmb_activity as ActivityLevel) || 'moderado',
        })
      }
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

  async function calcTmbNow() {
    const w = Number(tmbForm.weight_kg)
    const h = Number(tmbForm.height_cm)
    const a = Number(tmbForm.age_years)
    if (!w || !h || !a) return
    setTmbResult(calcTmb({ weight_kg: w, height_cm: h, age_years: a, sex: tmbForm.sex, activity: tmbForm.activity }))
    // Persiste os valores para pré-preencher na próxima vez
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('profiles').update({
        tmb_weight_kg: w,
        tmb_height_cm: h,
        tmb_age_years: a,
        tmb_sex: tmbForm.sex,
        tmb_activity: tmbForm.activity,
      }).eq('id', user.id)
    }
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > MAX_AVATAR_BYTES) {
      setAvatarError('A imagem deve ter no máximo 5 MB.')
      return
    }
    setAvatarError('')
    setAvatarLoading(true)
    const ext = file.name.split('.').pop()
    const path = `${userId}/${Date.now()}.${ext}`
    const { data: upload, error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
    if (error || !upload) {
      setAvatarError('Falha ao enviar imagem. Tente novamente.')
      setAvatarLoading(false)
      return
    }
    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(upload.path)
    await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', userId)
    setAvatarUrl(publicUrl)
    setAvatarLoading(false)
  }

  async function handleRemoveAvatar() {
    await supabase.from('profiles').update({ avatar_url: null }).eq('id', userId)
    setAvatarUrl(null)
  }

  function applyTmbToGoal() {
    if (!tmbResult) return
    const kcal = suggestCalories(tmbResult.recommended_get, tmbGoal)
    autoCalcMacros(kcal)
    setActiveSection('metas')
  }

  async function handleExport() {
    setExportLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [
      { data: prof },
      { data: logs },
      { data: marmitas },
      { data: foods },
      { data: plans },
    ] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('meal_logs').select('*, meal_log_items(*, food:foods(*))').eq('user_id', user.id),
      supabase.from('marmitas').select('*, marmita_items(*, food:foods(*))').eq('user_id', user.id),
      supabase.from('foods').select('*').eq('created_by', user.id),
      supabase.from('weekly_plans').select('*').eq('user_id', user.id),
    ])

    const exportData = {
      exportDate: new Date().toISOString(),
      profile: prof,
      meal_logs: logs,
      marmitas,
      custom_foods: foods,
      weekly_plans: plans,
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `fitrf-dados-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    setExportLoading(false)
  }

  async function handleDelete() {
    if (deleteConfirmText !== 'EXCLUIR MINHA CONTA') {
      setDeleteError('Digite exatamente: EXCLUIR MINHA CONTA')
      return
    }
    setDeleteError('')

    // Para usuários com e-mail, verificar senha antes
    if (!isGoogleUser && deleteStep === 'confirm') {
      setDeleteStep('password')
      return
    }

    if (!isGoogleUser && deleteStep === 'password') {
      if (!deletePassword) { setDeleteError('Informe sua senha.'); return }
      // Verificar senha fazendo um sign-in silencioso
      const { error } = await supabase.auth.signInWithPassword({ email, password: deletePassword })
      if (error) { setDeleteError('Senha incorreta.'); return }
    }

    setDeleteLoading(true)
    const { error } = await supabase.rpc('delete_own_account')
    if (error) {
      setDeleteError('Erro ao excluir conta. Tente novamente.')
      setDeleteLoading(false)
      return
    }
    await supabase.auth.signOut()
    router.push('/login')
  }

  function copyProfileUrl() {
    navigator.clipboard.writeText(profileUrl)
  }

  const SECTIONS: { id: Section; label: string; icon: string }[] = [
    { id: 'dados', label: 'Dados pessoais', icon: '👤' },
    { id: 'metas', label: 'Metas nutricionais', icon: '🎯' },
    { id: 'tmb', label: 'Taxa Metabólica Basal', icon: '🔬' },
    { id: 'amigos', label: 'Meu perfil público', icon: '🔗' },
    { id: 'exportar', label: 'Exportar dados', icon: '📦' },
    { id: 'excluir', label: 'Excluir conta', icon: '🗑️' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600 text-xl">←</button>
          <h1 className="text-lg font-bold text-gray-800">Perfil</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-5 space-y-3">
        {/* Section tabs */}
        <div className="grid grid-cols-2 gap-2">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left ${
                activeSection === s.id
                  ? s.id === 'excluir'
                    ? 'bg-red-50 text-red-600 ring-1 ring-red-200'
                    : 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                  : 'bg-white text-gray-600 shadow-sm hover:bg-gray-50'
              }`}
            >
              <span>{s.icon}</span>
              <span className="leading-tight">{s.label}</span>
            </button>
          ))}
        </div>

        {/* ── Dados pessoais ── */}
        {activeSection === 'dados' && (
          <form onSubmit={handleSave} className="bg-white rounded-2xl shadow-sm p-4 space-y-4">
            {/* Avatar */}
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Foto de perfil"
                    className="w-24 h-24 rounded-full object-cover ring-2 ring-emerald-200"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-emerald-100 flex items-center justify-center text-4xl">
                    👤
                  </div>
                )}
                {avatarLoading && (
                  <div className="absolute inset-0 rounded-full bg-black/30 flex items-center justify-center">
                    <span className="text-white text-xs">...</span>
                  </div>
                )}
              </div>
              {avatarError && <p className="text-xs text-red-500">{avatarError}</p>}
              <div className="flex gap-2">
                <label className="cursor-pointer bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors">
                  {avatarUrl ? 'Trocar foto' : 'Adicionar foto'}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleAvatarUpload}
                    disabled={avatarLoading}
                  />
                </label>
                {avatarUrl && (
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    className="text-xs text-red-400 hover:text-red-600 px-3 py-1.5 border border-red-200 rounded-lg"
                  >
                    Remover
                  </button>
                )}
              </div>
            </div>

            {email && (
              <div>
                <p className="text-xs text-gray-400 mb-0.5">E-mail</p>
                <p className="text-sm text-gray-700">{email}</p>
                {isGoogleUser && (
                  <p className="text-xs text-blue-500 mt-0.5">Conta vinculada ao Google</p>
                )}
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
            <button
              type="submit"
              disabled={saving}
              className={`w-full font-semibold py-3 rounded-2xl transition-colors ${
                saved
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-200 text-white'
              }`}
            >
              {saved ? '✓ Salvo!' : saving ? 'Salvando...' : 'Salvar'}
            </button>
          </form>
        )}

        {/* ── Metas nutricionais ── */}
        {activeSection === 'metas' && (
          <form onSubmit={handleSave} className="bg-white rounded-2xl shadow-sm p-4 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-700">Metas diárias</p>
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
                min={800} max={6000}
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
              Estimativa: {(form.protein_goal * 4 + form.carbs_goal * 4 + form.fat_goal * 9).toFixed(0)} kcal
            </p>
            <button
              type="submit"
              disabled={saving}
              className={`w-full font-semibold py-3 rounded-2xl transition-colors ${
                saved
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-200 text-white'
              }`}
            >
              {saved ? '✓ Salvo!' : saving ? 'Salvando...' : 'Salvar metas'}
            </button>
          </form>
        )}

        {/* ── TMB ── */}
        {activeSection === 'tmb' && (
          <div className="space-y-3">
            <div className="bg-white rounded-2xl shadow-sm p-4 space-y-4">
              <div>
                <p className="font-semibold text-gray-800">Taxa Metabólica Basal</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Baseado na equação de Mifflin-St Jeor (1990) — a mais precisa para adultos saudáveis,
                  validada no <em>American Journal of Clinical Nutrition</em>.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Peso (kg)</label>
                  <input
                    type="number"
                    value={tmbForm.weight_kg}
                    onChange={(e) => setTmbForm({ ...tmbForm, weight_kg: e.target.value })}
                    placeholder="ex: 75"
                    className="w-full border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Altura (cm)</label>
                  <input
                    type="number"
                    value={tmbForm.height_cm}
                    onChange={(e) => setTmbForm({ ...tmbForm, height_cm: e.target.value })}
                    placeholder="ex: 170"
                    className="w-full border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Idade (anos)</label>
                  <input
                    type="number"
                    value={tmbForm.age_years}
                    onChange={(e) => setTmbForm({ ...tmbForm, age_years: e.target.value })}
                    placeholder="ex: 30"
                    className="w-full border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Sexo biológico</label>
                  <select
                    value={tmbForm.sex}
                    onChange={(e) => setTmbForm({ ...tmbForm, sex: e.target.value as Sex })}
                    className="w-full border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  >
                    <option value="masculino">Masculino</option>
                    <option value="feminino">Feminino</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Nível de atividade física</label>
                <select
                  value={tmbForm.activity}
                  onChange={(e) => setTmbForm({ ...tmbForm, activity: e.target.value as ActivityLevel })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                >
                  {(Object.entries(ACTIVITY_LABELS) as [ActivityLevel, string][]).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={calcTmbNow}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-2.5 rounded-xl transition-colors"
              >
                Calcular
              </button>
            </div>

            {tmbResult && (
              <div className="bg-white rounded-2xl shadow-sm p-4 space-y-4">
                <p className="font-semibold text-gray-800">Resultado</p>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-emerald-50 rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold text-emerald-700">{tmbResult.recommended_tmb}</p>
                    <p className="text-xs text-gray-500">kcal/dia — TMB</p>
                    <p className="text-xs text-gray-400">(em repouso total)</p>
                  </div>
                  <div className="bg-blue-50 rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold text-blue-700">{tmbResult.recommended_get}</p>
                    <p className="text-xs text-gray-500">kcal/dia — GET</p>
                    <p className="text-xs text-gray-400">(com atividade)</p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-500 space-y-1">
                  <p><b>Mifflin-St Jeor:</b> TMB {tmbResult.tmb_mifflin} → GET {tmbResult.get_mifflin} kcal</p>
                  <p><b>Harris-Benedict:</b> TMB {tmbResult.tmb_harris} → GET {tmbResult.get_harris} kcal</p>
                  <p className="text-gray-400 pt-1">
                    Fator de atividade aplicado: ×{tmbResult.activity_factor}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Aplicar às minhas metas:</p>
                  <div className="space-y-1.5">
                    {(Object.entries(GOAL_LABELS) as [Goal, string][]).map(([g, label]) => (
                      <label key={g} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="tmb_goal"
                          value={g}
                          checked={tmbGoal === g}
                          onChange={() => setTmbGoal(g)}
                          className="accent-emerald-500"
                        />
                        <span className="text-sm text-gray-700">{label}</span>
                        <span className="text-xs text-gray-400 ml-auto">
                          {suggestCalories(tmbResult.recommended_get, g)} kcal
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <button
                  onClick={applyTmbToGoal}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-2.5 rounded-xl transition-colors"
                >
                  Aplicar {suggestCalories(tmbResult.recommended_get, tmbGoal)} kcal às metas →
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Perfil público / Amigos ── */}
        {activeSection === 'amigos' && (
          <div className="bg-white rounded-2xl shadow-sm p-4 space-y-4">
            <div>
              <p className="font-semibold text-gray-800">Seu link de perfil</p>
              <p className="text-xs text-gray-400 mt-0.5">
                Compartilhe este link para que outras pessoas possam solicitar conexão com você.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input
                readOnly
                value={profileUrl}
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-600 bg-gray-50 focus:outline-none"
              />
              <button
                onClick={copyProfileUrl}
                className="px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-medium rounded-lg transition-colors"
              >
                Copiar
              </button>
            </div>

            <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs text-amber-700 space-y-1">
              <p className="font-semibold">⚠️ Sobre privacidade</p>
              <p>
                Ao aceitar uma conexão, o outro usuário poderá visualizar seu diário alimentar,
                marmitas e planejamento semanal. Você poderá remover a conexão a qualquer momento
                na página <b>Amigos</b>.
              </p>
            </div>

            <a
              href="/amigos"
              className="block w-full text-center bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2.5 rounded-xl text-sm transition-colors"
            >
              Gerenciar amigos →
            </a>
          </div>
        )}

        {/* ── Exportar dados ── */}
        {activeSection === 'exportar' && (
          <div className="bg-white rounded-2xl shadow-sm p-4 space-y-4">
            <div>
              <p className="font-semibold text-gray-800">Exportar meus dados</p>
              <p className="text-xs text-gray-400 mt-0.5">
                Baixe todos os seus dados em formato JSON: perfil, diário alimentar, marmitas,
                alimentos personalizados e planejamento semanal.
              </p>
            </div>
            <ul className="text-xs text-gray-500 list-disc list-inside space-y-1">
              <li>Perfil e metas nutricionais</li>
              <li>Diário alimentar completo</li>
              <li>Todas as marmitas e composições</li>
              <li>Alimentos personalizados cadastrados</li>
              <li>Planejamento semanal</li>
            </ul>
            <button
              onClick={handleExport}
              disabled={exportLoading}
              className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-200 text-white font-semibold py-3 rounded-2xl transition-colors"
            >
              {exportLoading ? 'Preparando...' : '⬇️ Baixar dados (JSON)'}
            </button>
          </div>
        )}

        {/* ── Excluir conta ── */}
        {activeSection === 'excluir' && (
          <div className="space-y-3">
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
              <p className="font-bold text-red-700 text-base">⚠️ Zona de perigo</p>
              <p className="text-sm text-red-600 mt-1">
                A exclusão da conta é <strong>permanente e irreversível</strong>. Todos os seus dados
                serão apagados definitivamente: perfil, diário alimentar, marmitas, planejamento e
                conexões. Não há como recuperar.
              </p>
            </div>

            {deleteStep === 'idle' && (
              <button
                onClick={() => setDeleteStep('confirm')}
                className="w-full border-2 border-red-300 text-red-600 hover:bg-red-50 font-semibold py-3 rounded-2xl transition-colors"
              >
                Quero excluir minha conta
              </button>
            )}

            {(deleteStep === 'confirm' || deleteStep === 'password') && (
              <div className="bg-white rounded-2xl shadow-sm p-4 space-y-4">
                <p className="font-semibold text-gray-800">Confirmação final</p>

                {deleteError && (
                  <p className="text-red-500 text-sm bg-red-50 rounded-lg px-3 py-2">{deleteError}</p>
                )}

                <div>
                  <label className="text-sm text-gray-700 block mb-1">
                    Para confirmar, digite exatamente:
                  </label>
                  <p className="font-mono text-sm font-bold text-red-600 mb-2 select-all">
                    EXCLUIR MINHA CONTA
                  </p>
                  <input
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder="EXCLUIR MINHA CONTA"
                    className="w-full border border-red-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 font-mono"
                  />
                </div>

                {deleteStep === 'password' && !isGoogleUser && (
                  <div>
                    <label className="text-sm text-gray-700 block mb-1">
                      Confirme com sua senha atual
                    </label>
                    <input
                      type="password"
                      value={deletePassword}
                      onChange={(e) => setDeletePassword(e.target.value)}
                      placeholder="Sua senha"
                      className="w-full border border-red-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
                    />
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={handleDelete}
                    disabled={deleteLoading || deleteConfirmText !== 'EXCLUIR MINHA CONTA'}
                    className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-200 disabled:text-red-400 text-white font-bold py-3 rounded-xl transition-colors"
                  >
                    {deleteLoading ? 'Excluindo...' : 'Excluir permanentemente'}
                  </button>
                  <button
                    onClick={() => {
                      setDeleteStep('idle')
                      setDeleteConfirmText('')
                      setDeletePassword('')
                      setDeleteError('')
                    }}
                    className="px-4 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <Navigation />
    </div>
  )
}
