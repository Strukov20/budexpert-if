import React, { useRef, useState } from 'react'

export default function SpecificationRows({ rows, onChange, newRow }) {
  const dragRef = useRef(null)
  const [dragging, setDragging] = useState(null)
  const [announcement, setAnnouncement] = useState('')

  function move(id, targetIndex) {
    const index = rows.findIndex(row => row.id === id)
    if (index < 0 || index === targetIndex || targetIndex < 0 || targetIndex >= rows.length) return
    const next = [...rows]
    const [row] = next.splice(index, 1)
    next.splice(targetIndex, 0, row)
    onChange(next)
    setAnnouncement(`${row.key || 'Характеристика'}: позиція ${targetIndex + 1} з ${rows.length}`)
  }

  function endDrag(event, cancelled = false) {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return
    dragRef.current = null
    setDragging(null)
    if (cancelled) onChange(drag.original)
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

  return (
    <div className='space-y-2' data-spec-list
      onPointerMove={event => {
        const drag = dragRef.current
        if (!drag || drag.pointerId !== event.pointerId) return
        if (Math.abs(event.clientY - drag.startY) < 5) return
        const target = document.elementFromPoint(event.clientX, event.clientY)?.closest('[data-spec-row-id]')
        if (!target || !event.currentTarget.contains(target)) return
        const index = rows.findIndex(row => String(row.id) === target.dataset.specRowId)
        const currentIndex = rows.findIndex(row => row.id === drag.id)
        const bounds = target.getBoundingClientRect()
        const midpoint = bounds.top + bounds.height / 2
        if ((index > currentIndex && event.clientY >= midpoint) || (index < currentIndex && event.clientY <= midpoint)) {
          move(drag.id, index)
        }
      }}
      onPointerUp={event => endDrag(event)}
      onPointerCancel={event => endDrag(event, true)}
      onLostPointerCapture={event => endDrag(event)}>
      <p className='text-xs text-gray-500'>Перетягніть за ручку зліва, щоб змінити порядок. На клавіатурі — стрілки ↑ / ↓ на ручці.</p>
      {rows.map((row, index) => (
        <div key={row.id} data-spec-row-id={row.id}
          className={`grid grid-cols-[auto_minmax(0,1fr)_minmax(0,1fr)_auto] gap-2 items-center rounded ${dragging === row.id ? 'bg-red-50 ring-1 ring-red-200' : ''}`}>
          <button type='button' className='w-8 h-10 inline-flex items-center justify-center rounded border text-gray-500 cursor-grab active:cursor-grabbing touch-none select-none focus-visible:ring-2 focus-visible:ring-red-500'
            aria-label={`Перетягнути характеристику «${row.key || index + 1}»`}
            title='Перетягнути для зміни порядку (↑ / ↓ на клавіатурі)'
            onPointerDown={event => {
              if (event.button !== 0 || dragRef.current) return
              event.preventDefault()
              event.currentTarget.focus()
              dragRef.current = { id: row.id, pointerId: event.pointerId, startY: event.clientY, original: [...rows] }
              setDragging(row.id)
              event.currentTarget.closest('[data-spec-list]').setPointerCapture(event.pointerId)
            }}
            onKeyDown={event => {
              if (!['ArrowUp', 'ArrowDown'].includes(event.key)) return
              event.preventDefault()
              move(row.id, index + (event.key === 'ArrowUp' ? -1 : 1))
            }}>
            <svg width='16' height='20' viewBox='0 0 16 20' fill='currentColor' aria-hidden='true'>
              {[5, 10, 15].flatMap(y => [5, 11].map(x => <circle key={`${x}-${y}`} cx={x} cy={y} r='1.5' />))}
            </svg>
          </button>
          <input className='border p-2 rounded min-w-0 w-full' placeholder='Ключ'
            aria-label={`Назва характеристики ${index + 1}`} value={row.key}
            onChange={event => onChange(rows.map(item => item.id === row.id ? { ...item, key: event.target.value } : item))} />
          <input className='border p-2 rounded min-w-0 w-full' placeholder='Значення'
            aria-label={`Значення характеристики ${index + 1}`} value={row.value}
            onChange={event => onChange(rows.map(item => item.id === row.id ? { ...item, value: event.target.value } : item))} />
          <button type='button' className='w-10 h-10 inline-flex items-center justify-center border rounded hover:bg-red-600 hover:text-white transition'
            aria-label='Видалити характеристику' title='Видалити'
            onClick={() => {
              const next = rows.filter(item => item.id !== row.id)
              onChange(next.length ? next : [newRow()])
            }}>✕</button>
        </div>
      ))}
      <button type='button' className='px-3 py-2 border rounded hover:bg-black hover:text-white transition'
        onClick={() => onChange([...rows, newRow()])}>Додати характеристику</button>
      <span className='sr-only' role='status' aria-live='polite'>{announcement}</span>
    </div>
  )
}
