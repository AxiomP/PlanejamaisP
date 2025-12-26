'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

interface NavItem {
  name: string
  href: string
  icon: string
}

interface NavSection {
  title: string
  items: NavItem[]
}

const mainItem: NavItem = { name: 'Dashboard', href: '/dashboard', icon: '🏠' }

const navSections: NavSection[] = [
  {
    title: 'Criar Conteudo',
    items: [
      { name: 'Plano de Aula', href: '/dashboard/plano-aula', icon: '📚' },
      { name: 'Prova/Avaliacao', href: '/dashboard/prova', icon: '📝' },
      { name: 'Lista de Exercicios', href: '/dashboard/exercicios', icon: '✏️' },
      { name: 'Sequencia Didatica', href: '/dashboard/sequencia-didatica', icon: '📖' },
      { name: 'Ideias de Atividades', href: '/dashboard/atividades', icon: '💡' },
      { name: 'PEI/PDI', href: '/dashboard/pei-pdi', icon: '🎯' },
    ],
  },
  {
    title: 'Apoio e Extras',
    items: [
      { name: 'Texto de Apoio', href: '/dashboard/texto-apoio', icon: '📄' },
      { name: 'Reescritor de Texto', href: '/dashboard/reescritor', icon: '🔄' },
      { name: 'Projeto Educacional', href: '/dashboard/projeto', icon: '🚀' },
      { name: 'Chatbot BNCC', href: '/dashboard/chatbot', icon: '💬' },
    ],
  },
]

const secondaryItems: NavItem[] = [
  { name: 'Historico', href: '/dashboard/historico', icon: '📋' },
  { name: 'Creditos', href: '/dashboard/creditos', icon: '💰' },
  { name: 'Perfil', href: '/dashboard/perfil', icon: '👤' },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 bg-white border-r border-gray-200 h-screen overflow-y-auto sticky top-0">
      <div className="p-6">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="text-2xl font-bold text-[#2C3E7D]">Planeja+</span>
        </Link>
      </div>

      <nav className="px-4 space-y-1">
        {/* Dashboard link */}
        <div className="mb-4">
          <Link
            href={mainItem.href}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              pathname === mainItem.href
                ? 'bg-[#2C3E7D] text-white'
                : 'text-gray-700 hover:bg-gray-100'
            )}
          >
            <span className="text-lg">{mainItem.icon}</span>
            <span>{mainItem.name}</span>
          </Link>
        </div>

        {/* Tool sections */}
        {navSections.map((section) => (
          <div key={section.title} className="mb-4">
            <p className="px-3 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              {section.title}
            </p>
            <div className="space-y-1">
              {section.items.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-[#2C3E7D] text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    )}
                  >
                    <span className="text-lg">{item.icon}</span>
                    <span>{item.name}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}

        {/* Account section */}
        <div className="pt-4 border-t border-gray-200">
          <p className="px-3 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Conta
          </p>
          <div className="space-y-1">
            {secondaryItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-[#2C3E7D] text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  )}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </nav>
    </aside>
  )
}
