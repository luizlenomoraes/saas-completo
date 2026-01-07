'use client'

import { LucideIcon } from 'lucide-react'
import { PageTransition } from '@/components/ui/page-transition'

export interface KpiCardProps {
    title: string
    value: string
    icon: React.ReactNode
    description: string
    delay?: number
}

export function KpiCard({ title, value, icon, description, delay = 0 }: KpiCardProps) {
    return (
        <div
            className="glass-panel p-6 rounded-xl border border-white/5 relative overflow-hidden group animate-fade-up"
            style={{ animationDelay: `${delay}ms` }}
        >
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-zinc-400 font-medium text-sm">{title}</p>
                    <h3 className="text-2xl font-bold text-white mt-1 group-hover:text-[#D4AF37] transition-colors">{value}</h3>
                </div>
                <div className="p-3 bg-[#D4AF37]/10 rounded-lg text-[#D4AF37] group-hover:bg-[#D4AF37] group-hover:text-black transition-all">
                    {icon}
                </div>
            </div>
            <p className="text-xs text-zinc-500 mt-4">{description}</p>
        </div>
    )
}
