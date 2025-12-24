import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateContent } from '@/lib/gemini'

const CREDIT_COST = 5
const TOOL_TYPE = 'plano_aula'
const SKIP_CREDITS = process.env.SKIP_CREDITS === 'true'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Verificar se usuário existe na tabela users (não apenas no auth)
    const { data: dbUser, error: userCheckError } = await supabase
      .from('users')
      .select('id, credits')
      .eq('id', user.id)
      .single()

    if (userCheckError || !dbUser) {
      console.error('Usuário não encontrado na tabela users:', user.id, userCheckError)
      return NextResponse.json(
        { error: 'Usuário não cadastrado completamente. Faça logout e login novamente.' },
        { status: 400 }
      )
    }

    const inputData = await request.json()
    const generationId = crypto.randomUUID()

    // Verificar créditos do usuário (pular se SKIP_CREDITS=true)
    if (!SKIP_CREDITS) {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('credits')
        .eq('id', user.id)
        .single()

      if (userError || !userData) {
        return NextResponse.json(
          { error: 'Erro ao verificar créditos' },
          { status: 500 }
        )
      }

      if (userData.credits < CREDIT_COST) {
        return NextResponse.json(
          { error: 'Créditos insuficientes' },
          { status: 402 }
        )
      }
    }

    // Criar registro pendente
    const { error: insertError } = await supabase.from('generations').insert({
      id: generationId,
      user_id: user.id,
      tool_type: TOOL_TYPE,
      title: `Plano de Aula: ${inputData.tema}`,
      input_data: inputData,
      status: 'processing',
      credits_used: SKIP_CREDITS ? 0 : CREDIT_COST
    })

    if (insertError) {
      console.error('Erro ao inserir generation:', insertError)
      return NextResponse.json(
        { error: `Erro ao criar registro: ${insertError.message}` },
        { status: 500 }
      )
    }

    // Consumir créditos ANTES de gerar (pular se SKIP_CREDITS=true)
    if (!SKIP_CREDITS) {
      const { data: creditSuccess, error: creditError } = await supabase.rpc('consume_credits', {
        p_user_id: user.id,
        p_generation_id: generationId,
        p_amount: CREDIT_COST
      })

      if (creditError || !creditSuccess) {
        await supabase.from('generations')
          .update({ status: 'failed', error_message: 'Erro ao consumir créditos' })
          .eq('id', generationId)

        return NextResponse.json(
          { error: 'Erro ao consumir créditos' },
          { status: 402 }
        )
      }
    }

    // Gerar conteúdo com Gemini
    const startTime = Date.now()

    try {
      const outputData = await generateContent(TOOL_TYPE, inputData)
      const processingTime = Date.now() - startTime

      // Salvar resultado
      await supabase.from('generations')
        .update({
          output_data: outputData,
          status: 'completed',
          processing_time_ms: processingTime
        })
        .eq('id', generationId)

      return NextResponse.json({
        success: true,
        generationId,
        output: outputData
      })

    } catch (genError) {
      const errorMessage = genError instanceof Error ? genError.message : 'Erro desconhecido'
      console.error('Erro na geração Gemini:', genError)

      await supabase.from('generations')
        .update({
          status: 'failed',
          error_message: errorMessage
        })
        .eq('id', generationId)

      return NextResponse.json(
        { error: `Erro ao gerar conteúdo: ${errorMessage}` },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Erro no endpoint plano-aula:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
