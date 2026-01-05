import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const formData = await req.formData()
        const file = formData.get('file') as File

        if (!file) {
            return NextResponse.json({ error: 'Arquivo não fornecido' }, { status: 400 })
        }

        // Validar tamanho (max 50MB para materiais)
        const maxSize = 50 * 1024 * 1024
        if (file.size > maxSize) {
            return NextResponse.json({ error: 'Arquivo muito grande. Máximo: 50MB' }, { status: 400 })
        }

        // Não vamos restringir extensões por enquanto, mas bloquear executáveis seria bom.
        // Vamos permitir tudo exceto .exe, .bat, .sh
        const ext = file.name.split('.').pop()?.toLowerCase() || ''
        if (['exe', 'bat', 'sh', 'cmd', 'ps1'].includes(ext)) {
            return NextResponse.json({ error: 'Tipo de arquivo não permitido' }, { status: 400 })
        }

        const fileName = `${uuidv4()}.${ext}`
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'courses', 'materials')

        await mkdir(uploadDir, { recursive: true })
        const filePath = path.join(uploadDir, fileName)

        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)

        await writeFile(filePath, buffer)

        return NextResponse.json({
            success: true,
            url: `/uploads/courses/materials/${fileName}`,
            savedName: fileName,
            originalName: file.name,
            size: file.size,
            mimeType: file.type
        })
    } catch (error: any) {
        console.error('[Course Upload Error]', error)
        return NextResponse.json({ error: 'Erro no upload' }, { status: 500 })
    }
}
