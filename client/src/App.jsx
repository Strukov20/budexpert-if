import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import Home from './pages/Home'
import CartPage from './pages/Cart'
import Admin from './pages/AdminPanel'
import Checkout from './pages/Checkout'
import AdminLogin from './pages/AdminLogin'
import Services from './pages/Services'

export default function App(){
  function RequireAdmin({ children }){
    const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
    if (!token) return <Navigate to="/admin/login" replace />
    return children
  }
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        <Routes>
          <Route path='/' element={<Home />} />
          <Route path='/services' element={<Services />} />
          <Route path='/cart' element={<CartPage />} />
          <Route path='/checkout' element={<Checkout />} />
          <Route path='/admin/login' element={<AdminLogin />} />
          <Route path='/admin' element={<RequireAdmin><Admin /></RequireAdmin>} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}
