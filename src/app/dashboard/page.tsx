'use client'

import { ToolCard } from '@/components/dashboard/tool-card'

const toolGroups = [
  {
    id: 'criacao',
    title: 'Criar Conteudo',
    description: 'Ferramentas para criar materiais pedagogicos completos',
    tools: [
      {
        title: 'Plano de Aula',
        description: 'Crie planos de aula completos alinhados a BNCC com objetivos, metodologias e avaliacao.',
        icon: '📚',
        href: '/dashboard/plano-aula',
        cost: 5,
        comingSoon: false,
      },
      {
        title: 'Prova/Avaliacao',
        description: 'Gere provas e avaliacoes personalizadas com questoes objetivas e dissertativas.',
        icon: '📝',
        href: '/dashboard/prova',
        cost: 5,
        comingSoon: false,
      },
      {
        title: 'Lista de Exercicios',
        description: 'Crie listas de exercicios variadas para pratica e fixacao de conteudo.',
        icon: '✏️',
        href: '/dashboard/exercicios',
        cost: 3,
        comingSoon: false,
      },
      {
        title: 'Sequencia Didatica',
        description: 'Desenvolva sequencias didaticas estruturadas para multiplas aulas.',
        icon: '📖',
        href: '/dashboard/sequencia-didatica',
        cost: 8,
        comingSoon: false,
      },
      {
        title: 'Ideias de Atividades',
        description: 'Receba sugestoes criativas de atividades pedagogicas para suas aulas.',
        icon: '💡',
        href: '/dashboard/atividades',
        cost: 3,
        comingSoon: false,
      },
      {
        title: 'PEI/PDI',
        description: 'Crie Planos Educacionais Individualizados para educacao inclusiva.',
        icon: '🎯',
        href: '/dashboard/pei-pdi',
        cost: 10,
        comingSoon: false,
      },
    ],
  },
  {
    id: 'apoio',
    title: 'Apoio e Extras',
    description: 'Ferramentas complementares e de suporte',
    tools: [
      {
        title: 'Texto de Apoio/Resumo',
        description: 'Gere textos de apoio e resumos didaticos sobre qualquer tema.',
        icon: '📄',
        href: '/dashboard/texto-apoio',
        cost: 3,
        comingSoon: false,
      },
      {
        title: 'Reescritor de Texto',
        description: 'Reescreva textos adaptando linguagem, complexidade e formato.',
        icon: '🔄',
        href: '/dashboard/reescritor',
        cost: 2,
        comingSoon: false,
      },
      {
        title: 'Projeto Educacional',
        description: 'Desenvolva projetos educacionais completos e interdisciplinares.',
        icon: '🚀',
        href: '/dashboard/projeto',
        cost: 10,
        comingSoon: false,
      },
      {
        title: 'Chatbot BNCC',
        description: 'Converse com a IA sobre a BNCC, tire duvidas e receba orientacoes.',
        icon: '💬',
        href: '/dashboard/chatbot',
        cost: 1,
        comingSoon: false,
      },
    ],
  },
]

export default function DashboardPage() {
  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-[#2C3E7D]">
          Ferramentas de Geracao
        </h2>
        <p className="mt-2 text-gray-600">
          Selecione uma ferramenta para comecar a criar conteudo pedagogico com IA
        </p>
      </div>

      {toolGroups.map((group) => (
        <section key={group.id} className="mb-10">
          <div className="mb-4">
            <h3 className="text-xl font-bold text-[#2C3E7D]">
              {group.title}
            </h3>
            <p className="text-gray-600 text-sm">{group.description}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {group.tools.map((tool) => (
              <ToolCard key={tool.href} {...tool} />
            ))}
          </div>
        </section>
      ))}

      {/* Informacao sobre creditos */}
      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-3">
          <span className="text-2xl">ℹ️</span>
          <div>
            <h3 className="font-semibold text-[#2C3E7D]">Como funcionam os creditos?</h3>
            <p className="mt-1 text-sm text-gray-700">
              Cada ferramenta consome uma quantidade especifica de creditos. Voce pode
              visualizar seu saldo no canto superior direito e adquirir mais creditos
              na pagina de <span className="font-semibold">Creditos</span>.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
