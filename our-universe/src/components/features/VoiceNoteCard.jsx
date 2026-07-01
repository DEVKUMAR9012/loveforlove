import { useRef, useState } from 'react'
import AudioWaveform from './AudioWaveform'
import { format } from 'date-fns'

export default function VoiceNoteCard({ note }) {
  const audioRef = useRef(null)
  const [isPlaying, setIsPlaying] = useState(false)

  const handlePlay = () => {
    if (audioRef.current) {
      audioRef.current.play()
    }
  }

  const handlePause = () => {
    if (audioRef.current) {
      audioRef.current.pause()
    }
  }

  return (
    <div className="glass p-5 rounded-3xl border border-white/10 shadow-2xl shadow-black/10">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white">{note.title || 'Untitled voice note'}</h3>
          <p className="text-sm text-white/60 mt-1 line-clamp-2">{note.description || 'No description added.'}</p>
        </div>
        <span className="text-xs text-white/40">{note.createdAt ? format(new Date(note.createdAt.seconds * 1000), 'MMM d, yyyy') : ''}</span>
      </div>

      <div className="space-y-3">
        <audio
          ref={audioRef}
          src={note.url}
          controls
          className="w-full rounded-3xl bg-black/20"
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />

        <AudioWaveform audioRef={audioRef} active={isPlaying} />

        <div className="flex items-center justify-between text-xs text-white/50">
          <span>{note.duration ? `${note.duration}s` : 'Audio note'}</span>
          <button type="button" onClick={isPlaying ? handlePause : handlePlay} className="text-sky-300 hover:text-white">
            {isPlaying ? 'Pause' : 'Play'}
          </button>
        </div>
      </div>
    </div>
  )
}
