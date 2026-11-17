import React, { useId, useLayoutEffect, useRef, useState } from 'react'
import ProductDescription from './ProductDescription'

export default function DescriptionEditor({ value = '', onChange, className = '' }) {
  const textareaRef = useRef(null)
  const selectionRef = useRef(null)
  const helpId = useId()
  const [preview, setPreview] = useState(false)

  useLayoutEffect(() => {
    if (!selectionRef.current || !textareaRef.current) return
    textareaRef.current.focus()
    textareaRef.current.setSelectionRange(...selectionRef.current)
    selectionRef.current = null
  }, [value])

  function makeBold() {
    const field = textareaRef.current
    if (!field) return
    const { selectionStart: start, selectionEnd: end } = field
    const raw = value.slice(start, end)
    const leading = raw.match(/^\s*/)[0]
    const selected = raw.trim() || 'текст'
    const trailing = raw.trim() ? raw.slice(leading.length + selected.length) : ''
    // Markdown bold markers must touch the text, even when a whole line is selected.
    const selectionStart = start + leading.length + 2
    selectionRef.current = [selectionStart, selectionStart + selected.length]
    onChange(value.slice(0, start) + leading + '**' + selected + '**' + trailing + value.slice(end))
  }

  return (
    <div className={`min-w-0 ${className}`}>
      <div className='flex flex-wrap items-center gap-2 mb-2'>
        <button type='button' className='border rounded px-3 py-1 text-sm font-bold disabled:opacity-50'
          disabled={preview} onMouseDown={event => event.preventDefault()} onClick={makeBold}
          title='Виділіть текст і натисніть, щоб зробити його жирним (Ctrl+B / ⌘B)'>
          Жирний
        </button>
        <button type='button' className='border rounded px-3 py-1 text-sm'
          aria-pressed={preview} onClick={() => setPreview(previous => !previous)}>
          {preview ? 'Редагувати' : 'Попередній перегляд'}
        </button>
      </div>
      {preview ? (
        <div className='border rounded p-3 min-h-32'>
          {value ? <ProductDescription>{value}</ProductDescription> : <p className='text-gray-500'>Опис ще не додано.</p>}
        </div>
      ) : (
        <textarea ref={textareaRef} className='border p-2 rounded min-h-32 w-full' rows={8}
          aria-label='Опис товару' aria-describedby={helpId} placeholder='Опис товару'
          value={value} onChange={event => onChange(event.target.value)}
          onKeyDown={event => {
            if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'b') {
              event.preventDefault()
              makeBold()
            }
          }} />
      )}
      <p id={helpId} className='mt-1 text-xs text-gray-500'>
        Enter — новий рядок, порожній рядок — новий абзац. Для списку починайте рядки з «- ».
        Щоб виділити текст жирним, виділіть його та натисніть «Жирний» або напишіть **текст**.
      </p>
    </div>
  )
}
