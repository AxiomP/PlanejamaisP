'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatDateTime } from '@/lib/utils'
import type { CreditTransaction } from '@/types/database.types'

const creditPackages = [
  { credits: 50, price: 'R$ 19,90', popular: false },
  { credits: 150, price: 'R$ 49,90', popular: true },
  { credits: 500, price: 'R$ 149,90', popular: false },
]

export default function CreditosPage() {
  const { dbUser } = useAuth()
  const [transactions, setTransactions] = useState<CreditTransaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchTransactions() {
      if (!dbUser) return

      const supabase = createClient()
      const { data, error } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_id', dbUser.id)
        .order('created_at', { ascending: false })
        .limit(20)

      if (!error && data) {
        setTransactions(data as CreditTransaction[])
      }

      setLoading(false)
    }

    fetchTransactions()
  }, [dbUser])

  const getTransactionType = (type: string) => {
    const types: Record<string, { label: string; icon: string; color: string }> = {
      'purchase': { label: 'Compra', icon: '💳', color: 'text-green-600' },
      'consumption': { label: 'Consumo', icon: '📤', color: 'text-red-600' },
      'bonus': { label: 'Bônus', icon: '🎁', color: 'text-blue-600' },
      'refund': { label: 'Reembolso', icon: '↩️', color: 'text-yellow-600' },
    }
    return types[type] || types['consumption']
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-[#2C3E7D]">Gerenciar Créditos</h2>
        <p className="mt-2 text-gray-600">
          Adquira mais créditos para continuar gerando conteúdo
        </p>
      </div>

      {/* Saldo Atual */}
      <Card className="p-8 mb-8 bg-gradient-to-br from-[#2C3E7D] to-[#1f2d5c] text-white">
        <div className="text-center">
          <p className="text-sm opacity-90">Saldo Atual</p>
          <p className="text-6xl font-bold mt-2">
            {dbUser?.credits || 0}
          </p>
          <p className="text-sm opacity-90 mt-2">créditos disponíveis</p>
        </div>
      </Card>

      {/* Pacotes de Créditos */}
      <div className="mb-8">
        <h3 className="text-2xl font-bold text-[#2C3E7D] mb-4">
          Adquirir Créditos
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {creditPackages.map((pkg) => (
            <Card
              key={pkg.credits}
              className={`p-6 relative ${pkg.popular ? 'border-2 border-[#FDB913]' : ''}`}
            >
              {pkg.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-[#FDB913] text-[#2C3E7D] text-xs font-bold rounded-full">
                  MAIS POPULAR
                </span>
              )}
              <div className="text-center">
                <span className="text-5xl">💰</span>
                <p className="text-3xl font-bold text-[#2C3E7D] mt-4">
                  {pkg.credits}
                </p>
                <p className="text-sm text-gray-600 mt-1">créditos</p>
                <p className="text-2xl font-bold text-[#FDB913] mt-4">
                  {pkg.price}
                </p>
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full mt-6"
                  onClick={() => alert('Sistema de pagamento será implementado em breve!')}
                >
                  Comprar
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Histórico de Transações */}
      <div>
        <h3 className="text-2xl font-bold text-[#2C3E7D] mb-4">
          Histórico de Transações
        </h3>

        {loading ? (
          <Card className="p-12 text-center">
            <div className="animate-spin h-8 w-8 border-4 border-[#2C3E7D] border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-4 text-gray-600">Carregando transações...</p>
          </Card>
        ) : transactions.length === 0 ? (
          <Card className="p-12 text-center">
            <span className="text-6xl">📊</span>
            <h3 className="mt-4 text-xl font-semibold text-gray-700">
              Nenhuma transação encontrada
            </h3>
            <p className="mt-2 text-gray-600">
              Suas transações de créditos aparecerão aqui
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {transactions.map((transaction) => {
              const typeInfo = getTransactionType(transaction.transaction_type)
              return (
                <Card key={transaction.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{typeInfo.icon}</span>
                      <div>
                        <p className="font-semibold text-gray-800">
                          {typeInfo.label}
                        </p>
                        <p className="text-sm text-gray-600">
                          {formatDateTime(new Date(transaction.created_at))}
                        </p>
                        {transaction.description && (
                          <p className="text-xs text-gray-500 mt-1">
                            {transaction.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-xl font-bold ${typeInfo.color}`}>
                        {transaction.amount > 0 ? '+' : ''}{transaction.amount}
                      </p>
                      <p className="text-xs text-gray-500">
                        Saldo: {transaction.balance_after}
                      </p>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
