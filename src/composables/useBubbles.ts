import type { Ref } from 'vue'
import { BUBBLE_COLOR_TOKENS, BUBBLE_DENSITY_DIVISOR, BUBBLE_MAX_DPR } from '~/consts/bubbles.const'
import type { IBubble } from '~/interfaces/bubbles.interface'

/*********************************************************
 * useBubbles
 *
 * @description
 * Décor des vitrines (canvas de `bulles.js`). requestAnimationFrame, aucun setInterval ni setTimeout.
 * Ne démarre pas sous `prefers-reduced-motion: reduce`, s'arrête si la préférence change ou si l'onglet est masqué.
 * Réservé aux pages vitrines (exception de CLAUDE.md, 2026-10-19).
 ********************************************************/
export const useBubbles = (canvasRef: Ref<HTMLCanvasElement | null>) => {
  let frame = 0
  let stopListening: Array<() => void> = []

  const start = () => {
    const canvas = canvasRef.value
    const context = canvas?.getContext('2d')
    if (!canvas || !context) {
      return
    }
    const reduce = matchMedia('(prefers-reduced-motion: reduce)')
    const styles = getComputedStyle(document.documentElement)
    const colors = BUBBLE_COLOR_TOKENS.map(token => styles.getPropertyValue(token).trim()).filter(Boolean)
    if (colors.length === 0) {
      return
    }
    const dpr = Math.min(window.devicePixelRatio || 1, BUBBLE_MAX_DPR)
    let width = 0
    let height = 0
    let bubbles: IBubble[] = []

    const spawn = (anywhere: boolean): IBubble => ({
      x: Math.random() * width,
      y: anywhere ? Math.random() * height : height + 10,
      r: 1 + Math.random() * 4.5,
      v: 0.25 + Math.random() * 0.9,
      drift: Math.random() * 6.28,
      c: colors[Math.random() < 0.7 ? 0 : (Math.random() < 0.5 ? 1 : 2)] ?? colors[0]!,
      a: 0.12 + Math.random() * 0.3
    })

    const resize = () => {
      width = canvas.clientWidth
      height = canvas.clientHeight
      canvas.width = width * dpr
      canvas.height = height * dpr
      context.setTransform(dpr, 0, 0, dpr, 0, 0)
      bubbles = Array.from({ length: Math.round(width * height / BUBBLE_DENSITY_DIVISOR) }, () => spawn(true))
    }

    const draw = () => {
      context.clearRect(0, 0, width, height)
      for (const bubble of bubbles) {
        bubble.y -= bubble.v
        bubble.drift += 0.02
        bubble.x += Math.sin(bubble.drift) * 0.25
        if (bubble.y < -10) {
          Object.assign(bubble, spawn(false))
        }
        context.globalAlpha = bubble.a
        context.strokeStyle = bubble.c
        context.lineWidth = 1.2
        context.beginPath()
        context.arc(bubble.x, bubble.y, bubble.r, 0, Math.PI * 2)
        context.stroke()
      }
      frame = requestAnimationFrame(draw)
    }

    const play = () => {
      if (!frame && !reduce.matches && !document.hidden) {
        frame = requestAnimationFrame(draw)
      }
    }
    const pause = () => {
      cancelAnimationFrame(frame)
      frame = 0
      context.clearRect(0, 0, width, height)
    }
    const handleVisibility = () => (document.hidden ? pause() : play())
    const handlePreference = () => (reduce.matches ? pause() : play())

    resize()
    play()
    window.addEventListener('resize', resize)
    document.addEventListener('visibilitychange', handleVisibility)
    reduce.addEventListener('change', handlePreference)
    stopListening = [
      () => window.removeEventListener('resize', resize),
      () => document.removeEventListener('visibilitychange', handleVisibility),
      () => reduce.removeEventListener('change', handlePreference),
      pause
    ]
  }

  const stop = () => {
    stopListening.forEach(dispose => dispose())
    stopListening = []
  }

  return { start, stop }
}
