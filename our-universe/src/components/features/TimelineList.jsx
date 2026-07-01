import { useEffect, useRef, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { listMemoriesPage } from '../../features/memories/memoryService'
import MemoryCard from './MemoryCard'

const PAGE_SIZE = 8

const DateMarker = ({ date }) => (
  <div className="flex items-center gap-3">
    <div className="w-8 text-sm text-white/60">{date}</div>
    <div className="flex-1 border-t border-white/6" />
  </div>
)

const TimelineList = () => {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [cursorDate, setCursorDate] = useState(null)
  const sentinelRef = useRef(null)

  const loadPage = useCallback(async () => {
    if (loading || !hasMore) return
    setLoading(true)
    try {
      const page = await listMemoriesPage(PAGE_SIZE, cursorDate)
      if (!page || page.length === 0) {
        setHasMore(false)
        return
      }
      setItems(prev => [...prev, ...page])
      // set cursor to last item's date
      const last = page[page.length-1]
      setCursorDate(last.date)
      if (page.length < PAGE_SIZE) setHasMore(false)
    } catch (e) {
      console.error('loadPage error', e)
      setHasMore(false)
    } finally { setLoading(false) }
  }, [cursorDate, hasMore, loading])

  useEffect(() => { loadPage() }, [])

  // infinite scroll intersection
  useEffect(() => {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(ent => { if (ent.isIntersecting) loadPage() })
    }, { rootMargin: '200px' })
    const node = sentinelRef.current
    if (node) obs.observe(node)
    return () => obs.disconnect()
  }, [loadPage])

  // group items by month-year for date markers
  const grouped = items.reduce((acc, it) => {
    const d = new Date(it.date)
    const key = d.toLocaleString(undefined, { month: 'short', year: 'numeric' })
    if (!acc[key]) acc[key] = []
    acc[key].push(it)
    return acc
  }, {})

  const groups = Object.entries(grouped)

  return (
    <div className="relative">
      <div className="absolute left-10 top-0 bottom-0 w-0.5 bg-white/6 hidden md:block" />

      <div className="space-y-8">
        {groups.map(([label, mems]) => (
          <section key={label}>
            <DateMarker date={label} />
            <div className="mt-4 space-y-6">
              {mems.map(m => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.45 }}
                  className="pl-12"
                >
                  <MemoryCard memory={m} />
                </motion.div>
              ))}
            </div>
          </section>
        ))}

        <div ref={sentinelRef} className="h-8 flex items-center justify-center">
          {loading ? <div className="text-white/60">Loading…</div> : hasMore ? <div className="text-white/40">Scroll to load more</div> : <div className="text-white/40">No more memories</div>}
        </div>
      </div>
    </div>
  )
}

export default TimelineList
