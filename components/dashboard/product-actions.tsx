'use client'

import { Button } from '@/components/ui/button'
import { Edit, Copy, ExternalLink, MoreHorizontal } from 'lucide-react'
import Link from 'next/link'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'

interface ProductActionsProps {
    productId: string
    checkoutHash: string
}

export function ProductActions({ productId, checkoutHash }: ProductActionsProps) {
    const handleCopyLink = () => {
        const link = `${window.location.origin}/checkout/${checkoutHash}`
        navigator.clipboard.writeText(link)
        toast.success('Link copiado!')
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                    <Link href={`/dashboard/products/${productId}`}>
                        <Edit className="w-4 h-4 mr-2" />
                        Editar
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleCopyLink}>
                    <Copy className="w-4 h-4 mr-2" />
                    Copiar Link
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link href={`/checkout/${checkoutHash}`} target="_blank">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Ver Checkout
                    </Link>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
