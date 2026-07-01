import { useEffect, useRef, useState } from 'react'
import { createVoiceNote } from '../../features/voice/voiceService'
import useAuthStore from '../../store/authStore'
import AudioWaveform from './AudioWaveform'

export default function VoiceRecorder({ onSaved }) {
  const profile = useAuthStore((s) => s.profile)
  const [status, setStatus] = useState('idle')
  const [stream, setStream] = useState(null)
  const recorderRef = useRef(null)
  const chunksRef = useRef([])
  const [recordedBlob, setRecordedBlob] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)
  const [title, setTitle] = useState('My voice note')
  const [description, setDescription] = useState('')
  const [duration, setDuration] = useState(0)
  const audioRef = useRef(null)

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop())
      }
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [stream, previewUrl])

  const startRecording = async () => {
    try {
      setError(null)
      const mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true })
      setStream(mediaStream)
      chunksRef.current = []

      const recorder = new MediaRecorder(mediaStream)
      recorderRef.current = recorder

      recorder.addEventListener('dataavailable', (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      })

      recorder.addEventListener('stop', () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        const url = URL.createObjectURL(blob)
        setRecordedBlob(blob)
        setPreviewUrl(url)
        setStatus('ready')
      })

      recorder.start()
      setStatus('recording')
    } catch (err) {
      setError('Unable to start recording. Please allow microphone access.')
      console.error(err)
    }
  }

  const stopRecording = () => {
    if (recorderRef.current?.state === 'recording') {
      recorderRef.current.stop()
    }
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
      setStream(null)
    }
  }

  const handleFileUpload = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    setRecordedBlob(file)
    setPreviewUrl(url)
    setStatus('ready')
    setDuration(0)
  }

  const handleUpload = async () => {
    if (!profile) {
      setError('Please sign in to save voice notes.')
      return
    }
    if (!recordedBlob) {
      setError('Record or select an audio file first.')
      return
    }

    setUploading(true)
    setError(null)

    try {
      const file = recordedBlob instanceof File ? recordedBlob : new File([recordedBlob], `voice-note-${Date.now()}.webm`, { type: recordedBlob.type })

      await createVoiceNote({
        ownerId: profile.uid,
        title: title || 'Voice note',
        description,
        file,
        fileName: file.name,
        onProgress: setUploadProgress,
      })

      setStatus('idle')
      setRecordedBlob(null)
      setPreviewUrl('')
      setTitle('My voice note')
      setDescription('')
      setUploadProgress(0)
      setDuration(0)
      onSaved?.()
    } catch (err) {
      setError('Upload failed. Please try again.')
      console.error(err)
    } finally {
      setUploading(false)
    }
  }

  const handleMetaLoaded = () => {
    if (audioRef.current) {
      setDuration(Math.round(audioRef.current.duration))
    }
  }

  return (
    <div className="glass p-5 rounded-3xl border border-white/10">
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <button
            type="button"
            className={`btn w-full ${status === 'recording' ? 'btn-danger' : 'btn-primary'}`}
            onClick={status === 'recording' ? stopRecording : startRecording}
          >
            {status === 'recording' ? 'Stop Recording' : 'Record Voice'}
          </button>
          <label className="btn w-full cursor-pointer">
            <span>Upload Existing Audio</span>
            <input type="file" accept="audio/*" className="hidden" onChange={handleFileUpload} />
          </label>
        </div>

        <div className="space-y-3">
          <label className="block text-sm font-medium text-white/70">Title</label>
          <input
            className="w-full rounded-2xl border border-white/10 bg-black/20 p-3 text-white"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What should this note be called?"
          />
          <label className="block text-sm font-medium text-white/70">Description</label>
          <textarea
            className="w-full rounded-2xl border border-white/10 bg-black/20 p-3 text-white"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add a quick note about this recording."
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm text-white/60">
            <span>Status: {status === 'recording' ? 'Recording…' : status === 'ready' ? 'Ready to upload' : 'Idle'}</span>
            {duration > 0 && <span>{duration}s</span>}
          </div>

          <div className="rounded-3xl overflow-hidden bg-white/5 border border-white/10 p-4">
            <AudioWaveform mediaStream={stream} audioRef={audioRef} active={status === 'recording' || Boolean(previewUrl)} />
          </div>

          {previewUrl && (
            <audio
              ref={audioRef}
              src={previewUrl}
              controls
              className="w-full mt-2 rounded-3xl bg-black/20"
              onLoadedMetadata={handleMetaLoaded}
            />
          )}
        </div>

        {uploadProgress > 0 && (
          <div className="w-full rounded-full bg-white/10 overflow-hidden h-2">
            <div className="h-2 bg-pink-500" style={{ width: `${uploadProgress}%` }} />
          </div>
        )}

        {error && <p className="text-sm text-red-300">{error}</p>}

        <button type="button" className="btn btn-primary w-full" onClick={handleUpload} disabled={uploading || status !== 'ready'}>
          {uploading ? 'Uploading…' : 'Save Voice Note'}
        </button>
      </div>
    </div>
  )
}
