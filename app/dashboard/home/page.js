'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import { Users, CalendarRange, PhoneIcon, UserPen} from 'lucide-react'

export default function HomePage() {
  const [clinic, setClinic] = useState(null)
  const [stats, setStats] = useState({ total: 0, pending: 0, confirmed: 0, completed: 0 })
  const [todayApts, setTodayApts] = useState([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const today = new Date().toISOString().split('T')[0]

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/dashboard'); return }

    const { data: clinicUser } = await supabase
      .from('clinic_users').select('*, clinics(*)')
      .eq('email', user.email).single()
    if (!clinicUser) { router.push('/dashboard'); return }

    setClinic(clinicUser.clinics)

    const { data: todayData } = await supabase
      .from('appointments')
      .select('*, patients(name, phone), doctors(name)')
      .eq('clinic_id', clinicUser.clinics.id)
      .eq('date', today)
      .order('time_slot', { ascending: true })

    setTodayApts(todayData || [])

    const total = todayData?.length || 0
    const pending = todayData?.filter(a => a.status === 'pending').length || 0
    const confirmed = todayData?.filter(a => a.status === 'confirmed').length || 0
    const completed = todayData?.filter(a => a.status === 'completed').length || 0

    setStats({ total, pending, confirmed, completed })
    setLoading(false)
  }

  async function updateStatus(id, status) {
    await supabase.from('appointments').update({ status }).eq('id', id)
    fetchData()
  }

  const statusColors = {
    pending: { bg: '#FEF3C7', color: '#D97706' },
    confirmed: { bg: '#D1FAE5', color: '#059669' },
    cancelled: { bg: '#FEE2E2', color: '#DC2626' },
    completed: { bg: '#F3F4F6', color: '#6B7280' },
  }

  if (loading) return <p style={{ fontFamily: 'DM Sans, sans-serif', color: '#9CA3AF' }}>Loading...</p>

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&family=DM+Serif+Display&display=swap');`}</style>

      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <p style={{ fontSize: '13px', color: '#9CA3AF', marginBottom: '4px' }}>{greeting}</p>
        <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '28px', color: '#111827', margin: '0 0 4px' }}>{clinic?.name}</h1>
        <p style={{ fontSize: '13px', color: '#6B7280', margin: 0 }}>
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex',justifyContent:'center', gap: '12px', marginBottom: '28px' }}>
        {[
          { label: "Today's Total", value: stats.total, bg: '#F0FDFA', color: '#0D9488' },
          { label: 'Pending', value: stats.pending, bg: '#FFFBEB', color: '#D97706' },
          { label: 'Confirmed', value: stats.confirmed, bg: '#ECFDF5', color: '#059669' },
          { label: 'Completed', value: stats.completed, bg: '#F9FAFB', color: '#6B7280' },
        ].map(stat => (
          <div key={stat.label} style={{ background: stat.bg,width:'25%', borderRadius: '14px', padding: '16px', textAlign: 'center' }}>
            <p style={{ fontSize: '28px', fontWeight: 700, color: stat.color, margin: '0 0 4px', fontFamily: "'DM Serif Display', serif" }}>{stat.value}</p>
            <p style={{ fontSize: '11px', color: stat.color, margin: 0, fontWeight: 600, opacity: 0.8 }}>{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Today's Appointments */}
      <div style={{ background: 'white', borderRadius: '16px', border: '1.5px solid #E5E7EB', overflow: 'hidden' }}>
        <div style={{ padding: '18px 20px', borderBottom: '1px solid #F3F4F6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#111827', margin: 0 }}>Today's Appointments</h2>
          <button
            onClick={() => router.push('/dashboard/appointments')}
            style={{ fontSize: '13px', color: '#0D9488', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit' }}
          >
            View All →
          </button>
        </div>

        {todayApts.length === 0 ? (
          <div style={{ padding: '48px 20px', textAlign: 'center', color: '#9CA3AF' }}>
            <p style={{ fontSize: '14px' }}>No appointments today!</p>
          </div>
        ) : (
          <div>
            {todayApts.map((apt, i) => (
              <div key={apt.id} style={{
                padding: '16px 20px',
                borderBottom: i < todayApts.length - 1 ? '1px solid #F9FAFB' : 'none',
                display: 'flex', alignItems: 'center', gap: '16px'
              }}>
                {/* Time */}
                <div style={{ width: '72px', flexShrink: 0, textAlign: 'center', background: '#F7F9F8', borderRadius: '10px', padding: '8px 4px' }}>
                  <p style={{ fontSize: '13px', fontWeight: 700, color: '#0D9488', margin: 0 }}>{apt.time_slot?.split(' ')[0]}</p>
                  <p style={{ fontSize: '10px', color: '#9CA3AF', margin: 0 }}>{apt.time_slot?.split(' ')[1]}</p>
                </div>

                {/* Info */}
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '15px', fontWeight: 600, color: '#111827', margin: '0 0 3px', textTransform:'capitalize'}}>{apt.patients?.name}</p>
                  
                     <p style={{ fontSize:'12px',display:'flex', alignItems:'center', gap:'5px',color: '#6B7280', margin: 0}}><PhoneIcon size='12px'/>{apt.patients?.phone}</p>
                     <p style={{ fontSize:'12px',display:'flex', alignItems:'center', gap:'5px',color: '#6B7280', margin: 0}}><UserPen size='12px'/>{apt.doctors?.name}</p>
                    
                  
                </div>

                {/* Status */}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: window.innerWidth <= 768 ? 'flex-start' : 'flex-end',}}>
 <div> <span style={{
    padding: '3px 10px', borderRadius: '100px',
    color: '#000',
    fontSize: '11px', fontWeight: 600
  }}>
    Status:
  </span>


  <span style={{
    padding: '3px 10px', borderRadius: '100px',
    background: statusColors[apt.status]?.bg,
    color: statusColors[apt.status]?.color,
    fontSize: '11px', fontWeight: 600
  }}>
    {apt.status}
  </span></div>

  <div style={{ display: window.innerWidth <= 768 ? 'grid' : 'flex', gap: '4px',gridTemplateColumns: '1fr 1fr'}}>
    {['pending', 'confirmed', 'completed', 'cancelled'].map(s => (
      <button
        key={s}
        onClick={() => updateStatus(apt.id, s)}
        style={{
          padding: '4px 8px',
          borderRadius: '7px',
          border: `1.5px solid ${apt.status === s ? statusColors[s].color : '#E5E7EB'}`,
          background: apt.status === s ? statusColors[s].bg : 'white',
          color: apt.status === s ? statusColors[s].color : '#9CA3AF',
          fontSize: '11px', fontWeight: 600,
          cursor: 'pointer', fontFamily: 'inherit',
          transition: 'all 0.15s'
        }}
      >
        {s.charAt(0).toUpperCase() + s.slice(1)}
      </button>
    ))}
  </div>
</div>
                
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <button
          onClick={() => router.push('/dashboard/appointments')}
          style={{ padding: '16px', background: 'white', border: '1.5px solid #E5E7EB', borderRadius: '14px', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}
        >
          <p style={{ fontSize: '20px', margin: '0 0 6px' }}><CalendarRange size={20} color='#404145'/></p>
          <p style={{ fontSize: '14px', fontWeight: 600, color: '#111827', margin: '0 0 2px' }}>All Appointments</p>
          <p style={{ fontSize: '12px', color: '#9CA3AF', margin: 0 }}>View & manage all</p>
        </button>
        <button
          onClick={() => router.push('/dashboard/patients')}
          style={{ padding: '16px', background: 'white', border: '1.5px solid #E5E7EB', borderRadius: '14px', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}
        >
          <p style={{ fontSize: '20px', margin: '0 0 6px' }}><Users size={20} color="#404145" /></p>
          <p style={{ fontSize: '14px', fontWeight: 600, color: '#111827', margin: '0 0 2px' }}>Patients</p>
          <p style={{ fontSize: '12px', color: '#9CA3AF', margin: 0 }}>View patient records</p>
        </button>
      </div>
    </div>
  )
}