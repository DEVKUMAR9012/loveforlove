import { useEffect, useMemo, useState } from 'react'
import PageTransition from '../components/ui/PageTransition'
import GradientText from '../components/ui/GradientText'
import useAuthStore from '../store/authStore'
import GoalForm from '../components/features/GoalForm'
import GoalCard from '../components/features/GoalCard'
import ConfettiCanvas from '../components/features/ConfettiCanvas'
import { subscribeGoals, updateGoal, deleteGoal } from '../features/goals/goalsService'
import { where } from '../lib/firestore'

export default function GoalsPage() {
  const profile = useAuthStore((s) => s.profile)
  const [goals, setGoals] = useState([])
  const [celebrate, setCelebrate] = useState(false)

  useEffect(() => {
    if (!profile) return
    const unsub = subscribeGoals([where('ownerId', '==', profile.uid)], (items) => setGoals(items))
    return () => unsub()
  }, [profile])

  const completedCount = useMemo(() => goals.filter((g) => g.completed).length, [goals])
  const totalCount = goals.length
  const progressAvg = totalCount ? Math.round(goals.reduce((acc, g) => acc + (g.progress || 0), 0) / totalCount) : 0

  const handleToggleComplete = async (goal) => {
    const completed = !goal.completed
    await updateGoal(goal.id, { completed, progress: completed ? 100 : goal.progress || 0 })
    if (completed) {
      setCelebrate(true)
      window.setTimeout(() => setCelebrate(false), 2600)
    }
  }

  const handleProgressChange = async (goal, newProgress) => {
    await updateGoal(goal.id, { progress: newProgress, completed: newProgress >= 100 })
    if (newProgress >= 100) {
      setCelebrate(true)
      window.setTimeout(() => setCelebrate(false), 2600)
    }
  }

  const handleDelete = async (goal) => {
    await deleteGoal(goal.id)
  }

  return (
    <PageTransition className="p-4 md:p-8">
      <div className="space-y-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <GradientText as="h1" className="text-3xl font-bold">🌠 Future Goals</GradientText>
            <p className="text-white/70 max-w-2xl mt-2">Build your shared bucket list, track progress, and celebrate completed dreams together.</p>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="glass rounded-3xl p-4 border border-white/10">
              <p className="text-xs uppercase tracking-[0.3em] text-white/50">Goals</p>
              <p className="text-2xl font-bold text-white">{totalCount}</p>
            </div>
            <div className="glass rounded-3xl p-4 border border-white/10">
              <p className="text-xs uppercase tracking-[0.3em] text-white/50">Complete</p>
              <p className="text-2xl font-bold text-white">{completedCount}</p>
            </div>
            <div className="glass rounded-3xl p-4 border border-white/10">
              <p className="text-xs uppercase tracking-[0.3em] text-white/50">Average</p>
              <p className="text-2xl font-bold text-white">{progressAvg}%</p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.05fr,0.95fr]">
          <div className="space-y-6">
            <div className="glass rounded-3xl border border-white/10 p-6">
              <h2 className="heading-4 mb-3">Bucket List</h2>
              <p className="text-white/70">Add meaningful goals and watch your progress grow. Completed goals trigger a confetti celebration.</p>
            </div>

            <GoalForm onSaved={() => {}} />
          </div>

          <div className="space-y-6">
            <div className="glass rounded-3xl border border-white/10 p-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
              <h2 className="heading-4 mb-3">Goals progress</h2>
              <div className="w-full rounded-full bg-white/10 h-4 overflow-hidden">
                <div className="h-4 bg-gradient-to-r from-pink-500 to-sky-400" style={{ width: `${progressAvg}%` }} />
              </div>
              <p className="mt-3 text-white/60">Your average completion rate across all goals.</p>
            </div>

            <div className="grid gap-4">
              {goals.map((goal) => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  onToggleComplete={handleToggleComplete}
                  onProgressChange={handleProgressChange}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </div>
        </div>

        {celebrate && (
          <div className="pointer-events-none absolute inset-x-0 top-0 z-10 mx-auto w-full max-w-6xl">
            <ConfettiCanvas active={celebrate} />
          </div>
        )}
      </div>
    </PageTransition>
  )
}
