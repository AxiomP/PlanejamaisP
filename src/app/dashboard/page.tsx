'use client'

import { ToolCard } from '@/components/dashboard/tool-card'

const tools = [
  {
    title: 'Plano de Aula',
    description: 'Crie planos de aula completos alinhados à BNCC com objetivos, metodologias e avaliação.',
    icon: '📚',
    href: '/dashboard/plano-aula',
    cost: 5,
    comingSoon: false,
  },
  {
    title: 'Prova/Avaliação',
    description: 'Gere provas e avaliações personalizadas com questões objetivas e dissertativas.',
    icon: '📝',
    href: '/dashboard/prova',
    cost: 5,
    comingSoon: false,
  },
  {
    title: 'Lista de Exercícios',
    description: 'Crie listas de exercícios variadas para prática e fixação de conteúdo.',
    icon: '✏️',
    href: '/dashboard/exercicios',
    cost: 3,
    comingSoon: false,
  },
  {
    title: 'Sequência Didática',
    description: 'Desenvolva sequências didáticas estruturadas para múltiplas aulas.',
    icon: '📖',
    href: '/dashboard/sequencia-didatica',
    cost: 8,
    comingSoon: true,
  },
  {
    title: 'Texto de Apoio/Resumo',
    description: 'Gere textos de apoio e resumos didáticos sobre qualquer tema.',
    icon: '📄',
    href: '/dashboard/texto-apoio',
    cost: 3,
    comingSoon: true,
  },
  {
    title: 'Ideias de Atividades',
    description: 'Receba sugestões criativas de atividades pedagógicas para suas aulas.',
    icon: '💡',
    href: '/dashboard/atividades',
    cost: 3,
    comingSoon: true,
  },
  {
    title: 'PEI/PDI',
    description: 'Crie Planos Educacionais Individualizados para educação inclusiva.',
    icon: '🎯',
    href: '/dashboard/pei-pdi',
    cost: 10,
    comingSoon: true,
  },
  {
    title: 'Reescritor de Texto',
    description: 'Reescreva textos adaptando linguagem, complexidade e formato.',
    icon: '🔄',
    href: '/dashboard/reescritor',
    cost: 2,
    comingSoon: true,
  },
  {
    title: 'Projeto Educacional',
    description: 'Desenvolva projetos educacionais completos e interdisciplinares.',
    icon: '🚀',
    href: '/dashboard/projeto',
    cost: 10,
    comingSoon: true,
  },
  {
    title: 'Chatbot BNCC',
    description: 'Converse com a IA sobre a BNCC, tire dúvidas e receba orientações.',
    icon: '💬',
    href: '/dashboard/chatbot',
    cost: 1,
    comingSoon: true,
  },
]

export default function DashboardPage() {
  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-[#2C3E7D]">
          Ferramentas de Geração
        </h2>
        <p className="mt-2 text-gray-600">
          Selecione uma ferramenta para começar a criar conteúdo pedagógico com IA
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tools.map((tool) => (
          <ToolCard key={tool.href} {...tool} />
        ))}
      </div>

      {/* Informação sobre créditos */}
      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-3">
          <span className="text-2xl">ℹ️</span>
          <div>
            <h3 className="font-semibold text-[#2C3E7D]">Como funcionam os créditos?</h3>
            <p className="mt-1 text-sm text-gray-700">
              Cada ferramenta consome uma quantidade específica de créditos. Você pode
              visualizar seu saldo no canto superior direito e adquirir mais créditos
              na página de <span className="font-semibold">Créditos</span>.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
