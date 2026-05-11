'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Navigation from '@/components/Navigation'

interface FriendEntry {
  id: string
  friendshipId: string
  name: string
  role: 'requester' | 'target'
  status: 'pending' | 'accepted'
}

export default function AmigosPage() {
  const router = useRouter()
  const [friends, setFriends] = useState<FriendEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [myId, setMyId] = useState('')
  const [profileUrl, setProfileUrl] = useState('')
  const [copied, setCopied] = useState(false)

  const supabase = createClient()

  const loadFriends = useCallback(async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    setMyId(user.id)
    setProfileUrl(`${window.location.origin}/u/${user.id}`)

    const { data: rows } = await supabase
      .from('friendships')
      .select('id, status, requester_id, target_id')
      .or(`requester_id.eq.${user.id},target_id.eq.${user.id}`)
      .order('created_at', { ascending: false })

    if (!rows) { setLoading(false); return }

    // Coletar IDs dos amigos
    const otherIds = rows.map((r) => r.requester_id === user.id ? r.target_id : r.requester_id)

    let profiles: { id: string; name: string }[] = []
    if (otherIds.length) {
      const { data: profs } = await supabase
        .from('profiles')
        .select('id, name')
        .in('id', otherIds)
      profiles = profs || []
    }

    const entries: FriendEntry[] = rows.map((r) => {
      const otherId = r.requester_id === user.id ? r.target_id : r.requester_id
      const prof = profiles.find((p) => p.id === otherId)
      return {
        id: otherId,
        friendshipId: r.id,
        name: prof?.name || 'Usuário desconhecido',
        role: r.requester_id === user.id ? 'requester' : 'target',
        status: r.status,
      }
    })

    setFriends(entries)
    setLoading(false)
  }, [router])

  useEffect(() => { loadFriends() }, [loadFriends])

  async function acceptFriend(friendshipId: string) {
    await supabase.from('friendships').update({ status: 'accepted' }).eq('id', friendshipId)
    loadFriends()
  }

  async function removeFriend(friendshipId: string) {
    if (!confirm('Remover esta conexão?')) return
    await supabase.from('friendships').delete().eq('id', friendshipId)
    loadFriends()
  }

  function copyUrl() {
    navigator.clipboard.writeText(profileUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const pending = friends.filter((f) => f.status === 'pending')
  const pendingReceived = pending.filter((f) => f.role === 'target')
  const pendingSent = pending.filter((f) => f.role === 'requester')
  const accepted = friends.filter((f) => f.status === 'accepted')

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600 text-xl">←</button>
          <h1 className="text-lg font-bold text-gray-800">
            Amigos
            {pendingReceived.length > 0 && (
              <span className="ml-2 bg-red-500 text-white text-xs font-bold rounded-full px-1.5 py-0.5">
                {pendingReceived.length}
              </span>
            )}
          </h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-4 space-y-4">
        {/* Link de convite */}
        <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
          <div>
            <p className="font-semibold text-sm text-gray-700">Compartilhe seu link</p>
            <p className="text-xs text-gray-400">
              Envie este link para quem você quer conectar, ou peça o link da outra pessoa.
            </p>
          </div>
          <div className="flex gap-2">
            <input
              readOnly
              value={profileUrl}
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-600 bg-gray-50 focus:outline-none"
            />
            <button
              onClick={copyUrl}
              className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                copied
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-emerald-500 hover:bg-emerald-600 text-white'
              }`}
            >
              {copied ? '✓ Copiado' : 'Copiar'}
            </button>
          </div>
        </div>

        {loading && (
          <div className="bg-white rounded-2xl shadow-sm p-8 text-center text-gray-300 text-sm">
            Carregando...
          </div>
        )}

        {/* Solicitações recebidas */}
        {pendingReceived.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-50 flex items-center gap-2">
              <span className="w-2 h-2 bg-red-500 rounded-full" />
              <span className="font-semibold text-sm text-gray-700">
                Solicitações recebidas ({pendingReceived.length})
              </span>
            </div>
            <ul className="divide-y divide-gray-50">
              {pendingReceived.map((f) => (
                <li key={f.friendshipId} className="px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{f.name}</p>
                      <p className="text-xs text-gray-400">
                        Quer se conectar com você. Ao aceitar, vocês verão os dados um do outro.
                      </p>
                    </div>
                    <div className="flex gap-1 ml-2 flex-shrink-0">
                      <button
                        onClick={() => acceptFriend(f.friendshipId)}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg"
                      >
                        Aceitar
                      </button>
                      <button
                        onClick={() => removeFriend(f.friendshipId)}
                        className="border border-gray-200 text-gray-500 hover:bg-gray-50 text-xs px-2 py-1.5 rounded-lg"
                      >
                        Ignorar
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Solicitações enviadas */}
        {pendingSent.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-50">
              <span className="font-semibold text-sm text-gray-700">
                Aguardando resposta ({pendingSent.length})
              </span>
            </div>
            <ul className="divide-y divide-gray-50">
              {pendingSent.map((f) => (
                <li key={f.friendshipId} className="px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{f.name}</p>
                    <p className="text-xs text-gray-400">Solicitação pendente</p>
                  </div>
                  <button
                    onClick={() => removeFriend(f.friendshipId)}
                    className="text-xs text-red-400 hover:text-red-600"
                  >
                    Cancelar
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Amigos conectados */}
        {!loading && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-50">
              <span className="font-semibold text-sm text-gray-700">
                Conexões ({accepted.length})
              </span>
            </div>
            {accepted.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-gray-300">
                <p className="text-3xl mb-2">🤝</p>
                <p>Nenhuma conexão ainda.</p>
                <p className="text-xs mt-1">Compartilhe seu link para conectar com alguém.</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-50">
                {accepted.map((f) => (
                  <li key={f.friendshipId} className="flex items-center">
                    <button
                      onClick={() => router.push(`/amigos/${f.id}`)}
                      className="flex-1 px-4 py-3 text-left hover:bg-emerald-50 transition-colors"
                    >
                      <p className="text-sm font-medium text-gray-800">{f.name}</p>
                      <p className="text-xs text-emerald-600">Ver diário e marmitas →</p>
                    </button>
                    <button
                      onClick={() => removeFriend(f.friendshipId)}
                      className="px-4 py-3 text-gray-300 hover:text-red-400 text-xs"
                    >
                      remover
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </main>

      <Navigation />
    </div>
  )
}
