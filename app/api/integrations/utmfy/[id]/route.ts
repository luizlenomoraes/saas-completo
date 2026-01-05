import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// DELETE
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

        const existing = await prisma.utmfy_integrations.findUnique({
            where: { id: params.id }
        })

        if (!existing || existing.usuario_id !== session.user.id) {
            return NextResponse.json({ error: 'Integração não encontrada' }, { status: 404 })
        }

        await prisma.utmfy_integrations.delete({
            where: { id: params.id }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('[API Utmfy DELETE]', error)
        return NextResponse.json({ error: 'Erro ao excluir integração' }, { status: 500 })
    }
}
