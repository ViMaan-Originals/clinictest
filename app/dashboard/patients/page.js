'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'

export default function PatientsPage() {
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [clinic, setClinic] = useState(null)
  const [selected, setSelected] = useState(null)
  const [appointments, setAppointments] = useState([])
  const router = useRouter()

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/dashboard'); return }

    const { data: clinicUser } = await supabase
      .from('clinic_users')
      .select('*, clinics(*)')
      .eq('email', user.email)
      .single()

    if (!clinicUser) { router.push('/dashboard'); return }
    setClinic(clinicUser.clinics)

    const { data } = await supabase
      .from('patients')
      .select('*')
      .eq('clinic_id', clinicUser.clinics.id)
      .order('created_at', { ascending: false })

    setPatients(data || [])
    setLoading(false)
  }

  async function selectPatient(patient) {
    setSelected(patient)
    const { data } = await supabase
      .from('appointments')
      .select('*, doctors(name)')
      .eq('patient_id', patient.id)
      .order('date', { ascending: false })
    setAppointments(data || [])
  }

  const statusColors = {
    pending: '#f59e0b',
    confirmed: '#10b981',
    cancelled: '#ef4444',
    completed: '#6b7280',
  }

  if (loading) return <p style={{ fontFamily: 'sans-serif', padding: '20px' }}>Loading...</p>

  return (
    <div style={{ fontFamily: 'sans-serif', maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ margin: 0 }}>Patients</h1>
          <p style={{ margin: '4px 0 0', color: '#666' }}>{clinic?.name}</p>
        </div>
        <button
          onClick={() => router.push('/dashboard/appointments')}
          style={{ padding: '8px 16px', background: '#f0f0f0', color: '#333', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
        >
          ← Appointments
        </button>
      </div>

      {selected ? (
        <div>
          <button
            onClick={() => setSelected(null)}
            style={{ marginBottom: '16px', padding: '8px 16px', background: '#f0f0f0', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
          >
            ← All Patients
          </button>
          <div style={{ padding: '20px', border: '1px solid #eee', borderRadius: '10px', marginBottom: '20px' }}>
            <h2 style={{ margin: '0 0 8px' }}>{selected.name}</h2>
            <p style={{ margin: '0 0 4px', color: '#666' }}>📞 {selected.phone}</p>
            {selected.age && <p style={{ margin: '0 0 4px', color: '#666' }}>🎂 {selected.age} years</p>}
            {selected.gender && <p style={{ margin: 0, color: '#666' }}>⚧ {selected.gender}</p>}
          </div>

          <h3>Appointment History</h3>
          {appointments.length === 0 ? (
            <p style={{ color: '#999' }}>No appointments found.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {appointments.map(apt => (
                <div key={apt.id} style={{ padding: '14px', border: '1px solid #eee', borderRadius: '8px', display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ margin: '0 0 4px' }}>📅 {apt.date} — {apt.time_slot}</p>
                    {apt.doctors && <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>👨‍⚕️ {apt.doctors?.name}</p>}
                  </div>
                  <span style={{ padding: '4px 10px', borderRadius: '20px', background: statusColors[apt.status] + '22', color: statusColors[apt.status], fontSize: '13px', fontWeight: 600, alignSelf: 'center' }}>
                    {apt.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {patients.length === 0 ? (
            <p style={{ color: '#999' }}>No patients yet.</p>
          ) : (
            patients.map(p => (
              <div
                key={p.id}
                onClick={() => selectPatient(p)}
                style={{ padding: '16px', border: '1px solid #eee', borderRadius: '10px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <div>
                  <h3 style={{ margin: '0 0 4px' }}>{p.name}</h3>
                  <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>📞 {p.phone}</p>
                </div>
                <span style={{ color: '#aaa' }}>→</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}