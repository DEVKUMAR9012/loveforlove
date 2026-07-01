import React, { useState } from 'react'
import { createLetter, updateLetter } from '../../features/letters/lettersService'
import useAuthStore from '../../store/authStore'
import { Timestamp } from '../../lib/firestore'

export default function LetterEditor({ initial = null, onClose = () => {}, onSaved = () => {} }) {
  const profile = useAuthStore(s => s.profile)
  const [title, setTitle] = useState(initial?.title || '')
  const [body, setBody] = useState(initial?.body || '')
  const [unlockAt, setUnlockAt] = useState(initial?.unlockAt ? new Date(initial.unlockAt.seconds * 1000).toISOString().slice(0,16) : '')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        title,
        body,
        ownerId: profile?.uid || null,
      }
      if (unlockAt) payload.unlockAt = Timestamp.fromDate(new Date(unlockAt))

      if (initial && initial.id) {
        await updateLetter(initial.id, payload)
      } else {
        await createLetter(payload)
      }
      onSaved()
      onClose()
    } catch (err) {
      console.error('save letter', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="p-4 bg-white/5 rounded-lg" onSubmit={handleSubmit}>
      <label className="block text-sm text-white/60">Title</label>
      <input value={title} onChange={e=>setTitle(e.target.value)} className="w-full mt-1 p-2 rounded bg-white/5" />

      <label className="block text-sm text-white/60 mt-3">Unlock at (optional)</label>
      <input type="datetime-local" value={unlockAt} onChange={e=>setUnlockAt(e.target.value)} className="w-full mt-1 p-2 rounded bg-white/5" />

      <label className="block text-sm text-white/60 mt-3">Body</label>
      <textarea value={body} onChange={e=>setBody(e.target.value)} rows={6} className="w-full mt-1 p-2 rounded bg-white/5" />

      <div className="flex gap-2 mt-4">
        <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save Letter'}</button>
        <button type="button" className="btn" onClick={onClose}>Cancel</button>
      </div>
    </form>
  )
}
