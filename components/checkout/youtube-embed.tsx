'use client'

import { cn } from '@/lib/utils'

interface YouTubeEmbedProps {
    videoId: string
    title?: string
    className?: string
    autoplay?: boolean
}

export function YouTubeEmbed({
    videoId,
    title = 'Video',
    className,
    autoplay = false
}: YouTubeEmbedProps) {
    if (!videoId) return null

    // Limpar videoId se vier com URL completa
    const cleanVideoId = videoId.includes('youtube.com')
        ? new URL(videoId).searchParams.get('v') || videoId
        : videoId.includes('youtu.be')
            ? videoId.split('/').pop()?.split('?')[0] || videoId
            : videoId

    const params = new URLSearchParams({
        rel: '0',
        modestbranding: '1',
        ...(autoplay && { autoplay: '1', mute: '1' }),
    })

    return (
        <div className={cn('relative aspect-video rounded-xl overflow-hidden shadow-lg', className)}>
            <iframe
                src={`https://www.youtube.com/embed/${cleanVideoId}?${params.toString()}`}
                title={title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 w-full h-full"
            />
        </div>
    )
}
