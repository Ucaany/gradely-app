'use client'

import { useState } from 'react'
import { ExternalLink, Play } from 'lucide-react'

interface LinkPreviewProps {
  url: string
  label: string
}

function getYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ]
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  return null
}

function getInstagramPostId(url: string): string | null {
  const match = url.match(/instagram\.com\/(?:p|reel|tv)\/([A-Za-z0-9_-]+)/)
  return match ? match[1] : null
}

function isInstagram(url: string): boolean {
  return /instagram\.com/.test(url)
}

export function LinkPreview({ url, label }: LinkPreviewProps) {
  const [showEmbed, setShowEmbed] = useState(false)

  const youtubeId = getYouTubeId(url)
  const instagramPostId = getInstagramPostId(url)
  const isIG = isInstagram(url)

  if (youtubeId) {
    return (
      <div className="w-full rounded-md overflow-hidden border bg-muted/30">
        {!showEmbed ? (
          <button
            type="button"
            onClick={() => setShowEmbed(true)}
            className="relative w-full group"
          >
            <img
              src={`https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`}
              alt={label}
              className="w-full object-cover aspect-video"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors">
              <div className="bg-red-600 rounded-full p-3 shadow-lg">
                <Play className="h-5 w-5 text-white fill-white" />
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 px-3 py-2">
              <p className="text-xs text-white truncate">{label}</p>
            </div>
          </button>
        ) : (
          <div className="aspect-video">
            <iframe
              src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1`}
              title={label}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            />
          </div>
        )}
        <div className="px-3 py-1.5 flex items-center justify-between">
          <span className="text-xs text-muted-foreground truncate">{label}</span>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary hover:underline flex items-center gap-1 shrink-0 ml-2"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink className="h-3 w-3" />
            Buka
          </a>
        </div>
      </div>
    )
  }

  if (isIG && instagramPostId) {
    return (
      <div className="w-full rounded-md overflow-hidden border bg-muted/30">
        <div className="aspect-square w-full max-h-[480px]">
          <iframe
            src={`https://www.instagram.com/p/${instagramPostId}/embed/`}
            title={label}
            allowFullScreen
            scrolling="no"
            className="w-full h-full"
            style={{ minHeight: 420 }}
          />
        </div>
        <div className="px-3 py-1.5 flex items-center justify-between">
          <span className="text-xs text-muted-foreground truncate">{label}</span>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary hover:underline flex items-center gap-1 shrink-0 ml-2"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink className="h-3 w-3" />
            Buka
          </a>
        </div>
      </div>
    )
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
      onClick={(e) => e.stopPropagation()}
    >
      <ExternalLink className="h-3 w-3" />
      {label}
    </a>
  )
}
