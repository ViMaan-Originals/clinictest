'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import { Calendar, NotebookPen, PhoneIcon, Search, SearchAlert, User, UserPen} from 'lucide-react'

export default function PatientsPage() {
  const [patients, setPatients] = useState([])
  const [filtered, setFiltered] = useState([])
  const [loading, setLoading] = useState(true)
  const [clinic, setClinic] = useState(null)
  const [selected, setSelected] = useState(null)
  const [appointments, setAppointments] = useState([])
  const [search, setSearch] = useState('')
  const router = useRouter()

  useEffect(() => { fetchData() }, [])

useEffect(() => {
  if (!search.trim()) {
    setFiltered(patients)
    return
  }
  const timer = setTimeout(() => searchPatients(), 400)
  return () => clearTimeout(timer)
}, [search, patients])

async function searchPatients() {
  const q = search.trim()
  const { data } = await supabase
    .from('patients')
    .select('*')
    .eq('clinic_id', clinic.id)
    .or(`name.ilike.%${q}%,phone.ilike.%${q}%`)
    .limit(20)
  setFiltered(data || [])
}

async function fetchData() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) { router.push('/dashboard'); return }

  const { data: clinicUser } = await supabase
    .from('clinic_users').select('*, clinics(*)')
    .eq('email', user.email).single()

  if (!clinicUser) { router.push('/dashboard'); return }
  setClinic(clinicUser.clinics)

  const { data } = await supabase
    .from('patients')
    .select('*')
    .eq('clinic_id', clinicUser.clinics.id)
    .order('created_at', { ascending: false })
    .limit(10)

  setPatients(data || [])
  setFiltered(data || [])
  setLoading(false)
}

  async function selectPatient(patient) {
    setSelected(patient)
    const { data } = await supabase
      .from('appointments')
      .select('*, doctors(name), appointment_notes(*)')
      .eq('patient_id', patient.id)
      .order('date', { ascending: false })
    setAppointments(data || [])
  }

  const statusColors = {
    pending: { bg: '#FEF3C7', color: '#D97706' },
    confirmed: { bg: '#D1FAE5', color: '#059669' },
    cancelled: { bg: '#FEE2E2', color: '#DC2626' },
    completed: { bg: '#F3F4F6', color: '#6B7280' },
  }

  if (loading) return <p style={{ fontFamily: 'DM Sans, sans-serif', color: '#9CA3AF' }}>Loading...</p>

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&family=DM+Serif+Display&display=swap');`}</style>

      {selected ? (
        <div>
          <button onClick={() => setSelected(null)} style={{
            marginBottom: '20px', padding: '8px 16px',
            background: '#0D9488', border: 'none', borderRadius: '8px',
            cursor: 'pointer', fontFamily: 'inherit', fontSize: '13px', fontWeight: 600
          }}>← All Patients</button>

          {/* Patient Info Card */}
          <div style={{ background: 'white', border: '1.5px solid #E5E7EB', borderRadius: '16px', padding: '20px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#CCFBF1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>
                <User size={'30px'} color='#2b2b2b' />
              </div>
              <div>
                <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '20px', color: '#111827', margin: '0 0 4px',textTransform:'uppercase'}}>{selected.name}</h2>
                <p style={{ display:'flex',alignItems:'center',gap:'5px',fontSize: '13px', color: '#6B7280', margin: 0 ,textTransform:'uppercase'}}>
                  {selected.age && ` ${selected.age} yrs`}
                  {selected.gender && ` · ${selected.gender}`}
                  {selected.phone && ` . ${selected.phone}`}
                  
                </p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '20px' }}>
            {[
              { label: 'Total Visits', value: appointments.length, bg: '#F0FDFA', color: '#0D9488' },
              { label: 'Completed', value: appointments.filter(a => a.status === 'completed').length, bg: '#ECFDF5', color: '#059669' },
              { label: 'Upcoming', value: appointments.filter(a => a.status === 'confirmed').length, bg: '#FFFBEB', color: '#D97706' },
            ].map(stat => (
              <div key={stat.label} style={{ background: stat.bg, borderRadius: '12px', padding: '14px', textAlign: 'center' }}>
                <p style={{ fontSize: '22px', fontWeight: 700, color: stat.color, margin: '0 0 2px', fontFamily: "'DM Serif Display', serif" }}>{stat.value}</p>
                <p style={{ fontSize: '11px', color: stat.color, margin: 0, fontWeight: 600, opacity: 0.8 }}>{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Appointment History */}
          <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#374151', marginBottom: '12px' }}>Appointment History</h3>

          {appointments.length === 0 ? (
            <p style={{ color: '#9CA3AF', fontSize: '14px' }}>No appointments found.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {appointments.map(apt => (
                <div key={apt.id} style={{ background: 'white', border: '1.5px solid #E5E7EB', borderRadius: '12px', padding: '14px 16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ fontSize: '14px', fontWeight: 600, color: '#111827', margin: '0 0 3px' }}>
                        {apt.date} · {apt.time_slot}
                      </p>
                      {apt.doctors && <p style={{ fontSize: '12px', color: '#6B7280', margin: 0, display:'flex',gap:'5px',alignItems:'center' }}> <UserPen size={'12px'}></UserPen> {apt.doctors.name}</p>}
                      {apt.reason_for_visit && <p style={{ fontSize: '12px', color: '#6B7280', margin: '3px 0 0' }}><NotebookPen size={'12px'}/> {apt.reason_for_visit}</p>}
                    </div>
                    <span style={{
                      padding: '4px 10px', borderRadius: '100px',
                      background: statusColors[apt.status]?.bg,
                      color: statusColors[apt.status]?.color,
                      fontSize: '11px', fontWeight: 600
                    }}>
                      {apt.status}
                    </span>
                  </div>

                  {apt.appointment_notes?.[0] && (
                    <div style={{ marginTop: '10px', padding: '10px 12px', background: '#F7F9F8', borderRadius: '8px' }}>
                      {apt.appointment_notes[0].diagnosis && (
                        <p style={{ fontSize: '12px', color: '#374151', margin: '0 0 4px' }}>
                          <strong>Diagnosis:</strong> {apt.appointment_notes[0].diagnosis}
                        </p>
                      )}
                      {apt.appointment_notes[0].prescription && (
                        <p style={{ fontSize: '12px', color: '#374151', margin: '0 0 4px' }}>
                          <strong>Prescription:</strong> {apt.appointment_notes[0].prescription}
                        </p>
                      )}
                      {apt.appointment_notes[0].follow_up_date && (
                        <p style={{ fontSize: '12px', color: '#0D9488', margin: 0 }}>
                        <strong>Follow-up:</strong> {apt.appointment_notes[0].follow_up_date}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div>
          <div style={{ marginBottom: '24px' }}>
            <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '28px', color: '#111827', margin: '0 0 4px' }}>Patients</h1>
            <p style={{ fontSize: '13px', color: '#6B7280', margin: 0 }}>{clinic?.name}</p>
          </div>

          {/* Search */}
          <div style={{ position: 'relative', marginBottom: '20px' }}>
            <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '16px' }}><Search size={'24px'} color='#323232'></Search></span>
            <input
              placeholder="Search by name or phone..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%', padding: '12px 14px 12px 40px',
                color:'#616060',
                border: '1.5px solid #E5E7EB', borderRadius: '12px',
                fontSize: '14px', fontFamily: 'inherit', outline: 'none',
                transition: 'border-color 0.15s', boxSizing: 'border-box'
              }}
            />
          </div>

          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 20px', color: '#9CA3AF' }}>
              <p style={{ fontSize: '28px', marginBottom: '8px', display:'flex' ,justifyContent:'center'}}><SearchAlert size={'30px'}/></p>
              <p style={{ fontSize: '14px' }}>{search ? 'No patients found' : 'No patients yet'}</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {filtered.map(p => (
                <div key={p.id} onClick={() => selectPatient(p)} style={{
                  background: 'white', border: '1.5px solid #E5E7EB',
                  borderRadius: '12px', padding: '14px 16px',
                  cursor: 'pointer', display: 'flex',
                  justifyContent: 'space-between', alignItems: 'center',
                  transition: 'border-color 0.15s'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#dbfff6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 }}>
                      <User size={'24px' } color='#2e2e2e'/>
                    </div>
                    <div>
                      <p style={{ fontSize: '14px', fontWeight: 600, color: '#3b404b', margin: '0 0 2px',textTransform:'uppercase' }}>{p.name}</p>
                      <p style={{ fontSize: '12px', color: '#6B7280', margin: 0,textTransform:'uppercase' }}>
                        {p.age && ` ${p.age} yrs`}
                        {p.gender && ` · ${p.gender}`}
                         {p.phone && ` · ${p.phone}`}
                        
                      </p>
                    </div>
                  </div>
                  <span style={{ color: '#D1D5DB', fontSize: '18px' }}>›</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}