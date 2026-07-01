import { useEffect, useRef } from 'react'

const drawWaveform = (ctx, width, height, dataArray) => {
  ctx.clearRect(0, 0, width, height)
  ctx.fillStyle = 'rgba(255,255,255,0.08)'
  ctx.fillRect(0, 0, width, height)

  const sliceWidth = width / dataArray.length
  let x = 0

  ctx.lineWidth = 2
  ctx.strokeStyle = '#ffffff'
  ctx.beginPath()

  for (let i = 0; i < dataArray.length; i += 1) {
    const v = dataArray[i] / 128.0
    const y = (v * height) / 2

    if (i === 0) {
      ctx.moveTo(x, y)
    } else {
      ctx.lineTo(x, y)
    }

    x += sliceWidth
  }

  ctx.lineTo(width, height / 2)
  ctx.stroke()
}

export default function AudioWaveform({ audioRef, mediaStream, active = false }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    if (!active) return
    if (!canvasRef.current) return

    let audioCtx
    let analyser
    let source
    let rafId

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const width = canvas.width
    const height = canvas.height

    const setup = async () => {
      try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)()
        analyser = audioCtx.createAnalyser()
        analyser.fftSize = 2048

        if (mediaStream) {
          source = audioCtx.createMediaStreamSource(mediaStream)
          source.connect(analyser)
        } else if (audioRef?.current) {
          source = audioCtx.createMediaElementSource(audioRef.current)
          source.connect(analyser)
          analyser.connect(audioCtx.destination)
        }

        const dataArray = new Uint8Array(analyser.fftSize)

        const render = () => {
          rafId = requestAnimationFrame(render)
          analyser.getByteTimeDomainData(dataArray)
          drawWaveform(ctx, width, height, dataArray)
        }

        render()
      } catch (err) {
        console.warn('AudioWaveform error:', err.message)
      }
    }

    setup()

    return () => {
      if (rafId) cancelAnimationFrame(rafId)
      if (audioCtx && audioCtx.state !== 'closed') {
        audioCtx.close()
      }
    }
  }, [audioRef, mediaStream, active])

  return (
    <div className="rounded-3xl overflow-hidden bg-white/5 border border-white/10">
      <canvas ref={canvasRef} width={640} height={120} className="w-full h-28" />
    </div>
  )
}
