import React, { useEffect, useState } from 'react'
import { subscribeLetters } from '../../features/letters/lettersService'
import LetterCard from './LetterCard'

export default function LettersList({ onOpen }) {
  const [letters, setLetters] = useState([])

  useEffect(() => {
    const unsub = subscribeLetters([], (items) => setLetters(items))
    return () => unsub()
  }, [])

  return (
    <div className="flex flex-wrap -m-2">
      {letters.map(l => (
        <LetterCard key={l.id} letter={l} onOpen={onOpen} />
      ))}
    </div>
  )
}
