'use client'

import { cn } from '@/lib/utils'

export type GenerationMode = 'personalizado' | 'institucional'

interface ModeSelectorProps {
  mode: GenerationMode
  onModeChange: (mode: GenerationMode) => void
  institutionName?: string
  disabled?: boolean
  className?: string
}

export function ModeSelector({
  mode,
  onModeChange,
  institutionName,
  disabled = false,
  className
}: ModeSelectorProps) {
  // Se não há instituição, não mostrar o seletor
  if (!institutionName) {
    return null
  }

  return (
    <div className={cn('mb-6', className)}>
      <label className="mb-2 block text-sm font-medium text-gray-700">
        Modo de Geração
      </label>
      <div className="flex rounded-lg border-2 border-gray-200 p-1 bg-gray-50">
        <button
          type="button"
          onClick={() => onModeChange('personalizado')}
          disabled={disabled}
          className={cn(
            'flex-1 rounded-md px-4 py-2.5 text-sm font-medium transition-all',
            mode === 'personalizado'
              ? 'bg-white text-[#2C3E7D] shadow-sm border border-gray-200'
              : 'text-gray-600 hover:text-gray-900',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          <div className="flex flex-col items-center gap-1">
            <span>Personalizado</span>
            <span className="text-xs font-normal text-gray-500">
              Configuração livre
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onModeChange('institucional')}
          disabled={disabled}
          className={cn(
            'flex-1 rounded-md px-4 py-2.5 text-sm font-medium transition-all',
            mode === 'institucional'
              ? 'bg-[#2C3E7D] text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-900',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          <div className="flex flex-col items-center gap-1">
            <span>Institucional</span>
            <span className={cn(
              'text-xs font-normal',
              mode === 'institucional' ? 'text-white/80' : 'text-gray-500'
            )}>
              {institutionName}
            </span>
          </div>
        </button>
      </div>

      {mode === 'institucional' && (
        <p className="mt-2 text-xs text-[#2C3E7D]">
          Usando configurações e templates de {institutionName}
        </p>
      )}
    </div>
  )
}
