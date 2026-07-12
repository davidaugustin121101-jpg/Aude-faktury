export type LandingDemoVideoProvider = 'youtube' | 'vimeo' | 'file'

export type LandingDemoVideo = {
  provider: LandingDemoVideoProvider
  /** YouTube/Vimeo ID nebo cesta k souboru v /public */
  src: string
  mimeType?: string
  title: string
  description: string
  /** Volitelný poster pro self-hosted video */
  poster?: string
  /** Autoplay ve smyčce (self-hosted) */
  loop?: boolean
}

const DEFAULT_TITLE = 'Jak funguje Faktury Audeflow'
const DEFAULT_DESCRIPTION =
  'Od nahrání PDF přes vytěžení a předkontaci až po odeslání do iDokladu, Fakturoidu nebo export do Pohody.'

/** Výchozí ukázka na landingu — /public/videos/demo.mov */
export const DEFAULT_LANDING_DEMO_VIDEO_SRC = '/videos/demo.mov'

/** Nastavte NEXT_PUBLIC_LANDING_DEMO_VIDEO_URL pro override (YouTube/Vimeo/MP4). */
export function getLandingDemoVideo(): LandingDemoVideo | null {
  const raw =
    process.env.NEXT_PUBLIC_LANDING_DEMO_VIDEO_URL?.trim() || DEFAULT_LANDING_DEMO_VIDEO_SRC

  const youtubeId = parseYouTubeId(raw)
  if (youtubeId) {
    return {
      provider: 'youtube',
      src: youtubeId,
      title: DEFAULT_TITLE,
      description: DEFAULT_DESCRIPTION,
    }
  }

  const vimeoId = parseVimeoId(raw)
  if (vimeoId) {
    return {
      provider: 'vimeo',
      src: vimeoId,
      title: DEFAULT_TITLE,
      description: DEFAULT_DESCRIPTION,
    }
  }

  if (raw.startsWith('/') || /\.(mp4|webm|mov)$/i.test(raw)) {
    const src = raw.startsWith('/') ? raw : `/${raw}`
    return {
      provider: 'file',
      src,
      mimeType: mimeTypeForPath(src),
      title: DEFAULT_TITLE,
      description: DEFAULT_DESCRIPTION,
      poster: process.env.NEXT_PUBLIC_LANDING_DEMO_VIDEO_POSTER?.trim() || undefined,
      loop: false,
    }
  }

  return null
}

function mimeTypeForPath(path: string): string {
  if (path.endsWith('.webm')) return 'video/webm'
  if (path.endsWith('.mov')) return 'video/quicktime'
  return 'video/mp4'
}

function parseYouTubeId(url: string): string | null {
  try {
    const u = new URL(url)
    if (u.hostname === 'youtu.be') return u.pathname.slice(1) || null
    if (u.hostname.includes('youtube.com')) {
      const id = u.searchParams.get('v')
      if (id) return id
      const embed = u.pathname.match(/\/embed\/([^/]+)/)
      if (embed) return embed[1]
    }
  } catch {
    if (/^[\w-]{11}$/.test(url)) return url
  }
  return null
}

function parseVimeoId(url: string): string | null {
  try {
    const u = new URL(url)
    if (u.hostname.includes('vimeo.com')) {
      const id = u.pathname.match(/\/(\d+)/)
      return id?.[1] ?? null
    }
  } catch {
    if (/^\d+$/.test(url)) return url
  }
  return null
}

export const LANDING_DEMO_CHAPTERS = [
  'Nahrání PDF nebo e-mail na @in.audeflow.cz',
  'Automatické vytěžení dat a návrh předkontace',
  'Kontrola, audit a odeslání do účetního systému',
] as const
