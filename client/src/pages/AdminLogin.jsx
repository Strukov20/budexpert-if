import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '../api'

export default function AdminLogin(){
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const onSubmit = async (e)=>{
    e.preventDefault()
    setError('')
    setLoading(true)
    try{
      await login({ username, password })
      navigate('/admin', { replace: true })
    }catch(err){
      setError('Невірний логін або пароль')
    }finally{
      setLoading(false)
    }
  }

  return (
    <div className='container py-10 max-w-md mx-auto px-4 md:max-w-none md:px-0' data-testid='admin-login-page'>
      <h2 className='text-2xl font-semibold mb-4'>Вхід до адмін-панелі</h2>
      <form onSubmit={onSubmit} className='space-y-3' data-testid='admin-login-form'>
        <input className='border p-2 w-full' placeholder='Логін' autoComplete='username' value={username} onChange={e=>setUsername(e.target.value)} data-testid='admin-login-username' />
        <input className='border p-2 w-full' placeholder='Пароль' type='password' autoComplete='current-password' value={password} onChange={e=>setPassword(e.target.value)} data-testid='admin-login-password' />
        {error && <div className='text-red-600 text-sm' data-testid='admin-login-error'>{error}</div>}
        <button className='btn w-full' disabled={loading} data-testid='admin-login-submit'>{loading ? 'Вхід...' : 'Увійти'}</button>
      </form>
    </div>
  )
}
