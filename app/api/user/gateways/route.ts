import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// PUT - Atualizar credenciais de gateways
export async function PUT(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const body = await request.json()
        const { gateway, credentials } = body

        if (!gateway || !credentials) {
            return NextResponse.json({ error: 'Gateway e credenciais são obrigatórios' }, { status: 400 })
        }

        let updateData: any = {}

        switch (gateway) {
            case 'mercadopago':
                if (credentials.public_key) updateData.mp_public_key = credentials.public_key
                if (credentials.access_token) updateData.mp_access_token = credentials.access_token
                break

            case 'pushinpay':
                if (credentials.token) updateData.pushinpay_token = credentials.token
                break

            case 'efi':
                if (credentials.client_id) updateData.efi_client_id = credentials.client_id
                if (credentials.client_secret) updateData.efi_client_secret = credentials.client_secret
                if (credentials.pix_key) updateData.efi_pix_key = credentials.pix_key
                if (credentials.certificate_path) updateData.efi_certificate_path = credentials.certificate_path
                if (credentials.payee_code) updateData.efi_payee_code = credentials.payee_code
                break

            case 'beehive':
                if (credentials.public_key) updateData.beehive_public_key = credentials.public_key
                if (credentials.secret_key) updateData.beehive_secret_key = credentials.secret_key
                break

            case 'hypercash':
                if (credentials.public_key) updateData.hypercash_public_key = credentials.public_key
                if (credentials.secret_key) updateData.hypercash_secret_key = credentials.secret_key
                break

            default:
                return NextResponse.json({ error: 'Gateway não suportado' }, { status: 400 })
        }

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json({ error: 'Nenhuma credencial válida fornecida' }, { status: 400 })
        }

        await prisma.usuarios.update({
            where: { id: session.user.id },
            data: updateData
        })

        return NextResponse.json({
            success: true,
            message: `Credenciais do ${gateway} atualizadas com sucesso`
        })
    } catch (error: any) {
        console.error('[API Gateways PUT Error]', error)
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }
}
