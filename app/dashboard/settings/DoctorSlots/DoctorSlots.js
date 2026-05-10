'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import { User } from 'lucide-react'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export default function DoctorSlots({ clinicId, doctors }) {
  const [selectedDoctor, setSelectedDoctor] = useState(null)
  const [slots, setSlots] = useState([])
  const [weeklyOff, setWeeklyOff] = useState([])
  const [dailyLimits, setDailyLimits] = useState([])
  const [holidays, setHolidays] = useState([])
  const [tab, setTab] = useState('slots')

  // Slot form
  const [slotDay, setSlotDay] = useState('Monday')
  const [slotTime, setSlotTime] = useState('')
  const [slotCapacity, setSlotCapacity] = useState(1)
  const [applyToAll, setApplyToAll] = useState(false)

  // Daily limit form
  const [limitDate, setLimitDate] = useState('')
  const [limitMax, setLimitMax] = useState(20)

  // Holiday form
  const [holidayDate, setHolidayDate] = useState('')
  const [holidayReason, setHolidayReason] = useState('')

  const [saving, setSaving] = useState(false)

  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    if (selectedDoctor) fetchData()
  }, [selectedDoctor])

  async function fetchData() {
    const [s, wo, l, h] = await Promise.all([
      supabase.from('doctor_slots').select('*').eq('doctor_id', selectedDoctor.id).order('time_slot'),
      supabase.from('doctor_weekly_off').select('*').eq('doctor_id', selectedDoctor.id),
      supabase.from('doctor_daily_limits').select('*').eq('doctor_id', selectedDoctor.id).order('specific_date'),
      supabase.from('doctor_holidays').select('*').eq('doctor_id', selectedDoctor.id).order('specific_date'),
    ])
    setSlots(s.data || [])
    setWeeklyOff(wo.data || [])
    setDailyLimits(l.data || [])
    setHolidays(h.data || [])
  }

  // Weekly off helpers
  function isDayOff(day) {
    return weeklyOff.some(w => w.day_of_week === day)
  }

  async function toggleWeeklyOff(day) {
    const existing = weeklyOff.find(w => w.day_of_week === day)
    if (existing) {
      await supabase.from('doctor_weekly_off').delete().eq('id', existing.id)
    } else {
      await supabase.from('doctor_weekly_off').insert({
        doctor_id: selectedDoctor.id,
        clinic_id: clinicId,
        day_of_week: day,
      })
    }
    fetchData()
  }

  // Slot helpers
  function getSlotsForDay(day) {
    return slots.filter(s => s.day_of_week === day)
  }

  async function addSlot() {
    if (!slotTime.trim()) { alert('Enter a time slot'); return }
    setSaving(true)

    const daysToAdd = applyToAll
      ? DAYS.filter(d => !isDayOff(d))
      : [slotDay]

    // Check duplicates and insert
    for (const day of daysToAdd) {
      const exists = slots.find(s => s.day_of_week === day && s.time_slot === slotTime.trim())
      if (!exists) {
        await supabase.from('doctor_slots').insert({
          doctor_id: selectedDoctor.id,
          clinic_id: clinicId,
          day_of_week: day,
          time_slot: slotTime.trim(),
          max_capacity: parseInt(slotCapacity) || 1,
          is_active: true,
        })
      }
    }

    setSlotTime('')
    setSlotCapacity(1)
    setSaving(false)
    fetchData()
  }

  async function deleteSlot(id) {
    await supabase.from('doctor_slots').delete().eq('id', id)
    fetchData()
  }

  async function toggleSlotActive(slot) {
    await supabase.from('doctor_slots').update({ is_active: !slot.is_active }).eq('id', slot.id)
    fetchData()
  }

  async function updateSlotCapacity(id, val) {
    setSlots(prev => prev.map(s => s.id === id ? { ...s, max_capacity: parseInt(val) || 1 } : s))
    await supabase.from('doctor_slots').update({ max_capacity: parseInt(val) || 1 }).eq('id', id)
  }

  // Daily limit helpers
  async function addDailyLimit() {
    if (!limitDate) { alert('Select a date'); return }
    setSaving(true)
    await supabase.from('doctor_daily_limits').upsert({
      doctor_id: selectedDoctor.id,
      clinic_id: clinicId,
      specific_date: limitDate,
      max_patients: limitMax,
      is_accepting: true,
    }, { onConflict: 'doctor_id,specific_date' })
    setLimitDate('')
    setLimitMax(20)
    setSaving(false)
    fetchData()
  }

  async function toggleAccepting(limit) {
    await supabase.from('doctor_daily_limits').update({ is_accepting: !limit.is_accepting }).eq('id', limit.id)
    fetchData()
  }

  async function deleteDailyLimit(id) {
    await supabase.from('doctor_daily_limits').delete().eq('id', id)
    fetchData()
  }

  // Holiday helpers
  async function addHoliday() {
    if (!holidayDate) { alert('Select a date'); return }
    setSaving(true)
    await supabase.from('doctor_holidays').upsert({
      doctor_id: selectedDoctor.id,
      clinic_id: clinicId,
      specific_date: holidayDate,
      reason: holidayReason || null,
    }, { onConflict: 'doctor_id,specific_date' })
    setHolidayDate('')
    setHolidayReason('')
    setSaving(false)
    fetchData()
  }

  async function deleteHoliday(id) {
    await supabase.from('doctor_holidays').delete().eq('id', id)
    fetchData()
  }

  const btnStyle = (active) => ({
    padding: '7px 16px', borderRadius: '8px',
    border: '1.5px solid',
    borderColor: active ? '#0D9488' : '#E5E7EB',
    background: active ? '#F0FDFA' : 'white',
    color: active ? '#0D9488' : '#6B7280',
    fontSize: '13px', fontWeight: 600, cursor: 'pointer',
    fontFamily: 'inherit', transition: 'all 0.15s'
  })

  if (!doctors || doctors.length === 0)
    return <p style={{ color: '#9CA3AF', fontSize: '14px' }}>Add doctors first to manage their slots.</p>

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap');`}</style>

      {/* Doctor Selector */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
        {doctors.map(d => (
          <button key={d.id} onClick={() => setSelectedDoctor(d)} style={{
            padding: '8px 16px', borderRadius: '100px', border: '1.5px solid',
            borderColor: selectedDoctor?.id === d.id ? '#0D9488' : '#E5E7EB',
            background: selectedDoctor?.id === d.id ? '#0D9488' : 'white',
            color: selectedDoctor?.id === d.id ? 'white' : '#374151',
            fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',display:'flex',
            alignItems:'center',textTransform:'capitalize',gap:'3px'
    
          }}>
            <User size={'13px'}/>{d.name}
          </button>
        ))}
      </div>

      {selectedDoctor && (
        <div>
          <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '16px' }}>
            Managing: <strong style={{ color: '#111827' }}>{selectedDoctor.name}</strong>
          </p>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
            {[
              { key: 'slots', label: '🗓 Weekly Slots' },
              { key: 'daily', label: '📋 Daily Overrides' },
              { key: 'holidays', label: '🏖 Holidays' },
            ].map(t => (
              <button key={t.key} onClick={() => setTab(t.key)} style={btnStyle(tab === t.key)}>
                {t.label}
              </button>
            ))}
          </div>

          {/* ── WEEKLY SLOTS TAB ── */}
          {tab === 'slots' && (
            <div>
              {/* Weekly Off Days */}
              <div style={{ background: '#FEF2F2', borderRadius: '12px', padding: '16px', marginBottom: '24px' }}>
                <p style={{ fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '10px' }}>Weekly Off Days</p>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {DAYS.map(day => (
                    <button
                      key={day}
                      onClick={() => toggleWeeklyOff(day)}
                      style={{
                        padding: '6px 14px', borderRadius: '8px', border: '1.5px solid',
                        borderColor: isDayOff(day) ? '#DC2626' : '#E5E7EB',
                        background: isDayOff(day) ? '#FEE2E2' : 'white',
                        color: isDayOff(day) ? '#DC2626' : '#6B7280',
                        fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit'
                      }}
                    >
                      {isDayOff(day) ? '✕ ' : ''}{day.slice(0, 3)}
                    </button>
                  ))}
                </div>
                <p style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '8px' }}>
                  Red = weekly off. Patients cannot book on these days.
                </p>
              </div>

              {/* Add Slot Form */}
              <div style={{ background: '#F7F9F8', borderRadius: '12px', padding: '16px', marginBottom: '24px' }}>
                <p style={{ fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '12px' }}>Add Time Slot</p>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                  <div>
                    <p style={{ fontSize: '12px', color: '#6B7280', marginBottom: '5px' }}>Time Slot</p>
                    <input
                      placeholder="e.g. 10:00 AM or 10-11 AM"
                      value={slotTime}
                      onChange={e => setSlotTime(e.target.value)}
                      style={{ color:'#4a4949',padding: '10px 12px', borderRadius: '8px', border: '1.5px solid #E5E7EB', fontSize: '14px', fontFamily: 'inherit', width: '200px' }}
                    />
                  </div>
                  <div>
                    <p style={{ fontSize: '12px', color: '#6B7280', marginBottom: '5px' }}>Capacity</p>
                    <input
                      type="number" min="1" max="50"
                      value={slotCapacity}
                      onChange={e => setSlotCapacity(e.target.value)}
                      style={{ width: '70px', color:'#4a4949',padding: '10px 12px', borderRadius: '8px', border: '1.5px solid #E5E7EB', fontSize: '14px', fontFamily: 'inherit' }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <p style={{ fontSize: '12px', color: '#6B7280' }}>Apply to</p>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        onClick={() => setApplyToAll(false)}
                        style={{ ...btnStyle(!applyToAll), padding: '10px 14px' }}
                      >
                        One Day
                      </button>
                      <button
                        onClick={() => setApplyToAll(true)}
                        style={{ ...btnStyle(applyToAll), padding: '10px 14px' }}
                      >
                        All Working Days
                      </button>
                    </div>
                  </div>
                  {!applyToAll && (
                    <div>
                      <p style={{ fontSize: '12px', color: '#6B7280', marginBottom: '5px' }}>Day</p>
                      <select
                        value={slotDay}
                        onChange={e => setSlotDay(e.target.value)}
                        style={{ padding: '10px 12px', borderRadius: '8px', color:'#4a4949',border: '1.5px solid #E5E7EB', fontSize: '14px', fontFamily: 'inherit' }}
                      >
                        {DAYS.filter(d => !isDayOff(d)).map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                  )}
                  <button
                    onClick={addSlot}
                    disabled={saving}
                    style={{ padding: '10px 20px', background: '#0D9488', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
                  >
                    {saving ? 'Adding...' : 'Add Slot'}
                  </button>
                </div>
              </div>

              {/* Slots by day */}
              {DAYS.map(day => {
                const daySlots = getSlotsForDay(day)
                const isOff = isDayOff(day)
                if (daySlots.length === 0 && !isOff) return null
                return (
                  <div key={day} style={{ marginBottom: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                      <p style={{ fontSize: '13px', fontWeight: 700, color: isOff ? '#9CA3AF' : '#374151', margin: 0 }}>{day}</p>
                      {isOff && (
                        <span style={{ padding: '2px 8px', background: '#FEE2E2', color: '#DC2626', borderRadius: '6px', fontSize: '11px', fontWeight: 600 }}>
                          Weekly Off
                        </span>
                      )}
                    </div>
                    {!isOff && daySlots.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {daySlots.map(slot => (
                          <div key={slot.id} style={{
                            padding: '12px 16px', background: 'white',
                            border: `1.5px solid ${slot.is_active ? '#E5E7EB' : '#FEE2E2'}`,
                            borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap'
                          }}>
                            <p style={{ fontSize: '14px', fontWeight: 600, color: slot.is_active ? '#111827' : '#9CA3AF', margin: 0, flex: 1 }}>
                              {slot.time_slot}
                            </p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontSize: '12px', color: '#6B7280' }}>Max:</span>
                              <input
                                type="number" min="1" max="50"
                                value={slot.max_capacity}
                                onChange={e => updateSlotCapacity(slot.id, e.target.value)}
                                style={{ color:'#4f4f4f', width: '52px',padding: '4px 8px', borderRadius: '6px', border: '1px solid #E5E7EB', fontSize: '13px', fontFamily: 'inherit' }}
                              />
                            </div>
                            <button onClick={() => toggleSlotActive(slot)} style={{
                              padding: '5px 12px', borderRadius: '7px', border: '1.5px solid',
                              borderColor: slot.is_active ? '#059669' : '#DC2626',
                              background: slot.is_active ? '#D1FAE5' : '#FEE2E2',
                              color: slot.is_active ? '#059669' : '#DC2626',
                              fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit'
                            }}>
                              {slot.is_active ? 'Active' : 'Paused'}
                            </button>
                            <button onClick={() => deleteSlot(slot.id)} style={{
                              padding: '5px 10px', borderRadius: '7px',
                              background: '#FEF2F2', border: 'none',
                              color: '#EF4444', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit'
                            }}>Delete</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}

              {slots.length === 0 && (
                <p style={{ color: '#9CA3AF', fontSize: '14px', textAlign: 'center', padding: '20px' }}>No slots added yet. Add a slot above.</p>
              )}
            </div>
          )}

          {/* ── DAILY OVERRIDES TAB ── */}
          {tab === 'daily' && (
            <div>
              <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '16px' }}>
                Override slots for a specific date — set a lower patient limit or pause bookings entirely for that day.
              </p>
              <div style={{ background: '#F7F9F8', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                  <div>
                    <p style={{ fontSize: '12px', color: '#6B7280', marginBottom: '5px' }}>Date</p>
                    <input type="date" value={limitDate} min={today} onChange={e => setLimitDate(e.target.value)}
                      style={{ padding: '10px 12px',color:'#4c4b4b', borderRadius: '8px', border: '1.5px solid #E5E7EB', fontSize: '14px', fontFamily: 'inherit' }} />
                  </div>
                  <div>
                    <p style={{ fontSize: '12px', color: '#6B7280', marginBottom: '5px' }}>Max Patients</p>
                    <input type="number" min="1" max="200" value={limitMax} onChange={e => setLimitMax(parseInt(e.target.value))}
                      style={{ width: '80px',color:'#4c4b4b', padding: '10px 12px', borderRadius: '8px', border: '1.5px solid #E5E7EB', fontSize: '14px', fontFamily: 'inherit' }} />
                  </div>
                  <button onClick={addDailyLimit} disabled={saving} style={{ padding: '10px 20px', background: '#0D9488', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                    {saving ? 'Saving...' : 'Set Override'}
                  </button>
                </div>
              </div>

              {dailyLimits.length === 0 ? (
                <p style={{ color: '#9CA3AF', fontSize: '14px' }}>No overrides set.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {dailyLimits.map(limit => (
                    <div key={limit.id} style={{ padding: '14px 16px', background: 'white', border: '1.5px solid #E5E7EB', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                      <div>
                        <p style={{ fontSize: '14px', fontWeight: 600, color: '#111827', margin: '0 0 3px' }}>
                          {new Date(limit.specific_date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                        </p>
                        <p style={{ fontSize: '12px', color: '#6B7280', margin: 0 }}>Max {limit.max_patients} patients</p>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => toggleAccepting(limit)} style={{
                          padding: '6px 12px', borderRadius: '8px', border: '1.5px solid',
                          borderColor: limit.is_accepting ? '#059669' : '#DC2626',
                          background: limit.is_accepting ? '#D1FAE5' : '#FEE2E2',
                          color: limit.is_accepting ? '#059669' : '#DC2626',
                          fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit'
                        }}>
                          {limit.is_accepting ? ' Accepting' : ' Paused'}
                        </button>
                        <button onClick={() => deleteDailyLimit(limit.id)} style={{ padding: '6px 10px', borderRadius: '8px', background: '#FEF2F2', border: 'none', color: '#EF4444', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit' }}>
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── HOLIDAYS TAB ── */}
          {tab === 'holidays' && (
            <div>
              <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '16px' }}>
                Mark specific dates as holidays — no bookings allowed on these days.
              </p>
              <div style={{ background: '#F7F9F8', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                  <div>
                    <p style={{ fontSize: '12px', color: '#6B7280', marginBottom: '5px' }}>Date</p>
                    <input type="date" value={holidayDate} min={today} onChange={e => setHolidayDate(e.target.value)}
                      style={{ padding: '10px 12px',color:'#4c4b4b', borderRadius: '8px', border: '1.5px solid #E5E7EB', fontSize: '14px', fontFamily: 'inherit' }} />
                  </div>
                  <div>
                    <p style={{ fontSize: '12px', color: '#6B7280', marginBottom: '5px' }}>Reason (optional)</p>
                    <input placeholder="e.g. Diwali" value={holidayReason} onChange={e => setHolidayReason(e.target.value)}
                      style={{ padding: '10px 12px', color:'#4c4b4b',borderRadius: '8px', border: '1.5px solid #E5E7EB', fontSize: '14px', fontFamily: 'inherit', width: '180px' }} />
                  </div>
                  <button onClick={addHoliday} disabled={saving} style={{ padding: '10px 20px', background: '#0D9488', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                    {saving ? 'Saving...' : 'Mark Holiday'}
                  </button>
                </div>
              </div>

              {holidays.length === 0 ? (
                <p style={{ color: '#9CA3AF', fontSize: '14px' }}>No holidays marked.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {holidays.map(h => (
                    <div key={h.id} style={{ padding: '14px 16px', background: 'white', border: '1.5px solid #FEE2E2', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <p style={{ fontSize: '14px', fontWeight: 600, color: '#111827', margin: '0 0 3px' }}>
                          🏖 {new Date(h.specific_date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </p>
                        {h.reason && <p style={{ fontSize: '12px', color: '#6B7280', margin: 0 }}>{h.reason}</p>}
                      </div>
                      <button onClick={() => deleteHoliday(h.id)} style={{ padding: '6px 10px', borderRadius: '8px', background: '#FEF2F2', border: 'none', color: '#EF4444', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit' }}>
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}