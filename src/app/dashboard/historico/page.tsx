'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { formatDateTime } from '@/lib/utils'
import type { Generation } from '@/types/database.types'

export default function HistoricoPage() {
  const { user } = useAuth()
  const [generations, setGenerations] = useState<Generation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchGenerations() {
      if (!user) return

      const supabase = createClient()
      const { data, error } = await supabase
        .from('generations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (!error && data) {
        setGenerations(data as Generation[])
      }

      setLoading(false)
    }

    fetchGenerations()
  }, [user])

  const getToolName = (toolType: string) => {
    const toolNames: Record<string, string> = {
      'plano_aula': 'Plano de Aula',
      'prova': 'Prova/Avaliação',
      'exercicios': 'Lista de Exercícios',
      'sequencia': 'Sequência Didática',
      'texto': 'Texto de Apoio',
      'atividades': 'Ideias de Atividades',
      'pei': 'PEI/PDI',
      'reescritor': 'Reescritor de Texto',
      'projeto': 'Projeto Educacional',
      'chatbot': 'Chatbot BNCC',
    }
    return toolNames[toolType] || toolType
  }

  const getToolIcon = (toolType: string) => {
    const toolIcons: Record<string, string> = {
      'plano_aula': '📚',
      'prova': '📝',
      'exercicios': '✏️',
      'sequencia': '📖',
      'texto': '📄',
      'atividades': '💡',
      'pei': '🎯',
      'reescritor': '🔄',
      'projeto': '🚀',
      'chatbot': '💬',
    }
    return toolIcons[toolType] || '📄'
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      'completed': { label: 'Concluído', className: 'bg-green-100 text-green-800' },
      'processing': { label: 'Processando', className: 'bg-blue-100 text-blue-800' },
      'failed': { label: 'Falhou', className: 'bg-red-100 text-red-800' },
    }
    const config = statusConfig[status] || statusConfig['completed']
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${config.className}`}>
        {config.label}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-[#2C3E7D] border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando histórico...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-[#2C3E7D]">Histórico de Gerações</h2>
        <p className="mt-2 text-gray-600">
          Visualize todas as suas gerações anteriores
        </p>
      </div>

      {generations.length === 0 ? (
        <Card className="p-12 text-center">
          <span className="text-6xl">📋</span>
          <h3 className="mt-4 text-xl font-semibold text-gray-700">
            Nenhuma geração encontrada
          </h3>
          <p className="mt-2 text-gray-600">
            Você ainda não gerou nenhum conteúdo. Comece usando uma das ferramentas disponíveis!
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {generations.map((generation) => (
            <Card key={generation.id} className="p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <span className="text-4xl">{getToolIcon(generation.tool_type)}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold text-[#2C3E7D]">
                        {getToolName(generation.tool_type)}
                      </h3>
                      {getStatusBadge(generation.status)}
                    </div>
                    <p className="mt-1 text-sm text-gray-600">
                      {formatDateTime(new Date(generation.created_at))}
                    </p>
                    {generation.input_data && (
                      <div className="mt-2 text-sm text-gray-700">
                        <p className="line-clamp-2">
                          {typeof generation.input_data === 'object'
                            ? JSON.stringify(generation.input_data).substring(0, 150)
                            : String(generation.input_data).substring(0, 150)}...
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
