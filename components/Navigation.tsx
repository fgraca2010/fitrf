'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const tabs = [
  { href: '/dashboard', label: 'Início', icon: '🏠' },
  { href: '/diario', label: 'Diário', icon: '📋' },
  { href: '/alimentos', label: 'Alimentos', icon: '🥗' },
  { href: '/marmitas', label: 'Marmitas', icon: '🍱' },
  { href: '/planejador', label: 'Planejador', icon: '📅' },
]

export default function Navigation() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 pb-safe">
      <div className="max-w-lg mx-auto flex">
        {tabs.map((tab) => {
          const active = pathname.startsWith(tab.href)
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex-1 flex flex-col items-center py-2 text-xs transition-colors ${
                active ? 'text-emerald-600' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <span className="text-xl leading-tight">{tab.icon}</span>
              <span className={`mt-0.5 font-medium ${active ? 'text-emerald-600' : ''}`}>
                {tab.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
