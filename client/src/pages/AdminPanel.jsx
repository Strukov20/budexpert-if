import React, { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { getProducts, createProduct, updateProduct, deleteProduct, getCategories, createCategory, getOrders, deleteOrder, uploadImage, updateCategory, deleteCategory, reassignCategories, updateOrder, getLeads, updateLead, bulkCreateProducts, deleteAllProducts, exportProductsCsv } from '../api'
import { FiEdit2, FiPlus, FiX, FiCheckCircle, FiAlertTriangle, FiEye, FiTrash2, FiRefreshCcw, FiMaximize2, FiMinimize2, FiSearch, FiDownload } from 'react-icons/fi'
import ProductCard from '../components/ProductCard'

export default function AdminPanel(){
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [orders, setOrders] = useState([])
  const [leads, setLeads] = useState([])
  const [loadingAll, setLoadingAll] = useState(false)
  const [savingProduct, setSavingProduct] = useState(false)
  const [deletingProductId, setDeletingProductId] = useState('')
  const [deletingAllProductsLoading, setDeletingAllProductsLoading] = useState(false)
  const [leadsFull, setLeadsFull] = useState(false)
  const [ordersFull, setOrdersFull] = useState(false)
  const [prodFull, setProdFull] = useState(false)
  const [leadSearch, setLeadSearch] = useState('')
  const [leadFrom, setLeadFrom] = useState('')
  const [leadTo, setLeadTo] = useState('')
  const [leadStatusFilter, setLeadStatusFilter] = useState('')
  // Products UI state
  const [selectedProdId, setSelectedProdId] = useState('')
  const [showProdEdit, setShowProdEdit] = useState(false)
  const [showProdCreate, setShowProdCreate] = useState(false)
  const [showProdPreview, setShowProdPreview] = useState(false)
  const [previewProd, setPreviewProd] = useState(null)
  const [prodForm, setProdForm] = useState({ name:'', price:0, discount:0, image:'', imagePublicId:'', images: [], description:'', specsPairs: [{ id: Date.now() + Math.random(), key:'', value:'' }], specsText:'', category:'', subcategory:'', type:'', sku:'', stock:0, unit:'' })
  const [showProdList, setShowProdList] = useState(false)
  const [prodListSearch, setProdListSearch] = useState('')
  const [prodCatFilter, setProdCatFilter] = useState('')
  const [prodSubcatFilter, setProdSubcatFilter] = useState('')
  const [prodTypeFilter, setProdTypeFilter] = useState('')
  const [prodSortMode, setProdSortMode] = useState('date_desc') // price_asc | price_desc | date_desc | date_asc | stock_asc | stock_desc
  const [prodPage, setProdPage] = useState(1)
  const [prodPerPage, setProdPerPage] = useState(10)
  const [catName, setCatName] = useState('')
  const [inlineCatName, setInlineCatName] = useState('')
  const [inlineCatLoading, setInlineCatLoading] = useState(false)
  const [showInlineCat, setShowInlineCat] = useState(false)
  const [inlineSubcatName, setInlineSubcatName] = useState('')
  const [inlineSubcatLoading, setInlineSubcatLoading] = useState(false)
  const [showInlineSubcat, setShowInlineSubcat] = useState(false)
  const [inlineTypeName, setInlineTypeName] = useState('')
  const [inlineTypeLoading, setInlineTypeLoading] = useState(false)
  const [showInlineType, setShowInlineType] = useState(false)
  const [selectedCatId, setSelectedCatId] = useState('')
  const [showCatEdit, setShowCatEdit] = useState(false)
  const [showCatCreate, setShowCatCreate] = useState(false)
  const [catEditingName, setCatEditingName] = useState('')
  const [catSubName, setCatSubName] = useState('')
  const [catSubLoading, setCatSubLoading] = useState(false)
  const [catTypeParentId, setCatTypeParentId] = useState('')
  const [catTypeName, setCatTypeName] = useState('')
  const [catTypeLoading, setCatTypeLoading] = useState(false)
  const [editSubId, setEditSubId] = useState('')
  const [editSubName, setEditSubName] = useState('')
  const [editTypeId, setEditTypeId] = useState('')
  const [editTypeName, setEditTypeName] = useState('')
  const [savingChildId, setSavingChildId] = useState('')
  const [deletingChildId, setDeletingChildId] = useState('')
  const [applyToProducts, setApplyToProducts] = useState(true)
  const [showCatList, setShowCatList] = useState(false)
  const [catListSearch, setCatListSearch] = useState('')
  const [catSearchOpen, setCatSearchOpen] = useState(false)
  const [catSortAsc, setCatSortAsc] = useState(true)
  const [catSortKey, setCatSortKey] = useState('name') // name | date
  const [catPage, setCatPage] = useState(1)
  const [catPerPage, setCatPerPage] = useState(10)
  const [expandedCatId, setExpandedCatId] = useState('')
  const [uploading, setUploading] = useState(false)
  const [toasts, setToasts] = useState([]) // {id, open, type, message}
  const importInputRef = useRef(null)

  const [imgModalOpen, setImgModalOpen] = useState(false)
  const [imgModalIndex, setImgModalIndex] = useState(0)

  // Orders UI state
  const [orderSearch, setOrderSearch] = useState('')
  const [orderStatus, setOrderStatus] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [orderPage, setOrderPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [orderNote, setOrderNote] = useState('')
  const [orderStatusEdit, setOrderStatusEdit] = useState('new')

  function showToast(message, type='success'){
    const id = Date.now() + Math.random()
    setToasts(prev => [...prev, { id, open:true, type, message }])
    // автозакриття через 10 сек з плавним згасанням
    setTimeout(()=> closeToast(id), 10000)
  }

  async function handleExportCsv(){
    try{
      const res = await exportProductsCsv();
      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'products-export.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    }catch(err){
      showToast(getErrMsg(err),'error');
    }
  }

  // CSV простий парсер (підтримка лапок)
  function parseCsv(text){
    const lines = text.split(/\r?\n/).filter(l=> l.trim().length>0)
    if (lines.length===0) return []
    const split = (row)=>{
      const out=[]; let cur=''; let inQ=false
      for(let i=0;i<row.length;i++){
        const ch=row[i]
        if(ch==='"'){
          if(inQ && row[i+1]==='"'){ cur+='"'; i++; }
          else inQ=!inQ
        } else if(ch===',' && !inQ){ out.push(cur); cur=''; }
        else { cur+=ch }
      }
      out.push(cur); return out
    }
    const header = split(lines[0]).map(h=> h.trim())
    return lines.slice(1).map(line=>{
      const cols = split(line)
      const obj = {}
      header.forEach((h,idx)=>{ obj[h] = (cols[idx]||'').trim() })
      return obj
    })
  }

  async function handleImportClick(){
    importInputRef.current?.click()
  }

  async function handleImportFile(e){
    const file = e.target.files?.[0]
    if(!file) return
    try{
      const text = await file.text()
      let items = []
      if(file.name.toLowerCase().endsWith('.json')){
        const parsed = JSON.parse(text)
        items = Array.isArray(parsed) ? parsed : (parsed.items||[])
      } else {
        // CSV очікує колонки: name,price,description,image,categoryName,sku,stock,manufacturer,unit
        const rows = parseCsv(text)
        items = rows.map(r=>{
          let rawPrice = (r.price||'').toString().trim()
          // забираємо пробіли всередині та все, крім цифр, ком, крапок і мінуса
          rawPrice = rawPrice.replace(/\s+/g,'').replace(/[^0-9,.-]/g,'').replace(',', '.')
          const price = Number(rawPrice || 0) || 0
          const rawStock = (r.stock||r.quantity||r.kilkist||r.kilkist||'').toString().replace(',', '.').trim()
          const stock = Math.max(0, Math.floor(Number(rawStock || 0) || 0))
          const rawDiscount = (r.discount||r.Discount||r.DISCOUNT||'').toString().replace(',', '.').trim()
          let discount = Math.max(0, Math.min(100, Number(rawDiscount || 0) || 0))
          const unit = (r.unit||r.units||r['unitName']||r['одиниця']||r['одиниця_вимірювання']||'').toString().trim()
          let specs = {}
          try {
            const rawSpecs = (r.specs||r.characteristics||r['характеристики']||'').toString().trim()
            if (rawSpecs) {
              const parsed = JSON.parse(rawSpecs)
              if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) specs = parsed
            }
          } catch {}
          return {
            name: r.name,
            price,
            description: r.description||'',
            specs,
            image: r.image||'',
            categoryName: r.categoryName||r.category||'',
            sku: r.sku||r.SKU||r.artikul||r.article||'',
            stock,
            discount,
            unit,
            manufacturer: r.manufacturer||r.brand||r.group||r.група||''
          }
        })
      }
      items = items.filter(x=> (x.name||'').trim())
      if(items.length===0){ showToast('Файл порожній або невірний формат','error'); return }
      const res = await bulkCreateProducts(items)
      showToast(`Імпортовано товарів: ${res.count||items.length}`,'success')
      loadAll()
    } catch(err){
      showToast(getErrMsg(err),'error')
    } finally {
      if (importInputRef.current) importInputRef.current.value = ''
    }
  }

  const STATUS = {
    new: 'Новий',
    processing: 'В обробці',
    shipped: 'Відправлено',
    completed: 'Завершено',
    cancelled: 'Скасовано'
  }
  const STATUS_KEYS = ['new','processing','shipped','completed','cancelled']
  const getStatusLabel = (k)=> STATUS[k] || k

  const fmtDateShort = (d)=>{
    if (!d) return ''
    try{ return new Date(d).toLocaleString('uk-UA', { dateStyle:'short', timeStyle:'short' }) }catch{ return '' }
  }

  const getCategoryName = (cat)=>{
    if (!cat) return ''
    if (typeof cat === 'object') return cat?.name || ''
    if (typeof cat === 'string'){
      const found = categories.find(c=> c._id === cat)
      return found?.name || ''
    }
    return ''
  }

  const getErrMsg = (err)=> (err && err.response && err.response.data && (err.response.data.message || err.response.data.error)) || 'Сталася помилка'

  const newSpecRow = ()=> ({ id: Date.now() + Math.random(), key: '', value: '' })
  const ensureAtLeastOneSpecRow = (pairs)=>{
    if (Array.isArray(pairs) && pairs.length) return pairs
    return [newSpecRow()]
  }

  const parseSpecsText = (input)=>{
    if (typeof input !== 'string') return {}
    const out = {}
    const parts = input
      .replace(/\r\n/g, '\n')
      .split(/[;\n]+/g)
      .map(s => s.trim())
      .filter(Boolean)
    for (const p of parts) {
      const idx = p.indexOf(':')
      if (idx === -1) continue
      const key = p.slice(0, idx).trim()
      const value = p.slice(idx + 1).trim()
      if (!key) continue
      out[key] = value
    }
    return out
  }

  const specsObjectToText = (obj)=>{
    if (!obj || typeof obj !== 'object') return ''
    const entries = Object.entries(obj).filter(([k])=> (k||'').toString().trim())
    return entries.map(([k,v]) => `${String(k).trim()}: ${String(v ?? '').trim()};`).join('\n')
  }

  const specsPairsToObject = (pairs)=>{
    const out = {}
    if (!Array.isArray(pairs)) return out
    for (const row of pairs) {
      const k = (row?.key || '').toString().trim()
      if (!k) continue
      const v = (row?.value ?? '').toString().trim()
      out[k] = v
    }
    return out
  }

  const specsPairsToText = (pairs)=> specsObjectToText(specsPairsToObject(pairs))

  const specsObjectToPairs = (obj)=>{
    if (!obj || typeof obj !== 'object') return ensureAtLeastOneSpecRow([])
    const pairs = Object.entries(obj)
      .filter(([k])=> (k||'').toString().trim())
      .map(([k,v])=> ({ id: Date.now() + Math.random(), key: String(k), value: String(v ?? '') }))
    return ensureAtLeastOneSpecRow(pairs)
  }

  function closeToast(id){
    // спершу приховати (анімувати), потім забрати з масиву
    setToasts(prev => prev.map(t => t.id===id ? { ...t, open:false } : t))
    setTimeout(()=> setToasts(prev => prev.filter(t => t.id !== id)), 300)
  }

  const resolveImageUrl = (u)=>{
    if (!u) return ''
    if (u.startsWith('http://') || u.startsWith('https://')) return u
    if (u.startsWith('/uploads/')){
      try {
        const api = import.meta.env.VITE_API_URL || ''
        if (api) {
          const origin = new URL(api).origin
          return origin + u
        }
      } catch {}
    }
    return u
  }

  const placeholderProductImg = (()=>{
    const w = 160, h = 90
    const svg = `<?xml version="1.0" encoding="UTF-8"?><svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}' viewBox='0 0 ${w} ${h}'><rect width='100%' height='100%' fill='#f3f4f6'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-family='Arial, Helvetica, sans-serif' font-size='10' fill='#9ca3af'>No image</text></svg>`
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg)
  })()

  const normalizeImageForSave = (u)=>{
    try{
      if(!u) return ''
      if (u.startsWith('/uploads/')) return u
      if (u.startsWith('http://') || u.startsWith('https://')){
        const api = import.meta.env.VITE_API_URL || ''
        if (api){
          const apiOrigin = new URL(api).origin
          const url = new URL(u)
          if (url.origin === apiOrigin && url.pathname.startsWith('/uploads/')){
            return url.pathname
          }
        }
      }
      return u
    } catch { return u }
  }

  const normalizeImagesForSave = (images)=>{
    if (!Array.isArray(images)) return []
    return images
      .filter(Boolean)
      .map(x=> ({
        url: normalizeImageForSave((x?.url||'').toString()),
        publicId: (x?.publicId||'').toString(),
      }))
      .filter(x=> x.url || x.publicId)
  }

  const syncPrimaryFromImages = (images)=>{
    const first = Array.isArray(images) && images.length ? images[0] : null
    return {
      image: first?.url || '',
      imagePublicId: first?.publicId || '',
    }
  }

  useEffect(()=>{
    const token = localStorage.getItem('admin_token')
    if(!token){
      navigate('/admin/login', { replace: true })
      return
    }
    loadAll()
  },[])

  async function loadAll(){
    setLoadingAll(true)
    try {
      const [pRes, cRes, oRes, lRes] = await Promise.allSettled([
        getProducts(),
        getCategories(),
        getOrders(),
        getLeads(),
      ])

      if (pRes.status === 'fulfilled') {
        const d = pRes.value
        const items = Array.isArray(d) ? d : (Array.isArray(d?.items) ? d.items : [])
        setProducts(items)
      }
      if (cRes.status === 'fulfilled') setCategories(cRes.value)
      if (oRes.status === 'fulfilled') setOrders(oRes.value)
      if (lRes.status === 'fulfilled') setLeads(lRes.value)
    } finally {
      setLoadingAll(false)
    }
  }

  useEffect(()=>{ getLeads().then(setLeads).catch(()=>{}) }, [])

  const LEAD_STATUS = { new:'Нова', in_progress:'В роботі', done:'Опрацьована', cancelled:'Відхилена' }
  const LEAD_STATUS_KEYS = ['new','in_progress','done','cancelled']
  const updateLeadStatus = async (id, status)=>{
    try{ const u = await updateLead(id, { status }); setLeads(prev=> prev.map(x=> x._id===id ? u : x)) }catch{ /* no-op */ }
  }

  const handleCreateProduct = async ()=>{
    if (savingProduct) return
    setSavingProduct(true)
    try{
      const { specsPairs, specsText, ...rest } = prodForm
      const payload = { ...rest, specs: specsPairsToObject(specsPairs), images: normalizeImagesForSave(prodForm.images) }
      await createProduct(payload);
      setShowProdCreate(false); setProdForm({ name:'', price:0, discount:0, image:'', imagePublicId:'', images: [], description:'', specsPairs: [newSpecRow()], specsText:'', category:'', subcategory:'', type:'', sku:'', stock:0, unit:'' });
      loadAll();
      showToast('Товар успішно додано','success')
    }catch(err){
      showToast(getErrMsg(err),'error')
    } finally {
      setSavingProduct(false)
    }
  }
  const handleUpdate = async ()=>{
    if (savingProduct) return
    setSavingProduct(true)
    try{
      const { specsPairs, specsText, ...rest } = prodForm
      const payload = { ...rest, specs: specsPairsToObject(specsPairs), images: normalizeImagesForSave(prodForm.images) }
      await updateProduct(selectedProdId, payload);
      setShowProdEdit(false);
      setProdForm({ name:'', price:0, discount:0, image:'', imagePublicId:'', images: [], description:'', specsPairs: [newSpecRow()], specsText:'', category:'', subcategory:'', type:'', sku:'', stock:0, unit:'' });
      loadAll();
      showToast('Товар оновлено','success')
    }catch(err){
      showToast(getErrMsg(err),'error')
    } finally {
      setSavingProduct(false)
    }
  }
  const handleDeleteProduct = async id=>{
    if (deletingProductId) return
    if(!confirm('Видалити товар?')) return;
    setDeletingProductId(id)
    try {
      await deleteProduct(id);
      loadAll();
      if (selectedProdId === id) { setSelectedProdId(''); }
      showToast('Товар видалено','success')
    } catch(err){
      showToast(getErrMsg(err),'error')
    } finally {
      setDeletingProductId('')
    }
  }

  const handleDeleteAllProducts = async ()=>{
    if (deletingAllProductsLoading) return
    if(!confirm('Видалити всі товари? Дію не можна скасувати.')) return;
    setDeletingAllProductsLoading(true)
    try{
      const res = await deleteAllProducts();
      loadAll();
      showToast(`Видалено товарів: ${res?.deletedCount ?? 0}`,'success')
    } catch(err){
      showToast(getErrMsg(err),'error')
    } finally {
      setDeletingAllProductsLoading(false)
    }
  }

  const handleCreateCategory = async e=>{
    e.preventDefault();
    try{
      await createCategory({ name: catName });
      setCatName('');
      loadAll();
      showToast('Категорію створено','success')
    } catch(err){
      showToast(getErrMsg(err),'error')
    }
  }

  const handleInlineCreateCategory = async ()=>{
    const name = (inlineCatName||'').trim()
    if (!name) return
    setInlineCatLoading(true)
    try{
      const created = await createCategory({ name })
      setCategories(prev=> [...prev, created])
      setProdForm(prev=> ({ ...prev, category: created._id || prev.category }))
      setInlineCatName('')
      showToast('Категорію створено','success')
    } catch(err){
      showToast(getErrMsg(err),'error')
    } finally {
      setInlineCatLoading(false)
    }
  }

  const handleInlineCreateSubcategory = async ()=>{
    const name = (inlineSubcatName||'').trim()
    if (!name) return
    if (!prodForm.category) {
      showToast('Спочатку виберіть головну категорію','error')
      return
    }
    setInlineSubcatLoading(true)
    try{
      const created = await createCategory({ name, parent: prodForm.category })
      setCategories(prev=> [...prev, created])
      setProdForm(prev=> ({ ...prev, subcategory: created._id || prev.subcategory, type: '' }))
      setInlineSubcatName('')
      setShowInlineSubcat(false)
      showToast('Підкатегорію створено','success')
    } catch(err){
      showToast(getErrMsg(err),'error')
    } finally {
      setInlineSubcatLoading(false)
    }
  }

  const handleInlineCreateType = async ()=>{
    const name = (inlineTypeName||'').trim()
    if (!name) return
    if (!prodForm.subcategory) {
      showToast('Спочатку виберіть підкатегорію','error')
      return
    }
    setInlineTypeLoading(true)
    try{
      const created = await createCategory({ name, parent: prodForm.subcategory })
      setCategories(prev=> [...prev, created])
      setProdForm(prev=> ({ ...prev, type: created._id || prev.type }))
      setInlineTypeName('')
      setShowInlineType(false)
      showToast('Тип товару створено','success')
    } catch(err){
      showToast(getErrMsg(err),'error')
    } finally {
      setInlineTypeLoading(false)
    }
  }

  const handleDeleteOrder = async id=>{
    if(!confirm('Видалити замовлення?')) return;
    try{
      await deleteOrder(id);
      loadAll();
      showToast('Замовлення видалено','success')
    } catch(err){
      showToast(getErrMsg(err),'error')
    }
  }

  async function handleFileChange(e){
    const files = Array.from(e.target.files || [])
    if(!files.length) return
    setUploading(true)
    try{
      const uploaded = []
      for (const f of files) {
        const { url, filename } = await uploadImage(f)
        uploaded.push({ url, publicId: filename || '' })
      }
      setProdForm(prev=>{
        const images = [...(prev.images||[]), ...uploaded]
        const primary = syncPrimaryFromImages(images)
        return { ...prev, images, ...primary }
      })
    } finally{
      setUploading(false)
      e.target.value = ''
    }
  }

  const removeImageAt = (idx)=>{
    setProdForm(prev=>{
      const images = Array.isArray(prev.images) ? [...prev.images] : []
      images.splice(idx, 1)
      const primary = syncPrimaryFromImages(images)
      return { ...prev, images, ...primary }
    })
  }

  const makeImagePrimaryAt = (idx)=>{
    setProdForm(prev=>{
      const images = Array.isArray(prev.images) ? [...prev.images] : []
      if (idx < 0 || idx >= images.length) return prev
      if (idx === 0) return prev
      const [picked] = images.splice(idx, 1)
      images.unshift(picked)
      const primary = syncPrimaryFromImages(images)
      return { ...prev, images, ...primary }
    })
  }

  const openImgModal = (idx)=>{
    setImgModalIndex(idx)
    setImgModalOpen(true)
  }

  return (
    <div className='container py-6 max-w-md mx-auto px-4 md:max-w-none md:px-0 flex flex-col'>
      {/* Адмін-панель заголовок і кнопка виходу — переміщено вгору */}
      <div className='flex items-center justify-between mb-4'>
        <h2 className='text-2xl font-semibold'>Адмін-панель</h2>
        <button
          onClick={()=>{ localStorage.removeItem('admin_token'); navigate('/admin/login', { replace:true }) }}
          className='px-4 py-2 rounded-lg bg-red-600 text-white shadow ring-1 ring-red-700/30 hover:bg-red-700 hover:shadow-lg transition-all duration-200 active:scale-95 hover:animate-pulse'
        >
          Вийти
        </button>
      </div>

      {imgModalOpen && (
        <div className='fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4' onClick={()=>setImgModalOpen(false)}>
          <div className='bg-white rounded-2xl shadow-2xl w-full max-w-3xl p-5' onClick={(e)=>e.stopPropagation()}>
            <div className='flex items-center justify-between mb-3'>
              <h4 className='font-semibold'>Перегляд фото</h4>
              <button aria-label='Закрити' onClick={()=> setImgModalOpen(false)} className='w-8 h-8 rounded-lg border'>✕</button>
            </div>

            {(() => {
              const images = Array.isArray(prodForm.images) ? prodForm.images : []
              const img = images[imgModalIndex]
              const url = (img?.url || '').toString()
              return (
                <div className='grid gap-4'>
                  <div className='bg-gray-50 border rounded-xl p-2 flex items-center justify-center'>
                    <img
                      src={resolveImageUrl(url)}
                      alt='preview'
                      className='w-full max-h-[60vh] object-contain rounded'
                      referrerPolicy='no-referrer'
                    />
                  </div>

                  <div className='grid gap-2'>
                    <div className='text-sm text-gray-700'>URL:</div>
                    <input className='border p-2 rounded w-full' value={url} readOnly />
                  </div>

                  <div className='flex justify-end gap-2'>
                    <button
                      type='button'
                      className='px-3 py-2 border rounded'
                      onClick={()=>{ makeImagePrimaryAt(imgModalIndex); setImgModalIndex(0); }}
                      disabled={imgModalIndex === 0}
                      title={imgModalIndex === 0 ? 'Це вже головне фото' : 'Зробити головним'}
                    >
                      Зробити головним
                    </button>
                  </div>
                </div>
              )
            })()}
          </div>
        </div>
      )}

      {/* Modal: Edit Category (active, not hidden) */}
      {showCatEdit && (
        <div className='fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4' onClick={()=> setShowCatEdit(false)}>
          <div className='bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[96vh] overflow-auto' onClick={(e)=>e.stopPropagation()}>
            <div className='px-6 py-4 border-b bg-gradient-to-b from-gray-50 to-white rounded-t-2xl'>
              <div className='flex items-start justify-between gap-3'>
                <div>
                  <div className='text-lg font-semibold leading-tight'>Редагувати категорію</div>
                  <div className='text-xs text-gray-500 mt-0.5'>Керуйте назвою та підкатегоріями. Зміни застосуються одразу після збереження.</div>
                </div>
                <button
                  aria-label='Закрити'
                  onClick={()=> { setShowCatEdit(false); setCatTypeParentId(''); setCatTypeName(''); }}
                  className='w-9 h-9 rounded-xl border bg-white hover:bg-gray-50 active:scale-95 transition'
                >
                  ✕
                </button>
              </div>
            </div>

            <div className='p-6 flex flex-col gap-5'>
              <div className='border rounded-xl p-4 bg-white'>
                <div className='text-sm font-semibold mb-3'>Основне</div>
                <div className='space-y-3'>
                  <div>
                    <label className='text-sm text-gray-600'>Назва</label>
                    <input
                      className='mt-1 border px-3 py-2.5 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-gray-400'
                      value={catEditingName}
                      onChange={e=>setCatEditingName(e.target.value)}
                      placeholder='Назва категорії'
                    />
                  </div>

                <label className='flex items-start gap-2 mt-4 text-sm'>
                  <input type='checkbox' className='mt-1' checked={applyToProducts} onChange={(e)=> setApplyToProducts(e.target.checked)} />
                  <span>
                    Застосувати нову назву до всіх товарів цієї категорії
                    <div className='text-xs text-gray-500 mt-0.5'>Товари посилаються на категорію за ID, тому нова назва відобразиться автоматично.</div>
                  </span>
                </label>
                </div>
              </div>

              <div className='border rounded-xl p-4 bg-white'>
                <div className='text-sm font-semibold mb-1'>Підкатегорії</div>
                <div className='text-xs text-gray-600 mb-3'>Додайте підкатегорію до цієї категорії — вона зʼявиться у дропдаунах товару.</div>

                <div className='flex gap-2 mb-3'>
                  <input
                    className='border px-3 py-2.5 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-gray-400'
                    value={catSubName}
                    onChange={e=> setCatSubName(e.target.value)}
                    placeholder='Нова підкатегорія'
                    disabled={catSubLoading}
                  />
                  <button
                    type='button'
                    className='px-4 py-2.5 rounded-lg bg-black text-white hover:bg-red-600 transition disabled:opacity-60 disabled:cursor-not-allowed'
                    disabled={catSubLoading || !catSubName.trim() || !selectedCatId}
                    onClick={async()=>{
                      try{
                        if (!selectedCatId) return
                        const name = catSubName.trim()
                        if (!name) return
                        setCatSubLoading(true)
                        await createCategory({ name, parent: selectedCatId })
                        setCatSubName('')
                        loadAll()
                        showToast('Підкатегорію створено','success')
                      }catch(err){
                        showToast(getErrMsg(err),'error')
                      }finally{
                        setCatSubLoading(false)
                      }
                    }}
                  >
                    {catSubLoading ? 'Додаю…' : 'Додати'}
                  </button>
                </div>

                <div className='max-h-56 overflow-auto rounded-xl border bg-gray-50'>
                  {(()=>{
                    const pid = (selectedCatId || '').toString()
                    const getParentId = (c)=>{
                      const p = c?.parent
                      if (!p) return ''
                      if (typeof p === 'string') return p
                      if (typeof p === 'object') return p?._id || p?.id || (typeof p?.toString === 'function' ? p.toString() : '')
                      return ''
                    }
                    const subs = categories.filter(c=> String(getParentId(c)||'') === String(pid))
                    if (!subs.length) return <div className='p-3 text-sm text-gray-500'>Підкатегорій ще немає.</div>
                    return subs.map(sc=> (
                      <div key={sc._id} className='px-4 py-2.5 border-t first:border-t-0 text-sm bg-white hover:bg-gray-50 flex items-center gap-2'>
                        {editSubId === sc._id ? (
                          <input
                            className='border px-2 py-1.5 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-gray-400'
                            value={editSubName}
                            onChange={e=> setEditSubName(e.target.value)}
                            disabled={savingChildId === sc._id}
                          />
                        ) : (
                          <span className='flex-1 min-w-0 truncate'>{sc.name}</span>
                        )}

                        {editSubId === sc._id ? (
                          <>
                            <button
                              type='button'
                              className='w-9 h-9 inline-flex items-center justify-center border rounded-lg hover:bg-gray-50 active:scale-95 transition disabled:opacity-60'
                              disabled={savingChildId === sc._id || !editSubName.trim()}
                              onClick={async()=>{
                                try{
                                  const name = (editSubName||'').trim()
                                  if (!name) return
                                  setSavingChildId(sc._id)
                                  await updateCategory(sc._id, { name })
                                  setEditSubId('')
                                  setEditSubName('')
                                  loadAll()
                                  showToast('Підкатегорію оновлено','success')
                                }catch(err){
                                  showToast(getErrMsg(err),'error')
                                }finally{
                                  setSavingChildId('')
                                }
                              }}
                              title='Зберегти'
                              aria-label='Зберегти'
                            >
                              <FiCheckCircle />
                            </button>
                            <button
                              type='button'
                              className='w-9 h-9 inline-flex items-center justify-center border rounded-lg hover:bg-gray-50 active:scale-95 transition'
                              onClick={()=> { setEditSubId(''); setEditSubName(''); }}
                              title='Скасувати'
                              aria-label='Скасувати'
                            >
                              <FiX />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type='button'
                              className='w-9 h-9 inline-flex items-center justify-center border rounded-lg hover:bg-gray-50 active:scale-95 transition'
                              onClick={()=> { setEditSubId(sc._id); setEditSubName(sc.name || ''); }}
                              title='Редагувати'
                              aria-label='Редагувати'
                            >
                              <FiEdit2 />
                            </button>
                            <button
                              type='button'
                              className='w-9 h-9 inline-flex items-center justify-center border rounded-lg hover:bg-red-50 text-red-700 active:scale-95 transition disabled:opacity-60'
                              disabled={deletingChildId === sc._id}
                              onClick={async()=>{
                                if(!confirm('Видалити підкатегорію?')) return
                                try{
                                  setDeletingChildId(sc._id)
                                  await deleteCategory(sc._id)
                                  if (editSubId === sc._id) { setEditSubId(''); setEditSubName(''); }
                                  if (catTypeParentId === sc._id) { setCatTypeParentId(''); setCatTypeName(''); }
                                  loadAll()
                                  showToast('Підкатегорію видалено','success')
                                }catch(err){
                                  showToast(getErrMsg(err),'error')
                                }finally{
                                  setDeletingChildId('')
                                }
                              }}
                              title='Видалити'
                              aria-label='Видалити'
                            >
                              <FiTrash2 />
                            </button>
                          </>
                        )}
                      </div>
                    ))
                  })()}
                </div>
              </div>

              <div className='border rounded-xl p-4 bg-white'>
                <div className='text-sm font-semibold mb-1'>Типи</div>
                <div className='text-xs text-gray-600 mb-3'>Оберіть підкатегорію цієї категорії та додайте тип товару (3-й рівень).</div>

                <div className='grid gap-2 md:grid-cols-[240px_1fr] items-center mb-3'>
                  <select
                    className='border px-3 py-2.5 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-gray-400'
                    value={catTypeParentId}
                    onChange={e=> { setCatTypeParentId(e.target.value); setCatTypeName('') }}
                  >
                    <option value=''>Оберіть підкатегорію</option>
                    {(()=>{
                      const pid = selectedCatId
                      const getParentId = (c)=>{
                        const p = c?.parent
                        if (!p) return ''
                        if (typeof p === 'string') return p
                        if (typeof p === 'object') return p?._id || p?.id || (typeof p?.toString === 'function' ? p.toString() : '')
                        return ''
                      }
                      return categories
                        .filter(c=> String(getParentId(c)||'') === String(pid))
                        .map(sc=> <option key={sc._id} value={sc._id}>{sc.name}</option>)
                    })()}
                  </select>

                  <div className='flex gap-2'>
                    <input
                      className='border px-3 py-2.5 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-gray-400'
                      value={catTypeName}
                      onChange={e=> setCatTypeName(e.target.value)}
                      placeholder='Новий тип'
                      disabled={catTypeLoading || !catTypeParentId}
                    />
                    <button
                      type='button'
                      className='px-4 py-2.5 rounded-lg bg-black text-white hover:bg-red-600 transition disabled:opacity-60 disabled:cursor-not-allowed'
                      disabled={catTypeLoading || !catTypeName.trim() || !catTypeParentId}
                      onClick={async()=>{
                        try{
                          const parent = catTypeParentId
                          const name = (catTypeName||'').trim()
                          if (!parent || !name) return
                          setCatTypeLoading(true)
                          await createCategory({ name, parent })
                          setCatTypeName('')
                          loadAll()
                          showToast('Тип створено','success')
                        }catch(err){
                          showToast(getErrMsg(err),'error')
                        }finally{
                          setCatTypeLoading(false)
                        }
                      }}
                    >
                      {catTypeLoading ? '...' : 'Додати'}
                    </button>
                  </div>
                </div>

                <div className='border rounded-lg overflow-hidden'>
                  {(()=>{
                    const pid = catTypeParentId
                    if (!pid) return <div className='p-3 text-sm text-gray-500'>Оберіть підкатегорію, щоб побачити типи.</div>
                    const getParentId = (c)=>{
                      const p = c?.parent
                      if (!p) return ''
                      if (typeof p === 'string') return p
                      if (typeof p === 'object') return p?._id || p?.id || (typeof p?.toString === 'function' ? p.toString() : '')
                      return ''
                    }
                    const types = categories.filter(c=> String(getParentId(c)||'') === String(pid))
                    if (!types.length) return <div className='p-3 text-sm text-gray-500'>Типів ще немає.</div>
                    return types.map(t=> (
                      <div key={t._id} className='px-4 py-2.5 border-t first:border-t-0 text-sm bg-white hover:bg-gray-50 flex items-center gap-2'>
                        {editTypeId === t._id ? (
                          <input
                            className='border px-2 py-1.5 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-gray-400'
                            value={editTypeName}
                            onChange={e=> setEditTypeName(e.target.value)}
                            disabled={savingChildId === t._id}
                          />
                        ) : (
                          <span className='flex-1 min-w-0 truncate'>{t.name}</span>
                        )}

                        {editTypeId === t._id ? (
                          <>
                            <button
                              type='button'
                              className='w-9 h-9 inline-flex items-center justify-center border rounded-lg hover:bg-gray-50 active:scale-95 transition disabled:opacity-60'
                              disabled={savingChildId === t._id || !editTypeName.trim()}
                              onClick={async()=>{
                                try{
                                  const name = (editTypeName||'').trim()
                                  if (!name) return
                                  setSavingChildId(t._id)
                                  await updateCategory(t._id, { name })
                                  setEditTypeId('')
                                  setEditTypeName('')
                                  loadAll()
                                  showToast('Тип оновлено','success')
                                }catch(err){
                                  showToast(getErrMsg(err),'error')
                                }finally{
                                  setSavingChildId('')
                                }
                              }}
                              title='Зберегти'
                              aria-label='Зберегти'
                            >
                              <FiCheckCircle />
                            </button>
                            <button
                              type='button'
                              className='w-9 h-9 inline-flex items-center justify-center border rounded-lg hover:bg-gray-50 active:scale-95 transition'
                              onClick={()=> { setEditTypeId(''); setEditTypeName(''); }}
                              title='Скасувати'
                              aria-label='Скасувати'
                            >
                              <FiX />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type='button'
                              className='w-9 h-9 inline-flex items-center justify-center border rounded-lg hover:bg-gray-50 active:scale-95 transition'
                              onClick={()=> { setEditTypeId(t._id); setEditTypeName(t.name || ''); }}
                              title='Редагувати'
                              aria-label='Редагувати'
                            >
                              <FiEdit2 />
                            </button>
                            <button
                              type='button'
                              className='w-9 h-9 inline-flex items-center justify-center border rounded-lg hover:bg-red-50 text-red-700 active:scale-95 transition disabled:opacity-60'
                              disabled={deletingChildId === t._id}
                              onClick={async()=>{
                                if(!confirm('Видалити тип?')) return
                                try{
                                  setDeletingChildId(t._id)
                                  await deleteCategory(t._id)
                                  if (editTypeId === t._id) { setEditTypeId(''); setEditTypeName(''); }
                                  loadAll()
                                  showToast('Тип видалено','success')
                                }catch(err){
                                  showToast(getErrMsg(err),'error')
                                }finally{
                                  setDeletingChildId('')
                                }
                              }}
                              title='Видалити'
                              aria-label='Видалити'
                            >
                              <FiTrash2 />
                            </button>
                          </>
                        )}
                      </div>
                    ))
                  })()}
                </div>
              </div>
            </div>

            <div className='px-6 py-4 border-t bg-white rounded-b-2xl flex items-center justify-end gap-2'>
              <button onClick={()=> { setShowCatEdit(false); setCatTypeParentId(''); setCatTypeName(''); }} className='px-4 py-2.5 rounded-lg border bg-white hover:bg-gray-50 transition'>Скасувати</button>
              <button onClick={async()=>{
                try{
                  if (!selectedCatId) return;
                  if (catEditingName.trim()) await updateCategory(selectedCatId, { name: catEditingName.trim() })
                  setShowCatEdit(false);
                  setCatTypeParentId('');
                  setCatTypeName('');
                  loadAll();
                  showToast(applyToProducts ? 'Категорію оновлено. Товари відобразять нову назву автоматично.' : 'Категорію оновлено','success')
                }catch(err){ showToast(getErrMsg(err),'error') }
              }} className='px-4 py-2.5 rounded-lg bg-black text-white hover:bg-red-600 transition'>Зберегти</button>
            </div>
          </div>
        </div>
      )}
      {/* Toast stack */}
      <div className='fixed top-5 right-5 z-[9999] flex flex-col gap-2 items-end' aria-live='polite' aria-atomic='true'>
        {toasts.map(t => (
          <div key={t.id} className={`max-w-sm pl-5 pr-2 py-4 rounded-xl shadow-lg border text-base font-medium flex items-center gap-3 transition-all duration-300 backdrop-blur-md ${t.type==='success' ? 'bg-green-600/85 border-white/10 text-white' : 'bg-red-600/85 border-white/10 text-white'} ${t.open ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-3'}`}>
            <span className='inline-flex items-center justify-center w-6 h-6 rounded-full bg-white/20'>
              {t.type==='success' ? <FiCheckCircle size={16} /> : <FiAlertTriangle size={16} />}
            </span>
            <span className='pr-2'>{t.message}</span>
            <button
              aria-label='Закрити'
              onClick={()=> closeToast(t.id)}
              className='ml-auto inline-flex items-center justify-center w-8 h-8 rounded-lg border border-white/30 text-white/90 hover:bg-white hover:text-black transition active:scale-95'
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {/* Заявки на доставку */}
      <div className={`${leadsFull ? 'fixed inset-0 z-50 bg-white p-4 overflow-auto' : 'mt-6 mb-6'}`}>
        <div className='flex items-center justify-between mb-2'>
          <h3 className='text-lg font-semibold'>Заявки доставки</h3>
          <button
            className='w-10 h-10 inline-flex items-center justify-center border rounded hover:bg-gray-50 active:scale-95'
            onClick={()=> setLeadsFull(v=>!v)}
            aria-label={leadsFull ? 'Вийти з повного екрану' : 'На весь екран'}
            title={leadsFull ? 'Згорнути' : 'Розгорнути'}
          >
            {leadsFull ? <FiMinimize2 /> : <FiMaximize2 />}
          </button>
        </div>
        <div className='p-3 bg-white rounded-lg border shadow-sm flex items-center justify-center gap-2 md:gap-3 mb-3 flex-wrap md:flex-nowrap'>
          <input className='border rounded w-[200px] md:w-[240px] shrink-0 h-10 px-3 text-sm' placeholder='Пошук (імʼя/телефон/місто)' value={leadSearch} onChange={e=> setLeadSearch(e.target.value)} />
          <input type='date' className='border rounded w-[180px] shrink-0 h-10 px-3 text-sm' value={leadFrom} onChange={e=> setLeadFrom(e.target.value)} />
          <input type='date' className='border rounded w-[180px] shrink-0 h-10 px-3 text-sm' value={leadTo} onChange={e=> setLeadTo(e.target.value)} />
          <select className='border rounded w-[180px] shrink-0 h-10 px-3 text-sm' value={leadStatusFilter} onChange={e=> setLeadStatusFilter(e.target.value)}>
            <option value=''>Всі статуси</option>
            {LEAD_STATUS_KEYS.map(k=> <option key={k} value={k}>{LEAD_STATUS[k]}</option>)}
          </select>
          <button
            className='inline-flex items-center justify-center w-10 h-10 border rounded hover:bg-gray-50 active:scale-95'
            onClick={()=>{ setLeadSearch(''); setLeadFrom(''); setLeadTo(''); setLeadStatusFilter(''); }}
            title='Скинути фільтри'
            aria-label='Скинути фільтри'
          >
            <FiRefreshCcw />
          </button>
        </div>
        <div className='bg-white rounded-2xl border shadow-sm overflow-hidden'>
          <div className={`rounded-lg border m-3 ${leadsFull ? '' : 'max-h-[280px] overflow-auto'}`}>
            <table className='min-w-full text-sm'>
              <thead className='bg-gray-50 sticky top-0 z-10'>
                <tr>
                  <th className='text-center px-3 py-2'>Імʼя</th>
                  <th className='text-center px-3 py-2'>Телефон</th>
                  <th className='text-center px-3 py-2'>Місто</th>
                  <th className='text-center px-3 py-2'>Адреса</th>
                  <th className='text-center px-3 py-2'>Статус</th>
                  <th className='text-center px-3 py-2'>Бажана дата</th>
                  <th className='text-center px-3 py-2'>Створено</th>
                </tr>
              </thead>
              <tbody>
                {leads
                  .filter(l=>{
                    const s = (leadSearch||'').trim().toLowerCase()
                    const okS = !s || [l.name,l.phone,l.city,l.street,l.house].map(x=> (x||'').toString().toLowerCase()).some(v=> v.includes(s))
                    if(!okS) return false
                    const cAt = new Date(l.createdAt||l.datetime||0).getTime()
                    const fromOk = !leadFrom || cAt >= new Date(leadFrom+'T00:00:00').getTime()
                    const toOk = !leadTo || cAt <= new Date(leadTo+'T23:59:59').getTime()
                    const byStatus = !leadStatusFilter || (l.status||'new')===leadStatusFilter
                    return fromOk && toOk && byStatus
                  })
                  .sort((a,b)=> new Date(b.createdAt||b.datetime||0).getTime() - new Date(a.createdAt||a.datetime||0).getTime())
                  .map(l => (
                  <tr key={l._id} className='h-12 border-t odd:bg-gray-50/40 hover:bg-gray-50 transition-colors'>
                    <td className='px-3 py-2 text-center'>{l.name}</td>
                    <td className='px-3 py-2 text-center'>{l.phone}</td>
                    <td className='px-3 py-2 text-center'>{l.city}</td>
                    <td className='px-3 py-2 text-center'>{[l.street, l.house].filter(Boolean).join(', ')}</td>
                    <td className='px-3 py-2 text-center'>
                      <select
                        className={`border rounded px-2 pr-8 py-1 text-sm font-medium cursor-pointer
                          ${ (l.status||'new')==='new' ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                            : (l.status||'new')==='in_progress' ? 'bg-sky-100 text-sky-800 border-sky-200'
                            : (l.status||'new')==='done' ? 'bg-green-100 text-green-800 border-green-200'
                            : 'bg-red-100 text-red-800 border-red-200' }`}
                        value={l.status||'new'}
                        onChange={(e)=> updateLeadStatus(l._id, e.target.value)}
                        title={LEAD_STATUS[l.status||'new']}
                        aria-label='Статус заявки'
                      >
                        {LEAD_STATUS_KEYS.map(k=> <option key={k} value={k}>{LEAD_STATUS[k]}</option>)}
                      </select>
                    </td>
                    <td className='px-3 py-2 text-center'>{fmtDateShort(l.datetime)}</td>
                    <td className='px-3 py-2 text-center'>{fmtDateShort(l.createdAt)}</td>
                  </tr>
                ))}
                {leads.length === 0 && (
                  <tr>
                    <td colSpan='6' className='px-3 py-6 text-center text-gray-500'>Заявок поки немає</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      
      <h3 className='order-last text-xl font-semibold mt-6 mb-3'>Управління товаром</h3>
      <div className={`${prodFull ? 'fixed inset-0 z-50 bg-white p-4 overflow-auto' : 'order-last mb-6'}`}>
        <div className='card p-4'>
          <div className='flex items-center justify-between mb-3'>
            <div className='flex gap-3 items-center justify-center flex-wrap flex-1'>
              <button
                type='button'
                onClick={()=> setShowProdList(true)}
                className='inline-flex items-center gap-2 px-3 py-2 border rounded hover:bg-black hover:text-white transition'
              >
                <FiEye size={18} />
                <span>Всі товари</span>
              </button>
              <button
                type='button'
                onClick={handleImportClick}
                className='inline-flex items-center gap-2 px-3 py-2 border rounded hover:bg-black hover:text-white transition'
              >
                <FiPlus size={18} />
                <span>Імпорт товарів</span>
              </button>
              <button
                type='button'
                onClick={handleExportCsv}
                className='inline-flex items-center gap-2 px-3 py-2 border rounded hover:bg-black hover:text-white transition'
              >
                <FiDownload size={18} />
                <span>Експорт CSV</span>
              </button>
              <button
                type='button'
                onClick={handleDeleteAllProducts}
                className='inline-flex items-center justify-center w-10 h-10 border rounded text-red-600 hover:bg-red-600 hover:text-white transition'
                title='Видалити всі товари'
                aria-label='Видалити всі товари'
              >
                <FiTrash2 size={18} />
              </button>
              <span className='inline-block w-px h-6 bg-gray-200' aria-hidden='true' />
              <button
                type='button'
                onClick={()=> setShowCatList(true)}
                className='inline-flex items-center gap-2 px-3 py-2 border rounded hover:bg-black hover:text-white transition'
              >
                <FiEye size={18} />
                <span>Всі категорії</span>
              </button>
            </div>
            <button
              className='w-10 h-10 inline-flex items-center justify-center border rounded hover:bg-gray-50 active:scale-95 ml-2 shrink-0'
              onClick={()=> setProdFull(v=>!v)}
              aria-label={prodFull ? 'Вийти з повного екрану' : 'На весь екран'}
              title={prodFull ? 'Згорнути' : 'Розгорнути'}
            >
              {prodFull ? <FiMinimize2 /> : <FiMaximize2 />}
            </button>
          </div>
          <div className='flex gap-2 items-center justify-center flex-wrap'>
            <input ref={importInputRef} type='file' accept='.csv,.json,text/csv,application/json' className='hidden' onChange={handleImportFile} />
          </div>

          {/* Modal: Edit Product */}
          {showProdEdit && (
            <div className='fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4'>
              <div className='bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-auto p-6' onClick={(e)=>e.stopPropagation()}>
                <div className='flex items-center justify-between mb-3'>
                  <h4 className='font-semibold'>Редагувати товар</h4>
                  <button aria-label='Закрити' onClick={()=> setShowProdEdit(false)} className='w-8 h-8 rounded-lg border'>✕</button>
                </div>
                <div className='grid gap-3'>
                  <div className='grid gap-2 md:grid-cols-[220px_1fr] md:items-center'>
                    <div className='text-sm text-gray-700'>Назва:</div>
                    <input className='border p-2 rounded w-full' required value={prodForm.name} onChange={e=>setProdForm({...prodForm, name:e.target.value})} />
                  </div>

                  <div className='grid gap-2 md:grid-cols-[220px_1fr] md:items-center'>
                    <div className='text-sm text-gray-700'>Ціна / Знижка (%):</div>
                    <div className='grid grid-cols-[2fr_1fr] gap-2'>
                      <input
                        className='border p-2 rounded'
                        required
                        type='number'
                        value={prodForm.price}
                        onChange={e=>setProdForm({...prodForm, price:Number(e.target.value)})}
                      />
                      <input
                        className='border p-2 rounded'
                        type='number'
                        min='0'
                        max='100'
                        value={prodForm.discount}
                        onChange={e=>setProdForm({...prodForm, discount: Math.max(0, Math.min(100, Number(e.target.value)||0))})}
                      />
                    </div>
                  </div>

                  <div className='grid gap-2 md:grid-cols-[220px_1fr] md:items-center'>
                    <div className='text-sm text-gray-700'>SKU / Артикул:</div>
                    <input className='border p-2 rounded w-full' value={prodForm.sku} onChange={e=>setProdForm({...prodForm, sku:e.target.value})} />
                  </div>

                  <div className='grid gap-2 md:grid-cols-[220px_1fr] md:items-center'>
                    <div className='text-sm text-gray-700'>Кількість на складі:</div>
                    <input
                      className='border p-2 rounded w-full'
                      type='number'
                      min='0'
                      value={prodForm.stock}
                      onChange={e=>setProdForm({...prodForm, stock: Math.max(0, Number(e.target.value)||0)})}
                    />
                  </div>

                  <div className='grid gap-2 md:grid-cols-[220px_1fr] md:items-center'>
                    <div className='text-sm text-gray-700'>Одиниця вимірювання:</div>
                    <input className='border p-2 rounded w-full' value={prodForm.unit} onChange={e=>setProdForm({...prodForm, unit:e.target.value})} />
                  </div>

                  <div className='grid gap-2 md:grid-cols-[220px_1fr] md:items-center'>
                    <div className='text-sm text-gray-700'>Картинка (URL / файл):</div>
                    <div className='flex'>
                      <label className='inline-flex items-center justify-center gap-2 px-3 py-2 border rounded cursor-pointer w-full sm:w-auto'>
                        <input type='file' accept='image/*' multiple className='hidden' onChange={handleFileChange} />
                        <span>{uploading ? 'Завантаження…' : 'Завантажити файл'}</span>
                      </label>
                    </div>
                  </div>

                  {Array.isArray(prodForm.images) && prodForm.images.length > 0 && (
                    <div className='grid gap-2 md:grid-cols-[220px_1fr] md:items-center'>
                      <div className='text-sm text-gray-700'>Превʼю:</div>
                      <div className='flex flex-wrap items-center gap-3'>
                        {prodForm.images.map((img, idx)=>(
                          <div key={(img?.publicId||img?.url||idx) + '_' + idx} className='relative'>
                            <img
                              src={resolveImageUrl(img?.url)}
                              alt='preview'
                              className='w-28 h-20 object-contain border rounded bg-white cursor-zoom-in'
                              referrerPolicy='no-referrer'
                              onClick={()=>openImgModal(idx)}
                            />
                            <button
                              type='button'
                              className='absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white border flex items-center justify-center'
                              onClick={()=>removeImageAt(idx)}
                              aria-label='Видалити фото'
                              title='Видалити фото'
                            >
                              <FiX size={14} />
                            </button>
                          </div>
                        ))}
                        <button
                          type='button'
                          className='px-3 py-1 border rounded'
                          onClick={()=>setProdForm(prev=> ({ ...prev, image:'', imagePublicId:'', images: [] }))}
                        >
                          Очистити всі
                        </button>
                      </div>
                    </div>
                  )}

                  <div className='grid gap-2 md:grid-cols-[220px_1fr] md:items-center'>
                    <div className='text-sm text-gray-700'>Категорія:</div>
                    <div className='space-y-3'>
                      <div className='flex gap-2 items-center'>
                        <div className='relative flex-1'>
                          <select
                            className='border p-2 pr-10 rounded w-full'
                            value={prodForm.category}
                            onChange={e=> setProdForm(prev=> ({ ...prev, category: e.target.value, subcategory:'', type:'' }))}
                          >
                            <option value=''>Виберіть категорію</option>
                            {(()=>{
                              const getParentId = (c)=>{
                                const p = c?.parent
                                if (!p) return ''
                                if (typeof p === 'string') return p
                                if (typeof p === 'object') return p?._id || p?.id || (typeof p?.toString === 'function' ? p.toString() : '')
                                return ''
                              }
                              return categories.filter(c=> !getParentId(c)).map(c=> (
                                <option key={c._id} value={c._id}>{c.name}</option>
                              ))
                            })()}
                          </select>
                        </div>
                        <button
                          type='button'
                          onClick={()=> setShowInlineCat(v=>!v)}
                          className='w-10 h-10 inline-flex items-center justify-center border rounded bg-white hover:bg-black hover:text-white transition'
                          aria-label='Додати нову категорію'
                          title='Додати категорію'
                        >
                          <FiPlus size={18} />
                        </button>
                      </div>
                      {showInlineCat && (
                        <div className='flex flex-col sm:flex-row gap-2 sm:items-center'>
                          <input
                            className='border p-2 rounded flex-1'
                            value={inlineCatName}
                            onChange={e=> setInlineCatName(e.target.value)}
                            placeholder='Нова категорія'
                          />
                          <button
                            type='button'
                            onClick={handleInlineCreateCategory}
                            disabled={inlineCatLoading || !inlineCatName.trim()}
                            className='inline-flex items-center justify-center gap-2 px-3 py-2 border rounded bg-gray-50 hover:bg-black hover:text-white transition disabled:opacity-60 disabled:cursor-not-allowed'
                          >
                            <FiPlus size={16} />
                            <span>{inlineCatLoading ? 'Створення…' : 'Додати категорію'}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className='grid gap-2 md:grid-cols-[220px_1fr] md:items-center'>
                    <div className='text-sm text-gray-700'>Підкатегорія:</div>
                    <div className='space-y-3'>
                      <div className='flex gap-2 items-center'>
                        <div className='relative flex-1'>
                          <select
                            className='border p-2 pr-10 rounded w-full'
                            value={prodForm.subcategory}
                            onChange={e=> setProdForm(prev=> ({ ...prev, subcategory: e.target.value, type:'' }))}
                            disabled={!prodForm.category}
                          >
                            <option value=''>Виберіть підкатегорію</option>
                            {(()=>{
                              const parentId = (prodForm.category || '').toString()
                              const getParentId = (c)=>{
                                const p = c?.parent
                                if (!p) return ''
                                if (typeof p === 'string') return p
                                if (typeof p === 'object') return p?._id || p?.id || (typeof p?.toString === 'function' ? p.toString() : '')
                                return ''
                              }
                              return categories
                                .filter(c=> String(getParentId(c)||'') === String(parentId))
                                .map(c=> <option key={c._id} value={c._id}>{c.name}</option>)
                            })()}
                          </select>
                        </div>
                        <button
                          type='button'
                          onClick={()=> setShowInlineSubcat(v=>!v)}
                          disabled={!prodForm.category}
                          className='w-10 h-10 inline-flex items-center justify-center border rounded bg-white hover:bg-black hover:text-white transition disabled:opacity-60 disabled:cursor-not-allowed'
                          aria-label='Додати підкатегорію'
                          title='Додати підкатегорію'
                        >
                          <FiPlus size={18} />
                        </button>
                      </div>
                      {showInlineSubcat && (
                        <div className='flex flex-col sm:flex-row gap-2 sm:items-center'>
                          <input
                            className='border p-2 rounded flex-1'
                            value={inlineSubcatName}
                            onChange={e=> setInlineSubcatName(e.target.value)}
                            placeholder='Нова підкатегорія'
                          />
                          <button
                            type='button'
                            onClick={handleInlineCreateSubcategory}
                            disabled={inlineSubcatLoading || !inlineSubcatName.trim() || !prodForm.category}
                            className='inline-flex items-center justify-center gap-2 px-3 py-2 border rounded bg-gray-50 hover:bg-black hover:text-white transition disabled:opacity-60 disabled:cursor-not-allowed'
                          >
                            <FiPlus size={16} />
                            <span>{inlineSubcatLoading ? 'Створення…' : 'Додати підкатегорію'}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className='grid gap-2 md:grid-cols-[220px_1fr] md:items-center'>
                    <div className='text-sm text-gray-700'>Тип товару:</div>
                    <div className='space-y-3'>
                      <div className='flex gap-2 items-center'>
                        <div className='relative flex-1'>
                          <select
                            className='border p-2 pr-10 rounded w-full'
                            value={prodForm.type}
                            onChange={e=> setProdForm(prev=> ({ ...prev, type: e.target.value }))}
                            disabled={!prodForm.subcategory}
                          >
                            <option value=''>Виберіть тип</option>
                            {(()=>{
                              const parentId = (prodForm.subcategory || '').toString()
                              const getParentId = (c)=>{
                                const p = c?.parent
                                if (!p) return ''
                                if (typeof p === 'string') return p
                                if (typeof p === 'object') return p?._id || p?.id || (typeof p?.toString === 'function' ? p.toString() : '')
                                return ''
                              }
                              return categories
                                .filter(c=> String(getParentId(c)||'') === String(parentId))
                                .map(c=> <option key={c._id} value={c._id}>{c.name}</option>)
                            })()}
                          </select>
                        </div>
                        <button
                          type='button'
                          onClick={()=> setShowInlineType(v=>!v)}
                          disabled={!prodForm.subcategory}
                          className='w-10 h-10 inline-flex items-center justify-center border rounded bg-white hover:bg-black hover:text-white transition disabled:opacity-60 disabled:cursor-not-allowed'
                          aria-label='Додати тип'
                          title='Додати тип'
                        >
                          <FiPlus size={18} />
                        </button>
                      </div>
                      {showInlineType && (
                        <div className='flex flex-col sm:flex-row gap-2 sm:items-center'>
                          <input
                            className='border p-2 rounded flex-1'
                            value={inlineTypeName}
                            onChange={e=> setInlineTypeName(e.target.value)}
                            placeholder='Новий тип'
                          />
                          <button
                            type='button'
                            onClick={handleInlineCreateType}
                            disabled={inlineTypeLoading || !inlineTypeName.trim() || !prodForm.subcategory}
                            className='inline-flex items-center justify-center gap-2 px-3 py-2 border rounded bg-gray-50 hover:bg-black hover:text-white transition disabled:opacity-60 disabled:cursor-not-allowed'
                          >
                            <FiPlus size={16} />
                            <span>{inlineTypeLoading ? 'Створення…' : 'Додати тип'}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className='grid gap-2 md:grid-cols-[220px_1fr]'>
                    <div className='text-sm text-gray-700 md:pt-2'>Опис:</div>
                    <textarea className='border p-2 rounded min-h-32 w-full' value={prodForm.description} onChange={e=>setProdForm({...prodForm, description:e.target.value})} />
                  </div>

                  <div className='grid gap-2 md:grid-cols-[220px_1fr]'>
                    <div></div>
                    <div className='pt-3 border-t'>
                      <div className='font-semibold'>Характеристики</div>
                    </div>
                  </div>

                  <div className='grid gap-2 md:grid-cols-[220px_1fr]'>
                    <div className='text-sm text-gray-700 md:pt-2'>Характеристики (ключ: значення):</div>
                    <div className='space-y-2'>
                      {(prodForm.specsPairs || []).map((row) => (
                        <div key={row.id} className='grid grid-cols-[1fr_1fr_auto] gap-2 items-center'>
                          <input
                            className='border p-2 rounded w-full'
                            placeholder='Ключ'
                            value={row.key}
                            onChange={(e)=>{
                              const key = e.target.value
                              setProdForm(prev=> {
                                const nextPairs = (prev.specsPairs || []).map(r=> r.id===row.id ? { ...r, key } : r)
                                return { ...prev, specsPairs: nextPairs, specsText: specsPairsToText(nextPairs) }
                              })
                            }}
                          />
                          <input
                            className='border p-2 rounded w-full'
                            placeholder='Значення'
                            value={row.value}
                            onChange={(e)=>{
                              const value = e.target.value
                              setProdForm(prev=> {
                                const nextPairs = (prev.specsPairs || []).map(r=> r.id===row.id ? { ...r, value } : r)
                                return { ...prev, specsPairs: nextPairs, specsText: specsPairsToText(nextPairs) }
                              })
                            }}
                          />
                          <button
                            type='button'
                            className='w-10 h-10 inline-flex items-center justify-center border rounded hover:bg-red-600 hover:text-white transition'
                            onClick={()=>{
                              setProdForm(prev=>{
                                const next = (prev.specsPairs||[]).filter(r=> r.id!==row.id)
                                const ensured = ensureAtLeastOneSpecRow(next)
                                return { ...prev, specsPairs: ensured, specsText: specsPairsToText(ensured) }
                              })
                            }}
                            aria-label='Видалити характеристику'
                            title='Видалити'
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                      <div>
                        <button
                          type='button'
                          className='px-3 py-2 border rounded hover:bg-black hover:text-white transition'
                          onClick={()=> setProdForm(prev=> {
                            const nextPairs = [...(prev.specsPairs||[]), newSpecRow()]
                            return { ...prev, specsPairs: nextPairs, specsText: specsPairsToText(nextPairs) }
                          })}
                        >
                          Додати характеристику
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className='grid gap-2 md:grid-cols-[220px_1fr]'>
                    <div className='text-sm text-gray-700 md:pt-2'>Характеристики текстом (Ключ: Значення;):</div>
                    <textarea
                      className='border p-2 rounded min-h-32 w-full'
                      value={prodForm.specsText || ''}
                      onChange={e=>{
                        const text = e.target.value
                        const obj = parseSpecsText(text)
                        const pairs = specsObjectToPairs(obj)
                        setProdForm(prev=> ({ ...prev, specsText: text, specsPairs: pairs }))
                      }}
                      placeholder={'Бренд: Elf Decor;\nКраїна-виробник товару: Україна;'}
                    />
                  </div>
                </div>
                <div className='mt-4 flex justify-end gap-2'>
                  <button onClick={()=> setShowProdEdit(false)} className='px-3 py-2 border rounded' disabled={savingProduct}>Скасувати</button>
                  <button
                    onClick={handleUpdate}
                    disabled={savingProduct}
                    className='px-3 py-2 bg-black text-white rounded hover:bg-red-600 transition disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center gap-2'
                  >
                    {savingProduct && <span className='w-4 h-4 rounded-full border-2 border-white/50 border-t-white animate-spin' />}
                    <span>{savingProduct ? 'Збереження…' : 'Зберегти'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Modal: Create Product */}
          {showProdCreate && (
            <div className='fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4'>
              <div className='bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[95vh] overflow-auto p-6' onClick={(e)=>e.stopPropagation()}>
                <div className='flex items-center justify-between mb-3'>
                  <h4 className='font-semibold'>Новий товар</h4>
                  <button aria-label='Закрити' onClick={()=> setShowProdCreate(false)} className='w-8 h-8 rounded-lg border'>✕</button>
                </div>
                <div className='grid md:grid-cols-2 gap-3'>
                  <input className='border p-2 rounded' required placeholder='Назва' value={prodForm.name} onChange={e=>setProdForm({...prodForm, name:e.target.value})} />
                  <div className='grid grid-cols-[2fr_1fr] gap-2'>
                    <input
                      className='border p-2 rounded'
                      required
                      type='number'
                      placeholder='Ціна'
                      value={prodForm.price}
                      onChange={e=>setProdForm({...prodForm, price:Number(e.target.value)})}
                    />
                    <input
                      className='border p-2 rounded'
                      type='number'
                      min='0'
                      max='100'
                      placeholder='Discount %'
                      value={prodForm.discount}
                      onChange={e=>setProdForm({...prodForm, discount: Math.max(0, Math.min(100, Number(e.target.value)||0))})}
                    />
                  </div>
                  <div className='grid grid-cols-3 gap-2'>
                    <input
                      className='border p-2 rounded'
                      placeholder='SKU / артикул'
                      value={prodForm.sku}
                      onChange={e=>setProdForm({...prodForm, sku:e.target.value})}
                    />
                    <input
                      className='border p-2 rounded'
                      type='number'
                      min='0'
                      placeholder='Кількість на складі'
                      value={prodForm.stock}
                      onChange={e=>setProdForm({...prodForm, stock: Math.max(0, Number(e.target.value)||0)})}
                    />
                    <input
                      className='border p-2 rounded'
                      placeholder='Одиниця (шт, м, кг...)'
                      value={prodForm.unit}
                      onChange={e=>setProdForm({...prodForm, unit:e.target.value})}
                    />
                  </div>

                  <div className='md:col-span-2 space-y-3'>
                    <div className='flex gap-2 items-center'>
                      <div className='relative flex-1'>
                        <select className='border p-2 pr-10 rounded w-full' value={prodForm.category} onChange={e=>setProdForm({...prodForm, category:e.target.value, subcategory:''})}>
                          <option value=''>Виберіть категорію</option>
                          {categories.filter(c=> !c.parent).map(c=> <option key={c._id} value={c._id}>{c.name}</option>)}
                        </select>
                        <span className='pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-500'>
                          <svg xmlns='http://www.w3.org/2000/svg' className='h-4 w-4' viewBox='0 0 20 20' fill='currentColor'>
                            <path fillRule='evenodd' d='M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z' clipRule='evenodd' />
                          </svg>
                        </span>
                      </div>
                      <button
                        type='button'
                        onClick={()=> setShowInlineCat(v=>!v)}
                        className='w-10 h-10 inline-flex items-center justify-center border rounded bg-white hover:bg-black hover:text-white transition'
                        aria-label='Додати нову категорію'
                      >
                        <FiPlus size={18} />
                      </button>
                    </div>

                    {showInlineCat && (
                      <div className='flex flex-col sm:flex-row gap-2 sm:items-center'>
                        <input
                          className='border p-2 rounded flex-1'
                          value={inlineCatName}
                          onChange={e=> setInlineCatName(e.target.value)}
                          placeholder='Назва категорії'
                        />
                        <button
                          type='button'
                          onClick={handleInlineCreateCategory}
                          disabled={inlineCatLoading || !inlineCatName.trim()}
                          className='inline-flex items-center justify-center gap-2 px-3 py-2 border rounded bg-gray-50 hover:bg-black hover:text-white transition disabled:opacity-60 disabled:cursor-not-allowed'
                        >
                          <FiPlus size={16} />
                          <span>{inlineCatLoading ? 'Створення…' : 'Додати категорію'}</span>
                        </button>
                      </div>
                    )}

                    <div className='space-y-2'>
                      <div className='flex gap-2 items-center'>
                        <div className='relative flex-1'>
                          <select
                            className='border p-2 pr-10 rounded w-full'
                            value={prodForm.subcategory}
                            onChange={e=>setProdForm({...prodForm, subcategory:e.target.value})}
                            disabled={!prodForm.category}
                          >
                            <option value=''>Всі підкатегорії</option>
                            {categories
                              .filter(c=> {
                                const pid = (typeof c.parent === 'object'
                                  ? (c.parent?._id || c.parent?.id || (typeof c.parent?.toString === 'function' ? c.parent.toString() : ''))
                                  : c.parent)
                                return Boolean(prodForm.category) && String(pid||'') === String(prodForm.category)
                              })
                              .map(c=> <option key={c._id} value={c._id}>{c.name}</option>)}
                          </select>
                        </div>
                        <button
                          type='button'
                          onClick={()=> setShowInlineSubcat(v=>!v)}
                          disabled={!prodForm.category}
                          className='w-10 h-10 inline-flex items-center justify-center border rounded bg-white hover:bg-black hover:text-white transition disabled:opacity-60 disabled:cursor-not-allowed'
                          aria-label='Додати підкатегорію'
                          title='Додати підкатегорію'
                        >
                          <FiPlus size={18} />
                        </button>
                      </div>

                      {showInlineSubcat && (
                        <div className='flex flex-col sm:flex-row gap-2 sm:items-center'>
                          <input
                            className='border p-2 rounded flex-1'
                            value={inlineSubcatName}
                            onChange={e=> setInlineSubcatName(e.target.value)}
                            placeholder='Назва підкатегорії'
                          />
                          <button
                            type='button'
                            onClick={handleInlineCreateSubcategory}
                            disabled={inlineSubcatLoading || !inlineSubcatName.trim() || !prodForm.category}
                            className='inline-flex items-center justify-center gap-2 px-3 py-2 border rounded bg-gray-50 hover:bg-black hover:text-white transition disabled:opacity-60 disabled:cursor-not-allowed'
                          >
                            <FiPlus size={16} />
                            <span>{inlineSubcatLoading ? 'Створення…' : 'Додати підкатегорію'}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className='md:col-span-2 grid gap-2 sm:grid-cols-[1fr_auto] items-center'>
                    <input className='border p-2 rounded' placeholder='URL картинки' value={prodForm.image} onChange={e=>setProdForm({...prodForm, image:e.target.value})} />
                    <label className='inline-flex items-center gap-2 px-3 py-2 border rounded cursor-pointer'>
                      <input type='file' accept='image/*' multiple className='hidden' onChange={handleFileChange} />
                      <span>{uploading ? 'Завантаження…' : 'Завантажити файл'}</span>
                    </label>
                  </div>

                  {Array.isArray(prodForm.images) && prodForm.images.length > 0 && (
                    <div className='md:col-span-2 flex flex-wrap items-center gap-3'>
                      {prodForm.images.map((img, idx)=>(
                        <div key={(img?.publicId||img?.url||idx) + '_' + idx} className='relative'>
                          <img
                            src={resolveImageUrl(img?.url)}
                            alt='preview'
                            className='w-28 h-20 object-contain border rounded bg-white cursor-zoom-in'
                            referrerPolicy='no-referrer'
                            onClick={()=>openImgModal(idx)}
                          />
                          <button
                            type='button'
                            className='absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white border flex items-center justify-center'
                            onClick={()=>removeImageAt(idx)}
                            aria-label='Видалити фото'
                            title='Видалити фото'
                          >
                            <FiX size={14} />
                          </button>
                        </div>
                      ))}
                      <button
                        type='button'
                        className='px-3 py-1 border rounded'
                        onClick={()=>setProdForm(prev=> ({ ...prev, image:'', imagePublicId:'', images: [] }))}
                      >
                        Очистити всі
                      </button>
                    </div>
                  )}
                  <div className='md:col-span-2 space-y-2'>
                    <div className='flex gap-2 items-center'>
                      <div className='relative flex-1'>
                        <select className='border p-2 pr-10 rounded w-full' value={prodForm.category} onChange={e=>setProdForm({...prodForm, category:e.target.value})}>
                          <option value=''>Виберіть категорію</option>
                          {categories.map(c=> <option key={c._id} value={c._id}>{c.name}</option>)}
                        </select>
                        <span className='pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-500'>
                          <svg xmlns='http://www.w3.org/2000/svg' className='h-4 w-4' viewBox='0 0 20 20' fill='currentColor'>
                            <path fillRule='evenodd' d='M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z' clipRule='evenodd' />
                          </svg>
                        </span>
                      </div>
                      <button
                        type='button'
                        onClick={()=> setShowInlineCat(v=>!v)}
                        className='w-10 h-10 inline-flex items-center justify-center border rounded bg-white hover:bg-black hover:text-white transition'
                        aria-label='Додати нову категорію'
                      >
                        <FiPlus size={18} />
                      </button>
                    </div>
                    {showInlineCat && (
                      <div className='flex flex-col sm:flex-row gap-2 sm:items-center'>
                        <input
                          className='border p-2 rounded flex-1'
                          placeholder='Нова категорія'
                          value={inlineCatName}
                          onChange={e=> setInlineCatName(e.target.value)}
                        />
                        <button
                          type='button'
                          onClick={handleInlineCreateCategory}
                          disabled={inlineCatLoading || !inlineCatName.trim()}
                          className='inline-flex items-center justify-center gap-2 px-3 py-2 border rounded bg-gray-50 hover:bg-black hover:text-white transition disabled:opacity-60 disabled:cursor-not-allowed'
                        >
                          <FiPlus size={16} />
                          <span>{inlineCatLoading ? 'Створення…' : 'Додати категорію'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                  <textarea className='md:col-span-2 border p-2 rounded' placeholder='Опис' value={prodForm.description} onChange={e=>setProdForm({...prodForm, description:e.target.value})} />

                  <div className='md:col-span-2 pt-3 border-t'>
                    <div className='font-semibold'>Характеристики</div>
                  </div>

                  <div className='md:col-span-2'>
                    <div className='text-sm text-gray-600 mb-1'>Характеристики</div>
                    <div className='space-y-2'>
                      {(prodForm.specsPairs || []).map((row) => (
                        <div key={row.id} className='grid grid-cols-[1fr_1fr_auto] gap-2 items-center'>
                          <input
                            className='border p-2 rounded w-full'
                            placeholder='Ключ'
                            value={row.key}
                            onChange={(e)=>{
                              const key = e.target.value
                              setProdForm(prev=> {
                                const nextPairs = (prev.specsPairs || []).map(r=> r.id===row.id ? { ...r, key } : r)
                                return { ...prev, specsPairs: nextPairs, specsText: specsPairsToText(nextPairs) }
                              })
                            }}
                          />
                          <input
                            className='border p-2 rounded w-full'
                            placeholder='Значення'
                            value={row.value}
                            onChange={(e)=>{
                              const value = e.target.value
                              setProdForm(prev=> {
                                const nextPairs = (prev.specsPairs || []).map(r=> r.id===row.id ? { ...r, value } : r)
                                return { ...prev, specsPairs: nextPairs, specsText: specsPairsToText(nextPairs) }
                              })
                            }}
                          />
                          <button
                            type='button'
                            className='w-10 h-10 inline-flex items-center justify-center border rounded hover:bg-red-600 hover:text-white transition'
                            onClick={() => {
                              setProdForm(prev => {
                                const next = (prev.specsPairs || []).filter(r => r.id !== row.id)
                                const ensured = ensureAtLeastOneSpecRow(next)
                                return { ...prev, specsPairs: ensured, specsText: specsPairsToText(ensured) }
                              })
                            }}
                            aria-label='Видалити характеристику'
                            title='Видалити'
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                      <div>
                        <button
                          type='button'
                          className='px-3 py-2 border rounded hover:bg-black hover:text-white transition'
                          onClick={()=> setProdForm(prev=> {
                            const nextPairs = [...(prev.specsPairs||[]), newSpecRow()]
                            return { ...prev, specsPairs: nextPairs, specsText: specsPairsToText(nextPairs) }
                          })}
                        >
                          Додати характеристику
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className='md:col-span-2'>
                    <div className='text-sm text-gray-600 mb-1'>Характеристики текстом (Ключ: Значення;)</div>
                    <textarea
                      className='border p-2 rounded min-h-32 w-full'
                      value={prodForm.specsText || ''}
                      onChange={e=>{
                        const text = e.target.value
                        const obj = parseSpecsText(text)
                        const pairs = specsObjectToPairs(obj)
                        setProdForm(prev=> ({ ...prev, specsText: text, specsPairs: pairs }))
                      }}
                      placeholder={'Бренд: Elf Decor;\nКраїна-виробник товару: Україна;'}
                    />
                  </div>
                </div>
                <div className='mt-4 flex justify-end gap-2'>
                  <button onClick={()=> setShowProdCreate(false)} className='px-3 py-2 border rounded' disabled={savingProduct}>Скасувати</button>
                  <button
                    onClick={handleCreateProduct}
                    disabled={savingProduct}
                    className='px-3 py-2 bg-black text-white rounded hover:bg-red-600 transition disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center gap-2'
                  >
                    {savingProduct && <span className='w-4 h-4 rounded-full border-2 border-white/50 border-t-white animate-spin' />}
                    <span>{savingProduct ? 'Створення…' : 'Створити'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal: View All Products (list) */}
        {showProdList && (
          <div className='fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4'>
            <div
              className={`bg-white rounded-3xl shadow-2xl overflow-auto p-6 ${prodFull ? 'w-full h-full max-w-none' : 'w-full max-w-6xl max-h-[90vh]'}`}
              onClick={(e)=>e.stopPropagation()}
            >
              <div className='flex items-center justify-between mb-4 border-b pb-3'>
                <div className='flex flex-col gap-0.5'>
                  <h4 className='font-semibold'>Усі товари</h4>
                  <span className='text-xs text-gray-500'>
                    Всього товарів: {loadingAll ? 'Завантаження…' : products.length}
                  </span>
                </div>
                <div className='flex items-center gap-2'>
                  <button
                    className='w-8 h-8 rounded-lg border hover:bg-gray-100 flex items-center justify-center'
                    onClick={()=> setProdFull(v=>!v)}
                    aria-label={prodFull ? 'Вийти з повного екрану' : 'На весь екран'}
                    title={prodFull ? 'Згорнути' : 'Розгорнути'}
                  >
                    {prodFull ? <FiMinimize2 size={16} /> : <FiMaximize2 size={16} />}
                  </button>
                  <button
                    className='w-8 h-8 rounded-lg border hover:bg-gray-100 flex items-center justify-center'
                    onClick={()=> loadAll()}
                    aria-label='Оновити'
                    title='Оновити'
                    disabled={loadingAll}
                  >
                    <FiRefreshCcw size={16} />
                  </button>
                  <button aria-label='Закрити' onClick={()=> setShowProdList(false)} className='w-8 h-8 rounded-lg border hover:bg-gray-100'>✕</button>
                </div>
              </div>
              <div className='mb-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3'>
                <div className='flex items-center gap-2'>
                  <span className='text-sm text-gray-600'>Сортувати:</span>
                  <select
                    className='border rounded px-2 py-1.5 pr-8 text-sm min-w-[180px]'
                    value={prodSortMode}
                    onChange={e=>{ setProdSortMode(e.target.value); setProdPage(1) }}
                    disabled={loadingAll}
                  >
                    <option value='price_asc'>Ціна (↑)</option>
                    <option value='price_desc'>Ціна (↓)</option>
                    <option value='stock_asc'>Кількість (↑)</option>
                    <option value='stock_desc'>Кількість (↓)</option>
                    <option value='date_desc'>Дата (нові)</option>
                    <option value='date_asc'>Дата (старі)</option>
                  </select>
                </div>
                <div className='flex items-center justify-end gap-1 flex-1 flex-wrap md:flex-nowrap'>
                  <select
                    className='border rounded px-2 py-1.5 pr-8 text-sm w-full sm:w-auto min-w-[120px]'
                    value={prodCatFilter}
                    onChange={e=>{ setProdCatFilter(e.target.value); setProdSubcatFilter(''); setProdTypeFilter(''); setProdPage(1) }}
                    title='Фільтр по категорії'
                    disabled={loadingAll}
                  >
                    <option value=''>Всі категорії</option>
                    {(()=>{
                      const getParentId = (c)=>{
                        const p = c?.parent
                        if (!p) return ''
                        if (typeof p === 'string') return p
                        if (typeof p === 'object') return p?._id || p?.id || (typeof p?.toString === 'function' ? p.toString() : '')
                        return ''
                      }
                      return categories.filter(c=> !getParentId(c)).map(c=> (
                        <option key={c._id} value={c._id}>{c.name}</option>
                      ))
                    })()}
                  </select>

                  <select
                    className='border rounded px-2 py-1.5 pr-8 text-sm w-full sm:w-auto min-w-[140px]'
                    value={prodSubcatFilter}
                    onChange={e=>{ setProdSubcatFilter(e.target.value); setProdTypeFilter(''); setProdPage(1) }}
                    disabled={!prodCatFilter}
                    title='Фільтр по підкатегорії'
                  >
                    <option value=''>Всі підкатегорії</option>
                    {(()=>{
                      const parentId = (prodCatFilter || '').toString()
                      const getParentId = (c)=>{
                        const p = c?.parent
                        if (!p) return ''
                        if (typeof p === 'string') return p
                        if (typeof p === 'object') return p?._id || p?.id || (typeof p?.toString === 'function' ? p.toString() : '')
                        return ''
                      }
                      return categories
                        .filter(c=> String(getParentId(c)||'') === String(parentId))
                        .map(c=> <option key={c._id} value={c._id}>{c.name}</option>)
                    })()}
                  </select>

                  <select
                    className='border rounded px-2 py-1.5 pr-8 text-sm w-full sm:w-auto min-w-[140px]'
                    value={prodTypeFilter}
                    onChange={e=>{ setProdTypeFilter(e.target.value); setProdPage(1) }}
                    disabled={!prodSubcatFilter}
                    title='Фільтр по типу'
                  >
                    <option value=''>Всі типи</option>
                    {(()=>{
                      const parentId = (prodSubcatFilter || '').toString()
                      const getParentId = (c)=>{
                        const p = c?.parent
                        if (!p) return ''
                        if (typeof p === 'string') return p
                        if (typeof p === 'object') return p?._id || p?.id || (typeof p?.toString === 'function' ? p.toString() : '')
                        return ''
                      }
                      return categories
                        .filter(c=> String(getParentId(c)||'') === String(parentId))
                        .map(c=> <option key={c._id} value={c._id}>{c.name}</option>)
                    })()}
                  </select>

                  <input
                    className='border rounded px-2 py-1.5 text-sm w-full sm:w-auto max-w-[140px]'
                    placeholder='Пошук...'
                    value={prodListSearch}
                    onChange={e=>{ setProdListSearch(e.target.value); setProdPage(1) }}
                    disabled={loadingAll}
                  />
                </div>
              </div>
              <div className={`relative ${prodFull ? 'h-[calc(100vh-220px)]' : 'max-h-[70vh]'} overflow-auto rounded-lg border`}>
                {loadingAll && (
                  <div className='absolute inset-0 z-20 bg-white/70 backdrop-blur-sm flex items-center justify-center'>
                    <div className='flex items-center gap-3 text-sm text-gray-700'>
                      <span className='w-6 h-6 rounded-full border-2 border-gray-300 border-t-black animate-spin' />
                      <span>Завантаження…</span>
                    </div>
                  </div>
                )}
                <table className='min-w-full text-sm'>
                  <thead className='bg-gray-50 sticky top-0 z-10'>
                    <tr>
                      <th className='px-3 py-2 text-center'>Фото</th>
                      <th className='px-3 py-2 text-center'>Назва</th>
                      <th className='px-3 py-2 text-center'>Ціна</th>
                      <th className='px-3 py-2 text-center'>Кількість</th>
                      {(()=>{
                        const mode = (prodSortMode || 'date_desc').toString()
                        const sortKey = mode.split('_')[0]
                        return sortKey === 'date' ? (
                          <th className='px-3 py-2 text-center'>Дата</th>
                        ) : null
                      })()}
                      <th className='px-3 py-2 text-center'>Категорія</th>
                      <th className='px-3 py-2 text-center'>Підкатегорія</th>
                      <th className='px-3 py-2 text-center'>Тип</th>
                      <th className='px-3 py-2 text-center'>Дії</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(()=>{
                      const term = prodListSearch.trim().toLowerCase();
                      const catId = (prodCatFilter || '').toString();
                      const subId = (prodSubcatFilter || '').toString();
                      const typeId = (prodTypeFilter || '').toString();
                      const mode = (prodSortMode || 'date_desc').toString()
                      const sortKey = mode.split('_')[0]
                      const sortDir = mode.endsWith('_desc') ? -1 : 1
                      const showDateCol = sortKey === 'date'
                      const getId = (v)=>{
                        if (!v) return '';
                        if (typeof v === 'string') return v;
                        if (typeof v === 'object') return v?._id || v?.id || (typeof v?.toString === 'function' ? v.toString() : '');
                        return '';
                      }
                      const list = products
                        .filter(p=>{
                          if (!term) return true;
                          const name = (p.name||'').toLowerCase();
                          const sku  = (p.sku||'').toLowerCase();
                          return name.includes(term) || sku.includes(term);
                        })
                        .filter(p=>{
                          if (!catId) return true;
                          return String(getId(p.category)||'') === String(catId);
                        })
                        .filter(p=>{
                          if (!subId) return true;
                          return String(getId(p.subcategory)||'') === String(subId);
                        })
                        .filter(p=>{
                          if (!typeId) return true;
                          return String(getId(p.type)||'') === String(typeId);
                        })
                        .sort((a,b)=>{
                          const dir = sortDir
                          if (sortKey==='price'){
                            const av = Number(a.price||0), bv = Number(b.price||0)
                            return (av - bv) * dir
                          }
                          if (sortKey==='stock'){
                            const av = Number(a.stock??0), bv = Number(b.stock??0)
                            return (av - bv) * dir
                          }
                          if (sortKey==='date'){
                            const av = new Date(a.createdAt || 0).getTime()
                            const bv = new Date(b.createdAt || 0).getTime()
                            return (av - bv) * dir
                          }
                          // fallback: date desc
                          const av = new Date(a.createdAt || 0).getTime()
                          const bv = new Date(b.createdAt || 0).getTime()
                          return (bv - av)
                        })
                      const rows = list
                      return rows.map(p=> (
                        <tr key={p._id} className='border-t odd:bg-gray-50/40 hover:bg-gray-50 transition-colors'>
                          <td className='px-3 py-2 text-center'>
                            <div className='w-16 h-12 bg-gray-50 border rounded flex items-center justify-center overflow-hidden'>
                              <img
                                src={resolveImageUrl((p.images && p.images[0] && p.images[0].url) ? p.images[0].url : p.image) || placeholderProductImg}
                                alt={p.name}
                                className='w-full h-full object-contain'
                                referrerPolicy='no-referrer'
                                onError={(e)=>{ e.currentTarget.onerror=null; e.currentTarget.src = placeholderProductImg }}
                              />
                            </div>
                          </td>
                          <td className='px-3 py-2 text-center'>{p.name}</td>
                          <td className='px-3 py-2 text-center'>
                            {(p.price||0).toFixed(2)} ₴
                            {p.discount ? ' (' + p.discount + '%)' : ''}
                          </td>
                          <td className='px-3 py-2 text-center'>
                            {p.stock ?? 0}
                            {p.unit ? ' ' + p.unit : ''}
                          </td>
                          {showDateCol ? (
                            <td className='px-3 py-2 text-center'>{fmtDateShort(p.createdAt)}</td>
                          ) : null}
                          <td className='px-3 py-2 text-center'>{getCategoryName(p.category)}</td>
                          <td className='px-3 py-2 text-center'>{getCategoryName(p.subcategory)}</td>
                          <td className='px-3 py-2 text-center'>{getCategoryName(p.type)}</td>
                          <td className='px-3 py-2 text-center align-middle'>
                            <div className='inline-flex flex-row items-center justify-center gap-2'>
                              <button
                                title='Превʼю'
                                aria-label='Превʼю'
                                className='w-9 h-9 inline-flex items-center justify-center border rounded-lg hover:bg-black hover:text-white transition bg-white'
                                onClick={() => {
                                  setPreviewProd(p)
                                  setShowProdPreview(true)
                                }}
                              >
                                <FiEye size={16} />
                              </button>
                              <button
                                title='Редагувати'
                                aria-label='Редагувати'
                                className='w-9 h-9 inline-flex items-center justify-center border rounded-lg hover:bg-black hover:text-white transition bg-white'
                                onClick={() => {
                                  setSelectedProdId(p._id);
                                  const specsObj = (()=>{
                                    const s = p.specs
                                    if (!s) return {}
                                    if (s instanceof Map) return Object.fromEntries(s)
                                    if (typeof s === 'object') return s
                                    return {}
                                  })()
                                  const specsText = Object.entries(specsObj)
                                    .map(([k, v]) => `${String(k).trim()}: ${String(v ?? '').trim()};`)
                                    .join('\n')
                                  setProdForm({
                                    name: p.name||'',
                                    price: p.price||0,
                                    discount: p.discount||0,
                                    image: p.image||'',
                                    imagePublicId: p.imagePublicId||'',
                                    images: Array.isArray(p.images) && p.images.length
                                      ? p.images
                                      : ((p.image||p.imagePublicId) ? [{ url: p.image||'', publicId: p.imagePublicId||'' }] : []),
                                    description: p.description||'',
                                    specsPairs: specsObjectToPairs(specsObj),
                                    specsText,
                                    category: p.category?._id || p.category || '',
                                    subcategory: p.subcategory?._id || p.subcategory || '',
                                    type: p.type?._id || p.type || '',
                                    sku: p.sku||'',
                                    stock: p.stock||0,
                                    unit: p.unit||'',
                                  });
                                  setShowProdEdit(true);
                                }}
                              >
                                <FiEdit2 size={16} />
                              </button>
                              <button
                                title='Видалити'
                                aria-label='Видалити'
                                className='w-9 h-9 inline-flex items-center justify-center border rounded-lg text-red-600 hover:bg-red-600 hover:text-white transition bg-white disabled:opacity-60 disabled:cursor-not-allowed'
                                disabled={Boolean(deletingProductId)}
                                onClick={()=> handleDeleteProduct(p._id)}
                              >
                                {deletingProductId === p._id ? (
                                  <span className='w-4 h-4 rounded-full border-2 border-red-300 border-t-red-600 animate-spin' />
                                ) : (
                                  <FiTrash2 size={16} />
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    })()}
                  </tbody>
                </table>
              </div>
              
            </div>
          </div>
        )}

        {showProdPreview && (
          <div
            className='fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4'
            onClick={()=>{ setShowProdPreview(false); setPreviewProd(null) }}
          >
            <div
              className='bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-auto p-6'
              onClick={(e)=>e.stopPropagation()}
            >
              <div className='flex items-center justify-between mb-4'>
                <div className='font-semibold'>Превʼю товару</div>
                <button
                  type='button'
                  className='w-9 h-9 inline-flex items-center justify-center border rounded-lg hover:bg-black hover:text-white transition'
                  onClick={()=>{ setShowProdPreview(false); setPreviewProd(null) }}
                  aria-label='Закрити'
                  title='Закрити'
                >
                  <FiX size={16} />
                </button>
              </div>
              {previewProd ? (
                <div className='max-w-sm mx-auto'>
                  <ProductCard p={previewProd} onAdd={()=>{}} />
                </div>
              ) : (
                <div className='text-sm text-gray-500'>Товар не вибрано</div>
              )}
            </div>
          </div>
        )}

        <div className='hidden'>
          <h3 className='font-semibold mb-1 text-center'>Категорії (розширені налаштування)</h3>
          <p className='text-xs text-gray-500 text-center mb-3'>
            Для швидкого додавання використовуйте поле "Нова категорія" у формі товару. Тут можна масово переглядати, перейменовувати та видаляти категорії.
          </p>
          <div className='flex gap-2 items-center justify-center'>
            <button type='button' onClick={()=> setShowCatList(true)} className='inline-flex items-center gap-2 px-3 py-2 border rounded hover:bg-black hover:text-white transition'>
              <FiEye size={18} /> <span>Переглянути всі</span>
            </button>
            <button type='button' onClick={()=> setShowCatCreate(true)} className='inline-flex items-center gap-2 px-3 py-2 border rounded hover:bg-black hover:text-white transition'>
              <FiPlus size={18} /> <span>Нова категорія</span>
            </button>
          </div>

          {/* Modal: Edit Category */}
          {showCatEdit && (
            <div className='fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4' onClick={()=> setShowCatEdit(false)}>
              <div className='bg-white rounded-xl shadow-2xl w-full max-w-md p-5' onClick={(e)=>e.stopPropagation()}>
                <div className='flex items-center justify-between mb-3'>
                  <h4 className='font-semibold'>Редагувати категорію</h4>
                  <button aria-label='Закрити' onClick={()=> setShowCatEdit(false)} className='w-8 h-8 rounded-lg border'>✕</button>
                </div>
                <label className='text-sm text-gray-600'>Назва</label>
                <input className='border p-2 rounded w-full mb-3' value={catEditingName} onChange={e=>setCatEditingName(e.target.value)} />
                <label className='flex items-start gap-2 mb-3 text-sm'>
                  <input type='checkbox' className='mt-1' checked={applyToProducts} onChange={(e)=> setApplyToProducts(e.target.checked)} />
                  <span>
                    Застосувати нову назву до всіх товарів цієї категорії
                    <div className='text-gray-500'>Товари посилаються на категорію за ID, тому нова назва відобразиться автоматично.</div>
                  </span>
                </label>
                <div className='flex justify-end gap-2'>
                  <button onClick={()=> setShowCatEdit(false)} className='px-3 py-2 border rounded'>Скасувати</button>
                  <button onClick={async()=>{
                    try{
                      if (!selectedCatId) return;
                      // оновити назву
                      if (catEditingName.trim()) await updateCategory(selectedCatId, { name: catEditingName.trim() })
                      setShowCatEdit(false);
                      loadAll();
                      showToast(applyToProducts ? 'Категорію оновлено. Товари відобразять нову назву автоматично.' : 'Категорію оновлено','success')
                    }catch(err){ showToast(getErrMsg(err),'error') }
                  }} className='px-3 py-2 bg-black text-white rounded hover:bg-red-600 transition'>Зберегти</button>
                </div>
              </div>
            </div>
          )}

          {/* Modal: Create Category */}
          {showCatCreate && (
            <div className='fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4' onClick={()=> setShowCatCreate(false)}>
              <div className='bg-white rounded-xl shadow-2xl w-full max-w-md p-5' onClick={(e)=>e.stopPropagation()}>
                <div className='flex items-center justify-between mb-3'>
                  <h4 className='font-semibold'>Нова категорія</h4>
                  <button aria-label='Закрити' onClick={()=> setShowCatCreate(false)} className='w-8 h-8 rounded-lg border'>✕</button>
                </div>
                <label className='text-sm text-gray-600'>Назва</label>
                <input className='border p-2 rounded w-full mb-4' value={catName} onChange={e=>setCatName(e.target.value)} placeholder='Введіть назву категорії' />
                <div className='flex justify-end gap-2'>
                  <button onClick={()=> setShowCatCreate(false)} className='px-3 py-2 border rounded'>Скасувати</button>
                  <button onClick={async()=>{
                    try{
                      await createCategory({ name: (catName||'').trim() });
                      setCatName(''); setShowCatCreate(false); loadAll();
                      showToast('Категорію створено','success')
                    }catch(err){ showToast(getErrMsg(err),'error') }
                  }} className='px-3 py-2 bg-black text-white rounded hover:bg-red-600 transition'>Створити</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal: View All Categories (list) */}
      {showCatList && (
        <div className='fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4' onClick={()=> setShowCatList(false)}>
          <div className='bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] overflow-auto p-6' onClick={(e)=>e.stopPropagation()}>
            <div className='flex items-center justify-between mb-4 border-b pb-3'>
              <h4 className='font-semibold'>Усі категорії</h4>
              <button aria-label='Закрити' onClick={()=> setShowCatList(false)} className='w-8 h-8 rounded-lg border hover:bg-gray-100'>✕</button>
            </div>
            <div className='mb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3'>
              <div className='flex items-center gap-2'>
                <span className='text-sm text-gray-600'>Сортування:</span>
                <select
                  className='border rounded px-3 py-2 pr-10 min-w-[150px]'
                  value={catSortKey}
                  onChange={e=> setCatSortKey(e.target.value)}
                >
                  <option value='name'>Назва</option>
                  <option value='date'>Дата</option>
                </select>
                <button
                  className='px-3 py-2 border rounded hover:bg-black hover:text-white transition'
                  onClick={()=> setCatSortAsc(v=>!v)}
                  title={catSortAsc ? 'За зростанням' : 'За спаданням'}
                >
                  {catSortAsc ? '↑' : '↓'}
                </button>
              </div>
              <div className='flex items-center justify-end gap-2 flex-1'>
                {catSearchOpen && (
                  <input
                    autoFocus
                    className='border rounded px-3 py-2 w-full max-w-xs'
                    placeholder='Пошук за назвою'
                    value={catListSearch}
                    onChange={e=>{ setCatListSearch(e.target.value); setCatPage(1) }}
                  />
                )}
                <button
                  type='button'
                  onClick={()=> setCatSearchOpen(v=>!v)}
                  className='w-9 h-9 inline-flex items-center justify-center border rounded hover:bg-black hover:text-white transition'
                  title='Пошук'
                  aria-label='Пошук категорій'
                >
                  <FiSearch size={16} />
                </button>
              </div>
            </div>
            <div className='max-h-[78vh] overflow-auto rounded-lg border'>
              <table className='min-w-full text-sm'>
                <thead className='bg-gray-50 sticky top-0 z-10'>
                  <tr>
                    <th className='px-3 py-2 text-center'>Назва</th>
                    <th className='px-3 py-2 text-center'>Дата</th>
                    <th className='px-3 py-2 text-center'>Дії</th>
                  </tr>
                </thead>
                <tbody>
                  {(()=>{
                    const getParentId = (c)=>{
                      const p = c?.parent
                      if (!p) return ''
                      if (typeof p === 'string') return p
                      if (typeof p === 'object') return p?._id || p?.id || (typeof p?.toString === 'function' ? p.toString() : '')
                      return ''
                    }
                    const q = catListSearch.trim().toLowerCase()
                    const list = categories
                      .filter(c=> !getParentId(c))
                      .filter(c=> !q ? true : c.name.toLowerCase().includes(q))
                      .sort((a,b)=>{
                        const dir = catSortAsc ? 1 : -1
                        if (catSortKey==='date'){
                          const av = new Date(a.createdAt||0).getTime()
                          const bv = new Date(b.createdAt||0).getTime()
                          return (av - bv) * dir
                        }
                        return a.name.localeCompare(b.name) * dir
                      })
                    const subsByParent = (pid)=>{
                      return categories
                        .filter(x=> String(getParentId(x)||'') === String(pid||''))
                        .sort((a,b)=> a.name.localeCompare(b.name))
                    }
                    return list.flatMap(c=>{
                      const isOpen = String(expandedCatId||'') === String(c._id||'')
                      const subs = isOpen ? subsByParent(c._id) : []
                      const mainRow = (
                        <tr
                          key={c._id}
                          className='border-t odd:bg-gray-50/40 hover:bg-gray-50 transition-colors cursor-pointer'
                          onClick={()=> setExpandedCatId(prev=> String(prev||'')===String(c._id||'') ? '' : c._id)}
                          title='Натисніть, щоб показати/сховати підкатегорії'
                        >
                          <td className='px-3 py-2 text-center font-medium'>
                            {c.name}
                          </td>
                          <td className='px-3 py-2 text-center'>{fmtDateShort(c.createdAt)}</td>
                          <td className='px-3 py-2 text-center'>
                            <button
                              type='button'
                              title='Редагувати'
                              aria-label='Редагувати'
                              className='w-9 h-9 inline-flex items-center justify-center border rounded-lg hover:bg-black hover:text-white transition'
                              onClick={(e)=>{ e.preventDefault(); e.stopPropagation(); setSelectedCatId(c._id); setCatEditingName(c.name); setCatSubName(''); setCatTypeParentId(''); setCatTypeName(''); setShowCatList(false); setShowCatEdit(true); }}
                            >
                              <FiEdit2 size={16} />
                            </button>
                            <button
                              title='Видалити'
                              aria-label='Видалити'
                              className='ml-2 w-9 h-9 inline-flex items-center justify-center border rounded-lg text-red-600 hover:bg-red-600 hover:text-white transition'
                              onClick={async(e)=>{ e.preventDefault(); e.stopPropagation(); if(!confirm('Видалити категорію?')) return; try{ await deleteCategory(c._id); if (String(expandedCatId||'')===String(c._id||'')) setExpandedCatId(''); loadAll(); showToast('Категорію видалено','success') } catch(err){ showToast(getErrMsg(err),'error') } }}
                            >
                              <FiTrash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      )

                      const subRows = subs.map(sc=> (
                        <tr key={`${c._id}__${sc._id}`} className='border-t bg-white'>
                          <td className='px-3 py-2 text-center text-sm text-gray-700'>
                            <span className='inline-block text-gray-400 mr-1'>—</span>
                            {sc.name}
                          </td>
                          <td className='px-3 py-2 text-center text-sm text-gray-500'>{fmtDateShort(sc.createdAt)}</td>
                          <td className='px-3 py-2 text-center text-sm text-gray-400'>
                            
                          </td>
                        </tr>
                      ))

                      return [mainRow, ...subRows]
                    })
                  })()}
                </tbody>
              </table>
            </div>
            
          </div>
        </div>
      )}
      {/* Список товарів замінено на вибір у дропдауні зверху форми */}
      <div className={`${ordersFull ? 'fixed inset-0 z-50 bg-white p-4 overflow-auto' : 'mt-6'}`}>
        <div className='flex items-center justify-between mb-2'>
          <h3 className='text-lg font-semibold'>Замовлення</h3>
          <button
            className='w-10 h-10 inline-flex items-center justify-center border rounded hover:bg-gray-50 active:scale-95'
            onClick={()=> setOrdersFull(v=>!v)}
            aria-label={ordersFull ? 'Вийти з повного екрану' : 'На весь екран'}
            title={ordersFull ? 'Згорнути' : 'Розгорнути'}
          >
            {ordersFull ? <FiMinimize2 /> : <FiMaximize2 />}
          </button>
        </div>
        {/* Filters */}
        <div className='p-3 bg-white rounded-lg border shadow-sm flex items-center justify-center gap-2 md:gap-3 mb-3 flex-wrap md:flex-nowrap'>
          <input className='border rounded w-[200px] md:w-[220px] shrink-0 h-10 px-3 text-sm' placeholder='Пошук (імʼя/телефон/ID)' value={orderSearch} onChange={e=>{ setOrderSearch(e.target.value); setOrderPage(1) }} />
          <input type='date' className='border rounded w-[200px] md:w-[220px] shrink-0 h-10 px-3 text-sm' value={dateFrom} onChange={e=>{ setDateFrom(e.target.value); setOrderPage(1) }} />
          <input type='date' className='border rounded w-[200px] md:w-[220px] shrink-0 h-10 px-3 text-sm' value={dateTo} onChange={e=>{ setDateTo(e.target.value); setOrderPage(1) }} />
          <select className='border rounded w-[200px] md:w-[220px] shrink-0 h-10 px-3 text-sm' value={orderStatus} onChange={e=>{ setOrderStatus(e.target.value); setOrderPage(1) }}>
            <option value=''>Всі статуси</option>
            {STATUS_KEYS.map(k=> <option key={k} value={k}>{getStatusLabel(k)}</option>)}
          </select>
          <button
            className='inline-flex items-center justify-center w-10 h-10 border rounded hover:bg-gray-50 active:scale-95'
            onClick={()=>{ setOrderSearch(''); setOrderStatus(''); setDateFrom(''); setDateTo(''); setOrderPage(1) }}
            title='Скинути фільтри'
            aria-label='Скинути фільтри'
          >
            <FiRefreshCcw />
          </button>
        </div>

        {/* Table */}
        <div className='bg-white rounded-2xl border shadow-sm overflow-hidden'>
          <div className={`rounded-lg border m-3 ${ordersFull ? '' : 'max-h-[280px] overflow-auto'}`}>
            <table className='min-w-full text-sm'>
              <thead className='bg-gray-50 sticky top-0 z-10'>
                <tr>
                  <th className='text-center px-3 py-2'>ID</th>
                  <th className='text-center px-3 py-2'>Дата</th>
                  <th className='text-center px-3 py-2'>Клієнт</th>
                  <th className='text-center px-3 py-2'>Телефон</th>
                  <th className='text-center px-3 py-2'>Сума</th>
                  <th className='text-center px-3 py-2'>Статус</th>
                  <th className='text-center px-3 py-2'>Дії</th>
                </tr>
              </thead>
              <tbody>
                {(()=>{
                  const fmtDate = (d)=> new Date(d).toLocaleString('uk-UA', { dateStyle:'short', timeStyle:'short' })
                  const badge = (s)=>{
                    const map = { new:'bg-blue-100 text-blue-800', processing:'bg-amber-100 text-amber-800', shipped:'bg-indigo-100 text-indigo-800', completed:'bg-green-100 text-green-800', cancelled:'bg-red-100 text-red-800' }
                    return <span className={`px-2 py-1 rounded text-xs font-medium ${map[s]||'bg-gray-100 text-gray-700'}`}>{getStatusLabel(s)}</span>
                  }
                  const matches = (o)=>{
                    const q = orderSearch.trim().toLowerCase()
                    if (q && !(`${o._id}`.toLowerCase().includes(q) || (o.customerName||'').toLowerCase().includes(q) || (o.phone||'').toLowerCase().includes(q))) return false
                    if (orderStatus && o.status !== orderStatus) return false
                    if (dateFrom && new Date(o.createdAt) < new Date(dateFrom)) return false
                    if (dateTo){ const dt = new Date(dateTo); dt.setHours(23,59,59,999); if (new Date(o.createdAt) > dt) return false }
                    return true
                  }
                  const list = orders.filter(matches).sort((a,b)=> new Date(b.createdAt||0) - new Date(a.createdAt||0))
                  return list.map(o=> (
                    <tr key={o._id} className='h-12 border-t odd:bg-gray-50/40 hover:bg-gray-50 transition-colors'>
                      <td className='px-3 py-2 font-mono text-xs'>{o._id}</td>
                      <td className='px-3 py-2'>{fmtDate(o.createdAt)}</td>
                      <td className='px-3 py-2'>{o.customerName}</td>
                      <td className='px-3 py-2'><a href={`tel:${o.phone}`} className='hover:underline'>{o.phone}</a></td>
                      <td className='px-3 py-2 text-right font-semibold'>{(o.totalPrice||o.total||0).toFixed(2)} ₴</td>
                      <td className='px-3 py-2 text-center'>
                        <select
                          className={`border rounded px-2 pr-8 py-1 text-sm font-medium cursor-pointer
                            ${ (o.status||'new')==='new' ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                              : (o.status||'new')==='processing' ? 'bg-sky-100 text-sky-800 border-sky-200'
                              : (o.status||'new')==='completed' ? 'bg-green-100 text-green-800 border-green-200'
                              : (o.status||'new')==='shipped' ? 'bg-indigo-100 text-indigo-800 border-indigo-200'
                              : 'bg-red-100 text-red-800 border-red-200' }`}
                          value={o.status||'new'}
                          onChange={async (e)=>{ try{ await updateOrder(o._id, { status: e.target.value }); loadAll(); showToast('Статус оновлено','success') } catch(err){ showToast(getErrMsg(err),'error') } }}
                          title={getStatusLabel(o.status||'new')}
                          aria-label='Статус замовлення'
                        >
                          {STATUS_KEYS.map(k=> <option key={k} value={k}>{getStatusLabel(k)}</option>)}
                        </select>
                      </td>
                      <td className='px-3 py-2 text-right'>
                        <button className='px-2 py-1 border rounded hover:bg-black hover:text-white transition' onClick={()=>{ setSelectedOrder({ ...o }); setOrderStatusEdit(o.status||'new'); setOrderNote(o.note||'') }}>Деталі</button>
                        <button className='ml-2 px-2 py-1 border rounded text-red-600 hover:bg-red-600 hover:text-white transition' onClick={()=> handleDeleteOrder(o._id)}>Видалити</button>
                      </td>
                    </tr>
                  ))
                })()}
              </tbody>
            </table>
          </div>
          {/* Пагінацію прибрано: список прокручується всередині контейнера */}
        </div>

        {/* Order details modal */}
        {selectedOrder && (
          <div className='fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4' onClick={()=> setSelectedOrder(null)}>
            <div className='bg-white rounded-2xl shadow-2xl w-full max-w-3xl p-5' onClick={(e)=>e.stopPropagation()}>
              <div className='flex items-center justify-between mb-3 border-b pb-3'>
                <h4 className='font-semibold'>Замовлення #{selectedOrder._id}</h4>
                <button aria-label='Закрити' onClick={()=> setSelectedOrder(null)} className='w-8 h-8 rounded-lg border hover:bg-gray-100'>✕</button>
              </div>
              <div className='grid md:grid-cols-2 gap-3 text-sm'>
                <div className='p-3 rounded-lg border bg-gray-50'>
                  <div className='font-medium mb-1'>Клієнт</div>
                  <div>{selectedOrder.customerName}</div>
                  <div className='text-gray-600'><a href={`tel:${selectedOrder.phone}`} className='hover:underline'>{selectedOrder.phone}</a></div>
                  <div className='text-gray-600'>{selectedOrder.address}</div>
                </div>
                <div className='p-3 rounded-lg border bg-gray-50'>
                  <div className='font-medium mb-1'>Керування</div>
                  <label className='block text-gray-600 mb-1'>Статус</label>
                  <select className='border p-2 rounded w-full mb-2' value={orderStatusEdit} onChange={e=> setOrderStatusEdit(e.target.value)}>
                    {STATUS_KEYS.map(k=> <option key={k} value={k}>{getStatusLabel(k)}</option>)}
                  </select>
                  <label className='block text-gray-600 mb-1'>Нотатка</label>
                  <textarea className='border p-2 rounded w-full' rows='3' value={orderNote} onChange={e=> setOrderNote(e.target.value)} />
                </div>
              </div>
              <div className='mt-3 overflow-x-auto'>
                <table className='min-w-full text-sm'>
                  <thead>
                    <tr className='bg-gray-50'>
                      <th className='text-left px-3 py-2'>Товар</th>
                      <th className='text-right px-3 py-2'>К-сть</th>
                      <th className='text-right px-3 py-2'>Ціна</th>
                      <th className='text-right px-3 py-2'>Сума</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.items?.map((it, idx)=>{
                      // Підтримка різних форматів збережених items:
                      // 1) Новий: items.productId = ObjectId -> populate дає productId.name/price
                      // 2) Старий: items.name/price напряму
                      // 3) Перехідний: items._id = productId, productId === null

                      let name = it.productId?.name || it.name || '';
                      let priceRaw = it.productId?.price ?? it.price;

                      // Якщо productId відсутній, але є _id, спробувати знайти товар у вже завантажених products
                      if ((!name || priceRaw == null) && it._id && Array.isArray(products) && products.length) {
                        const prod = products.find(p => p._id === String(it._id));
                        if (prod) {
                          if (!name) name = prod.name;
                          if (priceRaw == null) priceRaw = prod.price;
                        }
                      }

                      const price = Number(priceRaw) || 0;
                      const qty = Number(it.quantity) || 0;
                      const sum = (price * qty).toFixed(2);

                      return (
                        <tr key={idx} className='border-t'>
                          <td className='px-3 py-2'>{name || 'Товар'}</td>
                          <td className='px-3 py-2 text-right'>{qty}</td>
                          <td className='px-3 py-2 text-right'>{price.toFixed(2)} ₴</td>
                          <td className='px-3 py-2 text-right'>{sum} ₴</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
                <div className='mt-2 text-right font-semibold'>Разом: {(selectedOrder.totalPrice||0).toFixed(2)} ₴</div>
              </div>
              <div className='mt-4 flex justify-end gap-2'>
                <button onClick={()=> setSelectedOrder(null)} className='px-3 py-2 border rounded'>Закрити</button>
                <button onClick={async()=>{ try{ await updateOrder(selectedOrder._id, { status: orderStatusEdit, note: orderNote }); showToast('Замовлення оновлено','success'); setSelectedOrder(null); loadAll(); } catch(err){ showToast(getErrMsg(err),'error') } }} className='px-3 py-2 bg-black text-white rounded hover:bg-red-600 transition'>Зберегти</button>
              </div>
            </div>
          </div>
        )}
      </div>
      
    </div>
  )
}
