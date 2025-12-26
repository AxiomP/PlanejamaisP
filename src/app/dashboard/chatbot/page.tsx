'use client'

import { useState, useRef, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import ReactMarkdown from 'react-markdown'

const CREDIT_COST = 1

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: Date
}

interface Conversation {
  id: string
  title: string
  messageCount: number
  lastMessageAt: Date
}

export default function ChatbotPage() {
  const { dbUser } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loadingConversations, setLoadingConversations] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    loadConversations()
  }, [])

  const loadConversations = async () => {
    try {
      const response = await fetch('/api/chat?action=list')
      if (response.ok) {
        const data = await response.json()
        setConversations(data.conversations || [])
      }
    } catch (err) {
      console.error('Erro ao carregar conversas:', err)
    } finally {
      setLoadingConversations(false)
    }
  }

  const loadConversation = async (convId: string) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/chat?action=get&conversationId=${convId}`)
      if (response.ok) {
        const data = await response.json()
        setConversationId(convId)
        setMessages(data.messages.map((m: { id: string; role: 'user' | 'assistant'; content: string; created_at: string }) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          createdAt: new Date(m.created_at)
        })))
      }
    } catch (err) {
      console.error('Erro ao carregar conversa:', err)
    } finally {
      setLoading(false)
    }
  }

  const startNewConversation = () => {
    setConversationId(null)
    setMessages([])
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim() || loading) return

    const userMessage = inputValue.trim()
    setInputValue('')
    setError('')

    // Adicionar mensagem do usuário localmente
    const tempUserMessage: Message = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: userMessage,
      createdAt: new Date()
    }
    setMessages(prev => [...prev, tempUserMessage])
    setLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          conversationId
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao enviar mensagem')
      }

      // Atualizar com a resposta do servidor
      setConversationId(data.conversationId)

      const assistantMessage: Message = {
        id: data.messageId,
        role: 'assistant',
        content: data.response,
        createdAt: new Date()
      }
      setMessages(prev => [...prev, assistantMessage])

      // Recarregar lista de conversas
      loadConversations()

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
      // Remover a mensagem temporária em caso de erro
      setMessages(prev => prev.filter(m => m.id !== tempUserMessage.id))
    } finally {
      setLoading(false)
    }
  }

  const creditsAvailable = dbUser?.credits ?? 0

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col">
      <div className="mb-4">
        <h2 className="text-3xl font-bold text-[#2C3E7D]">Chatbot BNCC</h2>
        <p className="mt-2 text-gray-600">
          Tire suas dúvidas sobre a BNCC, competências, habilidades e como aplicá-las em sala de aula.
        </p>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4 min-h-0">
        {/* Lista de Conversas */}
        <div className="hidden lg:block">
          <Card className="h-full">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-base">Conversas</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={startNewConversation}
                >
                  Nova
                </Button>
              </div>
            </CardHeader>
            <CardContent className="overflow-y-auto max-h-[calc(100vh-300px)]">
              {loadingConversations ? (
                <p className="text-sm text-gray-500">Carregando...</p>
              ) : conversations.length === 0 ? (
                <p className="text-sm text-gray-500">Nenhuma conversa ainda</p>
              ) : (
                <div className="space-y-2">
                  {conversations.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => loadConversation(conv.id)}
                      className={`w-full text-left p-2 rounded-lg text-sm transition-colors ${
                        conversationId === conv.id
                          ? 'bg-[#2C3E7D] text-white'
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      <p className="font-medium truncate">
                        {conv.title || 'Nova conversa'}
                      </p>
                      <p className={`text-xs ${conversationId === conv.id ? 'text-white/70' : 'text-gray-500'}`}>
                        {conv.messageCount} mensagens
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Área de Chat */}
        <div className="lg:col-span-2 flex flex-col min-h-0">
          <Card className="flex-1 flex flex-col min-h-0">
            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8">
                  <div className="text-6xl mb-4">💬</div>
                  <h3 className="text-xl font-semibold text-[#2C3E7D] mb-2">
                    Bem-vindo ao Chatbot BNCC!
                  </h3>
                  <p className="text-gray-600 max-w-md">
                    Faça perguntas sobre a Base Nacional Comum Curricular, competências gerais,
                    habilidades específicas ou como implementá-las em sua prática pedagógica.
                  </p>
                  <div className="mt-6 grid grid-cols-1 gap-2 w-full max-w-md">
                    <SuggestionButton
                      text="O que são as 10 competências gerais da BNCC?"
                      onClick={() => setInputValue('O que são as 10 competências gerais da BNCC?')}
                    />
                    <SuggestionButton
                      text="Como trabalhar a competência socioemocional?"
                      onClick={() => setInputValue('Como trabalhar a competência socioemocional em sala de aula?')}
                    />
                    <SuggestionButton
                      text="Explique a habilidade EF06MA01"
                      onClick={() => setInputValue('Explique a habilidade EF06MA01 da BNCC e como aplicá-la em aula')}
                    />
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-4 ${
                          message.role === 'user'
                            ? 'bg-[#2C3E7D] text-white'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {message.role === 'assistant' ? (
                          <div className="prose prose-sm max-w-none">
                            <ReactMarkdown>{message.content}</ReactMarkdown>
                          </div>
                        ) : (
                          <p>{message.content}</p>
                        )}
                      </div>
                    </div>
                  ))}
                  {loading && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 rounded-lg p-4">
                        <div className="flex space-x-2">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </>
              )}
            </CardContent>

            {/* Input de Mensagem */}
            <div className="border-t border-gray-200 p-4">
              {error && (
                <div className="mb-3 bg-red-50 border border-red-200 text-red-600 p-2 rounded-lg text-sm">
                  {error}
                </div>
              )}
              <form onSubmit={handleSubmit} className="flex gap-2">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Digite sua pergunta sobre a BNCC..."
                  className="flex-1 rounded-lg border-2 border-gray-300 px-4 py-2.5 text-base transition-colors focus:border-[#2C3E7D] focus:outline-none focus:ring-2 focus:ring-[#2C3E7D]/30"
                  disabled={loading}
                />
                <Button
                  type="submit"
                  disabled={loading || !inputValue.trim()}
                  isLoading={loading}
                >
                  Enviar
                </Button>
              </form>
            </div>
          </Card>
        </div>

        {/* Sidebar de Informações */}
        <div className="hidden lg:block space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-500">Seus créditos</p>
                <p className="text-3xl font-bold text-[#2C3E7D]">{creditsAvailable}</p>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Custo por mensagem:</span>
                  <span className="font-semibold text-[#2C3E7D]">{CREDIT_COST} crédito</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Sobre o Chatbot</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• Especialista em BNCC</li>
                <li>• Explica competências e habilidades</li>
                <li>• Sugere aplicações práticas</li>
                <li>• Ajuda no planejamento pedagógico</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Exemplos de Perguntas</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• &quot;Quais habilidades de Matemática para o 6º ano?&quot;</li>
                <li>• &quot;Como desenvolver pensamento crítico?&quot;</li>
                <li>• &quot;Atividades para trabalhar EF05LP01&quot;</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function SuggestionButton({ text, onClick }: { text: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="text-left p-3 rounded-lg border border-gray-200 hover:border-[#2C3E7D] hover:bg-[#2C3E7D]/5 transition-colors text-sm text-gray-700"
    >
      {text}
    </button>
  )
}
