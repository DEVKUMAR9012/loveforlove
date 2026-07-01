import { useState } from 'react'
import useAuthStore from '../../store/authStore'
import { createMemory } from '../../features/memories/memoryService'

const InputFile = ({ accept, multiple, onChange }) => (
  <input type="file" accept={accept} multiple={multiple} onChange={onChange} />
)

const MemoryForm = ({ onCreated }) => {
  const user = useAuthStore(s => s.user)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState('')
  const [photos, setPhotos] = useState([])
  const [videos, setVideos] = useState([])
  const [screenshots, setScreenshots] = useState([])
  const [voiceNotes, setVoiceNotes] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const toFiles = e => Array.from(e.target.files || [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!user) return setError('You must be signed in')
    if (!title) return setError('Title is required')

    setLoading(true)
    try {
      const memoryId = await createMemory({
        title,
        description,
        date: date || new Date().toISOString(),
        createdBy: user.uid,
        files: { photos, videos, screenshots, voiceNotes },
      })
      setTitle(''); setDescription(''); setDate(''); setPhotos([]); setVideos([]); setScreenshots([]); setVoiceNotes([])
      onCreated?.(memoryId)
    } catch (err) {
      console.error(err)
      setError(err.message || 'Failed to create memory')
    } finally { setLoading(false) }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 glass p-4 rounded-2xl">
      <div>
        <label className="block text-sm font-medium text-white/80">Title</label>
        <input className="input-glass w-full" value={title} onChange={(e)=>setTitle(e.target.value)} required />
      </div>
      <div>
        <label className="block text-sm font-medium text-white/80">Description</label>
        <textarea className="input-glass w-full" value={description} onChange={(e)=>setDescription(e.target.value)} rows={3} />
      </div>
      <div>
        <label className="block text-sm font-medium text-white/80">Date</label>
        <input type="date" className="input-glass" value={date} onChange={(e)=>setDate(e.target.value)} />
      </div>

      <div>
        <label className="block text-sm font-medium text-white/80">Photos</label>
        <InputFile accept="image/*" multiple onChange={(e)=>setPhotos(toFiles(e))} />
      </div>

      <div>
        <label className="block text-sm font-medium text-white/80">Videos</label>
        <InputFile accept="video/*" multiple onChange={(e)=>setVideos(toFiles(e))} />
      </div>

      <div>
        <label className="block text-sm font-medium text-white/80">Chat Screenshots</label>
        <InputFile accept="image/*" multiple onChange={(e)=>setScreenshots(toFiles(e))} />
      </div>

      <div>
        <label className="block text-sm font-medium text-white/80">Voice Notes</label>
        <InputFile accept="audio/*" multiple onChange={(e)=>setVoiceNotes(toFiles(e))} />
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex gap-2">
        <button className="px-4 py-2 bg-blush-500 text-white rounded-2xl" disabled={loading}>
          {loading ? 'Saving...' : 'Save Memory'}
        </button>
      </div>
    </form>
  )
}

export default MemoryForm
