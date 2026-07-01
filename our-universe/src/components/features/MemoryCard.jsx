import format from 'date-fns/format'

const Thumbnail = ({ item }) => (
  <div className="w-24 h-24 bg-gray-800 rounded-md overflow-hidden">
    <img src={item.url} alt={item.filename} className="w-full h-full object-cover" />
  </div>
)

const MemoryCard = ({ memory, onDelete, onEdit }) => {
  const dateStr = memory.date ? (typeof memory.date.toDate === 'function' ? format(memory.date.toDate(), 'yyyy-MM-dd') : new Date(memory.date).toLocaleDateString()) : ''

  return (
    <div className="glass p-4 rounded-2xl">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-semibold text-blush-500">{memory.title}</h3>
          <div className="text-sm text-white/60">{dateStr}</div>
        </div>
        <div className="flex gap-2">
          <button onClick={()=>onEdit?.(memory)} className="px-3 py-1 bg-sky-500 text-white rounded">Edit</button>
          <button onClick={()=>onDelete?.(memory.id)} className="px-3 py-1 bg-red-500 text-white rounded">Delete</button>
        </div>
      </div>

      <p className="text-white/70 mt-3">{memory.description}</p>

      <div className="mt-3 flex gap-2">
        {(memory.photos||[]).slice(0,3).map((p, i)=> <Thumbnail key={i} item={p} />)}
      </div>
    </div>
  )
}

export default MemoryCard
