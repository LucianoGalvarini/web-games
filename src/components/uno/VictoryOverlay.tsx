import { useEffect, useRef } from 'react'

type Particle = {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  color: string
}

const COLORS = ['#e4b45a', '#f0d59a', '#e4312b', '#ffd400', '#46a045', '#0072bc', '#f3e6d2']

type VictoryOverlayProps = {
  winnerName: string
  onClose: () => void
}

export function VictoryOverlay({ winnerName, onClose }: VictoryOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const c2d = canvas?.getContext('2d')
    if (!canvas || !c2d) return

    function resize() {
      canvas!.width = window.innerWidth
      canvas!.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    let particles: Particle[] = []
    let raf = 0
    let lastBurst = 0

    function burst(x: number, y: number) {
      for (let i = 0; i < 60; i++) {
        const angle = (Math.PI * 2 * i) / 60
        const speed = 2 + Math.random() * 3.5
        particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 1,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
        })
      }
    }

    function frame(t: number) {
      if (!canvas || !c2d) return
      c2d.fillStyle = 'rgba(15, 9, 6, 0.18)'
      c2d.fillRect(0, 0, canvas.width, canvas.height)

      if (t - lastBurst > 650) {
        lastBurst = t
        burst(canvas.width * (0.2 + Math.random() * 0.6), canvas.height * (0.2 + Math.random() * 0.35))
      }

      particles.forEach((p) => {
        p.vy += 0.045
        p.x += p.vx
        p.y += p.vy
        p.life -= 0.012
        c2d.globalAlpha = Math.max(p.life, 0)
        c2d.fillStyle = p.color
        c2d.beginPath()
        c2d.arc(p.x, p.y, 2.6, 0, Math.PI * 2)
        c2d.fill()
      })
      c2d.globalAlpha = 1
      particles = particles.filter((p) => p.life > 0)

      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <div className="uno-victory">
      <canvas ref={canvasRef} className="uno-victory-canvas" />
      <div className="uno-victory-card">
        <p className="eyebrow">Fin</p>
        <h1>{winnerName} ganó</h1>
        <button type="button" className="btn btn-gold" onClick={onClose}>
          Cerrar
        </button>
      </div>
    </div>
  )
}
