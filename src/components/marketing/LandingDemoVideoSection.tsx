'use client'

import { useState } from 'react'
import { Play } from 'lucide-react'
import {
  LANDING_DEMO_CHAPTERS,
  getLandingDemoVideo,
  type LandingDemoVideo,
} from '@/content/marketing/demo-video'

function Embed({ video }: { video: LandingDemoVideo }) {
  if (video.provider === 'youtube') {
    return (
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${video.src}?rel=0&modestbranding=1&loop=1&playlist=${video.src}`}
        title={video.title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        className="absolute inset-0 h-full w-full border-0"
      />
    )
  }

  if (video.provider === 'vimeo') {
    return (
      <iframe
        src={`https://player.vimeo.com/video/${video.src}?dnt=1&loop=1`}
        title={video.title}
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
        className="absolute inset-0 h-full w-full border-0"
      />
    )
  }

  return (
    <video
      autoPlay
      muted
      loop={video.loop ?? true}
      playsInline
      preload="auto"
      poster={video.poster}
      className="absolute inset-0 h-full w-full object-contain bg-gray-900 transition-opacity duration-500"
      aria-label={video.title}
    >
      <source src={video.src} type={video.mimeType ?? 'video/mp4'} />
    </video>
  )
}

function VideoPlayer({ video }: { video: LandingDemoVideo }) {
  const [active, setActive] = useState(video.provider === 'file')

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-gray-200 bg-gray-900 shadow-lg">
      {active ? (
        <Embed video={video} />
      ) : (
        <button
          type="button"
          onClick={() => setActive(true)}
          className="group absolute inset-0 flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-gray-900 via-blue-950 to-gray-900 text-white transition-colors duration-300"
          aria-label={`Přehrát video: ${video.title}`}
        >
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/25 transition duration-300 group-hover:scale-105 group-hover:bg-white/20">
            <Play className="h-7 w-7 fill-white text-white ml-1" />
          </span>
          <span className="text-sm font-medium text-white/90">Přehrát ukázku</span>
        </button>
      )}
    </div>
  )
}

export function LandingDemoVideoSection() {
  const video = getLandingDemoVideo()

  return (
    <section id="video" className="py-16 sm:py-20 bg-white border-t border-gray-100">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-3">
              Ukázka v praxi
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
              {video?.title ?? 'Jak celá aplikace funguje'}
            </h2>
            <p className="text-gray-600 leading-relaxed mb-6">
              {video?.description ??
                'Krátké video projde celým procesem — od PDF faktury přes vytěžení a předkontaci až po export nebo odeslání do vašeho účetního systému.'}
            </p>
            <ul className="space-y-3">
              {LANDING_DEMO_CHAPTERS.map((chapter, i) => (
                <li key={chapter} className="flex items-start gap-3 text-sm text-gray-700">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                    {i + 1}
                  </span>
                  {chapter}
                </li>
              ))}
            </ul>
          </div>

          <div>{video ? <VideoPlayer video={video} /> : null}</div>
        </div>
      </div>
    </section>
  )
}
