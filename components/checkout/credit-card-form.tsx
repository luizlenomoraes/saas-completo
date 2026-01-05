'use client'

import { useState, useCallback, useEffect } from 'react'
import { CreditCard, Lock, Calendar, User } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export interface CardData {
    number: string
    name: string
    expiry: string
    cvv: string
    installments: number
    token?: string
    paymentMethodId?: string
    issuerId?: string
}

interface CreditCardFormProps {
    data: CardData
    onChange: (data: CardData) => void
    amount: number
    publicKey?: string
    disabled?: boolean
}

// Formatação do número do cartão
function formatCardNumber(value: string): string {
    const digits = value.replace(/\D/g, '').slice(0, 16)
    return digits.replace(/(\d{4})(?=\d)/g, '$1 ')
}

// Formatação da validade
function formatExpiry(value: string): string {
    const digits = value.replace(/\D/g, '').slice(0, 4)
    if (digits.length >= 3) {
        return `${digits.slice(0, 2)}/${digits.slice(2)}`
    }
    return digits
}

// Detectar bandeira do cartão
function getCardBrand(number: string): string {
    const digits = number.replace(/\D/g, '')
    if (/^4/.test(digits)) return 'visa'
    if (/^5[1-5]/.test(digits)) return 'mastercard'
    if (/^3[47]/.test(digits)) return 'amex'
    if (/^6(?:011|5)/.test(digits)) return 'discover'
    if (/^(?:2131|1800|35)/.test(digits)) return 'jcb'
    if (/^3(?:0[0-5]|[68])/.test(digits)) return 'diners'
    if (/^(606282|3841)/.test(digits)) return 'hipercard'
    if (/^(50|636368|636297)/.test(digits)) return 'elo'
    return 'unknown'
}

// Gerar opções de parcelamento
function generateInstallmentOptions(amount: number, maxInstallments: number = 12) {
    const options = []
    for (let i = 1; i <= maxInstallments; i++) {
        const installmentValue = amount / i
        // Apenas mostrar se parcela for >= R$ 5,00
        if (installmentValue >= 5) {
            options.push({
                value: i,
                label: i === 1
                    ? `À vista - R$ ${amount.toFixed(2).replace('.', ',')}`
                    : `${i}x de R$ ${installmentValue.toFixed(2).replace('.', ',')} sem juros`,
            })
        }
    }
    return options
}

export function CreditCardForm({ data, onChange, amount, publicKey, disabled = false }: CreditCardFormProps) {
    const [touched, setTouched] = useState<Record<string, boolean>>({})
    const [cardBrand, setCardBrand] = useState('unknown')
    const [installmentOptions, setInstallmentOptions] = useState<{ value: number; label: string }[]>([])

    // Gerar opções de parcelamento quando o valor mudar
    useEffect(() => {
        setInstallmentOptions(generateInstallmentOptions(amount))
    }, [amount])

    // Detectar bandeira quando o número mudar
    useEffect(() => {
        const brand = getCardBrand(data.number)
        setCardBrand(brand)
    }, [data.number])

    const handleChange = useCallback((field: keyof CardData, value: string | number) => {
        let formattedValue = value

        if (field === 'number' && typeof value === 'string') {
            formattedValue = formatCardNumber(value)
        } else if (field === 'expiry' && typeof value === 'string') {
            formattedValue = formatExpiry(value)
        } else if (field === 'cvv' && typeof value === 'string') {
            formattedValue = value.replace(/\D/g, '').slice(0, 4)
        }

        onChange({ ...data, [field]: formattedValue })
    }, [data, onChange])

    const handleBlur = useCallback((field: string) => {
        setTouched((prev) => ({ ...prev, [field]: true }))
    }, [])

    const getError = (field: string): string | undefined => {
        if (!touched[field]) return undefined

        switch (field) {
            case 'number':
                const digits = data.number.replace(/\D/g, '')
                if (!digits) return 'Número do cartão é obrigatório'
                if (digits.length < 13) return 'Número do cartão incompleto'
                break
            case 'name':
                if (!data.name || data.name.length < 2) return 'Nome é obrigatório'
                break
            case 'expiry':
                if (!data.expiry) return 'Validade é obrigatória'
                if (data.expiry.length < 5) return 'Validade incompleta'
                // Validar se não está expirado
                const [month, year] = data.expiry.split('/')
                if (month && year) {
                    const expDate = new Date(2000 + parseInt(year), parseInt(month) - 1)
                    if (expDate < new Date()) return 'Cartão expirado'
                }
                break
            case 'cvv':
                if (!data.cvv) return 'CVV é obrigatório'
                if (data.cvv.length < 3) return 'CVV incompleto'
                break
        }
        return undefined
    }

    // Ícones das bandeiras
    const brandIcons: Record<string, string> = {
        visa: '💳',
        mastercard: '💳',
        amex: '💳',
        elo: '💳',
        hipercard: '💳',
        unknown: '💳',
    }

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Dados do Cartão
            </h3>

            <div className="grid gap-4">
                {/* Número do Cartão */}
                <div className="space-y-2">
                    <Label htmlFor="cardNumber">Número do Cartão *</Label>
                    <div className="relative">
                        <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            id="cardNumber"
                            type="text"
                            placeholder="0000 0000 0000 0000"
                            value={data.number}
                            onChange={(e) => handleChange('number', e.target.value)}
                            onBlur={() => handleBlur('number')}
                            disabled={disabled}
                            maxLength={19}
                            className={`pl-10 pr-12 ${getError('number') ? 'border-red-500' : ''}`}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-lg">
                            {brandIcons[cardBrand] || brandIcons.unknown}
                        </span>
                    </div>
                    {getError('number') && (
                        <p className="text-sm text-red-500">{getError('number')}</p>
                    )}
                </div>

                {/* Nome no Cartão */}
                <div className="space-y-2">
                    <Label htmlFor="cardName">Nome impresso no cartão *</Label>
                    <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            id="cardName"
                            type="text"
                            placeholder="NOME COMO NO CARTÃO"
                            value={data.name}
                            onChange={(e) => handleChange('name', e.target.value.toUpperCase())}
                            onBlur={() => handleBlur('name')}
                            disabled={disabled}
                            className={`pl-10 uppercase ${getError('name') ? 'border-red-500' : ''}`}
                        />
                    </div>
                    {getError('name') && (
                        <p className="text-sm text-red-500">{getError('name')}</p>
                    )}
                </div>

                {/* Validade e CVV */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="cardExpiry">Validade *</Label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                id="cardExpiry"
                                type="text"
                                placeholder="MM/AA"
                                value={data.expiry}
                                onChange={(e) => handleChange('expiry', e.target.value)}
                                onBlur={() => handleBlur('expiry')}
                                disabled={disabled}
                                maxLength={5}
                                className={`pl-10 ${getError('expiry') ? 'border-red-500' : ''}`}
                            />
                        </div>
                        {getError('expiry') && (
                            <p className="text-sm text-red-500">{getError('expiry')}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="cardCvv">CVV *</Label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                id="cardCvv"
                                type="text"
                                placeholder="123"
                                value={data.cvv}
                                onChange={(e) => handleChange('cvv', e.target.value)}
                                onBlur={() => handleBlur('cvv')}
                                disabled={disabled}
                                maxLength={4}
                                className={`pl-10 ${getError('cvv') ? 'border-red-500' : ''}`}
                            />
                        </div>
                        {getError('cvv') && (
                            <p className="text-sm text-red-500">{getError('cvv')}</p>
                        )}
                    </div>
                </div>

                {/* Parcelamento */}
                <div className="space-y-2">
                    <Label htmlFor="installments">Parcelamento</Label>
                    <Select
                        value={data.installments?.toString() || '1'}
                        onValueChange={(value) => handleChange('installments', parseInt(value))}
                        disabled={disabled}
                    >
                        <SelectTrigger id="installments">
                            <SelectValue placeholder="Selecione o parcelamento" />
                        </SelectTrigger>
                        <SelectContent>
                            {installmentOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value.toString()}>
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Selo de Segurança */}
                <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                    <Lock className="w-4 h-4 text-green-500" />
                    <span>Seus dados estão protegidos com criptografia SSL de 256 bits</span>
                </div>
            </div>
        </div>
    )
}
