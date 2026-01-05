import { NextRequest, NextResponse } from 'next/server'
import { verifyMemberToken } from '@/lib/auth-member'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/db'
import fs from 'fs'
import path from 'path'

export async function GET(
    request: NextRequest,
    { params }: { params: { fileId: string } }
) {
    try {
        const cookieStore = cookies()
        const token = cookieStore.get('member_session')?.value
        const session: any = token ? await verifyMemberToken(token) : null

        if (!session) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const { fileId } = params

        // Buscar arquivo
        const arquivo = await prisma.aula_arquivos.findUnique({
            where: { id: fileId },
            include: {
                aulas: {
                    include: {
                        modulos: {
                            include: { cursos: true }
                        }
                    }
                }
            }
        })

        if (!arquivo) {
            return NextResponse.json({ error: 'Arquivo não encontrado' }, { status: 404 })
        }

        // Verificar se o aluno tem acesso ao produto
        const produtoId = arquivo.aulas.modulos.cursos.produto_id
        const access: any[] = await prisma.$queryRaw`
            SELECT id FROM alunos_acessos
            WHERE email_aluno = ${session.email}
            AND produto_id = ${produtoId}
        `

        if (access.length === 0) {
            return NextResponse.json({ error: 'Sem acesso ao curso' }, { status: 403 })
        }

        // Verificar liberação por tempo (release_days) do módulo e da aula
        const accessData: any[] = await prisma.$queryRaw`
            SELECT data_acesso FROM alunos_acessos
            WHERE email_aluno = ${session.email}
            AND produto_id = ${produtoId}
            LIMIT 1
        `

        if (accessData.length > 0) {
            const dataAcesso = new Date(accessData[0].data_acesso)
            const agora = new Date()
            const diasDesdeAcesso = Math.floor((agora.getTime() - dataAcesso.getTime()) / (1000 * 60 * 60 * 24))

            const moduloReleaseDays = arquivo.aulas.modulos.release_days || 0
            const aulaReleaseDays = arquivo.aulas.release_days || 0
            const maxReleaseDays = Math.max(moduloReleaseDays, aulaReleaseDays)

            if (diasDesdeAcesso < maxReleaseDays) {
                return NextResponse.json({
                    error: `Este conteúdo será liberado em ${maxReleaseDays - diasDesdeAcesso} dia(s)`
                }, { status: 403 })
            }
        }

        // Ler o arquivo do sistema
        const filePath = path.join(process.cwd(), 'uploads', arquivo.caminho_arquivo)

        if (!fs.existsSync(filePath)) {
            return NextResponse.json({ error: 'Arquivo não encontrado no servidor' }, { status: 404 })
        }

        const fileBuffer = fs.readFileSync(filePath)
        const mimeType = arquivo.tipo_mime || 'application/octet-stream'

        return new NextResponse(fileBuffer, {
            headers: {
                'Content-Type': mimeType,
                'Content-Disposition': `attachment; filename="${arquivo.nome_original}"`,
                'Content-Length': fileBuffer.length.toString()
            }
        })
    } catch (error: any) {
        console.error('[API Download File Error]', error)
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }
}
