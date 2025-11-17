import React from 'react'

export default function Pagination({page, pages, onChange}){
  if(pages<=1) return null;
  return (
    <div className='flex justify-center gap-2 mt-6'>
      {Array.from({length: pages}, (_,i)=> (
        <button key={i} onClick={()=>onChange(i+1)} className={`px-3 py-1 rounded ${page===i+1 ? 'bg-red-700 text-white' : 'bg-gray-200'}`}>{i+1}</button>
      ))}
    </div>
  )
}
