import Link from 'next/link'
import Image from 'next/image'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-primary-50 to-white">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span className="text-2xl font-bold text-primary">
              Planeja<span className="text-accent">+</span>
            </span>
          </div>

          <div className="flex gap-4">
            <Link
              href="/login"
              className="px-4 py-2 text-primary hover:text-primary-600 font-medium transition-colors"
            >
              Entrar
            </Link>
            <Link
              href="/register"
              className="px-6 py-2 bg-accent text-white rounded-lg hover:bg-accent-600 font-medium transition-colors"
            >
              Criar Conta Grátis
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-block px-4 py-2 bg-accent/10 text-accent rounded-full text-sm font-medium mb-6">
            ✨ 50 créditos grátis ao se cadastrar
          </div>

          <h1 className="text-5xl md:text-6xl font-bold text-primary mb-6">
            Planejamento Pedagógico
            <br />
            <span className="text-accent">Inteligente e Rápido</span>
          </h1>

          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Crie planos de aula, provas, atividades e muito mais com inteligência artificial.
            Alinhado à BNCC e pronto em minutos.
          </p>

          <div className="flex gap-4 justify-center mb-12">
            <Link
              href="/register"
              className="px-8 py-4 bg-accent text-white rounded-lg hover:bg-accent-600 font-semibold text-lg transition-colors shadow-lg hover:shadow-xl"
            >
              Começar Agora
            </Link>
            <Link
              href="#ferramentas"
              className="px-8 py-4 bg-white text-primary border-2 border-primary rounded-lg hover:bg-primary-50 font-semibold text-lg transition-colors"
            >
              Ver Ferramentas
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto">
            <div>
              <div className="text-3xl font-bold text-primary">10</div>
              <div className="text-sm text-gray-600">Ferramentas</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary">100%</div>
              <div className="text-sm text-gray-600">Alinhado à BNCC</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary">5min</div>
              <div className="text-sm text-gray-600">Tempo Médio</div>
            </div>
          </div>
        </div>
      </section>

      {/* Ferramentas Section */}
      <section id="ferramentas" className="bg-white py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-primary mb-4">
              10 Ferramentas Essenciais
            </h2>
            <p className="text-xl text-gray-600">
              Tudo que você precisa para planejar suas aulas
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {[
              { icon: '📝', name: 'Plano de Aula', desc: 'Planos completos com objetivos, metodologia e avaliação' },
              { icon: '📋', name: 'Prova/Avaliação', desc: 'Questões objetivas e discursivas com gabarito' },
              { icon: '📚', name: 'Lista de Exercícios', desc: 'Atividades práticas para fixação' },
              { icon: '📖', name: 'Sequência Didática', desc: 'Planejamento de 1 a 10 aulas estruturadas' },
              { icon: '📄', name: 'Texto de Apoio', desc: 'Resumos e textos complementares' },
              { icon: '💡', name: 'Ideias de Atividades', desc: 'Sugestões criativas para suas aulas' },
              { icon: '🎯', name: 'PEI/PDI', desc: 'Planos individualizados para educação especial' },
              { icon: '✏️', name: 'Reescritor de Texto', desc: 'Adapte textos para diferentes níveis' },
              { icon: '🎨', name: 'Projeto Educacional', desc: 'Projetos completos com cronograma' },
              { icon: '🤖', name: 'Chatbot BNCC', desc: 'Assistente virtual especializado em educação' },
            ].map((tool, index) => (
              <div
                key={index}
                className="p-6 border border-gray-200 rounded-xl hover:border-accent hover:shadow-lg transition-all"
              >
                <div className="text-4xl mb-3">{tool.icon}</div>
                <h3 className="text-lg font-bold text-primary mb-2">{tool.name}</h3>
                <p className="text-gray-600 text-sm">{tool.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">
            Pronto para revolucionar seu planejamento?
          </h2>
          <p className="text-xl mb-8 text-primary-100">
            Ganhe 50 créditos grátis ao criar sua conta
          </p>
          <Link
            href="/register"
            className="inline-block px-8 py-4 bg-accent text-white rounded-lg hover:bg-accent-600 font-semibold text-lg transition-colors shadow-lg hover:shadow-xl"
          >
            Criar Conta Grátis
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 py-8">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p>&copy; 2024 Planeja+. Todos os direitos reservados.</p>
        </div>
      </footer>
    </main>
  )
}
