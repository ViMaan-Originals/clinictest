'use client'


import { supabase } from '../lib/supabase'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

export default function DashboardLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()


useEffect(() => {
  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) router.push('/dashboard/home')
  }
  checkAuth()
}, [])


  async function handleLogin() {
    if (!email || !password) { setError('Please enter email and password'); return }
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false); return }
    router.push('/dashboard/home')
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F7F9F8', fontFamily: "'DM Sans', sans-serif", padding: '24px' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&family=DM+Serif+Display&display=swap');`}</style>
      <div style={{ background: 'white', borderRadius: '20px', padding: '40px 32px', width: '100%', maxWidth: '400px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
        <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '28px', color: '#111827', marginBottom: '6px' }}>Welcome back</h1>
        <p style={{ color: '#6B7280', fontSize: '14px', marginBottom: '28px' }}>Sign in to your clinic dashboard</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <input
            placeholder="Email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={{ padding: '13px 16px', borderRadius: '10px', color:'#4f4e4e',border: '1.5px solid #E5E7EB', fontSize: '15px', outline: 'none', fontFamily: 'inherit' }}
          />
          <input
            placeholder="Password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            style={{ padding: '13px 16px', borderRadius: '10px',color:'#4f4e4e', border: '1.5px solid #E5E7EB', fontSize: '15px', outline: 'none', fontFamily: 'inherit' }}
          />
          {error && <p style={{ color: '#EF4444', fontSize: '13px', margin: 0 }}>{error}</p>}
          <button
            onClick={handleLogin}
            disabled={loading}
            style={{ padding: '14px', background: '#0D9488', color: 'white', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            {loading ? 'Signing in...' : 'Sign In →'}
          </button>
        </div>
      </div>
    </div>
  )
}