'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatDate } from '@/lib/utils'

export default function PerfilPage() {
  const { user, dbUser } = useAuth()
  const [fullName, setFullName] = useState(dbUser?.full_name || '')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleUpdateProfile = async () => {
    if (!user || !dbUser) return

    setLoading(true)
    setMessage(null)

    const supabase = createClient()
    const { error } = await supabase
      .from('users')
      .update({ full_name: fullName })
      .eq('id', user.id)

    if (error) {
      setMessage({ type: 'error', text: 'Erro ao atualizar perfil' })
    } else {
      setMessage({ type: 'success', text: 'Perfil atualizado com sucesso!' })
    }

    setLoading(false)
  }

  const getRoleName = (role: string) => {
    const roles: Record<string, string> = {
      'teacher': 'Professor(a)',
      'admin': 'Administrador',
      'institution': 'Instituição',
    }
    return roles[role] || role
  }

  const getSubscriptionTierName = (tier: string) => {
    const tiers: Record<string, string> = {
      'free': 'Gratuito',
      'premium': 'Premium',
      'institution': 'Institucional',
    }
    return tiers[tier] || tier
  }

  const getSubscriptionStatusBadge = (status: string) => {
    const statuses: Record<string, { label: string; className: string }> = {
      'active': { label: 'Ativo', className: 'bg-green-100 text-green-800' },
      'cancelled': { label: 'Cancelado', className: 'bg-yellow-100 text-yellow-800' },
      'expired': { label: 'Expirado', className: 'bg-red-100 text-red-800' },
    }
    const config = statuses[status] || statuses['active']
    return (
      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${config.className}`}>
        {config.label}
      </span>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-[#2C3E7D]">Meu Perfil</h2>
        <p className="mt-2 text-gray-600">
          Gerencie suas informações pessoais e configurações
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Informações do Perfil */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <h3 className="text-xl font-bold text-[#2C3E7D] mb-6">
              Informações Pessoais
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome Completo
                </label>
                <Input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Digite seu nome completo"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <Input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="bg-gray-50"
                />
                <p className="mt-1 text-xs text-gray-500">
                  O email não pode ser alterado
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Conta
                </label>
                <Input
                  type="text"
                  value={dbUser ? getRoleName(dbUser.role) : ''}
                  disabled
                  className="bg-gray-50"
                />
              </div>

              {message && (
                <div
                  className={`p-4 rounded-lg ${
                    message.type === 'success'
                      ? 'bg-green-50 text-green-800'
                      : 'bg-red-50 text-red-800'
                  }`}
                >
                  {message.text}
                </div>
              )}

              <Button
                variant="primary"
                size="lg"
                onClick={handleUpdateProfile}
                isLoading={loading}
                disabled={fullName === dbUser?.full_name}
              >
                Salvar Alterações
              </Button>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-xl font-bold text-[#2C3E7D] mb-6">
              Segurança
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Senha
                </label>
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => alert('Funcionalidade de alteração de senha será implementada em breve!')}
                >
                  Alterar Senha
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar - Informações da Conta */}
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-bold text-[#2C3E7D] mb-4">
              Status da Conta
            </h3>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Plano</p>
                <p className="font-semibold text-[#2C3E7D]">
                  {dbUser ? getSubscriptionTierName(dbUser.subscription_tier) : '-'}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-1">Status</p>
                {dbUser && getSubscriptionStatusBadge(dbUser.subscription_status)}
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-1">Créditos Disponíveis</p>
                <p className="text-2xl font-bold text-[#FDB913]">
                  {dbUser?.credits || 0}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-1">Membro desde</p>
                <p className="font-semibold text-gray-800">
                  {dbUser?.created_at ? formatDate(new Date(dbUser.created_at)) : '-'}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-[#2C3E7D] to-[#1f2d5c] text-white">
            <h3 className="text-lg font-bold mb-2">
              Precisa de mais créditos?
            </h3>
            <p className="text-sm opacity-90 mb-4">
              Adquira pacotes de créditos e continue gerando conteúdo pedagógico
            </p>
            <Button
              variant="secondary"
              size="md"
              className="w-full"
              onClick={() => window.location.href = '/dashboard/creditos'}
            >
              Comprar Créditos
            </Button>
          </Card>
        </div>
      </div>
    </div>
  )
}
