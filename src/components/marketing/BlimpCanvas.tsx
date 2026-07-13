'use client'

import { useEffect, useRef } from 'react'
import { startBlimpAnimation } from '@/components/marketing/blimp-canvas'

export function BlimpCanvas({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    return startBlimpAnimation(canvas)
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className={className}
      aria-hidden
      role="presentation"
    />
  )
}
