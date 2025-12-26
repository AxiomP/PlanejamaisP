import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Groq from 'groq-sdk'

const CREDIT_COST = 1
const SKIP_CREDITS = process.env.SKIP_CREDITS === 'true'

function getGroqClient() {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    throw new Error('GROQ_API_KEY não está configurada nas variáveis de ambiente')
  }
  return new Groq({ apiKey })
}

const SYSTEM_INSTRUCTION = `Você é um assistente especializado na BNCC (Base Nacional Comum Curricular) brasileira.

Seu papel é:
1. Explicar as 10 competências gerais da BNCC de forma clara e didática
2. Detalhar habilidades específicas por área do conhecimento e ano escolar
3. Sugerir atividades práticas alinhadas às competências e habilidades
4. Orientar professores sobre como implementar a BNCC em sala de aula
5. Esclarecer dúvidas sobre códigos alfanuméricos da BNCC (ex: EF06MA01)
6. Relacionar conteúdos curriculares com as competências da BNCC

Diretrizes:
- Responda sempre em português brasileiro
- Use linguagem acessível para educadores
- Quando mencionar códigos BNCC, explique o que significam
- Sugira exemplos práticos e contextualizados para a realidade brasileira
- Seja objetivo, mas completo nas explicações
- Use formatação Markdown para organizar as respostas (listas, negrito, etc.)

Estrutura dos códigos BNCC:
- EF = Ensino Fundamental
- EM = Ensino Médio
- 01 a 09 = ano escolar
- Duas letras = componente curricular (LP = Língua Portuguesa, MA = Matemática, etc.)
- Dois números finais = número sequencial da habilidade`

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    if (action === 'list') {
      // Listar conversas do usuário
      const { data: conversations, error } = await supabase
        .from('chatbot_conversations')
        .select('id, title, message_count, last_message_at')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .order('last_message_at', { ascending: false })
        .limit(20)

      if (error) {
        console.error('Erro ao listar conversas:', error)
        return NextResponse.json({ error: 'Erro ao listar conversas' }, { status: 500 })
      }

      return NextResponse.json({
        conversations: conversations?.map(c => ({
          id: c.id,
          title: c.title,
          messageCount: c.message_count,
          lastMessageAt: c.last_message_at
        })) || []
      })
    }

    if (action === 'get') {
      const conversationId = searchParams.get('conversationId')
      if (!conversationId) {
        return NextResponse.json({ error: 'conversationId é obrigatório' }, { status: 400 })
      }

      // Verificar se a conversa pertence ao usuário
      const { data: conversation, error: convError } = await supabase
        .from('chatbot_conversations')
        .select('id')
        .eq('id', conversationId)
        .eq('user_id', user.id)
        .single()

      if (convError || !conversation) {
        return NextResponse.json({ error: 'Conversa não encontrada' }, { status: 404 })
      }

      // Buscar mensagens
      const { data: messages, error: msgError } = await supabase
        .from('chatbot_messages')
        .select('id, role, content, created_at')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })

      if (msgError) {
        console.error('Erro ao buscar mensagens:', msgError)
        return NextResponse.json({ error: 'Erro ao buscar mensagens' }, { status: 500 })
      }

      return NextResponse.json({ messages: messages || [] })
    }

    return NextResponse.json({ error: 'Ação inválida' }, { status: 400 })

  } catch (error) {
    console.error('Erro no GET /api/chat:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Verificar se usuário existe na tabela users
    const { data: dbUser, error: userCheckError } = await supabase
      .from('users')
      .select('id, credits')
      .eq('id', user.id)
      .single()

    if (userCheckError || !dbUser) {
      console.error('Usuário não encontrado na tabela users:', user.id)
      return NextResponse.json(
        { error: 'Usuário não cadastrado completamente. Faça logout e login novamente.' },
        { status: 400 }
      )
    }

    const { message, conversationId: existingConversationId } = await request.json()

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json({ error: 'Mensagem é obrigatória' }, { status: 400 })
    }

    // Verificar créditos
    if (!SKIP_CREDITS && dbUser.credits < CREDIT_COST) {
      return NextResponse.json({ error: 'Créditos insuficientes' }, { status: 402 })
    }

    let conversationId = existingConversationId

    // Criar nova conversa se necessário
    if (!conversationId) {
      const title = message.length > 50 ? message.substring(0, 50) + '...' : message

      const { data: newConv, error: convError } = await supabase
        .from('chatbot_conversations')
        .insert({
          user_id: user.id,
          title,
          message_count: 0
        })
        .select('id')
        .single()

      if (convError || !newConv) {
        console.error('Erro ao criar conversa:', convError)
        return NextResponse.json({ error: 'Erro ao criar conversa' }, { status: 500 })
      }

      conversationId = newConv.id
    } else {
      // Verificar se a conversa pertence ao usuário
      const { data: existingConv, error: checkError } = await supabase
        .from('chatbot_conversations')
        .select('id')
        .eq('id', conversationId)
        .eq('user_id', user.id)
        .single()

      if (checkError || !existingConv) {
        return NextResponse.json({ error: 'Conversa não encontrada' }, { status: 404 })
      }
    }

    // Buscar histórico de mensagens para contexto
    const { data: history } = await supabase
      .from('chatbot_messages')
      .select('role, content')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(10)

    // Salvar mensagem do usuário
    const { error: userMsgError } = await supabase
      .from('chatbot_messages')
      .insert({
        conversation_id: conversationId,
        role: 'user',
        content: message
      })

    if (userMsgError) {
      console.error('Erro ao salvar mensagem do usuário:', userMsgError)
      return NextResponse.json({ error: 'Erro ao salvar mensagem' }, { status: 500 })
    }

    // Consumir créditos
    if (!SKIP_CREDITS) {
      const { error: creditError } = await supabase.rpc('consume_credits', {
        p_user_id: user.id,
        p_generation_id: conversationId,
        p_amount: CREDIT_COST
      })

      if (creditError) {
        console.error('Erro ao consumir créditos:', creditError)
        // Não falhar por isso, apenas logar
      }
    }

    // Preparar mensagens para o modelo
    const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
      { role: 'system', content: SYSTEM_INSTRUCTION }
    ]

    // Adicionar histórico
    if (history && history.length > 0) {
      for (const msg of history) {
        messages.push({
          role: msg.role as 'user' | 'assistant',
          content: msg.content
        })
      }
    }

    // Adicionar mensagem atual
    messages.push({ role: 'user', content: message })

    // Gerar resposta com Groq
    const groq = getGroqClient()
    const completion = await groq.chat.completions.create({
      messages,
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 2048
    })

    const assistantResponse = completion.choices[0]?.message?.content || 'Desculpe, não consegui gerar uma resposta.'

    // Salvar resposta do assistente
    const { data: assistantMsg, error: assistantMsgError } = await supabase
      .from('chatbot_messages')
      .insert({
        conversation_id: conversationId,
        role: 'assistant',
        content: assistantResponse
      })
      .select('id')
      .single()

    if (assistantMsgError) {
      console.error('Erro ao salvar resposta do assistente:', assistantMsgError)
    }

    // Atualizar conversa
    await supabase
      .from('chatbot_conversations')
      .update({
        message_count: (history?.length || 0) + 2,
        last_message_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', conversationId)

    return NextResponse.json({
      success: true,
      conversationId,
      messageId: assistantMsg?.id,
      response: assistantResponse
    })

  } catch (error) {
    console.error('Erro no POST /api/chat:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
