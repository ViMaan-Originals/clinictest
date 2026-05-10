'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export default function AppointmentNotes({ appointment, onClose, onSaved }) {
  const [notes, setNotes] = useState({
    diagnosis: '',
    prescription: '',
    follow_up_date: '',
    notes: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchNotes()
  }, [appointment.id])

  async function fetchNotes() {
    const { data } = await supabase
      .from('appointment_notes')
      .select('*')
      .eq('appointment_id', appointment.id)
      .single()

    if (data) {
      setNotes({
        diagnosis: data.diagnosis || '',
        prescription: data.prescription || '',
        follow_up_date: data.follow_up_date || '',
        notes: data.notes || '',
      })
    }
    setLoading(false)
  }

  async function saveNotes() {
    setSaving(true)
    await supabase.from('appointment_notes').upsert({
      appointment_id: appointment.id,
      clinic_id: appointment.clinic_id,
      doctor_id: appointment.doctor_id,
      patient_id: appointment.patient_id,
      diagnosis: notes.diagnosis || null,
      prescription: notes.prescription || null,
      follow_up_date: notes.follow_up_date || null,
      notes: notes.notes || null,
    }, { onConflict: 'appointment_id' })
    setSaving(false)
    onSaved()
  }

  const inputStyle = {
    width: '100%', padding: '12px 14px',
    border: '1.5px solid #E5E7EB', borderRadius: '10px',
    fontSize: '14px', fontFamily: 'inherit',
    outline: 'none', transition: 'border-color 0.15s',
    background: 'white',
  }

  const labelStyle = {
    fontSize: '12px', fontWeight: 600,
    color: '#374151', marginBottom: '6px', display: 'block'
  }

  if (loading) return (
    <div style={{ padding: '40px', textAlign: 'center', color: '#9CA3AF', fontFamily: 'inherit' }}>
      Loading...
    </div>
  )

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&family=DM+Serif+Display&display=swap');`}</style>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '20px', color: '#111827', margin: '0 0 3px',textTransform:'capitalize' }}>
            {appointment.patients?.name}
          </h2>
          <p style={{ fontSize: '13px', color: '#6B7280', margin: 0 }}>
            {appointment.date} · {appointment.time_slot}
            {appointment.doctors?.name && ` · ${appointment.doctors.name}`}
          </p>
        </div>
        <button onClick={onClose} style={{
          width: '32px', height: '32px', borderRadius: '8px',
          background: '#0D9488', border: 'none', fontSize: '16px',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>✕</button>
      </div>

      {appointment.reason_for_visit && (
        <div style={{ padding: '12px 14px', background: '#F0FDFA', borderRadius: '10px', marginBottom: '20px', border: '1px solid #CCFBF1' }}>
          <p style={{ fontSize: '12px', fontWeight: 600, color: '#0D9488', margin: '0 0 3px' }}>Reason for Visit</p>
          <p style={{ fontSize: '14px', color: '#111827', margin: 0 }}>{appointment.reason_for_visit}</p>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label style={labelStyle}>Diagnosis</label>
          <textarea
            placeholder="e.g. Viral fever, Upper respiratory infection..."
            value={notes.diagnosis}
            onChange={e => setNotes({ ...notes, diagnosis: e.target.value })}
            rows={2}
            style={{ ...inputStyle, resize: 'vertical',color:'#636262' }}
          />
        </div>

        <div>
          <label style={labelStyle}>Prescription</label>
          <textarea
            placeholder="e.g. Paracetamol 500mg twice daily, rest for 3 days..."
            value={notes.prescription}
            onChange={e => setNotes({ ...notes, prescription: e.target.value })}
            rows={3}
            style={{ ...inputStyle, resize: 'vertical',color:'#636262'  }}
          />
        </div>

        <div>
          <label style={labelStyle}>Additional Notes</label>
          <textarea
            placeholder="Any other observations or instructions..."
            value={notes.notes}
            onChange={e => setNotes({ ...notes, notes: e.target.value })}
            rows={2}
            style={{ ...inputStyle, resize: 'vertical',color:'#636262',color:'#636262'   }}
          />
        </div>

        <div>
          <label style={labelStyle}>Follow-up Date</label>
          <input
            type="date"
            value={notes.follow_up_date}
            min={new Date().toISOString().split('T')[0]}
            onChange={e => setNotes({ ...notes, follow_up_date: e.target.value })}
            style={{...inputStyle,color:'#636262' } }
          />
        </div>

        <button
          onClick={saveNotes}
          disabled={saving}
          style={{
            padding: '14px', background: '#0D9488', color: 'white',
            border: 'none', borderRadius: '12px', fontSize: '15px',
            fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            transition: 'background 0.15s'
          }}
        >
          {saving ? 'Saving...' : 'Save Notes'}
        </button>
      </div>
    </div>
  )
}