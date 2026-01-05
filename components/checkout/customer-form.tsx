'use client'

import { useState, useCallback } from 'react'
import { User, Mail, CreditCard, Phone } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatCPF, formatPhone, isValidCPF, isValidEmail } from '@/lib/utils'

export interface CustomerData {
    name: string
    email: string
    cpf: string
    phone: string
}

interface CustomerFormProps {
    data: CustomerData
    onChange: (data: CustomerData) => void
    errors?: Partial<Record<keyof CustomerData, string>>
    disabled?: boolean
}

export function CustomerForm({ data, onChange, errors = {}, disabled = false }: CustomerFormProps) {
    const [touched, setTouched] = useState<Record<string, boolean>>({})

    const handleChange = useCallback((field: keyof CustomerData, value: string) => {
        let formattedValue = value

        if (field === 'cpf') {
            formattedValue = formatCPF(value)
        } else if (field === 'phone') {
            formattedValue = formatPhone(value)
        }

        onChange({ ...data, [field]: formattedValue })
    }, [data, onChange])

    const handleBlur = useCallback((field: keyof CustomerData) => {
        setTouched((prev) => ({ ...prev, [field]: true }))
    }, [])

    const getError = (field: keyof CustomerData): string | undefined => {
        if (!touched[field]) return undefined
        if (errors[field]) return errors[field]

        // Validações inline
        switch (field) {
            case 'name':
                if (!data.name || data.name.length < 2) return 'Nome é obrigatório'
                break
            case 'email':
                if (!data.email) return 'Email é obrigatório'
                if (!isValidEmail(data.email)) return 'Email inválido'
                break
            case 'cpf':
                if (!data.cpf) return 'CPF é obrigatório'
                if (!isValidCPF(data.cpf)) return 'CPF inválido'
                break
            case 'phone':
                const phoneDigits = data.phone.replace(/\D/g, '')
                if (!phoneDigits) return 'Telefone é obrigatório'
                if (phoneDigits.length < 10) return 'Telefone incompleto'
                break
        }
        return undefined
    }

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <User className="w-5 h-5" />
                Dados Pessoais
            </h3>

            <div className="grid gap-4">
                {/* Nome */}
                <div className="space-y-2">
                    <Label htmlFor="name">Nome completo *</Label>
                    <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            id="name"
                            type="text"
                            placeholder="Seu nome completo"
                            value={data.name}
                            onChange={(e) => handleChange('name', e.target.value)}
                            onBlur={() => handleBlur('name')}
                            disabled={disabled}
                            className={`pl-10 ${getError('name') ? 'border-red-500' : ''}`}
                        />
                    </div>
                    {getError('name') && (
                        <p className="text-sm text-red-500">{getError('name')}</p>
                    )}
                </div>

                {/* Email */}
                <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            id="email"
                            type="email"
                            placeholder="seu@email.com"
                            value={data.email}
                            onChange={(e) => handleChange('email', e.target.value)}
                            onBlur={() => handleBlur('email')}
                            disabled={disabled}
                            className={`pl-10 ${getError('email') ? 'border-red-500' : ''}`}
                        />
                    </div>
                    {getError('email') && (
                        <p className="text-sm text-red-500">{getError('email')}</p>
                    )}
                </div>

                {/* CPF e Telefone */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* CPF */}
                    <div className="space-y-2">
                        <Label htmlFor="cpf">CPF *</Label>
                        <div className="relative">
                            <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                id="cpf"
                                type="text"
                                placeholder="000.000.000-00"
                                value={data.cpf}
                                onChange={(e) => handleChange('cpf', e.target.value)}
                                onBlur={() => handleBlur('cpf')}
                                disabled={disabled}
                                maxLength={14}
                                className={`pl-10 ${getError('cpf') ? 'border-red-500' : ''}`}
                            />
                        </div>
                        {getError('cpf') && (
                            <p className="text-sm text-red-500">{getError('cpf')}</p>
                        )}
                    </div>

                    {/* Telefone */}
                    <div className="space-y-2">
                        <Label htmlFor="phone">Telefone *</Label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                id="phone"
                                type="tel"
                                placeholder="(11) 99999-9999"
                                value={data.phone}
                                onChange={(e) => handleChange('phone', e.target.value)}
                                onBlur={() => handleBlur('phone')}
                                disabled={disabled}
                                maxLength={15}
                                className={`pl-10 ${getError('phone') ? 'border-red-500' : ''}`}
                            />
                        </div>
                        {getError('phone') && (
                            <p className="text-sm text-red-500">{getError('phone')}</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
