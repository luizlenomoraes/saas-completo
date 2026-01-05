import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

/**
 * Página inicial - Redireciona baseado no estado de autenticação
 */
export default async function HomePage() {
    const session = await getServerSession(authOptions)

    if (!session) {
        // Não autenticado - redireciona para login
        redirect('/login')
    }

    // Redireciona baseado no tipo de usuário
    switch (session.user.type) {
        case 'ADMIN':
            redirect('/admin')
        case 'MEMBER':
            redirect('/member')
        case 'INFOPRODUCER':
        default:
            redirect('/dashboard')
    }
}
