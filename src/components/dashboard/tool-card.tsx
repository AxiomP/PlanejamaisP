import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface ToolCardProps {
  title: string
  description: string
  icon: string
  href: string
  cost: number
  comingSoon?: boolean
}

export function ToolCard({ title, description, icon, href, cost, comingSoon = false }: ToolCardProps) {
  const CardContent = (
    <Card className={cn(
      'relative p-6 hover:shadow-lg transition-all duration-300 cursor-pointer group',
      comingSoon && 'opacity-60 cursor-not-allowed'
    )}>
      {comingSoon && (
        <span className="absolute top-3 right-3 px-2 py-1 text-xs font-semibold bg-[#FDB913] text-[#2C3E7D] rounded-full">
          Em breve
        </span>
      )}

      <div className="flex items-start gap-4">
        <div className="text-4xl">{icon}</div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-[#2C3E7D] group-hover:text-[#1f2d5c] transition-colors">
            {title}
          </h3>
          <p className="mt-1 text-sm text-gray-600 line-clamp-2">
            {description}
          </p>
          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-500">Custo:</span>
            <span className="flex items-center gap-1 text-sm font-bold text-[#FDB913]">
              💰 {cost} crédito{cost > 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>
    </Card>
  )

  if (comingSoon) {
    return <div>{CardContent}</div>
  }

  return <Link href={href}>{CardContent}</Link>
}
