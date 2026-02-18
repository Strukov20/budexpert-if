import React from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import Home from './pages/Home'
import CartPage from './pages/Cart'
import Admin from './pages/AdminPanel'
import Checkout from './pages/Checkout'
import AdminLogin from './pages/AdminLogin'
import Services from './pages/Services'
import ProductPage from './pages/ProductPage'
import ReturnsPolicy from './pages/ReturnsPolicy'
import Payment from './pages/Payment'
import About from './pages/About'
import Contacts from './pages/Contacts'

export default function App(){
  const location = useLocation()
  const isAdminRoute = location.pathname === '/admin' || location.pathname.startsWith('/admin/')
  function RequireAdmin({ children }){
    const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
    if (!token) return <Navigate to="/admin/login" replace />
    return children
  }
  return (
    <div className="flex flex-col min-h-screen">
      {!isAdminRoute && <Header />}
      <main className="flex-1">
        <Routes>
          <Route path='/' element={<Home />} />
          <Route path='/services' element={<Services />} />
          <Route path='/cart' element={<CartPage />} />
          <Route path='/checkout' element={<Checkout />} />
          <Route path='/p/:id' element={<ProductPage />} />
          <Route path='/payment' element={<Payment />} />
          <Route path='/about' element={<About />} />
          <Route path='/contacts' element={<Contacts />} />
          <Route path='/returns' element={<ReturnsPolicy />} />
          <Route path='/admin/login' element={<AdminLogin />} />
          <Route path='/admin' element={<RequireAdmin><Admin /></RequireAdmin>} />
          <Route path='/:parentSlug' element={<Home />} />
          <Route path='/:parentSlug/:childSlug' element={<Home />} />
          <Route path='/:parentSlug/:childSlug/:typeSlug' element={<Home />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}
