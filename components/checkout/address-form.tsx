'use client'

import { useState, useCallback, useEffect } from 'react'
import { MapPin, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatCEP, fetchAddressByCEP } from '@/lib/utils'

export interface AddressData {
    cep: string
    street: string
    number: string
    complement: string
    neighborhood: string
    city: string
    state: string
}

interface AddressFormProps {
    data: AddressData
    onChange: (data: AddressData) => void
    errors?: Partial<Record<keyof AddressData, string>>
    disabled?: boolean
    required?: boolean
}

export function AddressForm({
    data,
    onChange,
    errors = {},
    disabled = false,
    required = false
}: AddressFormProps) {
    const [isLoadingCep, setIsLoadingCep] = useState(false)
    const [cepError, setCepError] = useState<string | null>(null)

    const handleChange = useCallback((field: keyof AddressData, value: string) => {
        let formattedValue = value

        if (field === 'cep') {
            formattedValue = formatCEP(value)
        } else if (field === 'state') {
            formattedValue = value.toUpperCase().slice(0, 2)
        }

        onChange({ ...data, [field]: formattedValue })
    }, [data, onChange])

    // Buscar endereço automaticamente quando CEP tiver 9 caracteres (00000-000)
    useEffect(() => {
        const cepDigits = data.cep.replace(/\D/g, '')

        if (cepDigits.length === 8) {
            setIsLoadingCep(true)
            setCepError(null)

            fetchAddressByCEP(cepDigits)
                .then((address) => {
                    if (address) {
                        onChange({
                            ...data,
                            street: address.logradouro || data.street,
                            neighborhood: address.bairro || data.neighborhood,
                            city: address.localidade || data.city,
                            state: address.uf || data.state,
                            complement: address.complemento || data.complement,
                        })
                    } else {
                        setCepError('CEP não encontrado')
                    }
                })
                .catch(() => {
                    setCepError('Erro ao buscar CEP')
                })
                .finally(() => {
                    setIsLoadingCep(false)
                })
        }
    }, [data.cep])

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Endereço de Entrega
                {!required && <span className="text-sm font-normal text-gray-500">(opcional)</span>}
            </h3>

            <div className="grid gap-4">
                {/* CEP */}
                <div className="space-y-2">
                    <Label htmlFor="cep">CEP {required && '*'}</Label>
                    <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            id="cep"
                            type="text"
                            placeholder="00000-000"
                            value={data.cep}
                            onChange={(e) => handleChange('cep', e.target.value)}
                            disabled={disabled}
                            maxLength={9}
                            className={`pl-10 ${cepError || errors.cep ? 'border-red-500' : ''}`}
                        />
                        {isLoadingCep && (
                            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
                        )}
                    </div>
                    {(cepError || errors.cep) && (
                        <p className="text-sm text-red-500">{cepError || errors.cep}</p>
                    )}
                </div>

                {/* Logradouro e Número */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2 space-y-2">
                        <Label htmlFor="street">Logradouro {required && '*'}</Label>
                        <Input
                            id="street"
                            type="text"
                            placeholder="Rua, Avenida, etc."
                            value={data.street}
                            onChange={(e) => handleChange('street', e.target.value)}
                            disabled={disabled || isLoadingCep}
                            className={errors.street ? 'border-red-500' : ''}
                        />
                        {errors.street && (
                            <p className="text-sm text-red-500">{errors.street}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="number">Número {required && '*'}</Label>
                        <Input
                            id="number"
                            type="text"
                            placeholder="123"
                            value={data.number}
                            onChange={(e) => handleChange('number', e.target.value)}
                            disabled={disabled}
                            className={errors.number ? 'border-red-500' : ''}
                        />
                        {errors.number && (
                            <p className="text-sm text-red-500">{errors.number}</p>
                        )}
                    </div>
                </div>

                {/* Complemento e Bairro */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="complement">Complemento</Label>
                        <Input
                            id="complement"
                            type="text"
                            placeholder="Apto, Bloco, etc."
                            value={data.complement}
                            onChange={(e) => handleChange('complement', e.target.value)}
                            disabled={disabled}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="neighborhood">Bairro {required && '*'}</Label>
                        <Input
                            id="neighborhood"
                            type="text"
                            placeholder="Bairro"
                            value={data.neighborhood}
                            onChange={(e) => handleChange('neighborhood', e.target.value)}
                            disabled={disabled || isLoadingCep}
                            className={errors.neighborhood ? 'border-red-500' : ''}
                        />
                        {errors.neighborhood && (
                            <p className="text-sm text-red-500">{errors.neighborhood}</p>
                        )}
                    </div>
                </div>

                {/* Cidade e Estado */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2 space-y-2">
                        <Label htmlFor="city">Cidade {required && '*'}</Label>
                        <Input
                            id="city"
                            type="text"
                            placeholder="Cidade"
                            value={data.city}
                            onChange={(e) => handleChange('city', e.target.value)}
                            disabled={disabled || isLoadingCep}
                            className={errors.city ? 'border-red-500' : ''}
                        />
                        {errors.city && (
                            <p className="text-sm text-red-500">{errors.city}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="state">Estado {required && '*'}</Label>
                        <Input
                            id="state"
                            type="text"
                            placeholder="SP"
                            value={data.state}
                            onChange={(e) => handleChange('state', e.target.value)}
                            disabled={disabled || isLoadingCep}
                            maxLength={2}
                            className={errors.state ? 'border-red-500' : ''}
                        />
                        {errors.state && (
                            <p className="text-sm text-red-500">{errors.state}</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
