import type { Metadata } from 'next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import './globals.css'

export const metadata: Metadata = {
  title: 'FitRF – Plano Alimentar',
  description: 'Planejamento de dieta, marmitas e acompanhamento calórico',
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className="h-full">
      <body className="min-h-full">
        {children}
        <SpeedInsights />
      </body>
    </html>
  )
}
