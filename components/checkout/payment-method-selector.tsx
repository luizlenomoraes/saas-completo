'use client'

import { CreditCard, QrCode, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'

export type PaymentMethod = 'pix' | 'credit_card' | 'boleto'

interface PaymentMethodSelectorProps {
    selected: PaymentMethod | null
    onChange: (method: PaymentMethod) => void
    availableMethods: PaymentMethod[]
    disabled?: boolean
}

const methodConfig: Record<PaymentMethod, { icon: React.ReactNode; label: string; description: string }> = {
    pix: {
        icon: <QrCode className="w-6 h-6" />,
        label: 'Pix',
        description: 'Pagamento instantâneo',
    },
    credit_card: {
        icon: <CreditCard className="w-6 h-6" />,
        label: 'Cartão de Crédito',
        description: 'Parcele em até 12x',
    },
    boleto: {
        icon: <FileText className="w-6 h-6" />,
        label: 'Boleto',
        description: 'Vencimento em 3 dias',
    },
}

export function PaymentMethodSelector({
    selected,
    onChange,
    availableMethods,
    disabled = false,
}: PaymentMethodSelectorProps) {
    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Forma de Pagamento
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {availableMethods.map((method) => {
                    const config = methodConfig[method]
                    const isSelected = selected === method

                    return (
                        <button
                            key={method}
                            type="button"
                            onClick={() => onChange(method)}
                            disabled={disabled}
                            className={cn(
                                'relative flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-200',
                                'hover:border-green-400 hover:bg-green-50 dark:hover:bg-green-950/20',
                                'focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2',
                                isSelected
                                    ? 'border-green-500 bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400'
                                    : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400',
                                disabled && 'opacity-50 cursor-not-allowed'
                            )}
                        >
                            {/* Indicador de seleção */}
                            {isSelected && (
                                <div className="absolute top-2 right-2 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                                    <svg
                                        className="w-3 h-3 text-white"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={3}
                                            d="M5 13l4 4L19 7"
                                        />
                                    </svg>
                                </div>
                            )}

                            {/* Ícone */}
                            <div
                                className={cn(
                                    'w-12 h-12 rounded-full flex items-center justify-center mb-2',
                                    isSelected
                                        ? 'bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400'
                                        : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                                )}
                            >
                                {config.icon}
                            </div>

                            {/* Label */}
                            <span
                                className={cn(
                                    'font-semibold text-sm',
                                    isSelected
                                        ? 'text-green-700 dark:text-green-400'
                                        : 'text-gray-700 dark:text-gray-300'
                                )}
                            >
                                {config.label}
                            </span>

                            {/* Description */}
                            <span className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                {config.description}
                            </span>

                            {/* Badge para Pix */}
                            {method === 'pix' && (
                                <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-green-500 text-white text-[10px] font-bold rounded-full uppercase tracking-wide">
                                    Mais rápido
                                </span>
                            )}
                        </button>
                    )
                })}
            </div>

            {/* Mensagem informativa */}
            {selected === 'pix' && (
                <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-400 text-sm">
                    <QrCode className="w-4 h-4 flex-shrink-0" />
                    <span>Após confirmar, você receberá um QR Code para pagamento instantâneo.</span>
                </div>
            )}

            {selected === 'credit_card' && (
                <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg text-blue-700 dark:text-blue-400 text-sm">
                    <CreditCard className="w-4 h-4 flex-shrink-0" />
                    <span>Seus dados são criptografados e processados com segurança.</span>
                </div>
            )}

            {selected === 'boleto' && (
                <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg text-yellow-700 dark:text-yellow-400 text-sm">
                    <FileText className="w-4 h-4 flex-shrink-0" />
                    <span>O boleto vence em 3 dias úteis. Acesso liberado após compensação.</span>
                </div>
            )}
        </div>
    )
}
