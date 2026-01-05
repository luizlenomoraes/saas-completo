'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { CheckCircle, Circle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LessonCompleteButtonProps {
    aulaId: string
    isCompleted: boolean
    onComplete?: (completed: boolean) => void
}

export function LessonCompleteButton({ aulaId, isCompleted: initialCompleted, onComplete }: LessonCompleteButtonProps) {
    const [isCompleted, setIsCompleted] = useState(initialCompleted)
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()

    async function toggleComplete() {
        setIsLoading(true)

        try {
            if (isCompleted) {
                // Remover progresso
                const res = await fetch(`/api/members/progress?aulaId=${aulaId}`, {
                    method: 'DELETE'
                })
                if (res.ok) {
                    setIsCompleted(false)
                    onComplete?.(false)
                    // Atualizar a página para refletir a mudança no sidebar
                    router.refresh()
                }
            } else {
                // Marcar como concluída
                const res = await fetch('/api/members/progress', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ aulaId })
                })
                if (res.ok) {
                    setIsCompleted(true)
                    onComplete?.(true)
                    // Atualizar a página para refletir a mudança no sidebar
                    router.refresh()
                }
            }
        } catch (error) {
            console.error('Erro ao atualizar progresso:', error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Button
            variant={isCompleted ? "default" : "outline"}
            size="sm"
            onClick={toggleComplete}
            disabled={isLoading}
            className={cn(
                "transition-all gap-2",
                isCompleted && "bg-green-600 hover:bg-green-700 text-white"
            )}
        >
            {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
            ) : isCompleted ? (
                <CheckCircle className="w-4 h-4" />
            ) : (
                <Circle className="w-4 h-4" />
            )}
            {isCompleted ? 'Concluída' : 'Marcar como Concluída'}
        </Button>
    )
}
