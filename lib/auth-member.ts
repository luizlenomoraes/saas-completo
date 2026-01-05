import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

const secretKey = process.env.JWT_SECRET_KEY || 'default-secret-key-checkout-platform'
const key = new TextEncoder().encode(secretKey)

export async function signMemberToken(payload: any) {
    return new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('30d') // Login persistente
        .sign(key)
}

export async function verifyMemberToken(token: string) {
    try {
        const { payload } = await jwtVerify(token, key)
        return payload
    } catch (error) {
        return null
    }
}

export async function getMemberSession() {
    const cookieStore = cookies()
    const token = cookieStore.get('member_session')?.value
    if (!token) return null
    return await verifyMemberToken(token)
}
