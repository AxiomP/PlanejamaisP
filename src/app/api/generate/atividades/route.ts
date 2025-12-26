import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateContent } from '@/lib/gemini'
import { parseInstitutionalSettings } from '@/types/institutional-settings'
import { buildInstitutionalPromptContext } from '@/lib/institutional-context'

const CREDIT_COST = 3
const TOOL_TYPE = 'ideias_atividades'
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

    // Verificar se usuário existe na tabela users
    const { data: dbUser, error: userCheckError } = await supabase
      .from('users')
      .select('id, credits, institution_id')
      .eq('id', user.id)
      .single()

    if (userCheckError || !dbUser) {
      return NextResponse.json(
        { error: 'Usuário não cadastrado completamente. Faça logout e login novamente.' },
        { status: 400 }
      )
    }

    const requestData = await request.json()
    const { mode = 'personalizado', ...inputData } = requestData

    // Validar modo institucional
    if (mode === 'institucional' && !dbUser.institution_id) {
      return NextResponse.json(
        { error: 'Modo institucional não disponível. Você não está vinculado a uma instituição.' },
        { status: 403 }
      )
    }

    // Buscar configurações institucionais se modo institucional
    let institutionalContext: string | null = null
    if (mode === 'institucional' && dbUser.institution_id) {
      const { data: institution } = await supabase
        .from('institutions')
        .select('settings')
        .eq('id', dbUser.institution_id)
        .single()

      if (institution?.settings) {
        const settings = parseInstitutionalSettings(institution.settings)
        if (settings) {
          institutionalContext = buildInstitutionalPromptContext(settings)
        }
      }
    }

    const generationId = crypto.randomUUID()

    // Preparar metadata com informações do modo de geração
    const metadata = {
      generation_mode: mode,
      institution_id: mode === 'institucional' ? dbUser.institution_id : null
    }

    // Validar campos obrigatórios
    if (!inputData.tema || inputData.tema.length < 3) {
      return NextResponse.json(
        { error: 'O tema deve ter pelo menos 3 caracteres' },
        { status: 400 }
      )
    }

    if (inputData.tema.length > 200) {
      return NextResponse.json(
        { error: 'O tema deve ter no máximo 200 caracteres' },
        { status: 400 }
      )
    }

    if (!inputData.disciplina) {
      return NextResponse.json(
        { error: 'A disciplina é obrigatória' },
        { status: 400 }
      )
    }

    if (!inputData.ano) {
      return NextResponse.json(
        { error: 'O ano/série é obrigatório' },
        { status: 400 }
      )
    }

    if (!inputData.tipoAtividade) {
      return NextResponse.json(
        { error: 'O tipo de atividade é obrigatório' },
        { status: 400 }
      )
    }

    if (!inputData.modalidade) {
      return NextResponse.json(
        { error: 'A modalidade é obrigatória' },
        { status: 400 }
      )
    }

    if (!inputData.duracao) {
      return NextResponse.json(
        { error: 'A duração é obrigatória' },
        { status: 400 }
      )
    }

    if (!inputData.quantidade || inputData.quantidade < 1 || inputData.quantidade > 10) {
      return NextResponse.json(
        { error: 'A quantidade deve ser entre 1 e 10' },
        { status: 400 }
      )
    }

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
      title: `Ideias de Atividades: ${inputData.tema}`,
      input_data: inputData,
      status: 'processing',
      credits_used: SKIP_CREDITS ? 0 : CREDIT_COST,
      metadata
    })

    if (insertError) {
      return NextResponse.json(
        { error: 'Erro ao criar registro' },
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

    // Gerar conteúdo
    const startTime = Date.now()

    try {
      const outputData = await generateContent(TOOL_TYPE, inputData, institutionalContext)
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

      await supabase.from('generations')
        .update({
          status: 'failed',
          error_message: errorMessage
        })
        .eq('id', generationId)

      return NextResponse.json(
        { error: 'Erro ao gerar conteúdo. Por favor, tente novamente.' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Erro no endpoint atividades:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
