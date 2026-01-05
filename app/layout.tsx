import type { Metadata, Viewport } from 'next'
import { Inter, Roboto_Mono } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/sonner'
import { Providers } from '@/components/providers'
import { SystemBanner } from '@/components/system-banner'

const inter = Inter({
    subsets: ['latin'],
    variable: '--font-inter',
    display: 'swap',
})

const robotoMono = Roboto_Mono({
    subsets: ['latin'],
    variable: '--font-roboto-mono',
    display: 'swap',
})

export const metadata: Metadata = {
    title: {
        default: 'AgentiVerso',
        template: '%s | AgentiVerso',
    },
    description: 'O Universo dos Agentes de IA e Infoprodutos',
    keywords: ['IA', 'agentes', 'automação', 'checkout', 'vendas', 'infoprodutos', 'área de membros'],
    authors: [{ name: 'AgentiVerso' }],
    creator: 'AgentiVerso',
    metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
    openGraph: {
        type: 'website',
        locale: 'pt_BR',
        siteName: 'AgentiVerso',
    },
    robots: {
        index: true,
        follow: true,
    },
    icons: {
        icon: '/favicon.ico',
        apple: '/apple-touch-icon.png',
    },
    manifest: '/manifest.json',
}

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    themeColor: [
        { media: '(prefers-color-scheme: light)', color: '#D4AF37' },
        { media: '(prefers-color-scheme: dark)', color: '#050505' },
    ],
}

export default async function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    // Buscar configurações de banner (Comentado para evitar erro 500 no Prisma)
    let bannerSettings = {
        banner_active: 'false',
        banner_text: '',
        banner_color: ''
    }

    return (
        <html lang="pt-BR" suppressHydrationWarning>
            <head>
                <link rel="icon" href="/favicon.ico" sizes="any" />
                <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
                <link rel="manifest" href="/manifest.json" />
            </head>
            <body className={`${inter.variable} ${robotoMono.variable} font-sans antialiased`}>
                <Providers>
                    <SystemBanner
                        active={bannerSettings.banner_active === 'true'}
                        text={bannerSettings.banner_text}
                        color={bannerSettings.banner_color}
                    />
                    {children}
                    <Toaster position="top-right" richColors closeButton />
                </Providers>
            </body>
        </html>
    )
}
