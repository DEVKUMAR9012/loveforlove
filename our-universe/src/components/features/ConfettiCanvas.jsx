import { useEffect, useRef } from 'react'

const createParticle = (canvas, x, y, color) => ({
  x,
  y,
  vx: (Math.random() - 0.5) * 4,
  vy: Math.random() * -6 - 2,
  r: Math.random() * 4 + 2,
  color,
  ttl: 100,
  gravity: 0.15,
  rotation: Math.random() * Math.PI * 2,
  angularVelocity: (Math.random() - 0.5) * 0.2,
})

const colors = ['#f472b6', '#a78bfa', '#22d3ee', '#f97316', '#34d399']

export default function ConfettiCanvas({ active }) {
  const canvasRef = useRef(null)
  const animationRef = useRef(null)
  const particlesRef = useRef([])

  useEffect(() => {
    if (!active) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const resize = () => {
      canvas.width = canvas.clientWidth * window.devicePixelRatio
      canvas.height = canvas.clientHeight * window.devicePixelRatio
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
    }

    resize()
    window.addEventListener('resize', resize)

    const emit = () => {
      const rect = canvas.getBoundingClientRect()
      for (let i = 0; i < 10; i += 1) {
        particlesRef.current.push(createParticle(canvas, Math.random() * rect.width, rect.height, colors[Math.floor(Math.random() * colors.length)]))
      }
    }

    const render = () => {
      const width = canvas.clientWidth
      const height = canvas.clientHeight
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      particlesRef.current = particlesRef.current.filter((particle) => particle.ttl > 0)
      particlesRef.current.forEach((particle) => {
        particle.vy += particle.gravity
        particle.x += particle.vx
        particle.y += particle.vy
        particle.rotation += particle.angularVelocity
        particle.ttl -= 1
        ctx.save()
        ctx.translate(particle.x, particle.y)
        ctx.rotate(particle.rotation)
        ctx.fillStyle = particle.color
        ctx.fillRect(-particle.r / 2, -particle.r / 2, particle.r, particle.r * 0.4)
        ctx.restore()
      })
      animationRef.current = requestAnimationFrame(render)
    }

    const interval = setInterval(emit, 120)
    render()

    return () => {
      clearInterval(interval)
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
      window.removeEventListener('resize', resize)
    }
  }, [active])

  return <canvas ref={canvasRef} className="w-full h-40 pointer-events-none" />
}
