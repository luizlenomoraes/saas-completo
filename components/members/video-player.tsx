'use client'

import { useState, useEffect } from 'react'
import { Play } from 'lucide-react'
import dynamic from 'next/dynamic'

// CORREÇÃO: Usar o import raiz para garantir compatibilidade de Tipos
const ReactPlayer = dynamic(() => import('react-player'), { ssr: false })

interface VideoPlayerProps {
    url: string
    title: string
    onEnded?: () => void
    watermarkText?: string
}

export function VideoPlayer({ url, title, onEnded, watermarkText }: VideoPlayerProps) {
    const [hasWindow, setHasWindow] = useState(false)
    const [playing, setPlaying] = useState(false)
    const [watermarkPos, setWatermarkPos] = useState({ top: '10%', left: '10%' })

    useEffect(() => {
        setHasWindow(true)
        const interval = setInterval(() => {
            const randomTop = Math.floor(Math.random() * 80) + 10
            const randomLeft = Math.floor(Math.random() * 80) + 10
            setWatermarkPos({ top: `${randomTop}%`, left: `${randomLeft}%` })
        }, 5000)
        return () => clearInterval(interval)
    }, [])

    if (!hasWindow) {
        return <div className="aspect-video bg-zinc-900 rounded-lg animate-pulse" />
    }

    // Componente do Overlay para reutilização
    const CustomOverlay = (
        <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center z-10 cursor-pointer group">
            <div className="p-6 rounded-full bg-[#D4AF37]/90 text-black shadow-2xl transform transition-transform group-hover:scale-110">
                <Play className="w-8 h-8 fill-current ml-1" />
            </div>
            <h3 className="mt-4 text-white font-medium text-lg drop-shadow-md">{title}</h3>
        </div>
    )

    return (
        <div className="relative aspect-video bg-black rounded-lg overflow-hidden shadow-2xl border border-zinc-800">
            <ReactPlayer
                url={url}
                width="100%"
                height="100%"
                playing={playing}
                controls={true}
                light={true}
                playIcon={CustomOverlay}
                onPlay={() => setPlaying(true)}
                onPause={() => setPlaying(false)}
                onEnded={() => {
                    setPlaying(false)
                    if (onEnded) onEnded()
                }}
                config={{
                    youtube: {
                        // CORREÇÃO AQUI: Adicionado 'as any' para silenciar o erro de tipagem
                        playerVars: {
                            showinfo: 0,
                            modestbranding: 1,
                            rel: 0,
                            playsinline: 1,
                            origin: typeof window !== 'undefined' ? window.location.origin : undefined
                        }
                    } as any
                }}
            />

            {watermarkText && playing && (
                <div
                    className="absolute text-white/30 text-[10px] pointer-events-none select-none font-mono z-40 whitespace-nowrap"
                    style={{
                        top: watermarkPos.top,
                        left: watermarkPos.left,
                        textShadow: '0 0 2px rgba(0,0,0,0.5)'
                    }}
                >
                    {watermarkText} - {new Date().toLocaleDateString()}
                </div>
            )}
        </div>
    )
}