import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Image from 'next/image'

interface AuthLayoutProps {
    children: React.ReactNode
}

export default async function AuthLayout({ children }: AuthLayoutProps) {
    // Verificar se já está logado
    const session = await getServerSession(authOptions)

    if (session) {
        // Redirecionar baseado no tipo
        switch (session.user.type) {
            case 'ADMIN':
                redirect('/admin')
            case 'MEMBER':
                redirect('/member')
            default:
                redirect('/dashboard')
        }
    }

    return (
        <div className="min-h-screen flex">
            {/* Lado esquerdo - Imagem de fundo */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-green-600 via-green-500 to-emerald-400">
                {/* Overlay com padrão */}
                <div className="absolute inset-0 bg-black/20" />

                {/* Conteúdo sobre a imagem */}
                <div className="relative z-10 flex flex-col justify-center items-center p-12 text-white">
                    <div className="max-w-md text-center">
                        {/* Logo ou título */}
                        <div className="mb-8">
                            <div className="w-20 h-20 mx-auto bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-6">
                                <svg
                                    className="w-12 h-12 text-white"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M13 10V3L4 14h7v7l9-11h-7z"
                                    />
                                </svg>
                            </div>
                            <h1 className="text-4xl font-bold mb-4">Checkout Platform</h1>
                            <p className="text-xl text-white/80">
                                A plataforma completa para vender seus produtos digitais
                            </p>
                        </div>

                        {/* Features */}
                        <div className="space-y-4 text-left">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <span>Checkout otimizado para conversão</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <span>Múltiplos gateways de pagamento</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <span>Área de membros integrada</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <span>Dashboard completo com métricas</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Decoração de fundo */}
                <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/20 to-transparent" />
            </div>

            {/* Lado direito - Formulário */}
            <div className="flex-1 flex flex-col justify-center items-center p-8 bg-gray-50 dark:bg-gray-900">
                <div className="w-full max-w-md">
                    {children}
                </div>

                {/* Footer */}
                <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
                    <p>© {new Date().getFullYear()} Checkout Platform. Todos os direitos reservados.</p>
                </div>
            </div>
        </div>
    )
}
