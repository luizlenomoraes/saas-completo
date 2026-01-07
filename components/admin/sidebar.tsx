'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    LayoutDashboard,
    Users,
    ShoppingBag,
    Settings,
    LogOut,
    ShieldAlert,
    CreditCard,
    Smartphone
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { signOut } from 'next-auth/react'

const adminItems = [
    { icon: LayoutDashboard, label: 'Visão Geral', href: '/admin' },
    { icon: Users, label: 'Usuários', href: '/admin/users' },
    { icon: ShoppingBag, label: 'Produtos', href: '/admin/products' },
    { icon: CreditCard, label: 'Planos SaaS', href: '/admin/saas' },
    { icon: Smartphone, label: 'App PWA', href: '/admin/pwa' },
    { icon: Settings, label: 'Configurações', href: '/admin/settings' },
]

export function AdminSidebar() {
    const pathname = usePathname()

    return (
        <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-[#0a0a0a]/95 backdrop-blur-xl border-r border-white/5 hidden md:flex flex-col">
            <div className="flex h-16 items-center px-6 border-b border-white/5">
                <div className="flex items-center gap-2 font-bold text-xl">
                    <div className="w-8 h-8 rounded-lg bg-[#D4AF37] flex items-center justify-center text-black shadow-[0_0_15px_-3px_rgba(212,175,55,0.4)]">
                        <ShieldAlert className="w-5 h-5" strokeWidth={1.5} />
                    </div>
                    <span className="text-white font-serif tracking-tight">Admin<span className="text-[#D4AF37]">Verso</span></span>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
                <div className="px-3 mb-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                    Gerenciamento
                </div>
                {adminItems.map((item) => {
                    const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative overflow-hidden",
                                isActive
                                    ? "text-[#D4AF37] bg-white/5"
                                    : "text-zinc-400 hover:text-white hover:bg-white/5"
                            )}
                        >
                            {isActive && (
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#D4AF37] shadow-[0_0_10px_#D4AF37]" />
                            )}
                            <item.icon className={cn("w-5 h-5 transition-transform group-hover:scale-110", isActive ? "text-[#D4AF37]" : "text-zinc-500 group-hover:text-zinc-300")} strokeWidth={1.5} />
                            {item.label}
                        </Link>
                    )
                })}
            </div>

            <div className="p-4 border-t border-white/5">
                <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                    onClick={() => signOut({ callbackUrl: '/login' })}
                >
                    <LogOut className="w-5 h-5" strokeWidth={1.5} />
                    Sair do Admin
                </Button>
            </div>
        </aside>
    )
}
