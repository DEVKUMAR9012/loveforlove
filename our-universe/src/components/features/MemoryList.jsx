import { useEffect, useState } from 'react'
import { listMemories, deleteMemoryById } from '../../features/memories/memoryService'
import MemoryCard from './MemoryCard'

const MemoryList = () => {
  const [memories, setMemories] = useState([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const data = await listMemories()
      setMemories(data.sort((a,b)=> new Date(b.date) - new Date(a.date)))
    } catch (e) {
      console.error(e)
    } finally { setLoading(false) }
  }

  useEffect(()=>{ load() }, [])

  const handleDelete = async (id) => {
    if (!confirm('Delete this memory?')) return
    await deleteMemoryById(id)
    load()
  }

  return (
    <div className="space-y-4">
      {loading && <div className="text-white/60">Loading...</div>}
      {!loading && memories.length === 0 && <div className="text-white/60">No memories yet.</div>}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {memories.map(m => (
          <MemoryCard key={m.id} memory={m} onDelete={handleDelete} onEdit={()=>{}} />
        ))}
      </div>
    </div>
  )
}

export default MemoryList
