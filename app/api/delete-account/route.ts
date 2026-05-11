import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export async function DELETE() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

  if (!serviceKey || !supabaseUrl) {
    return NextResponse.json(
      { error: 'Serviço de exclusão não configurado. Contate o administrador.' },
      { status: 503 }
    )
  }

  const admin = createAdminClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // Remover dados em cascata (profiles tem ON DELETE CASCADE via auth.users)
  // mas deletamos explicitamente para garantir
  await admin.from('weekly_plans').delete().eq('user_id', user.id)
  await admin.from('meal_logs').delete().eq('user_id', user.id)
  await admin.from('marmitas').delete().eq('user_id', user.id)
  await admin.from('friendships').delete().or(`requester_id.eq.${user.id},target_id.eq.${user.id}`)
  await admin.from('profiles').delete().eq('id', user.id)

  const { error } = await admin.auth.admin.deleteUser(user.id)
  if (error) {
    return NextResponse.json({ error: 'Falha ao excluir conta. Tente novamente.' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
