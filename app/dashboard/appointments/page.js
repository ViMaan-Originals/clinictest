'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import AppointmentNotes from './appointmentNotes'
import { NotepadText, PhoneIcon, UserPen} from 'lucide-react'

const statusColors = {
  pending: { bg: '#FEF3C7', color: '#D97706' },
  confirmed: { bg: '#D1FAE5', color: '#059669' },
  cancelled: { bg: '#FEE2E2', color: '#DC2626' },
  completed: { bg: '#F3F4F6', color: '#6B7280' },
}

const FILTERS = ['All', 'Today', 'Upcoming', 'Past','By Date']

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState([])
  const [grouped, setGrouped] = useState({})
  const [loading, setLoading] = useState(true)
  const [clinic, setClinic] = useState(null)
  const [filter, setFilter] = useState('Today')
  const [expandedDates, setExpandedDates] = useState({})
  const [bulkLoading, setBulkLoading] = useState(false)
  const router = useRouter()
  const [selectedApt, setSelectedApt] = useState(null)

  const today = new Date().toISOString().split('T')[0]
    const [selectedDate, setSelectedDate] = useState(today)

  useEffect(() => { fetchData() }, [])
  useEffect(() => { applyFilter() }, [filter, appointments, selectedDate])

  async function fetchData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/dashboard'); return }
    const { data: clinicUser } = await supabase
      .from('clinic_users').select('*, clinics(*)')
      .eq('email', user.email).single()
    if (!clinicUser) { router.push('/dashboard'); return }
    setClinic(clinicUser.clinics)
    const { data } = await supabase
      .from('appointments')
      .select('*, patients(name, phone), doctors(name)')
      .eq('clinic_id', clinicUser.clinics.id)
      .order('date', { ascending: false })
    setAppointments(data || [])
    setLoading(false)
  }

  function applyFilter() {
    let filtered = [...appointments]
    if (filter === 'Today') filtered = appointments.filter(a => a.date === today)
    else if (filter === 'Upcoming') filtered = appointments.filter(a => a.date > today)
    else if (filter === 'Past') filtered = appointments.filter(a => a.date < today)
  else if (filter === 'By Date') filtered = appointments.filter(a => a.date === selectedDate)

    const groups = {}
    filtered.forEach(apt => {
      if (!groups[apt.date]) groups[apt.date] = []
      groups[apt.date].push(apt)
    })
    Object.keys(groups).forEach(date => {
      groups[date].sort((a, b) => a.time_slot.localeCompare(b.time_slot))
    })
    setGrouped(groups)
  }

  async function updateStatus(id, status) {
    await supabase.from('appointments').update({ status }).eq('id', id)
    fetchData()
  }

async function bulkUpdateDate(date, action) {
  setBulkLoading(true)
  const dateApts = grouped[date] || []
  
  let toUpdate = []
  let finalStatus = ''

  if (action === 'confirmed') {
    toUpdate = dateApts.filter(a => a.status === 'pending')
    finalStatus = 'confirmed'
  } else if (action === 'cancel-pending') {
    toUpdate = dateApts.filter(a => a.status === 'pending')
    finalStatus = 'cancelled'
  } else if (action === 'cancelled') {
    toUpdate = dateApts
    finalStatus = 'cancelled'
  }

  const ids = toUpdate.map(a => a.id)
  if (ids.length > 0) {
    await supabase.from('appointments')
      .update({ status: finalStatus })
      .in('id', ids)
  }

  setBulkLoading(false)
  fetchData()
}

  function toggleExpanded(date) {
    setExpandedDates(prev => ({ ...prev, [date]: !prev[date] }))
  }

  function formatDate(dateStr) {
    const d = new Date(dateStr + 'T00:00:00')
    if (dateStr === today) return 'Today'
    return d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })
  }

  function getDateStats(apts) {
    return {
      total: apts.length,
      confirmed: apts.filter(a => a.status === 'confirmed').length,
      pending: apts.filter(a => a.status === 'pending').length,
      cancelled: apts.filter(a => a.status === 'cancelled').length,
      completed: apts.filter(a => a.status === 'completed').length,
    }
  }

  const sortedDates = Object.keys(grouped).sort((a, b) => {
    if (filter === 'Past') return b.localeCompare(a)
    return a.localeCompare(b)
  })

  if (loading) return <p style={{ fontFamily: 'DM Sans, sans-serif', color: '#9CA3AF' }}>Loading...</p>

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&family=DM+Serif+Display&display=swap');`}</style>

      {selectedApt && (
  <div style={{
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
    zIndex: 1000, display: 'flex', alignItems: 'flex-end',
    justifyContent: 'center', padding: '20px'
  }} onClick={e => e.target === e.currentTarget && setSelectedApt(null)}>
    <div style={{
      background: 'white', borderRadius: '20px', padding: '24px',
      width: '100%', maxWidth: '560px', maxHeight: '90vh',
      overflowY: 'auto'
    }}>
      <AppointmentNotes
        appointment={selectedApt}
        onClose={() => setSelectedApt(null)}
        onSaved={() => { setSelectedApt(null); fetchData() }}
      />
    </div>
  </div>
)}

      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '28px', color: '#111827', margin: '0 0 4px' }}>Appointments</h1>
        <p style={{ fontSize: '13px', color: '#6B7280', margin: 0 }}>{clinic?.name}</p>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '8px 18px', borderRadius: '100px', border: '1.5px solid',
            borderColor: filter === f ? '#0D9488' : '#E5E7EB',
            background: filter === f ? '#0D9488' : 'white',
            color: filter === f ? 'white' : '#6B7280',
            fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s'
          }}>
            {f}
          </button>
        ))}

        {filter === 'By Date' && (
  <input
    type="date"
    value={selectedDate}
    onChange={e => setSelectedDate(e.target.value)}
    style={{
      padding: '10px 14px', borderRadius: '10px',
      border: '1.5px solid #E5E7EB', fontSize: '14px',
      fontFamily: 'inherit',
      outline: 'none', color:'#706f6f'
    }}
  />
)}
      </div>

      

      {sortedDates.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9CA3AF' }}>
          <p style={{ fontSize: '32px', marginBottom: '8px' }}>📭</p>
          <p style={{ fontSize: '14px' }}>No appointments {filter === 'Today' ? 'today' : 'found'}.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {sortedDates.map(date => {
            const apts = grouped[date]
            const s = getDateStats(apts)
            const isExpanded = expandedDates[date]
            const visibleApts = isExpanded ? apts : apts.slice(0, 3)
            const hasMore = apts.length > 3

            return (
              <div key={date}>
                {/* Date Header */}
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
                    <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#111827', margin: 0 }}>
                      {formatDate(date)}
                      <span style={{ fontSize: '12px', color: '#9CA3AF', fontWeight: 400, marginLeft: '8px' }}>{date}</span>
                    </h2>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {[
                        { label: `${s.total} total`, bg: '#F0FDFA', color: '#0D9488' },
                        s.pending > 0 && { label: `${s.pending} pending`, bg: '#FEF3C7', color: '#D97706' },
                        s.confirmed > 0 && { label: `${s.confirmed} confirmed`, bg: '#D1FAE5', color: '#059669' },
                        s.cancelled > 0 && { label: `${s.cancelled} cancelled`, bg: '#FEE2E2', color: '#DC2626' },
                        s.completed > 0 && { label: `${s.completed} done`, bg: '#F3F4F6', color: '#6B7280' },
                      ].filter(Boolean).map((tag, i) => (
                        <span key={i} style={{ padding: '3px 10px', borderRadius: '100px', background: tag.bg, color: tag.color, fontSize: '11px', fontWeight: 600 }}>
                          {tag.label}
                        </span>
                      ))}

                    
                    </div>
                  </div>

                  {/* Bulk Actions */}
                  {s.pending > 0 && (
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => bulkUpdateDate(date, 'confirmed')}
                        disabled={bulkLoading}
                        style={{
                          padding: '6px 14px', borderRadius: '8px',
                          background: '#D1FAE5', border: '1.5px solid #059669',
                          color: '#059669', fontSize: '12px', fontWeight: 600,
                          cursor: 'pointer', fontFamily: 'inherit'
                        }}
                      >
                        ✅ Confirm All Pending ({s.pending})
                      </button>
                      <button
                        onClick={() => bulkUpdateDate(date, 'cancelled')}
                        disabled={bulkLoading}
                        style={{
                          padding: '6px 14px', borderRadius: '8px',
                          background: '#FEE2E2', border: '1.5px solid #DC2626',
                          color: '#DC2626', fontSize: '12px', fontWeight: 600,
                          cursor: 'pointer', fontFamily: 'inherit'
                        }}
                      >
                        ❌ Cancel All ({s.total})
                      </button>

                      <button
  onClick={() => bulkUpdateDate(date, 'cancel-pending')}
  disabled={bulkLoading}
  style={{
    padding: '6px 14px', borderRadius: '8px',
    background: '#FEF3C7', border: '1.5px solid #D97706',
    color: '#D97706', fontSize: '12px', fontWeight: 600,
    cursor: 'pointer', fontFamily: 'inherit'
  }}
>
  ⚠️ Cancel All Pending ({s.pending})
</button>
                    </div>
                  )}
                </div>

                {/* Appointments */}
                <div style={{ background: 'white', border: '1.5px solid #E5E7EB', borderRadius: '14px', overflow: 'hidden' }}>
                  {visibleApts.map((apt, i) => (
                    <div key={apt.id} style={{
                      padding: '14px 18px',
                      borderBottom: i < visibleApts.length - 1 ? '1px solid #F9FAFB' : 'none',
                      display: 'flex', alignItems: 'center', gap: '14px', overflowX:'auto',scrollbarWidth:'none'
                    }}>
                      {/* Time */}
                      <div style={{ width: '64px', flexShrink: 0, textAlign: 'center', background: '#F7F9F8', borderRadius: '10px', padding: '8px 4px' }}>
                        <p style={{ fontSize: '12px', fontWeight: 700, color: '#0D9488', margin: 0 }}>{apt.time_slot?.split(' ')[0]}</p>
                        <p style={{ fontSize: '10px', color: '#9CA3AF', margin: 0 }}>{apt.time_slot?.split(' ')[1]}</p>
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1, }}>
                        <p style={{ fontSize: '14px', fontWeight: 600, color: '#111827', margin: '0 0 3px',textTransform:'capitalize', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {apt.patients?.name}
                        </p>
                        

                         <p style={{ fontSize:'12px',display:'flex', alignItems:'center', gap:'5px',color: '#6B7280', margin: 0}}><PhoneIcon size='12px'/>{apt.patients?.phone}</p>
                        <p style={{ fontSize:'12px',display:'flex', alignItems:'center', gap:'5px',color: '#6B7280', margin: 0}}><UserPen size='12px'/>{apt.doctors?.name}</p>
                         <p style={{ fontSize:'12px',display:'flex', alignItems:'center', gap:'5px',color: '#6B7280', margin: 0}}><NotepadText size='12px'/>{apt.patients?.reason_for_visit}</p>

                                            
                      </div>

                      {/* Status + Actions */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: window.innerWidth <= 768 ? 'flex-start' : 'flex-end', flexShrink: 0 }}>
                   <div>   <span style={{
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
                        <div style={{ display: window.innerWidth <= 768 ? 'grid' : 'flex',gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                          {['pending', 'confirmed', 'completed', 'cancelled'].map(s => (
                            <button key={s} onClick={() => updateStatus(apt.id, s)} style={{
                              padding: '3px 7px', borderRadius: '6px', border: '1.5px solid',
                              borderColor: apt.status === s ? statusColors[s].color : '#E5E7EB',
                              background: apt.status === s ? statusColors[s].bg : 'white',
                              color: apt.status === s ? statusColors[s].color : '#9CA3AF',
                              fontSize: '10px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s'
                            }}>
                              {s.charAt(0).toUpperCase() + s.slice(1)}
                            </button>
                          ))}
                        </div>
                        <div/>
                        <button
  onClick={() => setSelectedApt(apt)}
  style={{
    padding: '3px 7px', borderRadius: '6px',
    border: '1.5px solid #E5E7EB',
    background: 'white', color: '#6B7280',
    fontSize: '10px', fontWeight: 600,
    cursor: 'pointer', fontFamily: 'inherit'
  }}
>
  Add Notes
</button>
                      </div>
                    </div>
                  ))}

                  {/* View All / Show Less */}
                  {hasMore && (
                    <button
                      onClick={() => toggleExpanded(date)}
                      style={{
                        width: '100%', padding: '12px',
                        background: '#F9FAFB', border: 'none',
                        borderTop: '1px solid #F3F4F6',
                        color: '#0D9488', fontSize: '13px', fontWeight: 600,
                        cursor: 'pointer', fontFamily: 'inherit'
                      }}
                    >
                      {isExpanded ? '↑ Show Less' : `↓ View All ${apts.length} Appointments`}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}