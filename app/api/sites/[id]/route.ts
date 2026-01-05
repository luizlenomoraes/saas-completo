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

        const site = await prisma.cloned_sites.findUnique({
            where: { id: params.id }
        })

        if (!site || site.usuario_id !== session.user.id) {
            return NextResponse.json({ error: 'Site não encontrado' }, { status: 404 })
        }

        await prisma.cloned_sites.delete({
            where: { id: params.id }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('[API Sites DELETE]', error)
        return NextResponse.json({ error: 'Erro ao excluir site' }, { status: 500 })
    }
}
