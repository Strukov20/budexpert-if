import React from 'react'
import { FiLoader, FiUploadCloud } from 'react-icons/fi'

const base = 'inline-flex min-h-[44px] min-w-0 items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold leading-5 transition duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 motion-safe:active:scale-[0.98]'
export const adminButtonStyles = {
  primary: `${base} border-red-600 bg-red-600 text-white shadow-sm hover:border-red-700 hover:bg-red-700 hover:shadow-md`,
  secondary: `${base} border-slate-200 bg-white text-slate-700 shadow-sm hover:border-slate-300 hover:bg-slate-50`,
  danger: `${base} border-red-100 bg-red-50 text-red-600 hover:border-red-200 hover:bg-red-100`,
}

export default function AdminButton({ children, icon: Icon, busy = false, disabled = false, variant = 'secondary', className = '', type = 'button', ...props }) {
  return (
    <button {...props} type={type} disabled={disabled || busy} aria-busy={busy} className={`${adminButtonStyles[variant]} ${className}`}>
      {busy ? <FiLoader className='h-4 w-4 shrink-0 animate-spin' aria-hidden='true' /> : Icon ? <Icon className='h-4 w-4 shrink-0' aria-hidden='true' /> : null}
      {children}
    </button>
  )
}

export function AdminUploadButton({ onChange, busy = false, testId, inputTestId, hint = false }) {
  return (
    <div className='min-w-0'>
      <label data-testid={testId} className={`group relative inline-flex max-w-full ${busy ? 'cursor-wait opacity-60' : 'cursor-pointer'}`}>
        <input
          type='file'
          accept='image/jpeg,image/png,image/webp,image/gif'
          multiple
          disabled={busy}
          onChange={onChange}
          className='peer sr-only'
          aria-label='Завантажити фото'
          data-testid={inputTestId}
        />
        <span aria-busy={busy} className={`${adminButtonStyles.primary} pointer-events-none peer-focus-visible:ring-2 peer-focus-visible:ring-red-500 peer-focus-visible:ring-offset-2 ${busy ? '' : 'group-hover:bg-red-700'}`}>
          {busy ? <FiLoader className='h-4 w-4 shrink-0 animate-spin' aria-hidden='true' /> : <FiUploadCloud className='h-5 w-5 shrink-0' aria-hidden='true' />}
          <span>{busy ? 'Завантаження…' : 'Завантажити фото'}</span>
        </span>
      </label>
      {hint && <p className='mt-2 text-xs leading-5 text-slate-500'>JPG, PNG, WebP або GIF · до 5 МБ за фото</p>}
    </div>
  )
}
