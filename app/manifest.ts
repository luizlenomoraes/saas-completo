import { MetadataRoute } from 'next'
import { prisma } from '@/lib/db'

export default async function manifest(): Promise<MetadataRoute.Manifest> {
    let config = null

    try {
        // Buscar primeira configuração ou default
        config = await prisma.pwa_config.findFirst()
    } catch (error) {
        console.warn('Failed to fetch PWA config for manifest generation', error)
    }

    const name = config?.app_name || 'AgentiVerso SaaS'
    const short_name = config?.short_name || 'AgentiVerso'
    const description = config?.description || 'Plataforma completa para infoprodutores'
    const theme_color = config?.theme_color || '#D4AF37'
    const background_color = config?.background_color || '#000000'
    const start_url = config?.start_url || '/dashboard'
    const display = (config?.display_mode as any) || 'standalone'

    return {
        name,
        short_name,
        description,
        start_url,
        display,
        background_color,
        theme_color,
        orientation: 'portrait',
        scope: '/',
        icons: [
            {
                src: '/icons/icon-192.png',
                sizes: '192x192',
                type: 'image/png',
                purpose: 'maskable'
            },
            {
                src: '/icons/icon-512.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'any'
            }
        ],
        // Screenshots para install prompt
        screenshots: [
            {
                src: '/screenshots/mobile-1.png',
                sizes: '390x844',
                type: 'image/png'
            }
        ]
    }
}
