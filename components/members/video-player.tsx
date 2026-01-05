'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
// Usando import default pois react-player/lazy falhou no build
import ReactPlayer from 'react-player'

interface VideoPlayerProps {
    url: string
    title: string
    onEnded?: () => void
}

export function VideoPlayer({ url, title, onEnded }: VideoPlayerProps) {
    const [isClient, setIsClient] = useState(false)
    const [playing, setPlaying] = useState(false)
    const [volume, setVolume] = useState(0.8)
    const [muted, setMuted] = useState(false)
    const [playbackRate, setPlaybackRate] = useState(1.0)
    const [played, setPlayed] = useState(0)
    const [duration, setDuration] = useState(0)
    const [seeking, setSeeking] = useState(false)
    const [showControls, setShowControls] = useState(true)
    const [isFullscreen, setIsFullscreen] = useState(false)
    const [isReady, setIsReady] = useState(false)
    const [hasError, setHasError] = useState(false)

    // Referências
    const playerRef = useRef<any>(null)
    const playerContainerRef = useRef<HTMLDivElement>(null)
    const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    useEffect(() => {
        setIsClient(true)
    }, [])

    const handleMouseMove = useCallback(() => {
        setShowControls(true)
        if (controlsTimeoutRef.current) {
            clearTimeout(controlsTimeoutRef.current)
        }
        if (playing) {
            controlsTimeoutRef.current = setTimeout(() => {
                setShowControls(false)
            }, 3000)
        }
    }, [playing])

    const handlePlayPause = () => {
        setPlaying(!playing)
        if (!playing) {
            setShowControls(true)
            if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current)
            controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000)
        } else {
            setShowControls(true)
            if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current)
        }
    }

    const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPlayed(parseFloat(e.target.value))
    }

    const handleSeekMouseDown = () => {
        setSeeking(true)
    }

    const handleSeekMouseUp = (e: React.MouseEvent<HTMLInputElement>) => {
        setSeeking(false)
        if (playerRef.current) {
            playerRef.current.seekTo(parseFloat((e.target as HTMLInputElement).value))
        }
    }

    const handleProgress = (state: any) => {
        if (!seeking) {
            setPlayed(state.played)
        }
    }

    const handleDuration = (dur: number) => {
        setDuration(dur)
    }

    const handleReady = () => {
        setIsReady(true)
        setHasError(false)
    }

    const formatTime = (seconds: number) => {
        const date = new Date(seconds * 1000)
        const hh = date.getUTCHours()
        const mm = date.getUTCMinutes()
        const ss = date.getUTCSeconds().toString().padStart(2, '0')
        if (hh) {
            return `${hh}:${mm.toString().padStart(2, '0')}:${ss}`
        }
        return `${mm}:${ss}`
    }

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            playerContainerRef.current?.requestFullscreen()
            setIsFullscreen(true)
        } else {
            document.exitFullscreen()
            setIsFullscreen(false)
        }
    }

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement)
        }
        document.addEventListener('fullscreenchange', handleFullscreenChange)
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }, [])

    // Renderização condicional para SSR
    if (!isClient) {
        return (
            <div className="aspect-video bg-zinc-900 animate-pulse rounded-lg flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
        )
    }

    // Se houve erro
    if (hasError) {
        return (
            <div className="aspect-video bg-zinc-900 rounded-lg flex flex-col items-center justify-center gap-4 border border-zinc-800">
                <div className="w-20 h-20 rounded-full bg-red-900/20 flex items-center justify-center">
                    <Play className="w-8 h-8 text-red-500" />
                </div>
                <div className="text-center px-4">
                    <p className="text-zinc-300 font-medium">Não foi possível carregar o vídeo</p>
                    <button
                        onClick={() => { setHasError(false); setIsReady(false); }}
                        className="mt-4 text-sm bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90"
                    >
                        Tentar novamente
                    </button>
                    <p className="text-zinc-600 text-xs mt-4">URL: {url}</p>
                </div>
            </div>
        )
    }

    return (
        <div
            ref={playerContainerRef}
            className="relative aspect-video bg-black group overflow-hidden rounded-lg shadow-xl"
            onMouseMove={handleMouseMove}
            onMouseLeave={() => playing && setShowControls(false)}
        >
            <ReactPlayer
                ref={playerRef}
                url={url}
                width="100%"
                height="100%"
                playing={playing}
                volume={volume}
                muted={muted}
                playbackRate={playbackRate}
                onEnded={onEnded}
                onProgress={handleProgress}
                onDuration={handleDuration}
                onReady={handleReady}
                onPlay={() => setPlaying(true)}
                onPause={() => setPlaying(false)}
                onError={(e: any) => {
                    console.error("ReactPlayer Error:", e);
                    setHasError(true);
                }}
                style={{ position: 'absolute', top: 0, left: 0 }}
                controls={false}
                config={{
                    youtube: {
                        playerVars: { showinfo: 0 }
                    }
                }}
            />

            {/* Loading Overlay */}
            {!isReady && !hasError && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-30 pointer-events-none">
                    <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                </div>
            )}

            {/* Click to Play/Pause overlay - apenas se estiver pronto */}
            {isReady && (
                <div
                    className="absolute inset-0 z-10 cursor-pointer"
                    onClick={handlePlayPause}
                />
            )}

            {/* Overlay Play Button (Central) */}
            {!playing && showControls && isReady && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-20 transition-opacity pointer-events-none">
                    <div className="p-5 rounded-full bg-primary/90 text-primary-foreground hover:scale-110 transition-transform shadow-2xl pointer-events-auto">
                        <Play className="w-12 h-12 ml-1 fill-current" />
                    </div>
                </div>
            )}

            {/* Controls Bar */}
            <div
                className={cn(
                    "absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent pt-16 pb-4 px-4 z-30 transition-all duration-300 flex flex-col gap-3",
                    showControls ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
                )}
            >
                {/* Progress Bar */}
                <div className="flex items-center gap-2 group/slider" onClick={(e) => e.stopPropagation()}>
                    <input
                        type="range"
                        min={0}
                        max={0.999999}
                        step="any"
                        value={played}
                        onMouseDown={handleSeekMouseDown}
                        onChange={handleSeekChange}
                        onMouseUp={handleSeekMouseUp}
                        className="w-full h-1.5 bg-white/30 rounded-full appearance-none cursor-pointer hover:h-2 transition-all [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-lg hover:[&::-webkit-slider-thumb]:scale-110"
                        style={{
                            backgroundSize: `${played * 100}% 100%`,
                            backgroundImage: `linear-gradient(to right, rgb(212, 175, 55) 0%, rgb(212, 175, 55) 100%)`,
                            backgroundRepeat: 'no-repeat'
                        }}
                    />
                </div>

                <div className="flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={handlePlayPause}
                            className="text-white hover:text-primary transition-colors p-1"
                        >
                            {playing ? (
                                <Pause className="w-6 h-6 fill-current" />
                            ) : (
                                <Play className="w-6 h-6 fill-current" />
                            )}
                        </button>

                        <div className="flex items-center gap-2 group/volume">
                            <button
                                onClick={() => setMuted(!muted)}
                                className="text-white hover:text-primary transition-colors p-1"
                            >
                                {muted || volume === 0 ? (
                                    <VolumeX className="w-5 h-5" />
                                ) : (
                                    <Volume2 className="w-5 h-5" />
                                )}
                            </button>
                            <input
                                type="range"
                                min={0}
                                max={1}
                                step="any"
                                value={muted ? 0 : volume}
                                onChange={e => {
                                    setVolume(parseFloat(e.target.value))
                                    setMuted(false)
                                }}
                                className="w-0 group-hover/volume:w-24 transition-all duration-300 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
                            />
                        </div>

                        <span className="text-sm text-white/90 font-mono tabular-nums">
                            {formatTime(duration * played)} / {formatTime(duration)}
                        </span>
                    </div>

                    <div className="flex items-center gap-3">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-white hover:text-primary hover:bg-white/10 h-8 px-3 min-w-[3.5rem] font-bold"
                                >
                                    {playbackRate}x
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-zinc-900/95 border-zinc-700 text-white backdrop-blur-sm">
                                <DropdownMenuLabel className="text-zinc-400">Velocidade</DropdownMenuLabel>
                                <DropdownMenuSeparator className="bg-zinc-700" />
                                <DropdownMenuRadioGroup
                                    value={playbackRate.toString()}
                                    onValueChange={(v) => setPlaybackRate(parseFloat(v))}
                                >
                                    {[0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0].map(rate => (
                                        <DropdownMenuRadioItem
                                            key={rate}
                                            value={rate.toString()}
                                            className="focus:bg-primary/30 cursor-pointer"
                                        >
                                            {rate}x {rate === 1.0 && <span className="text-zinc-400 ml-2">(Normal)</span>}
                                        </DropdownMenuRadioItem>
                                    ))}
                                </DropdownMenuRadioGroup>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <button
                            onClick={toggleFullscreen}
                            className="text-white hover:text-primary transition-colors p-1"
                        >
                            {isFullscreen ? (
                                <Minimize className="w-5 h-5" />
                            ) : (
                                <Maximize className="w-5 h-5" />
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Title Overlay (Top) */}
            <div className={cn(
                "absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/80 to-transparent transition-opacity duration-300 pointer-events-none z-20",
                showControls ? "opacity-100" : "opacity-0"
            )}>
                <h3 className="text-white font-medium text-lg drop-shadow-md line-clamp-1">{title}</h3>
            </div>
        </div>
    )
}
