import React from 'react'

export default function SearchBar({value, onChange}){
  return (
    <div className='relative bg-white rounded-xl ring-1 ring-gray-200 shadow px-3'>
      <span className='absolute inset-y-0 left-3 flex items-center text-gray-500 pointer-events-none'>
        {/* Лупа */}
        <svg xmlns='http://www.w3.org/2000/svg' className='h-4 w-4' viewBox='0 0 20 20' fill='currentColor'>
          <path fillRule='evenodd' d='M12.9 14.32a8 8 0 111.414-1.414l3.387 3.387a1 1 0 01-1.414 1.414l-3.387-3.387zM8 14a6 6 0 100-12 6 6 0 000 12z' clipRule='evenodd' />
        </svg>
      </span>
      <input
        value={value}
        onChange={e=>onChange(e.target.value)}
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
    </div>
  )
}
