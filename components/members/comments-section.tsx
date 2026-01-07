'use client'

import { useState, useEffect } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Send, MessageCircle, Reply, ShieldCheck, Image as ImageIcon, X } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'

interface Comment {
    id: string
    texto: string
    created_at: string
    aluno_nome: string | null
    aluno_email: string | null
    usuario_id: string | null
    imagem_url: string | null
    usuario?: {
        nome: string
        foto_perfil: string
        tipo: string
    }
    respostas?: Comment[]
}

interface CommentsSectionProps {
    aulaId: string
    currentUserEmail?: string
}

export function CommentsSection({ aulaId, currentUserEmail }: CommentsSectionProps) {
    const [comments, setComments] = useState<Comment[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [newComment, setNewComment] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [replyTo, setReplyTo] = useState<string | null>(null)
    const [replyText, setReplyText] = useState('')
    const [imageUrl, setImageUrl] = useState<string | null>(null) // Para upload de imagem
    const [showUpload, setShowUpload] = useState(false)

    useEffect(() => {
        loadComments()
    }, [aulaId])

    async function loadComments() {
        try {
            const res = await fetch(`/api/members/comments?aulaId=${aulaId}`)
            const data = await res.json()
            setComments(data)
        } catch (error) {
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }

    async function handleSubmit(parentId: string | null = null) {
        const text = parentId ? replyText : newComment
        if (!text.trim()) return

        setIsSubmitting(true)
        try {
            const res = await fetch('/api/members/comments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    aulaId,
                    texto: text,
                    parentId,
                    imagemUrl: parentId ? null : imageUrl // Simples: só permite imagem no comentário raiz por enquanto
                })
            })

            if (!res.ok) throw new Error()

            setNewComment('')
            setReplyText('')
            setReplyTo(null)
            setImageUrl(null)
            setShowUpload(false)
            toast.success('Comentário enviado!')
            loadComments()
        } catch (error) {
            toast.error('Erro ao enviar comentário')
        } finally {
            setIsSubmitting(false)
        }
    }

    // Componente de Renderização de Um Comentário
    const CommentItem = ({ comment, isReply = false }: { comment: Comment, isReply?: boolean }) => {
        const isProducer = !!comment.usuario_id
        const initials = (comment.usuario?.nome || comment.aluno_nome || 'A').substring(0, 2).toUpperCase()

        return (
            <div className={`flex gap-4 ${isReply ? 'ml-12 mt-4 border-l-2 border-white/5 pl-4' : 'mt-6'}`}>
                <Avatar className={`h-10 w-10 border-2 ${isProducer ? 'border-[#D4AF37]' : 'border-white/10'}`}>
                    <AvatarImage src={comment.usuario?.foto_perfil || ''} />
                    <AvatarFallback className={isProducer ? 'bg-[#D4AF37] text-black font-bold' : 'bg-white/10 text-zinc-400'}>
                        {initials}
                    </AvatarFallback>
                </Avatar>

                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <span className={`font-semibold text-sm ${isProducer ? 'text-[#D4AF37]' : 'text-white'}`}>
                            {comment.usuario?.nome || comment.aluno_nome || 'Usuário'}
                        </span>
                        {isProducer && (
                            <span className="flex items-center gap-1 bg-[#D4AF37]/10 text-[#D4AF37] text-[10px] px-1.5 py-0.5 rounded border border-[#D4AF37]/20">
                                <ShieldCheck className="w-3 h-3" /> EQUIPE
                            </span>
                        )}
                        <span className="text-xs text-zinc-500">
                            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: ptBR })}
                        </span>
                    </div>

                    <div className="bg-white/5 p-3 rounded-tr-xl rounded-br-xl rounded-bl-xl border border-white/5 text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">
                        {comment.texto}

                        {comment.imagem_url && (
                            <div className="mt-3">
                                <img
                                    src={comment.imagem_url}
                                    alt="Anexo"
                                    className="max-w-xs rounded-lg border border-white/10 cursor-pointer hover:opacity-90 transition-opacity"
                                    onClick={() => window.open(comment.imagem_url!, '_blank')}
                                />
                            </div>
                        )}
                    </div>

                    {!isReply && (
                        <div className="mt-2 flex items-center gap-4">
                            <button
                                onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
                                className="text-xs text-zinc-500 hover:text-[#D4AF37] flex items-center gap-1 transition-colors"
                            >
                                <Reply className="w-3 h-3" /> Responder
                            </button>
                        </div>
                    )}

                    {/* Formulário de Resposta */}
                    {replyTo === comment.id && (
                        <div className="mt-3 flex gap-3 animate-fade-in">
                            <Textarea
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                placeholder="Escreva sua resposta..."
                                className="min-h-[60px] bg-black/30 border-white/10 text-white focus:border-[#D4AF37]/50"
                            />
                            <Button
                                size="icon"
                                onClick={() => handleSubmit(comment.id)}
                                disabled={isSubmitting}
                                className="bg-[#D4AF37] text-black hover:bg-[#B5952F] h-auto"
                            >
                                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            </Button>
                        </div>
                    )}

                    {/* Renderizar Respostas Recursivamente */}
                    {comment.respostas?.map(resposta => (
                        <CommentItem key={resposta.id} comment={resposta} isReply={true} />
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="mt-12 max-w-4xl mx-auto">
            <div className="flex items-center gap-2 mb-6 border-b border-white/5 pb-4">
                <MessageCircle className="w-5 h-5 text-[#D4AF37]" />
                <h3 className="text-xl font-bold text-white">Comunidade da Aula</h3>
                <span className="text-sm text-zinc-500 ml-2">({comments.length} interações)</span>
            </div>

            {/* Input Principal */}
            <div className="glass-panel p-4 rounded-xl border border-white/5 mb-10">
                <div className="flex gap-4">
                    <Avatar className="h-10 w-10 border border-white/10">
                        <AvatarFallback className="bg-white/5 text-zinc-400">EU</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-3">
                        <Textarea
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Tem alguma dúvida ou resultado para compartilhar?"
                            className="min-h-[80px] bg-black/20 border-white/10 text-white placeholder:text-zinc-600 focus:border-[#D4AF37]/50 focus:ring-0"
                        />

                        {/* Preview da Imagem */}
                        {imageUrl && (
                            <div className="relative inline-block">
                                <img src={imageUrl} alt="Preview" className="h-20 w-20 object-cover rounded-lg border border-white/10" />
                                <button
                                    onClick={() => setImageUrl(null)}
                                    className="absolute -top-2 -right-2 bg-red-500 rounded-full p-0.5 text-white hover:bg-red-600"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        )}

                        <div className="flex justify-between items-center">
                            <div className="flex gap-2">
                                {/* Botão Fake de Upload para Demo - Você deve integrar com seu ImageUpload real */}
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="text-zinc-400 hover:text-white hover:bg-white/5 gap-2"
                                    onClick={() => {
                                        const url = prompt("Cole a URL da imagem (Simulação de Upload):")
                                        if (url) setImageUrl(url)
                                    }}
                                >
                                    <ImageIcon className="w-4 h-4" />
                                    <span className="text-xs">Adicionar Imagem</span>
                                </Button>
                            </div>
                            <Button
                                onClick={() => handleSubmit(null)}
                                disabled={isSubmitting || !newComment.trim()}
                                className="bg-[#D4AF37] text-black hover:bg-[#B5952F] font-bold"
                            >
                                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : 'Publicar Comentário'}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Lista de Comentários */}
            {isLoading ? (
                <div className="flex justify-center py-10">
                    <Loader2 className="w-8 h-8 animate-spin text-[#D4AF37]" />
                </div>
            ) : comments.length === 0 ? (
                <div className="text-center py-10 text-zinc-600">
                    <p>Seja o primeiro a comentar nesta aula!</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {comments.map(comment => (
                        <CommentItem key={comment.id} comment={comment} />
                    ))}
                </div>
            )}
        </div>
    )
}
