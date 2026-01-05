'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Bot, ShoppingCart, Users, Settings, LogOut, Package, BarChart3, Sparkles, Plug, LayoutTemplate } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { signOut } from 'next-auth/react'

const menuItems = [
    { icon: BarChart3, label: 'Visão Geral', href: '/dashboard' },
    { icon: ShoppingCart, label: 'Vendas', href: '/dashboard/sales' },
    { icon: Package, label: 'Produtos', href: '/dashboard/products' },
    { icon: LayoutTemplate, label: 'Páginas', href: '/dashboard/sites' },
    { icon: Users, label: 'Alunos', href: '/dashboard/students' },
    { icon: Plug, label: 'Integrações', href: '/dashboard/integrations' },
    { icon: Settings, label: 'Configurações', href: '/dashboard/settings' },
]

export function Sidebar() {
    const pathname = usePathname()

    const handleLogout = async () => {
        await signOut({ callbackUrl: '/login' })
    }

    return (
        <aside className="fixed left-0 top-0 z-40 h-screen w-64 sidebar-glass hidden md:flex flex-col">
            <div className="flex h-16 items-center sidebar-header px-6">
                <Link href="/dashboard" className="flex items-center gap-2 font-bold text-xl">
                    <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-[#D4AF37] to-[#F6D764]">
                        <Bot className="w-5 h-5 text-black" />
                    </div>
                    <span className="text-gradient-gold">AgentiVerso</span>
                </Link>
            </div>

            <div className="flex-1 overflow-y-auto py-6 px-4">
                <nav className="space-y-1">
                    {menuItems.map((item) => {
                        const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "sidebar-item",
                                    isActive
                                        ? "sidebar-item-active"
                                        : "sidebar-item-inactive"
                                )}
                            >
                                <item.icon className="w-5 h-5" />
                                {item.label}
                            </Link>
                        )
                    })}
                </nav>
            </div>

            <div className="border-t border-[#D4AF37]/20 p-4">
                <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 text-red-500 hover:text-red-400 hover:bg-red-500/10"
                    onClick={handleLogout}
                >
                    <LogOut className="w-5 h-5" />
                    Sair
                </Button>
            </div>
        </aside>
    )
}
