'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'

type Status = 'loading' | 'self' | 'already_friends' | 'pending_sent' | 'pending_received' | 'none' | 'not_found' | 'unauthenticated'

interface TargetProfile {
  id: string
  name: string
}

export default function PublicProfilePage() {
  const router = useRouter()
  const params = useParams()
  const targetId = params.userId as string

  const [status, setStatus] = useState<Status>('loading')
  const [target, setTarget] = useState<TargetProfile | null>(null)
  const [myId, setMyId] = useState('')
  const [sending, setSending] = useState(false)
  const [accepted, setAccepted] = useState(false)
  const [confirmed, setConfirmed] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setStatus('unauthenticated'); return }
      setMyId(user.id)

      if (user.id === targetId) { setStatus('self'); return }

      // Buscar perfil do alvo
      const { data: prof } = await supabase
        .from('profiles')
        .select('id, name')
        .eq('id', targetId)
        .single()

      if (!prof) { setStatus('not_found'); return }
      setTarget(prof)

      // Verificar estado da amizade
      const { data: friendship } = await supabase
        .from('friendships')
        .select('id, status, requester_id')
        .or(`and(requester_id.eq.${user.id},target_id.eq.${targetId}),and(requester_id.eq.${targetId},target_id.eq.${user.id})`)
        .maybeSingle()

      if (!friendship) {
        setStatus('none')
      } else if (friendship.status === 'accepted') {
        setStatus('already_friends')
      } else if (friendship.requester_id === user.id) {
        setStatus('pending_sent')
      } else {
        setStatus('pending_received')
      }
    }
    load()
  }, [targetId])

  async function sendRequest() {
    if (!confirmed) return
    setSending(true)
    await supabase.from('friendships').insert({ requester_id: myId, target_id: targetId })
    setStatus('pending_sent')
    setSending(false)
  }

  async function acceptRequest() {
    const { data: friendship } = await supabase
      .from('friendships')
      .select('id')
      .eq('requester_id', targetId)
      .eq('target_id', myId)
      .single()
    if (friendship) {
      await supabase.from('friendships').update({ status: 'accepted' }).eq('id', friendship.id)
      setStatus('already_friends')
      setAccepted(true)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-emerald-50 to-green-100 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">🥗</div>
          <h1 className="text-2xl font-bold text-gray-800">FitRF</h1>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
          {status === 'loading' && (
            <p className="text-center text-gray-400 text-sm py-4">Carregando perfil...</p>
          )}

          {status === 'unauthenticated' && (
            <div className="space-y-3 text-center">
              <p className="text-gray-700 text-sm">
                Você precisa estar logado para conectar com outras pessoas.
              </p>
              <button
                onClick={() => router.push(`/login?next=/u/${targetId}`)}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 rounded-xl transition-colors"
              >
                Entrar ou cadastrar
              </button>
            </div>
          )}

          {status === 'not_found' && (
            <div className="text-center space-y-2">
              <p className="text-4xl">🔍</p>
              <p className="font-semibold text-gray-700">Perfil não encontrado</p>
              <p className="text-sm text-gray-400">Este link pode estar desatualizado.</p>
            </div>
          )}

          {status === 'self' && (
            <div className="text-center space-y-3">
              <p className="text-4xl">👤</p>
              <p className="font-semibold text-gray-700">Este é o seu próprio perfil</p>
              <button
                onClick={() => router.push('/dashboard')}
                className="w-full bg-emerald-500 text-white font-semibold py-2.5 rounded-xl"
              >
                Ir para o Dashboard
              </button>
            </div>
          )}

          {status === 'already_friends' && target && (
            <div className="text-center space-y-3">
              <p className="text-4xl">{accepted ? '🎉' : '✅'}</p>
              <p className="font-semibold text-gray-700">
                {accepted ? `Você e ${target.name} agora são amigos!` : `Você já é amigo de ${target.name}`}
              </p>
              <button
                onClick={() => router.push(`/amigos/${target.id}`)}
                className="w-full bg-emerald-500 text-white font-semibold py-2.5 rounded-xl"
              >
                Ver dados de {target.name} →
              </button>
            </div>
          )}

          {status === 'pending_sent' && target && (
            <div className="text-center space-y-2">
              <p className="text-4xl">⏳</p>
              <p className="font-semibold text-gray-700">Solicitação enviada</p>
              <p className="text-sm text-gray-400">
                Aguardando <b>{target.name}</b> aceitar sua solicitação de conexão.
              </p>
              <button
                onClick={() => router.push('/dashboard')}
                className="text-emerald-600 text-sm font-medium hover:underline"
              >
                Voltar ao app
              </button>
            </div>
          )}

          {status === 'pending_received' && target && (
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-4xl mb-2">👋</p>
                <p className="font-semibold text-gray-700">
                  <b>{target.name}</b> quer se conectar com você!
                </p>
              </div>
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs text-amber-700">
                <p className="font-semibold mb-1">⚠️ Atenção antes de aceitar</p>
                <p>
                  Ao aceitar, <b>{target.name}</b> poderá ver <b>todo o seu diário alimentar</b>,
                  suas marmitas e planejamento semanal. Você também poderá ver os dados dele(a).
                  Esta permissão pode ser revogada a qualquer momento.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={acceptRequest}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-2.5 rounded-xl"
                >
                  ✓ Aceitar conexão
                </button>
                <button
                  onClick={() => router.push('/dashboard')}
                  className="px-4 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 text-sm"
                >
                  Ignorar
                </button>
              </div>
            </div>
          )}

          {status === 'none' && target && (
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-4xl mb-2">🤝</p>
                <p className="font-semibold text-gray-800">
                  Conectar com <b>{target.name}</b>
                </p>
              </div>

              <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs text-amber-700">
                <p className="font-semibold mb-1">⚠️ Sobre privacidade dos dados</p>
                <p>
                  Se <b>{target.name}</b> aceitar sua solicitação, vocês poderão ver mutuamente:
                  diário alimentar, marmitas e planejamento semanal. A conexão pode ser desfeita
                  a qualquer momento por qualquer uma das partes.
                </p>
              </div>

              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                  className="mt-0.5 accent-emerald-500"
                />
                <span className="text-sm text-gray-600">
                  Entendi que ao aceitar a conexão, meus dados nutricionais serão visíveis
                  para <b>{target.name}</b>.
                </span>
              </label>

              <button
                onClick={sendRequest}
                disabled={!confirmed || sending}
                className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-200 disabled:text-emerald-400 text-white font-semibold py-3 rounded-xl transition-colors"
              >
                {sending ? 'Enviando...' : `Enviar solicitação para ${target.name}`}
              </button>
            </div>
          )}
        </div>

        <button
          onClick={() => router.push('/dashboard')}
          className="block text-center text-sm text-gray-400 hover:text-emerald-600 mt-4 w-full"
        >
          ← Voltar ao app
        </button>
      </div>
    </div>
  )
}
