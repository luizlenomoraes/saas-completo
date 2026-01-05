import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const formData = await request.formData()
        const file = formData.get('file') as File
        const type = formData.get('type') as string || 'product' // product, course, profile

        if (!file) {
            return NextResponse.json({ error: 'Arquivo não fornecido' }, { status: 400 })
        }

        // Validar tipo de arquivo
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json({
                error: 'Tipo de arquivo não permitido. Use: JPG, PNG, WebP ou GIF'
            }, { status: 400 })
        }

        // Validar tamanho (max 5MB)
        const maxSize = 5 * 1024 * 1024 // 5MB
        if (file.size > maxSize) {
            return NextResponse.json({
                error: 'Arquivo muito grande. Máximo: 5MB'
            }, { status: 400 })
        }

        // Gerar nome único
        const ext = file.name.split('.').pop() || 'jpg'
        const fileName = `${uuidv4()}.${ext}`

        // Definir pasta baseada no tipo
        const folder = type === 'profile' ? 'profiles' : type === 'course' ? 'courses' : 'products'
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', folder)

        // Criar diretório se não existir
        await mkdir(uploadDir, { recursive: true })

        // Salvar arquivo
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)
        const filePath = path.join(uploadDir, fileName)

        await writeFile(filePath, buffer)

        // Retornar URL pública
        const publicUrl = `/uploads/${folder}/${fileName}`

        return NextResponse.json({
            success: true,
            url: publicUrl,
            fileName
        })
    } catch (error: any) {
        console.error('[API Upload Error]', error)
        return NextResponse.json({ error: 'Erro ao fazer upload' }, { status: 500 })
    }
}
