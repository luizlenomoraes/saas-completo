import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { compare } from 'bcryptjs'
import prisma from '@/lib/db'

export const authOptions: NextAuthOptions = {
    session: {
        strategy: 'jwt',
        maxAge: 30 * 24 * 60 * 60, // 30 dias (equivalente ao PHP)
    },
    pages: {
        signIn: '/login',
        signOut: '/logout',
        error: '/login',
    },
    providers: [
        CredentialsProvider({
            name: 'credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Senha', type: 'password' },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error('Email e senha são obrigatórios')
                }

                const user = await prisma.usuarios.findUnique({
                    where: { usuario: credentials.email },
                })

                if (!user) {
                    throw new Error('Credenciais incorretas')
                }

                const isPasswordValid = await compare(credentials.password, user.senha)

                if (!isPasswordValid) {
                    throw new Error('Credenciais incorretas')
                }

                return {
                    id: user.id,
                    email: user.usuario,
                    name: user.nome,
                    type: user.tipo,
                    image: user.foto_perfil,
                }
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user, trigger, session }) {
            if (user) {
                token.id = user.id
                token.type = (user as any).type
            }

            // Atualizar sessão quando solicitado
            if (trigger === 'update' && session) {
                token.name = session.name
                token.picture = session.image
            }

            return token
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string
                session.user.type = token.type as string
            }
            return session
        },
    },
    events: {
        async signIn({ user }) {
            // Log de login bem-sucedido (equivalente ao PHP log_security_event)
            console.log(`[AUTH] Login bem-sucedido: ${user.email}`)
        },
        async signOut({ token }) {
            console.log(`[AUTH] Logout: ${token?.email}`)
        },
    },
}

// Tipos estendidos para TypeScript
declare module 'next-auth' {
    interface Session {
        user: {
            id: string
            email: string
            name?: string | null
            image?: string | null
            type: string
        }
    }

    interface User {
        type: string
    }
}

declare module 'next-auth/jwt' {
    interface JWT {
        id: string
        type: string
    }
}
