import Seo from './components/Seo'
import NotFound from './pages/NotFound'
import React, { lazy, Suspense, useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import CartToast from './components/CartToast'
import ScrollTopButton from './components/ScrollTopButton'
import FloatingCart from './components/FloatingCart'
const Home = lazy(() => import('./pages/Home'))
const CartPage = lazy(() => import('./pages/Cart'))
const Admin = lazy(() => import('./pages/AdminPanel'))
const Checkout = lazy(() => import('./pages/Checkout'))
const AdminLogin = lazy(() => import('./pages/AdminLogin'))
const Services = lazy(() => import('./pages/Services'))
const ProductPage = lazy(() => import('./pages/ProductPage'))
const ReturnsPolicy = lazy(() => import('./pages/ReturnsPolicy'))
const Payment = lazy(() => import('./pages/Payment'))
const About = lazy(() => import('./pages/About'))
const Contacts = lazy(() => import('./pages/Contacts'))
const ProductsSearch = lazy(() => import('./pages/ProductsSearch'))

export default function App(){
  const location = useLocation()
  const isAdminRoute = location.pathname === '/admin' || location.pathname.startsWith('/admin/')
  const isProductsPage = location.pathname === '/products'

  useEffect(() => {
    try {
      const params = new URLSearchParams(location.search || '')
      const promo = (params.get('promo') || '').toString().trim().toUpperCase()
      if (!promo) return
      if (promo === 'SOCIAL5') {
        localStorage.setItem('active_promo', JSON.stringify({ code: 'SOCIAL5', percent: 5, appliedAt: Date.now() }))
      }
    } catch {}
  }, [location.search])

  function RequireAdmin({ children }){
    const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
    if (!token) return <Navigate to="/admin/login" replace />
    return children
  }
  return (
    <div className="flex flex-col min-h-screen">
      {!isAdminRoute && <Header />}
      <Seo />
      <main className="flex-1">
        <Suspense fallback={<div className="container py-8" role="status">Завантаження…</div>}>
        <Routes>
          <Route path='/' element={<Home />} />
          <Route path='/services' element={<Services />} />
          <Route path='/cart' element={<CartPage />} />
          <Route path='/checkout' element={<Checkout />} />
          <Route path='/p/:id' element={<ProductPage />} />
          <Route path='/products' element={<ProductsSearch />} />
          <Route path='/products/:id' element={<ProductPage />} />
          <Route path='/payment' element={<Payment />} />
          <Route path='/about' element={<About />} />
          <Route path='/contacts' element={<Contacts />} />
          <Route path='/returns' element={<ReturnsPolicy />} />
          <Route path='/admin/login' element={<AdminLogin />} />
          <Route path='/admin' element={<RequireAdmin><Admin /></RequireAdmin>} />
          <Route path='/:parentSlug' element={<Home />} />
          <Route path='/:parentSlug/:childSlug' element={<Home />} />
          <Route path='/:parentSlug/:childSlug/:typeSlug' element={<Home />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        </Suspense>
      </main>
      <Footer />
      <CartToast />
      {isProductsPage && <FloatingCart />}
      {isProductsPage && <ScrollTopButton />}
    </div>
  )
}
