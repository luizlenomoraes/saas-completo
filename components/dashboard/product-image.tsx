'use client'

import { useState } from 'react'
import { Package } from 'lucide-react'

interface ProductImageProps {
    src: string | null
    alt: string
}

export function ProductImage({ src, alt }: ProductImageProps) {
    const [imageError, setImageError] = useState(false)

    // Show image if we have a source and no error
    const showImage = src && !imageError

    return (
        <>
            {showImage && (
                <img
                    src={src}
                    alt={alt}
                    className="w-full h-full object-cover"
                    onError={() => setImageError(true)}
                />
            )}

            {/* Show fallback icon if no image or error */}
            {(!showImage) && (
                <div className="absolute inset-0 flex items-center justify-center bg-zinc-100 dark:bg-zinc-800">
                    <Package className="w-12 h-12 text-primary/30" />
                </div>
            )}
        </>
    )
}
