'use client'

import Image from 'next/image'
import { ShoppingCart, Tag, Minus } from 'lucide-react'
import { formatCurrency, cn } from '@/lib/utils'

interface Product {
    id: string
    name: string
    description?: string | null
    price: number
    previousPrice?: number | null
    image?: string | null
}

interface OrderBump {
    id: string
    headline: string
    description?: string | null
    product: Product
}

interface OrderSummaryProps {
    mainProduct: Product
    orderBumps: OrderBump[]
    selectedBumps: string[]
    onToggleBump: (bumpId: string) => void
    disabled?: boolean
}

export function OrderSummary({
    mainProduct,
    orderBumps,
    selectedBumps,
    onToggleBump,
    disabled = false,
}: OrderSummaryProps) {
    // Calcular totais
    const mainProductPrice = mainProduct.price
    const bumpsTotal = orderBumps
        .filter((bump) => selectedBumps.includes(bump.id))
        .reduce((sum, bump) => sum + bump.product.price, 0)
    const totalPrice = mainProductPrice + bumpsTotal

    const discount = mainProduct.previousPrice
        ? mainProduct.previousPrice - mainProduct.price
        : 0

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                Resumo do Pedido
            </h3>

            {/* Produto Principal */}
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                <div className="flex gap-4">
                    {mainProduct.image && (
                        <div className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden">
                            <Image
                                src={mainProduct.image}
                                alt={mainProduct.name}
                                fill
                                className="object-cover"
                            />
                        </div>
                    )}
                    <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                            {mainProduct.name}
                        </h4>
                        {mainProduct.description && (
                            <p className="text-sm text-gray-500 line-clamp-2 mt-1">
                                {mainProduct.description}
                            </p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                            {mainProduct.previousPrice && (
                                <span className="text-sm text-gray-400 line-through">
                                    {formatCurrency(mainProduct.previousPrice)}
                                </span>
                            )}
                            <span className="font-bold text-lg text-green-600">
                                {formatCurrency(mainProduct.price)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Order Bumps */}
            {orderBumps.length > 0 && (
                <div className="space-y-3">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Ofertas Especiais
                    </p>
                    {orderBumps.map((bump) => {
                        const isSelected = selectedBumps.includes(bump.id)
                        return (
                            <button
                                key={bump.id}
                                type="button"
                                onClick={() => onToggleBump(bump.id)}
                                disabled={disabled}
                                className={cn(
                                    'w-full p-4 rounded-xl border-2 text-left transition-all duration-200',
                                    'hover:shadow-md',
                                    isSelected
                                        ? 'border-green-500 bg-green-50 dark:bg-green-950/20'
                                        : 'border-dashed border-gray-300 dark:border-gray-600 hover:border-green-400',
                                    disabled && 'opacity-50 cursor-not-allowed'
                                )}
                            >
                                {/* Checkbox visual */}
                                <div className="flex items-start gap-3">
                                    <div
                                        className={cn(
                                            'w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5',
                                            isSelected
                                                ? 'bg-green-500 border-green-500'
                                                : 'border-gray-300 dark:border-gray-600'
                                        )}
                                    >
                                        {isSelected && (
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
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-green-600 dark:text-green-400 flex items-center gap-2">
                                            <Tag className="w-4 h-4" />
                                            {bump.headline}
                                        </p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                            {bump.product.name}
                                        </p>
                                        {bump.description && (
                                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                                {bump.description}
                                            </p>
                                        )}
                                        <div className="flex items-center gap-2 mt-2">
                                            {bump.product.previousPrice && (
                                                <span className="text-xs text-gray-400 line-through">
                                                    {formatCurrency(bump.product.previousPrice)}
                                                </span>
                                            )}
                                            <span className="font-bold text-green-600">
                                                + {formatCurrency(bump.product.price)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </button>
                        )
                    })}
                </div>
            )}

            {/* Totais */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-2">
                {/* Subtotal */}
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                    <span>Subtotal</span>
                    <span>{formatCurrency(mainProductPrice + (mainProduct.previousPrice ? discount : 0))}</span>
                </div>

                {/* Desconto */}
                {discount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                        <span className="flex items-center gap-1">
                            <Minus className="w-3 h-3" />
                            Desconto
                        </span>
                        <span>- {formatCurrency(discount)}</span>
                    </div>
                )}

                {/* Bumps */}
                {bumpsTotal > 0 && (
                    <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                        <span>Ofertas adicionais</span>
                        <span>+ {formatCurrency(bumpsTotal)}</span>
                    </div>
                )}

                {/* Total */}
                <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-700">
                    <span className="text-lg font-bold text-gray-900 dark:text-white">Total</span>
                    <span className="text-2xl font-bold text-green-600">
                        {formatCurrency(totalPrice)}
                    </span>
                </div>
            </div>
        </div>
    )
}
