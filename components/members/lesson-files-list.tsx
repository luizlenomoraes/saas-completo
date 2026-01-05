'use client'

import { Download, FileText, FileImage, FileVideo, FileAudio, File } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface LessonFile {
    id: string
    nome_original: string
    tipo_mime: string | null
    tamanho_bytes: number | null
}

interface LessonFilesListProps {
    files: LessonFile[]
}

function getFileIcon(mimeType: string | null) {
    if (!mimeType) return <File className="w-5 h-5" />

    if (mimeType.startsWith('image/')) return <FileImage className="w-5 h-5 text-purple-600" />
    if (mimeType.startsWith('video/')) return <FileVideo className="w-5 h-5 text-red-600" />
    if (mimeType.startsWith('audio/')) return <FileAudio className="w-5 h-5 text-orange-600" />
    if (mimeType.includes('pdf')) return <FileText className="w-5 h-5 text-red-500" />
    if (mimeType.includes('document') || mimeType.includes('word')) return <FileText className="w-5 h-5 text-blue-600" />
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return <FileText className="w-5 h-5 text-green-600" />

    return <File className="w-5 h-5 text-gray-500" />
}

function formatFileSize(bytes: number | null): string {
    if (!bytes) return ''

    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
}

export function LessonFilesList({ files }: LessonFilesListProps) {
    if (!files || files.length === 0) {
        return (
            <div className="text-sm text-muted-foreground italic">
                Nenhum arquivo anexado a esta aula.
            </div>
        )
    }

    return (
        <div className="space-y-2">
            {files.map((file) => (
                <div
                    key={file.id}
                    className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border hover:border-primary/50 transition-colors"
                >
                    <div className="flex items-center gap-3">
                        {getFileIcon(file.tipo_mime)}
                        <div>
                            <p className="text-sm font-medium line-clamp-1">{file.nome_original}</p>
                            {file.tamanho_bytes && (
                                <p className="text-xs text-muted-foreground">
                                    {formatFileSize(file.tamanho_bytes)}
                                </p>
                            )}
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        asChild
                    >
                        <a href={`/api/members/files/${file.id}`} download>
                            <Download className="w-4 h-4 mr-2" />
                            Baixar
                        </a>
                    </Button>
                </div>
            ))}
        </div>
    )
}
