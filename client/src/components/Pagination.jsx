import React from 'react'

export default function Pagination({page, pages, onChange}){
  if(pages<=1) return null;
  const maxVisible = 5;
  let start = 1;
  let end = pages;

  if (pages > maxVisible) {
    start = Math.max(1, page - 2);
    end = start + maxVisible - 1;
    if (end > pages) {
      end = pages;
      start = Math.max(1, end - maxVisible + 1);
    }
  }

  const pageNumbers = [];
  for (let i = start; i <= end; i++) pageNumbers.push(i);

  const hasPrev = page > 1;
  const hasNext = page < pages;

  return (
    <div className='flex justify-center gap-2 mt-6 items-center'>
      <button
        onClick={() => hasPrev && onChange(page - 1)}
        disabled={!hasPrev}
        className={`px-3 py-1 rounded border text-sm min-w-[80px] ${
          hasPrev
            ? 'bg-white text-gray-800 hover:bg-gray-100 cursor-pointer'
            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
        }`}
      >
        Попередня
      </button>

      {pageNumbers.map(p => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={`px-3 py-1 rounded text-sm min-w-[36px] ${
            page === p
              ? 'bg-red-700 text-white cursor-default'
              : 'bg-gray-200 text-gray-800 hover:bg-gray-300 cursor-pointer'
          }`}
        >
          {p}
        </button>
      ))}

      <button
        onClick={() => hasNext && onChange(page + 1)}
        disabled={!hasNext}
        className={`px-3 py-1 rounded border text-sm min-w-[80px] ${
          hasNext
            ? 'bg-white text-gray-800 hover:bg-gray-100 cursor-pointer'
            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
        }`}
      >
        Наступна
      </button>
    </div>
  )
}
