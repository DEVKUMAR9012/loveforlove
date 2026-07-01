import React, { useMemo, useState } from 'react'
import Envelope from './Envelope'
import { formatDistanceToNowStrict, parseISO } from 'date-fns'

export default function LetterCard({ letter, onOpen, now = Date.now() }) {
  const [isOpen, setOpen] = useState(false)

  const unlockDate = letter.unlockAt ? (letter.unlockAt.seconds ? new Date(letter.unlockAt.seconds * 1000) : new Date(letter.unlockAt)) : null
  const isLocked = useMemo(() => {
    if (!unlockDate) return false
    return unlockDate.getTime() > now
  }, [unlockDate, now])

  const handleClick = () => {
    if (isLocked) return
    setOpen(true)
    onOpen && onOpen(letter)
  }

  return (
    <div className="w-full md:w-1/2 lg:w-1/3 p-2">
      <div className="cursor-pointer" onClick={handleClick}>
        <Envelope isOpen={isOpen} className="min-h-[140px]">
          <h3 className="text-white font-semibold text-lg truncate">{letter.title || 'Untitled'}</h3>
          <p className="text-sm text-white/60 mt-2 line-clamp-3">{letter.body || ''}</p>
          <div className="text-xs text-white/40 mt-3">{letter.createdAt ? formatDistanceToNowStrict(new Date(letter.createdAt.seconds * 1000), { addSuffix: true }) : ''}</div>
        </Envelope>
        {isLocked && (
          <div className="mt-2 text-sm text-red-400">Locked — opens {unlockDate ? unlockDate.toLocaleString() : ''}</div>
        )}
      </div>
    </div>
  )
}
