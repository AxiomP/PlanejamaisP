import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'Planeja+ | Planejamento Pedagógico com IA',
  description: 'Plataforma com IA para professores gerarem conteúdo pedagógico alinhado à BNCC',
  keywords: ['educação', 'professor', 'plano de aula', 'BNCC', 'IA', 'inteligência artificial'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
