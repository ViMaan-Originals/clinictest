'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'

export default function BookPage() {
  const [slug, setSlug] = useState('')
  const [clinic, setClinic] = useState(null)
  const [doctors, setDoctors] = useState([])
  const [availableSlots, setAvailableSlots] = useState([])
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [form, setForm] = useState({
    name: '', phone: '', age: '', gender: '',
    doctor_id: '', date: '', time_slot: '',
  })
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [bookingError, setBookingError] = useState('')

  useEffect(() => {
    const s = window.location.pathname.split('/')[2]
    setSlug(s)
    async function fetchData() {
      const { data: clinicData } = await supabase
        .from('clinics').select('*').eq('slug', s).single()
      setClinic(clinicData)
      const { data: doctorsData } = await supabase
        .from('doctors').select('*').eq('clinic_id', clinicData.id)
      setDoctors(doctorsData || [])
    }
    fetchData()
  }, [])

  // Fetch available slots when doctor + date changes
  useEffect(() => {
    if (form.doctor_id && form.date) fetchAvailableSlots()
    else setAvailableSlots([])
  }, [form.doctor_id, form.date])

  async function fetchAvailableSlots() {
    setSlotsLoading(true)
    setForm(f => ({ ...f, time_slot: '' }))

    const date = new Date(form.date + 'T00:00:00')
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' })


    
    // Check holiday
    const { data: holiday } = await supabase
      .from('doctor_holidays')
      .select('*')
      .eq('doctor_id', form.doctor_id)
      .eq('specific_date', form.date)
      .single()

    if (holiday) {
      setAvailableSlots([{ blocked: true, reason: `Doctor is on leave${holiday.reason ? ` — ${holiday.reason}` : ''}` }])
      setSlotsLoading(false)
      return
    }

    // Check weekly off
const { data: weeklyOff } = await supabase
  .from('doctor_weekly_off')
  .select('*')
  .eq('doctor_id', form.doctor_id)
  .eq('day_of_week', dayName)
  .single()

if (weeklyOff) {
  setAvailableSlots([{ blocked: true, reason: 'Doctor is off on ' + dayName + 's' }])
  setSlotsLoading(false)
  return
}
    // Check daily limit
    const { data: dailyLimit } = await supabase
      .from('doctor_daily_limits')
      .select('*')
      .eq('doctor_id', form.doctor_id)
      .eq('specific_date', form.date)
      .single()

    if (dailyLimit && !dailyLimit.is_accepting) {
      setAvailableSlots([{ blocked: true, reason: 'Bookings paused for this day' }])
      setSlotsLoading(false)
      return
    }

    // Get doctor's slots for this day
    const { data: slots } = await supabase
      .from('doctor_slots')
      .select('*')
      .eq('doctor_id', form.doctor_id)
      .eq('day_of_week', dayName)
      .eq('is_active', true)
      .order('time_slot')

    if (!slots || slots.length === 0) {
      setAvailableSlots([{ blocked: true, reason: 'No slots available on this day' }])
      setSlotsLoading(false)
      return
    }

    // Check existing bookings count per slot
    const { data: existingApts } = await supabase
      .from('appointments')
      .select('time_slot')
      .eq('doctor_id', form.doctor_id)
      .eq('date', form.date)
      .neq('status', 'cancelled')

    const bookedCounts = {}
    existingApts?.forEach(apt => {
      bookedCounts[apt.time_slot] = (bookedCounts[apt.time_slot] || 0) + 1
    })

    // Check daily limit count
    const totalBooked = existingApts?.length || 0
    const dailyMax = dailyLimit?.max_patients || Infinity

    const processedSlots = slots.map(slot => {
      const booked = bookedCounts[slot.time_slot] || 0
      const slotFull = booked >= slot.max_capacity
      const dayFull = totalBooked >= dailyMax
      return {
        ...slot,
        booked,
        isFull: slotFull || dayFull,
        reason: dayFull ? 'Day fully booked' : slotFull ? 'Slot full' : null
      }
    })

    setAvailableSlots(processedSlots)
    setSlotsLoading(false)
  }

  async function handleSubmit() {
    if (!form.name || !form.phone || !form.date || !form.time_slot) {
      setBookingError('Please fill all required fields')
      return
    }
    if (!form.doctor_id) {
      setBookingError('Please select a doctor')
      return
    }
    setLoading(true)
    setBookingError('')

    let { data: patient } = await supabase
      .from('patients').select('*')
      .eq('clinic_id', clinic.id).eq('phone', form.phone).single()

    if (!patient) {
      const { data: newPatient } = await supabase.from('patients').insert({
        clinic_id: clinic.id, name: form.name, phone: form.phone,
        age: form.age ? parseInt(form.age) : null,
        gender: form.gender || null,
      }).select().single()
      patient = newPatient
    }

    await supabase.from('appointments').insert({
      clinic_id: clinic.id, patient_id: patient.id,
      doctor_id: form.doctor_id,
      date: form.date, time_slot: form.time_slot, status: 'pending',
    })

    setLoading(false)
    setSubmitted(true)
  }

  const selectedDoctor = doctors.find(d => d.id === form.doctor_id)

  if (submitted) return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&family=DM+Serif+Display&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'DM Sans', sans-serif; background: #F7F9F8; }
        @keyframes pop { from { opacity:0; transform: scale(0.9); } to { opacity:1; transform: scale(1); } }
      `}</style>
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ background: 'white', borderRadius: '24px', padding: '40px 32px', textAlign: 'center', maxWidth: '400px', width: '100%', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', animation: 'pop 0.3s ease' }}>
          <div style={{ width: '72px', height: '72px', background: '#CCFBF1', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', margin: '0 auto 24px' }}>✅</div>
          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '28px', marginBottom: '12px', color: '#111827' }}>Booked!</h1>
          <p style={{ color: '#6B7280', marginBottom: '8px' }}>Hey <strong style={{ color: '#111827' }}>{form.name}</strong>, your appointment is confirmed.</p>
          <div style={{ background: '#F7F9F8', borderRadius: '12px', padding: '16px', margin: '20px 0', textAlign: 'left' }}>
            <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '4px' }}>Date & Time</p>
            <p style={{ fontWeight: 600, color: '#111827', marginBottom: '8px' }}>{form.date} — {form.time_slot}</p>
            {selectedDoctor && <>
              <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '4px' }}>Doctor</p>
              <p style={{ fontWeight: 600, color: '#111827' }}>{selectedDoctor.name}</p>
            </>}
          </div>
          <p style={{ fontSize: '13px', color: '#9CA3AF', marginBottom: '24px' }}>{clinic?.name} will confirm shortly.</p>
          <a href={`/clinic/${slug}`} style={{ display: 'block', padding: '14px', background: '#0D9488', color: 'white', borderRadius: '12px', textDecoration: 'none', fontWeight: 600, fontSize: '15px' }}>← Back to Clinic</a>
        </div>
      </div>
    </>
  )

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&family=DM+Serif+Display&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'DM Sans', sans-serif; background: #F7F9F8; }
        input, select, textarea { font-family: 'DM Sans', sans-serif; }

        .container { max-width: 480px; margin: 0 auto; padding: 24px 20px 48px; }
        .back { display: inline-flex; align-items: center; gap: 6px; color: #0D9488; text-decoration: none; font-size: 14px; font-weight: 500; margin-bottom: 24px; }
        .title { font-family: 'DM Serif Display', serif; font-size: 32px; color: #111827; margin-bottom: 4px; }
        .subtitle { font-size: 14px; color: #6B7280; margin-bottom: 32px; }
        .section-label { font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #9CA3AF; margin: 28px 0 14px; }
        .field { margin-bottom: 14px; }
        .field label { display: block; font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 6px; }
        .field input, .field select {
          width: 100%; padding: 13px 16px;
          border: 1.5px solid #E5E7EB; border-radius: 12px;
          font-size: 15px; color: #111827; background: white;
          outline: none; transition: border-color 0.15s; appearance: none;
        }
        .field input:focus, .field select:focus { border-color: #0D9488; }
        .row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

        .slots-grid { display: flex; flex-direction: column; gap: 8px; margin-top: 6px; }
        .slot {
          padding: 12px 16px; border: 1.5px solid #E5E7EB;
          border-radius: 10px; font-size: 14px; font-weight: 500;
          cursor: pointer; background: white; color: #374151;
          transition: all 0.15s; font-family: 'DM Sans', sans-serif;
          display: flex; justify-content: space-between; align-items: center;
          width: 100%; text-align: left;
        }
        .slot:hover:not(:disabled) { border-color: #0D9488; color: #0D9488; }
        .slot.selected { background: #0D9488; border-color: #0D9488; color: white; }
        .slot:disabled { background: #F9FAFB; color: #D1D5DB; cursor: not-allowed; border-color: #F3F4F6; }

        .blocked-msg { padding: 16px; background: #FEF2F2; border-radius: 10px; color: #DC2626; font-size: 14px; font-weight: 500; text-align: center; }
        .hint-msg { padding: 14px; background: #F7F9F8; border-radius: 10px; color: #9CA3AF; font-size: 14px; text-align: center; }

        .submit-btn {
          width: 100%; padding: 16px; background: #0D9488;
          color: white; border: none; border-radius: 14px;
          font-size: 16px; font-weight: 600; cursor: pointer;
          margin-top: 24px; font-family: 'DM Sans', sans-serif;
          transition: background 0.15s;
        }
        .submit-btn:hover { background: #0f766e; }
        .submit-btn:disabled { background: #9CA3AF; cursor: not-allowed; }

        @keyframes fadeUp { from { opacity:0; transform: translateY(12px); } to { opacity:1; transform: translateY(0); } }
        .container { animation: fadeUp 0.3s ease; }
      `}</style>

      <div className="container">
        <a href={`/clinic/${slug}`} className="back">← Back</a>
        <h1 className="title">Book a Visit</h1>
        <p className="subtitle">{clinic?.name}</p>

        <p className="section-label">Your Details</p>

        <div className="field">
          <label>Full Name *</label>
          <input placeholder="Enter your name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
        </div>
        <div className="field">
          <label>Phone Number *</label>
          <input placeholder="10-digit mobile number" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
        </div>
        <div className="row">
          <div className="field">
            <label>Age</label>
            <input type="number" placeholder="Age" value={form.age} onChange={e => setForm({ ...form, age: e.target.value })} />
          </div>
          <div className="field">
            <label>Gender</label>
            <select value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })}>
              <option value="">Select</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        <p className="section-label">Choose Doctor & Schedule</p>

        <div className="field">
          <label>Select Doctor *</label>
          <select value={form.doctor_id} onChange={e => setForm({ ...form, doctor_id: e.target.value, date: '', time_slot: '' })}>
            <option value="">Select a doctor</option>
            {doctors.map(d => (
              <option key={d.id} value={d.id}>{d.name}{d.specialization ? ` — ${d.specialization}` : ''}</option>
            ))}
          </select>
        </div>

        {form.doctor_id && (
          <div className="field">
            <label>Date *</label>
            <input
              type="date"
              value={form.date}
              min={new Date().toISOString().split('T')[0]}
              onChange={e => setForm({ ...form, date: e.target.value, time_slot: '' })}
            />
          </div>
        )}

        {form.doctor_id && form.date && (
          <div className="field">
            <label>Available Slots *</label>
            {slotsLoading ? (
              <div className="hint-msg">Checking availability...</div>
            ) : availableSlots.length === 0 ? (
              <div className="hint-msg">No slots configured for this day.</div>
            ) : availableSlots[0]?.blocked ? (
              <div className="blocked-msg">🚫 {availableSlots[0].reason}</div>
            ) : (
              <div className="slots-grid">
                {availableSlots.map(slot => (
                  <button
                    key={slot.id}
                    disabled={slot.isFull}
                    className={`slot ${form.time_slot === slot.time_slot ? 'selected' : ''}`}
                    onClick={() => !slot.isFull && setForm({ ...form, time_slot: slot.time_slot })}
                  >
                    <span>{slot.time_slot}</span>
                    {slot.isFull ? (
                      <span style={{ fontSize: '11px', fontWeight: 600 }}>🔴 {slot.reason}</span>
                    ) : (
                      <span style={{ fontSize: '11px', color: form.time_slot === slot.time_slot ? 'rgba(255,255,255,0.8)' : '#9CA3AF' }}>
                        {slot.max_capacity - slot.booked} left
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {!form.doctor_id && (
          <div className="hint-msg">👆 Select a doctor to see available slots</div>
        )}

        {bookingError && (
          <p style={{ color: '#EF4444', fontSize: '13px', marginTop: '12px' }}>{bookingError}</p>
        )}

        <button
          className="submit-btn"
          onClick={handleSubmit}
          disabled={loading || !form.time_slot}
        >
          {loading ? 'Booking...' : 'Confirm Appointment →'}
        </button>
      </div>
    </>
  )
}