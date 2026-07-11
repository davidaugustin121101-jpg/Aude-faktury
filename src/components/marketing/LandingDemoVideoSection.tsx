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
        src={`https://www.youtube-nocookie.com/embed/${video.src}?rel=0&modestbranding=1`}
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
        src={`https://player.vimeo.com/video/${video.src}?dnt=1`}
        title={video.title}
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
        className="absolute inset-0 h-full w-full border-0"
      />
    )
  }

  return (
    <video
      controls
      playsInline
      preload="metadata"
      poster={video.poster}
      className="absolute inset-0 h-full w-full object-cover bg-gray-900"
    >
      <source src={video.src} type="video/mp4" />
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
          className="group absolute inset-0 flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-gray-900 via-blue-950 to-gray-900 text-white"
          aria-label={`Přehrát video: ${video.title}`}
        >
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/25 transition group-hover:scale-105 group-hover:bg-white/20">
            <Play className="h-7 w-7 fill-white text-white ml-1" />
          </span>
          <span className="text-sm font-medium text-white/90">Přehrát ukázku</span>
        </button>
      )}
    </div>
  )
}

function Placeholder() {
  const isDev = process.env.NODE_ENV === 'development'

  return (
    <div
      className="relative aspect-video w-full overflow-hidden rounded-2xl border-2 border-dashed border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50"
      aria-hidden
    >
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-blue-600">
          <Play className="h-6 w-6 fill-blue-600 text-blue-600 ml-0.5" />
        </span>
        <p className="text-sm font-semibold text-gray-900">Video ukázka brzy</p>
        <p className="text-xs text-gray-500 max-w-sm">
          {isDev ? (
            <>
              Nastavte{' '}
              <code className="rounded bg-white/80 px-1 py-0.5 text-[11px]">
                NEXT_PUBLIC_LANDING_DEMO_VIDEO_URL
              </code>{' '}
              (YouTube, Vimeo nebo /videos/demo.mp4).
            </>
          ) : (
            'Připravujeme krátkou ukázku celého procesu od PDF po export do účetnictví.'
          )}
        </p>
      </div>
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

          <div>{video ? <VideoPlayer video={video} /> : <Placeholder />}</div>
        </div>
      </div>
    </section>
  )
}
