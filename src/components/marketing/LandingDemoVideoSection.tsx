'use client'

import { useState } from 'react'
import { Maximize2, Play } from 'lucide-react'
import {
  LANDING_DEMO_CHAPTERS,
  getLandingDemoVideo,
  type LandingDemoVideo,
} from '@/content/marketing/demo-video'

function Embed({
  video,
  cinema = false,
}: {
  video: LandingDemoVideo
  cinema?: boolean
}) {
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
      className={
        cinema
          ? 'h-full w-full object-contain bg-black'
          : 'absolute inset-0 h-full w-full object-contain bg-gray-900'
      }
      aria-label={video.title}
    >
      <source src={video.src} type={video.mimeType ?? 'video/mp4'} />
    </video>
  )
}

function VideoPlayer({ video }: { video: LandingDemoVideo }) {
  const [active, setActive] = useState(video.provider === 'file')

  if (video.provider === 'file') {
    return (
      <div className="relative w-full min-h-[min(85vh,920px)] bg-black">
        <Embed video={video} cinema />
      </div>
    )
  }

  return (
    <div className="relative aspect-video w-full min-h-[min(70vh,720px)] overflow-hidden bg-gray-900">
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
          <span className="text-sm font-medium text-white/90">Přehrát ukázku na celé obrazovce</span>
        </button>
      )}
    </div>
  )
}

export function LandingDemoVideoSection() {
  const video = getLandingDemoVideo()

  return (
    <section id="video" className="bg-white border-t border-gray-100">
      <div className="max-w-6xl mx-auto px-4 pt-16 sm:pt-20 pb-10">
        <div className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-3">
            Ukázka v praxi
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
            {video?.title ?? 'Jak celá aplikace funguje'}
          </h2>
          <p className="text-gray-600 leading-relaxed mb-6">
            {video?.description ??
              'Video projde celým procesem — od PDF faktury přes vytěžení a předkontaci až po export nebo odeslání do vašeho účetního systému. Přehrajte si ho v klidu na celé šířce stránky.'}
          </p>
          <ul className="grid sm:grid-cols-3 gap-3">
            {LANDING_DEMO_CHAPTERS.map((chapter, i) => (
              <li
                key={chapter}
                className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50 px-3 py-3 text-sm text-gray-700"
              >
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                  {i + 1}
                </span>
                {chapter}
              </li>
            ))}
          </ul>
          {video?.provider === 'file' ? (
            <p className="mt-4 flex items-center gap-2 text-xs text-gray-500">
              <Maximize2 className="h-3.5 w-3.5 shrink-0" />
              Použijte ovládání videa nebo celou obrazovku pro detailní prohlídku.
            </p>
          ) : null}
        </div>
      </div>

      {video ? (
        <div className="w-full border-y border-gray-200 shadow-inner">
          <VideoPlayer video={video} />
        </div>
      ) : null}
    </section>
  )
}
