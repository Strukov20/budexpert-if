import React, { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { getProductSuggestions } from '../api'

export default function SearchBar({value, onChange}){
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState([])
  const rootRef = useRef(null)
  const inputRef = useRef(null)
  const dropdownRef = useRef(null)
  const lastReqIdRef = useRef(0)
  const debounceRef = useRef(null)
  const abortRef = useRef(null)
  const [dropdownRect, setDropdownRect] = useState({ left: 0, top: 0, width: 0 })

  useEffect(()=>{
    const v = (value || '').toString().trim()
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
      debounceRef.current = null
    }
    if (abortRef.current) {
      try { abortRef.current.abort() } catch {}
      abortRef.current = null
    }
    if (v.length < 2) {
      // Cancel any in-flight suggestion responses
      lastReqIdRef.current += 1
      setItems(prev => (prev.length ? [] : prev))
      setOpen(prev => (prev ? false : prev))
      setLoading(prev => (prev ? false : prev))
      return
    }

    debounceRef.current = setTimeout(async ()=>{
      const reqId = ++lastReqIdRef.current
      const controller = new AbortController()
      abortRef.current = controller
      setLoading(true)
      try {
        const res = await getProductSuggestions(v, { signal: controller.signal })
        if (lastReqIdRef.current !== reqId) return
        const next = Array.isArray(res) ? res : []
        setItems(next)
        setOpen(next.length > 0)
      } catch {
        if (lastReqIdRef.current !== reqId) return
        // Ignore abort errors (user typed something else)
        const aborted = controller?.signal?.aborted
        if (!aborted) {
          setItems([])
          setOpen(false)
        }
      } finally {
        if (abortRef.current === controller) abortRef.current = null
        if (lastReqIdRef.current === reqId) setLoading(false)
      }
    }, 450)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
        debounceRef.current = null
      }
      if (abortRef.current) {
        try { abortRef.current.abort() } catch {}
        abortRef.current = null
      }
    }
  }, [value])

  useEffect(()=>{
    const onDocDown = (e)=>{
      const el = rootRef.current
      if (!el) return
      if (el.contains(e.target)) return
      const dd = dropdownRef.current
      if (dd && dd.contains(e.target)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', onDocDown)
    return () => document.removeEventListener('mousedown', onDocDown)
  }, [])

  const recomputeRect = ()=>{
    const input = inputRef.current
    if (!input) return
    const r = input.getBoundingClientRect()
    setDropdownRect(prev => {
      const next = { left: r.left, top: r.bottom, width: r.width }
      if (prev.left === next.left && prev.top === next.top && prev.width === next.width) return prev
      return next
    })
  }

  useEffect(()=>{
    if (!open) return
    recomputeRect()
    const onScroll = ()=> recomputeRect()
    const onResize = ()=> recomputeRect()
    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', onResize)
    return ()=>{
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', onResize)
    }
  }, [open])

  const selectItem = (name)=>{
    const next = (name || '').toString()
    onChange(next)
    setOpen(false)
  }

  const dropdownEl = useMemo(()=>{
    if (!open) return null
    return (
      <div
        ref={dropdownRef}
        className='fixed z-[10000] bg-white rounded-xl ring-1 ring-gray-200 shadow-lg overflow-hidden'
        style={{ left: dropdownRect.left, top: dropdownRect.top + 8, width: dropdownRect.width }}
      >
        <div className='max-h-72 overflow-auto'>
          {loading ? (
            <div className='px-4 py-3 text-sm text-gray-500'>Завантаження…</div>
          ) : (
            items.map((p)=> (
              <button
                key={p?._id || p?.name}
                type='button'
                className='w-full text-left px-4 py-2.5 hover:bg-red-50 hover:text-red-700 transition text-sm'
                onMouseDown={(e)=>{
                  e.preventDefault()
                  e.stopPropagation()
                  selectItem(p?.name || '')
                }}
              >
                {p?.name || ''}
              </button>
            ))
          )}
        </div>
      </div>
    )
  }, [open, dropdownRect.left, dropdownRect.top, dropdownRect.width, loading, items])

  return (
    <div ref={rootRef} className='relative bg-white rounded-xl ring-1 ring-gray-200 shadow px-3'>
      <span className='absolute inset-y-0 left-3 flex items-center text-gray-500 pointer-events-none'>
        {/* Лупа */}
        <svg xmlns='http://www.w3.org/2000/svg' className='h-4 w-4' viewBox='0 0 20 20' fill='currentColor'>
          <path fillRule='evenodd' d='M12.9 14.32a8 8 0 111.414-1.414l3.387 3.387a1 1 0 01-1.414 1.414l-3.387-3.387zM8 14a6 6 0 100-12 6 6 0 000 12z' clipRule='evenodd' />
        </svg>
      </span>
      <input
        ref={inputRef}
        value={value}
        onChange={e=>onChange(e.target.value)}
        onFocus={()=> { if (items.length > 0) { recomputeRect(); setOpen(true) } }}
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

      {typeof document !== 'undefined' && dropdownEl ? createPortal(dropdownEl, document.body) : null}
    </div>
  )
}
