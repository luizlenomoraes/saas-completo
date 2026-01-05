import { z } from 'zod'

// =============================================
// VALIDADORES DE AUTENTICAÇÃO
// =============================================

export const loginSchema = z.object({
    email: z
        .string()
        .min(1, 'Email é obrigatório')
        .email('Email inválido'),
    password: z
        .string()
        .min(1, 'Senha é obrigatória'),
    remember: z.boolean().optional(),
})

// DDDs brasileiros válidos
const DDDS_VALIDOS = [
    11, 12, 13, 14, 15, 16, 17, 18, 19, // SP
    21, 22, 24, // RJ
    27, 28, // ES
    31, 32, 33, 34, 35, 37, 38, // MG
    41, 42, 43, 44, 45, 46, // PR
    47, 48, 49, // SC
    51, 53, 54, 55, // RS
    61, // DF
    62, 64, // GO
    63, // TO
    65, 66, // MT
    67, // MS
    68, // AC
    69, // RO
    71, 73, 74, 75, 77, // BA
    79, // SE
    81, 87, // PE
    82, // AL
    83, // PB
    84, // RN
    85, 88, // CE
    86, 89, // PI
    91, 93, 94, // PA
    92, 97, // AM
    95, // RR
    96, // AP
    98, 99, // MA
]

export const phoneWithDDDSchema = z
    .string()
    .min(1, 'Telefone é obrigatório')
    .transform((val) => val.replace(/\D/g, ''))
    .refine((val) => val.length === 10 || val.length === 11, {
        message: 'Telefone deve ter DDD + número (10 ou 11 dígitos)',
    })
    .refine((val) => {
        const ddd = parseInt(val.substring(0, 2))
        return DDDS_VALIDOS.includes(ddd)
    }, {
        message: 'DDD inválido. Use um DDD brasileiro válido.',
    })

export const registerSchema = z.object({
    name: z
        .string()
        .min(2, 'Nome deve ter pelo menos 2 caracteres')
        .max(100, 'Nome muito longo'),
    email: z
        .string()
        .min(1, 'Email é obrigatório')
        .email('Email inválido'),
    phone: phoneWithDDDSchema,
    password: z
        .string()
        .min(6, 'Senha deve ter pelo menos 6 caracteres')
        .max(100, 'Senha muito longa'),
    confirmPassword: z
        .string()
        .min(1, 'Confirmação de senha é obrigatória'),
}).refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
})

export const forgotPasswordSchema = z.object({
    email: z
        .string()
        .min(1, 'Email é obrigatório')
        .email('Email inválido'),
})

export const resetPasswordSchema = z.object({
    token: z.string().min(1, 'Token inválido'),
    password: z
        .string()
        .min(6, 'Senha deve ter pelo menos 6 caracteres'),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
})

// =============================================
// VALIDADORES DE CHECKOUT
// =============================================

export const cpfSchema = z
    .string()
    .min(11, 'CPF inválido')
    .max(14, 'CPF inválido')
    .transform((val) => val.replace(/\D/g, ''))
    .refine((val) => val.length === 11, 'CPF deve ter 11 dígitos')
    .refine((val) => {
        // Validação de dígitos verificadores do CPF
        if (/^(\d)\1+$/.test(val)) return false

        let sum = 0
        for (let i = 0; i < 9; i++) {
            sum += parseInt(val.charAt(i)) * (10 - i)
        }
        let remainder = (sum * 10) % 11
        if (remainder === 10 || remainder === 11) remainder = 0
        if (remainder !== parseInt(val.charAt(9))) return false

        sum = 0
        for (let i = 0; i < 10; i++) {
            sum += parseInt(val.charAt(i)) * (11 - i)
        }
        remainder = (sum * 10) % 11
        if (remainder === 10 || remainder === 11) remainder = 0
        return remainder === parseInt(val.charAt(10))
    }, 'CPF inválido')

export const phoneSchema = z
    .string()
    .min(10, 'Telefone inválido')
    .max(15, 'Telefone inválido')
    .transform((val) => val.replace(/\D/g, ''))
    .refine((val) => val.length >= 10 && val.length <= 11, 'Telefone deve ter 10 ou 11 dígitos')

export const customerSchema = z.object({
    name: z.string().min(2, 'Nome é obrigatório'),
    email: z.string().email('Email inválido'),
    cpf: cpfSchema,
    phone: phoneSchema,
})

export const addressSchema = z.object({
    cep: z.string().length(8, 'CEP deve ter 8 dígitos'),
    street: z.string().min(1, 'Logradouro é obrigatório'),
    number: z.string().min(1, 'Número é obrigatório'),
    complement: z.string().optional(),
    neighborhood: z.string().min(1, 'Bairro é obrigatório'),
    city: z.string().min(1, 'Cidade é obrigatória'),
    state: z.string().length(2, 'Estado deve ter 2 caracteres'),
})

export const checkoutSchema = z.object({
    customer: customerSchema,
    address: addressSchema.optional(),
    paymentMethod: z.enum(['pix', 'credit_card', 'boleto']),
    orderBumps: z.array(z.string()).optional(),
    // Dados do cartão (opcional, só para credit_card)
    cardData: z.object({
        token: z.string(),
        installments: z.number().min(1).max(12),
    }).optional(),
    // UTM tracking
    utm: z.object({
        source: z.string().optional(),
        medium: z.string().optional(),
        campaign: z.string().optional(),
        content: z.string().optional(),
        term: z.string().optional(),
        src: z.string().optional(),
        sck: z.string().optional(),
    }).optional(),
})

// =============================================
// VALIDADORES DE PRODUTO
// =============================================

export const productSchema = z.object({
    name: z.string().min(1, 'Nome é obrigatório').max(255),
    description: z.string().optional(),
    price: z.number().min(0.01, 'Preço deve ser maior que zero'),
    previousPrice: z.number().optional(),
    deliveryType: z.enum(['link', 'email_pdf', 'area_membros', 'produto_fisico']),
    deliveryContent: z.string().optional(),
    gateway: z.string().default('mercadopago'),
    checkoutConfig: z.any().optional(),
})

// =============================================
// VALIDADORES DE WEBHOOK
// =============================================

export const webhookSchema = z.object({
    url: z.string().url('URL inválida'),
    productId: z.string().optional(),
    eventApproved: z.boolean().default(false),
    eventPending: z.boolean().default(false),
    eventRejected: z.boolean().default(false),
    eventRefunded: z.boolean().default(false),
    eventChargedBack: z.boolean().default(false),
})

// =============================================
// VALIDADORES DE CURSO
// =============================================

export const courseSchema = z.object({
    title: z.string().min(1, 'Título é obrigatório'),
    description: z.string().optional(),
})

export const moduleSchema = z.object({
    title: z.string().min(1, 'Título é obrigatório'),
    order: z.number().default(0),
    releaseDays: z.number().default(0),
})

export const lessonSchema = z.object({
    title: z.string().min(1, 'Título é obrigatório'),
    videoUrl: z.string().url().optional().or(z.literal('')),
    description: z.string().optional(),
    order: z.number().default(0),
    releaseDays: z.number().default(0),
    contentType: z.enum(['video', 'files', 'mixed']).default('video'),
})

// =============================================
// TIPOS INFERIDOS
// =============================================

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
export type CustomerInput = z.infer<typeof customerSchema>
export type AddressInput = z.infer<typeof addressSchema>
export type CheckoutInput = z.infer<typeof checkoutSchema>
export type ProductInput = z.infer<typeof productSchema>
export type WebhookInput = z.infer<typeof webhookSchema>
export type CourseInput = z.infer<typeof courseSchema>
export type ModuleInput = z.infer<typeof moduleSchema>
export type LessonInput = z.infer<typeof lessonSchema>
