import React from 'react'
import { Link } from 'react-router-dom'
export default function NotFound() {
  return <div className="container py-12"><h1 className="text-3xl font-semibold">Сторінку не знайдено</h1><p className="my-4">Перевірте адресу або відкрийте каталог товарів.</p><Link to="/products" className="underline">До каталогу</Link></div>
}
