import React from 'react'
import { FiArrowUpRight, FiCamera, FiDownload, FiExternalLink, FiImage, FiLayers, FiMaximize2, FiMinimize2, FiPackage, FiUploadCloud } from 'react-icons/fi'

function Action({ label, description, icon: Icon, onClick, testId, primary = false, count }) {
  return (
    <button
      type='button'
      onClick={onClick}
      aria-label={label}
      aria-describedby={`${testId}-description`}
      data-testid={testId}
      className={`group relative flex min-w-0 items-start gap-3 overflow-hidden rounded-2xl border p-4 text-left transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 motion-safe:hover:-translate-y-0.5 sm:p-5 ${primary
        ? 'border-slate-900 bg-slate-900 text-white shadow-sm hover:border-slate-800 hover:bg-slate-800 sm:col-span-2'
        : 'border-slate-200 bg-white text-slate-900 shadow-sm hover:border-red-200 hover:shadow-md'}`}
    >
      {primary && <span aria-hidden='true' className='pointer-events-none absolute -right-10 -top-16 h-44 w-44 rounded-full bg-red-500/10' />}
      <span className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${primary ? 'bg-red-600 text-white' : 'bg-red-50 text-red-600 transition-colors group-hover:bg-red-100'}`}>
        <Icon className='h-5 w-5' aria-hidden='true' />
      </span>
      <span className='relative min-w-0 flex-1'>
        <span className='flex flex-wrap items-center gap-2'>
          <span className='text-sm font-semibold leading-6 sm:text-base'>{label}</span>
          {count !== undefined && <span className={`rounded-md px-1.5 py-0.5 text-[11px] font-medium leading-4 ${primary ? 'bg-white/10 text-slate-200' : 'bg-slate-100 text-slate-500'}`}>{count}</span>}
        </span>
        <span id={`${testId}-description`} className={`mt-1 block text-xs leading-5 ${primary ? 'text-slate-300' : 'text-slate-500'}`}>{description}</span>
      </span>
      <FiArrowUpRight className={`relative mt-1 h-4 w-4 shrink-0 transition-colors ${primary ? 'text-slate-400 group-hover:text-white' : 'text-slate-300 group-hover:text-red-500'}`} aria-hidden='true' />
    </button>
  )
}

export default function AdminActions({ onProducts, onCategories, onCatalog, onImport, onExport, onBanner, onGallery, onToggleExpand, expanded, productCount, categoryCount }) {
  return (
    <section aria-labelledby='admin-actions-heading' data-testid='admin-actions'>
      <div className='mb-4 flex items-start justify-between gap-3'>
        <div>
          <h3 id='admin-actions-heading' className='text-xl font-semibold tracking-tight text-slate-900'>Панель керування</h3>
          <p className='mt-1 text-sm leading-6 text-slate-500'>Товари, категорії та вигляд магазину</p>
        </div>
        <button
          type='button'
          onClick={onToggleExpand}
          aria-label={expanded ? 'Вийти з повного екрану' : 'На весь екран'}
          title={expanded ? 'Згорнути' : 'Розгорнути'}
          data-testid='admin-actions-toggle-fullscreen'
          className='flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2'
        >
          {expanded ? <FiMinimize2 className='h-4 w-4' /> : <FiMaximize2 className='h-4 w-4' />}
        </button>
      </div>
      <div className='grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4'>
        <Action label='Всі товари' description='Перегляд і редагування асортименту' icon={FiPackage} onClick={onProducts} testId='admin-products-open-list' count={productCount} primary />
        <Action label='Категорії' description='Розділи, підкатегорії та типи' icon={FiLayers} onClick={onCategories} testId='admin-categories-open-list' count={categoryCount} />
        <Action label='Каталог' description='Відкрити сторінку магазину' icon={FiExternalLink} onClick={onCatalog} testId='admin-panel-go-catalog' />
        <Action label='Імпорт товарів' description='Завантажити товари з CSV або JSON' icon={FiUploadCloud} onClick={onImport} testId='admin-products-import-open' />
        <Action label='Експорт CSV' description='Зберегти каталог у файл' icon={FiDownload} onClick={onExport} testId='admin-products-export-csv' />
        <Action label='Банер' description='Зображення на головній сторінці' icon={FiImage} onClick={onBanner} testId='admin-panel-banner-open' />
        <Action label='Фото магазину' description='Галерея сторінки «Про магазин»' icon={FiCamera} onClick={onGallery} testId='admin-panel-about-gallery-open' />
      </div>
    </section>
  )
}
