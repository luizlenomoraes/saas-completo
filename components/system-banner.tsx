'use client'
import { cn } from '@/lib/utils'

interface SystemBannerProps {
    active: boolean
    text: string | null
    color: string | null
}

export function SystemBanner({ active, text, color }: SystemBannerProps) {
    if (!active || !text) return null

    // Se color for hexadecimal, usamos style, senão className
    const isHex = color?.startsWith('#')
    const bgClass = !isHex ? color : ''
    const style = isHex ? { backgroundColor: color! } : {}

    return (
        <div
            className={cn("w-full py-2 px-4 text-center text-sm font-medium text-white shadow-sm z-50 relative", bgClass || 'bg-primary')}
            style={style}
        >
            {text}
        </div>
    )
}
