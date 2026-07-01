import { format } from 'date-fns'

export default function GoalCard({ goal, onToggleComplete, onProgressChange, onDelete }) {
  const targetDate = goal.targetDate ? new Date(goal.targetDate.seconds * 1000) : null
  const progress = Math.min(Math.max(goal.progress || 0, 0), 100)

  return (
    <div className="glass p-5 rounded-3xl border border-white/10 shadow-xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-white">{goal.title}</h3>
          <p className="text-sm text-white/60 mt-1 line-clamp-2">{goal.description || 'No description yet.'}</p>
        </div>
        <button
          type="button"
          onClick={() => onToggleComplete(goal)}
          className={`px-3 py-1 rounded-full text-xs font-semibold ${goal.completed ? 'bg-emerald-500/20 text-emerald-300' : 'bg-sky-500/20 text-sky-200'}`}
        >
          {goal.completed ? 'Completed' : 'Mark complete'}
        </button>
      </div>

      <div className="mt-4 space-y-3">
        <div className="flex items-center justify-between text-xs text-white/50">
          <span>{goal.category?.replace('-', ' ') || 'Bucket'}</span>
          {targetDate && <span>{format(targetDate, 'MMM d, yyyy')}</span>}
        </div>

        <div className="w-full rounded-full bg-white/10 h-3 overflow-hidden">
          <div className="h-3 bg-gradient-to-r from-fuchsia-500 to-sky-400" style={{ width: `${progress}%` }} />
        </div>
        <div className="flex items-center justify-between text-xs text-white/60">
          <span>{progress}% progress</span>
          <div className="flex gap-2">
            <button type="button" className="text-white/60 hover:text-white" onClick={() => onProgressChange(goal, Math.max(progress - 10, 0))}>-</button>
            <button type="button" className="text-white/60 hover:text-white" onClick={() => onProgressChange(goal, Math.min(progress + 10, 100))}>+</button>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-white/50">
        <button type="button" className="text-red-400 hover:text-red-300" onClick={() => onDelete(goal)}>
          Delete
        </button>
        {goal.completed && <span className="text-emerald-300">Goal complete — celebrate! 🎉</span>}
      </div>
    </div>
  )
}
