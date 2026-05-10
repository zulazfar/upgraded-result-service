'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface NavProps {
  links: { href: string; label: string }[]
  title: string
}

export function Nav({ links, title }: NavProps) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    toast.success('Logged out.')
  }

  return (
    <nav className="border-b bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-14">
        <div className="flex items-center gap-6">
          <span className="font-semibold text-sm">{title}</span>
          <div className="flex gap-1">
            {links.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'px-3 py-1.5 rounded-md text-sm transition-colors',
                  pathname === link.href
                    ? 'bg-gray-100 font-medium text-gray-900'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={handleLogout}>Logout</Button>
      </div>
    </nav>
  )
}
