import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { verifyMemberToken } from '@/lib/auth-member'

/**
 * Middleware de proteção de rotas
 * Equivalente às verificações de sessão no PHP (config.php)
 */
export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl

    // Rotas públicas que não precisam de autenticação
    const publicPaths = [
        '/login',
        '/register',
        '/forgot-password',
        '/reset-password',
        '/checkout',
        '/obrigado',
        '/member/login',
        '/member/setup-password',
        '/api/auth',
        '/api/webhooks',
        '/api/payments/process',
        '/api/payments/status',
        '/_next',
        '/favicon.ico',
        '/manifest.json',
        '/sw.js',
        '/uploads',
        '/assets',
        '/s',
        '/pricing',
        '/.well-known',
    ]

    // Verificar se é rota pública
    const isPublicPath = publicPaths.some(
        (path) => pathname.startsWith(path) || pathname === '/'
    )

    // Lógica Específica para Área de Membros (/members)
    // Feita ANTES da verificação de NextAuth para não misturar sessões
    if (pathname.startsWith('/members')) {
        const memberToken = request.cookies.get('member_session')?.value
        const payload = memberToken ? await verifyMemberToken(memberToken) : null

        if (!payload) {
            const loginUrl = new URL('/login', request.url)
            loginUrl.searchParams.set('callbackUrl', pathname)
            return NextResponse.redirect(loginUrl)
        }
        return NextResponse.next()
    }

    if (isPublicPath) {
        return NextResponse.next()
    }

    // Obter token JWT
    const token = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET,
    })

    // Se não autenticado, redirecionar para login
    if (!token) {
        const loginUrl = new URL('/login', request.url)
        loginUrl.searchParams.set('callbackUrl', pathname)
        return NextResponse.redirect(loginUrl)
    }

    // Verificar permissões por tipo de rota
    const userType = token.type as string

    // Rotas do Admin - apenas admin
    if (pathname.startsWith('/admin')) {
        const type = userType?.toLowerCase() || ''
        if (type !== 'admin') {
            return NextResponse.redirect(new URL('/dashboard', request.url))
        }
    }

    // Rotas do Dashboard - admin e infoprodutor
    if (pathname.startsWith('/dashboard')) {
        if (userType === 'MEMBER') {
            return NextResponse.redirect(new URL('/member', request.url))
        }
    }

    // Rotas da Área de Membros - todos podem acessar (inclusive infoprodutores para preview)
    // Não precisa verificação adicional

    // Headers de segurança
    const response = NextResponse.next()

    response.headers.set('X-Frame-Options', 'SAMEORIGIN')
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

    return response
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public files (uploads, assets, etc)
         */
        '/((?!_next/static|_next/image|favicon.ico|uploads/|assets/).*)',
    ],
}
