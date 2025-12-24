'use client'

import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'

export function Header() {
  const { dbUser, signOut } = useAuth()

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <h1 className="text-2xl font-bold text-[#2C3E7D]">
            Bem-vindo, {dbUser?.full_name || 'Professor(a)'}!
          </h1>
          <p className="text-sm text-gray-600">
            Crie conteúdo pedagógico alinhado à BNCC com IA
          </p>
        </div>

        <div className="flex items-center gap-4">
          {/* Display de Créditos */}
          <div className="flex items-center gap-2 px-4 py-2 bg-[#FDB913]/10 rounded-lg border border-[#FDB913]/30">
            <span className="text-2xl">💰</span>
            <div>
              <p className="text-xs text-gray-600">Créditos</p>
              <p className="text-lg font-bold text-[#2C3E7D]">
                {dbUser?.credits || 0}
              </p>
            </div>
          </div>

          {/* Botão de Sair */}
          <Button
            variant="outline"
            size="md"
            onClick={() => signOut()}
          >
            Sair
          </Button>
        </div>
      </div>
    </header>
  )
}
