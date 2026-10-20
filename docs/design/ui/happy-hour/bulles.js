/*********************************************************
 * bulles.js — décor des pages VITRINES uniquement (accueil, palmarès)
 *
 * @description
 * Autorisé par CLAUDE.md du projet (exception « vitrine » du 2026-10-19).
 * Remplaçant provisoire de la vidéo de fond (asset à fournir). requestAnimationFrame,
 * aucun setInterval / setTimeout. Ne démarre pas sous prefers-reduced-motion, s'arrête
 * si la préférence change ou si l'onglet est masqué. Purement décoratif (aria-hidden).
 ********************************************************/
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)')
  const css = getComputedStyle(document.documentElement)
  const colors = ['--origam-color__bar---foam', '--origam-color__bar---amber', '--origam-color__bar---neon']
    .map((v) => css.getPropertyValue(v).trim()).filter(Boolean)

  document.querySelectorAll('canvas.bubbles').forEach((cv) => {
    const ctx = cv.getContext('2d')
    let w = 0, h = 0, raf = 0, bubbles = []
    const dpr = Math.min(devicePixelRatio || 1, 2)

    const resize = () => {
      w = cv.clientWidth; h = cv.clientHeight
      cv.width = w * dpr; cv.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const n = Math.round(w * h / 9000)
      bubbles = Array.from({ length: n }, () => spawn(true))
    }
    const spawn = (anywhere) => ({
      x: Math.random() * w, y: anywhere ? Math.random() * h : h + 10,
      r: 1 + Math.random() * 4.5, v: 0.25 + Math.random() * 0.9, drift: Math.random() * 6.28,
      c: colors[Math.random() < 0.7 ? 0 : (Math.random() < 0.5 ? 1 : 2)], a: 0.12 + Math.random() * 0.3
    })
    const draw = () => {
      ctx.clearRect(0, 0, w, h)
      for (const b of bubbles) {
        b.y -= b.v; b.drift += 0.02; b.x += Math.sin(b.drift) * 0.25
        if (b.y < -10) Object.assign(b, spawn(false))
        ctx.globalAlpha = b.a; ctx.strokeStyle = b.c; ctx.lineWidth = 1.2
        ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.stroke()
      }
      raf = requestAnimationFrame(draw)
    }
    const start = () => { if (!raf && !reduce.matches && !document.hidden) raf = requestAnimationFrame(draw) }
    const stop = () => { cancelAnimationFrame(raf); raf = 0; ctx.clearRect(0, 0, w, h) }

    resize(); start()
    addEventListener('resize', () => { resize() })
    document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()))
    reduce.addEventListener('change', () => (reduce.matches ? stop() : start()))
  })
})()
