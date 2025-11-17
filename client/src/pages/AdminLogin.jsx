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
    <div className='container py-10 max-w-md mx-auto px-4 md:max-w-none md:px-0'>
      <h2 className='text-2xl font-semibold mb-4'>Вхід до адмін-панелі</h2>
      <form onSubmit={onSubmit} className='space-y-3'>
        <input className='border p-2 w-full' placeholder='Логін' value={username} onChange={e=>setUsername(e.target.value)} />
        <input className='border p-2 w-full' placeholder='Пароль' type='password' value={password} onChange={e=>setPassword(e.target.value)} />
        {error && <div className='text-red-600 text-sm'>{error}</div>}
        <button className='btn w-full' disabled={loading}>{loading ? 'Вхід...' : 'Увійти'}</button>
      </form>
    </div>
  )
}
