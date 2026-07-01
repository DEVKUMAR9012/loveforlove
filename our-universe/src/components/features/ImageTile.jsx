import React from 'react'

const ImageTile = ({ item, onOpen }) => {
  return (
    <div className="mb-4 break-inside-avoid" style={{ cursor: 'pointer' }} onClick={() => onOpen(item)}>
      <div className="relative overflow-hidden rounded-xl shadow-lg">
        <img src={item.url} alt={item.filename || item.title || 'photo'} className="w-full h-auto object-cover" />
        <div className="absolute left-2 bottom-2 bg-black/40 text-white text-xs px-2 py-1 rounded">{item.title}</div>
      </div>
    </div>
  )
}

export default ImageTile
