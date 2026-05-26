import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // Verificar se o usuário já existe na tabela users
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('id', data.user.id)
        .maybeSingle()

      // Se não existir, criar o registro (primeiro acesso via Google)
      if (!existingUser) {
        const fullName =
          data.user.user_metadata?.full_name ||
          data.user.user_metadata?.name ||
          data.user.email?.split('@')[0] ||
          'Usuário'

        await supabase.from('users').insert({
          id: data.user.id,
          email: data.user.email!,
          full_name: fullName,
          avatar_url: data.user.user_metadata?.avatar_url || null,
          role: 'teacher',
          subscription_tier: 'free',
          subscription_status: 'active',
          credits: 100,
          onboarding_completed: false,
        })
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Em caso de erro, redirecionar para login com mensagem
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`)
}
