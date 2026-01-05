'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BannerCarouselProps {
    images: string[]
    autoPlayMs?: number
    className?: string
}

export function BannerCarousel({
    images,
    autoPlayMs = 5000,
    className
}: BannerCarouselProps) {
    const [currentIndex, setCurrentIndex] = useState(0)

    const goToNext = useCallback(() => {
        setCurrentIndex((prev) => (prev + 1) % images.length)
    }, [images.length])

    const goToPrev = useCallback(() => {
        setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)
    }, [images.length])

    // Auto-play
    useEffect(() => {
        if (images.length <= 1 || !autoPlayMs) return

        const interval = setInterval(goToNext, autoPlayMs)
        return () => clearInterval(interval)
    }, [images.length, autoPlayMs, goToNext])

    if (images.length === 0) return null

    return (
        <div className={cn('relative rounded-xl overflow-hidden', className)}>
            {/* Images */}
            <div className="relative aspect-video">
                {images.map((src, index) => (
                    <div
                        key={src}
                        className={cn(
                            'absolute inset-0 transition-opacity duration-500',
                            index === currentIndex ? 'opacity-100' : 'opacity-0'
                        )}
                    >
                        <Image
                            src={src}
                            alt={`Banner ${index + 1}`}
                            fill
                            className="object-cover"
                            priority={index === 0}
                        />
                    </div>
                ))}
            </div>

            {/* Navigation arrows */}
            {images.length > 1 && (
                <>
                    <button
                        onClick={goToPrev}
                        className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-colors"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button
                        onClick={goToNext}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-colors"
                    >
                        <ChevronRight className="w-6 h-6" />
                    </button>
                </>
            )}

            {/* Dots indicator */}
            {images.length > 1 && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
                    {images.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => setCurrentIndex(index)}
                            className={cn(
                                'w-2 h-2 rounded-full transition-all',
                                index === currentIndex
                                    ? 'w-6 bg-white'
                                    : 'bg-white/50 hover:bg-white/70'
                            )}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}
