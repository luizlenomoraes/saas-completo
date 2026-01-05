import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET - Buscar dados do perfil
export async function GET() {
    try {
        const session = await getServerSession(authOptions)
        if (!session) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const user = await prisma.usuarios.findUnique({
            where: { id: session.user.id },
            select: {
                id: true,
                usuario: true,
                nome: true,
                telefone: true,
                foto_perfil: true,
                mp_public_key: true,
                mp_access_token: true,
                pushinpay_token: true,
                efi_client_id: true,
                efi_client_secret: true,
                efi_pix_key: true,
                beehive_public_key: true,
                beehive_secret_key: true,
                hypercash_public_key: true,
                hypercash_secret_key: true
            }
        })

        if (!user) {
            return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
        }

        // Mascarar tokens sensíveis (mostrar apenas os últimos 4 caracteres)
        const maskToken = (token: string | null) => {
            if (!token) return null
            if (token.length <= 8) return '****'
            return '****' + token.slice(-4)
        }

        return NextResponse.json({
            profile: {
                email: user.usuario,
                nome: user.nome,
                telefone: user.telefone,
                foto_perfil: user.foto_perfil
            },
            gateways: {
                mercadopago: {
                    configured: !!(user.mp_public_key && user.mp_access_token),
                    public_key: maskToken(user.mp_public_key),
                    access_token: maskToken(user.mp_access_token)
                },
                pushinpay: {
                    configured: !!user.pushinpay_token,
                    token: maskToken(user.pushinpay_token)
                },
                efi: {
                    configured: !!(user.efi_client_id && user.efi_client_secret),
                    client_id: maskToken(user.efi_client_id),
                    pix_key: user.efi_pix_key
                },
                beehive: {
                    configured: !!(user.beehive_public_key && user.beehive_secret_key),
                    public_key: maskToken(user.beehive_public_key)
                },
                hypercash: {
                    configured: !!(user.hypercash_public_key && user.hypercash_secret_key),
                    public_key: maskToken(user.hypercash_public_key)
                }
            }
        })
    } catch (error: any) {
        console.error('[API Profile GET Error]', error)
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }
}

// PUT - Atualizar perfil
export async function PUT(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const body = await request.json()
        const { nome, telefone, foto_perfil } = body

        await prisma.usuarios.update({
            where: { id: session.user.id },
            data: {
                nome: nome !== undefined ? nome : undefined,
                telefone: telefone !== undefined ? telefone : undefined,
                foto_perfil: foto_perfil !== undefined ? foto_perfil : undefined
            }
        })

        return NextResponse.json({ success: true, message: 'Perfil atualizado' })
    } catch (error: any) {
        console.error('[API Profile PUT Error]', error)
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }
}
