const FONT5X7: Record<string, number[]> = {
  ' ': [0, 0, 0, 0, 0, 0, 0],
  A: [14, 17, 17, 31, 17, 17, 17],
  B: [30, 17, 17, 30, 17, 17, 30],
  C: [14, 17, 16, 16, 16, 17, 14],
  D: [28, 18, 17, 17, 17, 18, 28],
  E: [31, 16, 16, 30, 16, 16, 31],
  F: [31, 16, 16, 30, 16, 16, 16],
  G: [14, 17, 16, 23, 17, 17, 14],
  H: [17, 17, 17, 31, 17, 17, 17],
  I: [31, 4, 4, 4, 4, 4, 31],
  J: [15, 2, 2, 2, 18, 18, 12],
  K: [17, 18, 20, 24, 20, 18, 17],
  L: [16, 16, 16, 16, 16, 16, 31],
  M: [17, 27, 21, 17, 17, 17, 17],
  N: [17, 25, 21, 19, 17, 17, 17],
  O: [14, 17, 17, 17, 17, 17, 14],
  P: [30, 17, 17, 30, 16, 16, 16],
  Q: [14, 17, 17, 17, 21, 18, 13],
  R: [30, 17, 17, 30, 20, 18, 17],
  S: [15, 16, 16, 14, 1, 1, 30],
  T: [31, 4, 4, 4, 4, 4, 4],
  U: [17, 17, 17, 17, 17, 17, 14],
  V: [17, 17, 17, 17, 17, 10, 4],
  W: [17, 17, 17, 21, 21, 27, 17],
  X: [17, 10, 4, 4, 4, 10, 17],
  Y: [17, 17, 10, 4, 4, 4, 4],
  Z: [31, 1, 2, 4, 8, 16, 31],
  '0': [14, 17, 19, 21, 25, 17, 14],
  '1': [4, 12, 4, 4, 4, 4, 31],
  '2': [14, 17, 1, 6, 8, 16, 31],
  '3': [31, 1, 2, 6, 1, 17, 14],
  '4': [2, 6, 10, 18, 31, 2, 2],
  '5': [31, 16, 30, 1, 1, 17, 14],
  '6': [14, 16, 16, 30, 17, 17, 14],
  '7': [31, 1, 2, 4, 8, 8, 8],
  '8': [14, 17, 17, 14, 17, 17, 14],
  '9': [14, 17, 17, 15, 1, 1, 14],
  '.': [0, 0, 0, 0, 0, 4, 4],
  '-': [0, 0, 0, 31, 0, 0, 0],
  '!': [4, 4, 4, 4, 4, 0, 4],
}

const MESSAGES = ['AUDEFLOW', 'MENE RUTINY.', 'VICE ZAKAZEK.']
const CHAR_W = 5
const CHAR_GAP = 1
const CHAR_H = 7

type PixelMap = {
  grid: boolean[][]
  totalCols: number
  rows: number
}

function buildMap(text: string): PixelMap {
  const chars = text.toUpperCase().split('').map((c) => FONT5X7[c] || FONT5X7[' '])
  const totalCols = chars.length * (CHAR_W + CHAR_GAP) - CHAR_GAP
  const grid: boolean[][] = []
  for (let row = 0; row < CHAR_H; row++) {
    const rowArr: boolean[] = []
    for (let ci = 0; ci < chars.length; ci++) {
      const glyph = chars[ci]
      for (let bit = CHAR_W - 1; bit >= 0; bit--) {
        rowArr.push(!!(glyph[row] & (1 << bit)))
      }
      if (ci < chars.length - 1) {
        for (let g = 0; g < CHAR_GAP; g++) rowArr.push(false)
      }
    }
    grid.push(rowArr)
  }
  return { grid, totalCols, rows: CHAR_H }
}

export function startBlimpAnimation(canvas: HTMLCanvasElement): () => void {
  const context = canvas.getContext('2d')
  if (!context) return () => {}
  const ctx = context

  const pixelMaps = MESSAGES.map(buildMap)

  let msgIdx = 0
  let phase: 'hold' | 'blink' | 'slide' | 'out' = 'hold'
  let phaseT = 0
  let blinkOn = true
  let slideOff = 0
  let blimpAlpha = 1
  let bobT = 0
  let lastTS = 0
  let frameId = 0

  const T_HOLD_0 = 1800
  const T_BLINK = 220
  const N_BLINKS = 4
  const T_SLIDE = 900
  const T_HOLD = 1600

  function resize() {
    const wrap = canvas.parentElement
    const dpr = window.devicePixelRatio || 1
    const w = wrap?.offsetWidth || 520
    const h = wrap?.offsetHeight || 360
    canvas.width = w * dpr
    canvas.height = h * dpr
    canvas.style.width = `${w}px`
    canvas.style.height = `${h}px`
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  }

  resize()
  const onResize = () => resize()
  window.addEventListener('resize', onResize)

  function draw(ts: number) {
    const dt = Math.min(ts - lastTS, 50)
    lastTS = ts
    bobT += dt * 0.0007

    phaseT += dt

    if (phase === 'hold') {
      blimpAlpha = 1
      blinkOn = true
      const holdDur = msgIdx === 0 ? T_HOLD_0 : T_HOLD
      if (phaseT > holdDur) {
        phase = 'blink'
        phaseT = 0
        blinkOn = false
      }
    } else if (phase === 'blink') {
      blinkOn = Math.floor(phaseT / T_BLINK) % 2 === 0
      blimpAlpha = blinkOn ? 1 : 0.08
      if (phaseT > T_BLINK * N_BLINKS * 2) {
        blimpAlpha = 0
        msgIdx = (msgIdx + 1) % MESSAGES.length
        phase = msgIdx === 0 ? 'hold' : 'slide'
        phaseT = 0
        blinkOn = true
        blimpAlpha = 1
        if (phase === 'slide') {
          slideOff = pixelMaps[msgIdx].totalCols + 4
        }
      }
    } else if (phase === 'slide') {
      const pm2 = pixelMaps[msgIdx]
      slideOff = Math.max(0, (pm2.totalCols + 4) * (1 - phaseT / T_SLIDE))
      blimpAlpha = 1
      if (phaseT > T_SLIDE) {
        slideOff = 0
        phase = 'hold'
        phaseT = 0
      }
    }

    const W = canvas.offsetWidth
    const H = canvas.offsetHeight
    if (!W || !H) {
      frameId = requestAnimationFrame(draw)
      return
    }

    ctx.clearRect(0, 0, W, H)

    const dark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const bobY = Math.sin(bobT) * H * 0.022
    const bobRot = Math.sin(bobT * 0.72) * 0.014
    const cx = W * 0.5
    const cy = H * 0.44 + bobY
    const RX = W * 0.415
    const RY = RX * 0.295
    const tilt = -0.13 + bobRot

    ctx.save()
    ctx.translate(cx, cy)
    ctx.rotate(tilt)

    ctx.save()
    ctx.scale(1, 0.18)
    const shG = ctx.createRadialGradient(0, RY * 6.2, 0, 0, RY * 6.2, RX * 0.82)
    shG.addColorStop(0, dark ? 'rgba(37,99,235,0.18)' : 'rgba(37,99,235,0.10)')
    shG.addColorStop(1, 'transparent')
    ctx.fillStyle = shG
    ctx.beginPath()
    ctx.arc(0, RY * 6.2, RX * 0.82, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()

    function hullClip() {
      ctx.beginPath()
      ctx.ellipse(0, 0, RX, RY, 0, 0, Math.PI * 2)
    }

    const bodyG = ctx.createLinearGradient(0, -RY, 0, RY)
    bodyG.addColorStop(0.0, '#93c5fd')
    bodyG.addColorStop(0.22, '#3b82f6')
    bodyG.addColorStop(0.55, '#2563eb')
    bodyG.addColorStop(0.82, '#1e40af')
    bodyG.addColorStop(1.0, '#1e3a8a')
    hullClip()
    ctx.fillStyle = bodyG
    ctx.fill()

    ctx.save()
    hullClip()
    ctx.clip()
    ;[-0.72, -0.44, -0.12, 0.22, 0.52, 0.74].forEach((t) => {
      const rFrac = Math.sqrt(Math.max(0, 1 - t * t))
      const ribRY = RY * rFrac
      const ribRX = ribRY * 0.18
      const ribX = t * RX * 0.97
      ctx.beginPath()
      ctx.ellipse(ribX, 0, ribRX, ribRY, 0, 0, Math.PI * 2)
      ctx.strokeStyle = dark ? 'rgba(147,197,253,0.18)' : 'rgba(30,64,175,0.22)'
      ctx.lineWidth = 1.2
      ctx.stroke()
    })
    ctx.restore()

    ctx.save()
    hullClip()
    ctx.clip()
    const specG = ctx.createRadialGradient(-RX * 0.1, -RY * 0.58, 0, -RX * 0.1, -RY * 0.58, RX * 0.55)
    specG.addColorStop(0, 'rgba(255,255,255,0.42)')
    specG.addColorStop(0.5, 'rgba(255,255,255,0.10)')
    specG.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = specG
    hullClip()
    ctx.fill()

    ctx.beginPath()
    ctx.ellipse(0, 0, RX * 0.98, RY * 0.07, 0, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(30,58,138,0.45)'
    ctx.fill()
    ctx.restore()

    function drawFin(points: [number, number][], topLit: boolean) {
      ctx.beginPath()
      ctx.moveTo(points[0][0] * RX, points[0][1] * RY)
      points.slice(1).forEach((p) => ctx.lineTo(p[0] * RX, p[1] * RY))
      ctx.closePath()
      const fg = ctx.createLinearGradient(0, -RY, 0, RY * 0.5)
      fg.addColorStop(0, topLit ? '#3b82f6' : '#1e40af')
      fg.addColorStop(1, '#1e3a8a')
      ctx.fillStyle = fg
      ctx.fill()
      ctx.strokeStyle = dark ? 'rgba(147,197,253,0.30)' : 'rgba(30,64,175,0.35)'
      ctx.lineWidth = 1
      ctx.stroke()
    }

    drawFin(
      [
        [0.72, -0.18],
        [0.98, -1.08],
        [0.9, -0.14],
      ],
      true
    )
    drawFin(
      [
        [0.72, 0.18],
        [0.98, 0.9],
        [0.9, 0.14],
      ],
      false
    )
    drawFin(
      [
        [0.7, 0.04],
        [0.99, 0.22],
        [0.87, 0.04],
        [0.7, -0.04],
      ],
      false
    )
    drawFin(
      [
        [0.73, 0.0],
        [0.96, 0.14],
        [0.87, 0.0],
      ],
      false
    )

    ctx.save()
    hullClip()
    ctx.clip()
    const noseG = ctx.createRadialGradient(-RX * 0.82, -RY * 0.1, 0, -RX * 0.82, -RY * 0.1, RY * 0.55)
    noseG.addColorStop(0, '#bfdbfe')
    noseG.addColorStop(1, 'rgba(37,99,235,0)')
    ctx.fillStyle = noseG
    hullClip()
    ctx.fill()
    ctx.restore()

    const gCX = -RX * 0.05
    const gCY = RY * 1.08
    const gW = RX * 0.44
    const gH = RY * 0.32

    ctx.strokeStyle = dark ? 'rgba(147,197,253,0.35)' : 'rgba(30,64,175,0.40)'
    ctx.lineWidth = 1
    ;(
      [
        [-0.38, -0.1],
        [-0.12, -0.05],
        [0.12, -0.05],
        [0.38, -0.1],
      ] as [number, number][]
    ).forEach(([sx, tx]) => {
      ctx.beginPath()
      ctx.moveTo(gCX + sx * gW, RY * 0.92)
      ctx.lineTo(gCX + tx * gW, gCY - gH * 0.5)
      ctx.stroke()
    })

    const gondG = ctx.createLinearGradient(gCX - gW * 0.5, gCY - gH * 0.5, gCX + gW * 0.5, gCY + gH * 0.5)
    gondG.addColorStop(0, '#60a5fa')
    gondG.addColorStop(0.4, '#2563eb')
    gondG.addColorStop(1, '#1e3a8a')
    ctx.beginPath()
    ctx.roundRect(gCX - gW * 0.5, gCY - gH * 0.5, gW, gH, gH * 0.32)
    ctx.fillStyle = gondG
    ctx.fill()
    ctx.strokeStyle = dark ? 'rgba(147,197,253,0.40)' : 'rgba(30,64,175,0.45)'
    ctx.lineWidth = 1
    ctx.stroke()

    const nWin = 6
    for (let i = 0; i < nWin; i++) {
      const wx = gCX - gW * 0.38 + (i / (nWin - 1)) * gW * 0.76
      const wy = gCY - gH * 0.06
      const wR = gH * 0.2
      const wG = ctx.createRadialGradient(wx - wR * 0.3, wy - wR * 0.3, 0, wx, wy, wR)
      wG.addColorStop(0, 'rgba(219,234,254,0.95)')
      wG.addColorStop(0.6, 'rgba(96,165,250,0.7)')
      wG.addColorStop(1, 'rgba(30,58,138,0.4)')
      ctx.beginPath()
      ctx.arc(wx, wy, wR, 0, Math.PI * 2)
      ctx.fillStyle = wG
      ctx.fill()
    }

    const MAX_COLS = pixelMaps.reduce((m, p) => Math.max(m, p.totalCols), 0)
    const GROW = 7
    const dotSize = Math.min((RX * 1.14) / (MAX_COLS + 6), (RY * 0.78) / (GROW + 2))
    const panPadX = dotSize * 2.0
    const panPadY = dotSize * 1.4
    const panW = MAX_COLS * dotSize + panPadX * 2
    const panH = GROW * dotSize + panPadY * 2
    const pX0 = -panW * 0.5
    const pY0 = -panH * 0.5
    const dR = dotSize * 0.36

    ctx.save()
    ctx.beginPath()
    ctx.ellipse(0, 0, RX - 1, RY - 1, 0, 0, Math.PI * 2)
    ctx.clip()

    ctx.beginPath()
    ctx.roundRect(pX0, pY0, panW, panH, panH * 0.14)
    ctx.fillStyle = 'rgba(3,10,45,0.90)'
    ctx.fill()
    ctx.beginPath()
    ctx.roundRect(pX0, pY0, panW, panH, panH * 0.14)
    ctx.strokeStyle = 'rgba(96,165,250,0.65)'
    ctx.lineWidth = 1.5
    ctx.stroke()

    const pm = pixelMaps[msgIdx]
    const msgStartCol = Math.round((MAX_COLS - pm.totalCols) / 2) - Math.round(slideOff)

    for (let ri = 0; ri < GROW; ri++) {
      for (let ci = 0; ci < MAX_COLS; ci++) {
        const dx = pX0 + panPadX + (ci + 0.5) * dotSize
        const dy = pY0 + panPadY + (ri + 0.5) * dotSize
        const msgCol = ci - msgStartCol
        const on =
          blinkOn && msgCol >= 0 && msgCol < pm.totalCols && pm.grid[ri] && pm.grid[ri][msgCol]

        if (on) {
          const gG = ctx.createRadialGradient(dx, dy, 0, dx, dy, dR * 4)
          gG.addColorStop(0, `rgba(255,250,100,${0.78 * blimpAlpha})`)
          gG.addColorStop(1, 'transparent')
          ctx.beginPath()
          ctx.arc(dx, dy, dR * 4, 0, Math.PI * 2)
          ctx.fillStyle = gG
          ctx.fill()
          ctx.beginPath()
          ctx.arc(dx, dy, dR, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(255,238,50,${blimpAlpha})`
          ctx.fill()
          ctx.beginPath()
          ctx.arc(dx, dy, dR * 0.45, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(255,255,200,${blimpAlpha})`
          ctx.fill()
        } else {
          ctx.beginPath()
          ctx.arc(dx, dy, dR * 0.52, 0, Math.PI * 2)
          ctx.fillStyle = 'rgba(15,35,90,0.60)'
          ctx.fill()
        }
      }
    }
    ctx.restore()
    ctx.restore()

    frameId = requestAnimationFrame(draw)
  }

  frameId = requestAnimationFrame((ts) => {
    lastTS = ts
    requestAnimationFrame(draw)
  })

  return () => {
    cancelAnimationFrame(frameId)
    window.removeEventListener('resize', onResize)
  }
}
