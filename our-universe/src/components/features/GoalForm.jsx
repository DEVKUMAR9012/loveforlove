import { useState } from 'react'
import { createGoal } from '../../features/goals/goalsService'
import useAuthStore from '../../store/authStore'
import { Timestamp } from '../../lib/firestore'

export default function GoalForm({ onSaved }) {
  const profile = useAuthStore((s) => s.profile)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [targetDate, setTargetDate] = useState('')
  const [category, setCategory] = useState('bucket')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!title.trim()) {
      setError('Give your goal a title.')
      return
    }
    setSaving(true)
    setError(null)

    try {
      await createGoal({
        title: title.trim(),
        description: description.trim(),
        category,
        targetDate: targetDate ? Timestamp.fromDate(new Date(targetDate)) : null,
        completed: false,
        ownerId: profile?.uid || null,
        progress: 0,
        createdAt: Timestamp.fromDate(new Date()),
      })
      setTitle('')
      setDescription('')
      setTargetDate('')
      setCategory('bucket')
      onSaved?.()
    } catch (err) {
      console.error(err)
      setError('Unable to save goal. Try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="glass p-6 rounded-3xl border border-white/10">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-sm text-white/60">Goal title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-black/20 p-3 text-white"
            placeholder="Learn to cook our favorite meals"
          />
        </div>
        <div>
          <label className="text-sm text-white/60">Category</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full rounded-2xl border border-white/10 bg-black/20 p-3 text-white">
            <option value="bucket">Bucket List</option>
            <option value="relationship">Relationship</option>
            <option value="travel">Travel</option>
            <option value="self">Self Growth</option>
          </select>
        </div>
      </div>

      <div className="mt-4">
        <label className="text-sm text-white/60">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full rounded-2xl border border-white/10 bg-black/20 p-3 text-white"
          placeholder="Why does this goal matter to us?"
        />
      </div>

      <div className="mt-4">
        <label className="text-sm text-white/60">Target date</label>
        <input
          type="date"
          value={targetDate}
          onChange={(e) => setTargetDate(e.target.value)}
          className="w-full rounded-2xl border border-white/10 bg-black/20 p-3 text-white"
        />
      </div>

      {error && <p className="mt-3 text-sm text-red-300">{error}</p>}

      <button type="submit" className="btn btn-primary mt-5 w-full" disabled={saving}>
        {saving ? 'Saving goal…' : 'Add goal'}
      </button>
    </form>
  )
}
