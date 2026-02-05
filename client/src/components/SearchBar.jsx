import React, { useEffect, useRef, useState } from 'react'
import { getProductSuggestions } from '../api'

export default function SearchBar({value, onChange}){
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState([])
  const rootRef = useRef(null)
  const lastReqIdRef = useRef(0)
  const debounceRef = useRef(null)

  useEffect(()=>{
    const v = (value || '').toString().trim()
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
      debounceRef.current = null
    }
    if (v.length < 2) {
      setItems([])
      setOpen(false)
      setLoading(false)
      return
    }

    debounceRef.current = setTimeout(async ()=>{
      const reqId = ++lastReqIdRef.current
      setLoading(true)
      try {
        const res = await getProductSuggestions(v)
        if (lastReqIdRef.current !== reqId) return
        const next = Array.isArray(res) ? res : []
        setItems(next)
        setOpen(next.length > 0)
      } catch {
        if (lastReqIdRef.current !== reqId) return
        setItems([])
        setOpen(false)
      } finally {
        if (lastReqIdRef.current === reqId) setLoading(false)
      }
    }, 250)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
        debounceRef.current = null
      }
    }
  }, [value])

  useEffect(()=>{
    const onDocDown = (e)=>{
      const el = rootRef.current
      if (!el) return
      if (el.contains(e.target)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', onDocDown)
    return () => document.removeEventListener('mousedown', onDocDown)
  }, [])

  const selectItem = (name)=>{
    const next = (name || '').toString()
    onChange(next)
    setOpen(false)
  }

  return (
    <div ref={rootRef} className='relative bg-white rounded-xl ring-1 ring-gray-200 shadow px-3'>
      <span className='absolute inset-y-0 left-3 flex items-center text-gray-500 pointer-events-none'>
        {/* Лупа */}
        <svg xmlns='http://www.w3.org/2000/svg' className='h-4 w-4' viewBox='0 0 20 20' fill='currentColor'>
          <path fillRule='evenodd' d='M12.9 14.32a8 8 0 111.414-1.414l3.387 3.387a1 1 0 01-1.414 1.414l-3.387-3.387zM8 14a6 6 0 100-12 6 6 0 000 12z' clipRule='evenodd' />
        </svg>
      </span>
      <input
        value={value}
        onChange={e=>onChange(e.target.value)}
        onFocus={()=> { if (items.length > 0) setOpen(true) }}
        placeholder='Пошук товарів...'
        className='h-11 w-full bg-transparent border-0 pl-9 pr-9 text-base focus:ring-0 focus:outline-none'
      />
      {value && (
        <button
          type='button'
          aria-label='Очистити'
          onClick={()=> onChange('')}
          className='absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-black'
        >
          {/* Х */}
          <svg xmlns='http://www.w3.org/2000/svg' className='h-4 w-4' viewBox='0 0 20 20' fill='currentColor'>
            <path fillRule='evenodd' d='M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z' clipRule='evenodd'/>
          </svg>
        </button>
      )}

      {open && (
        <div className='absolute left-0 right-0 top-full mt-2 z-50 bg-white rounded-xl ring-1 ring-gray-200 shadow-lg overflow-hidden'>
          <div className='max-h-72 overflow-auto'>
            {loading ? (
              <div className='px-4 py-3 text-sm text-gray-500'>Завантаження…</div>
            ) : (
              items.map((p)=> (
                <button
                  key={p?._id || p?.name}
                  type='button'
                  className='w-full text-left px-4 py-2.5 hover:bg-red-50 hover:text-red-700 transition text-sm'
                  onClick={()=> selectItem(p?.name || '')}
                >
                  {p?.name || ''}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
