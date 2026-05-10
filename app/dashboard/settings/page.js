'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import { QRCodeSVG } from 'qrcode.react'
import DoctorSlots from './DoctorSlots/DoctorSlots'

export default function SettingsPage() {
  const [clinic, setClinic] = useState(null)
  const [clinicId, setClinicId] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [doctors, setDoctors] = useState([])
  const [doctorName, setDoctorName] = useState('')
  const [doctorSpec, setDoctorSpec] = useState('')
  const [doctorQual, setDoctorQual] = useState('')
const [doctorExp, setDoctorExp] = useState('')
const [doctorDays, setDoctorDays] = useState('')
const [doctorBio, setDoctorBio] = useState('')
  const [form, setForm] = useState({
    name: '',
    phone: '',
    address: '',
    timings: '',
  })
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

    const c = clinicUser.clinics
    setClinic(c)
    setClinicId(c.id)
    setForm({
      name: c.name || '',
      phone: c.phone || '',
      address: c.address || '',
      timings: c.timings || '',
    })

    const { data: doctorsData } = await supabase
      .from('doctors')
      .select('*')
      .eq('clinic_id', c.id)
      .order('created_at', { ascending: true })

    setDoctors(doctorsData || [])
    setLoading(false)
  }

  async function handleSave() {
    setSaving(true)
    await supabase.from('clinics').update(form).eq('id', clinicId)
    setSaving(false)
    alert('Settings saved!')
  }

  async function addDoctor() {
  if (!doctorName) { alert('Please enter doctor name'); return }
  await supabase.from('doctors').insert({
    clinic_id: clinicId,
    name: doctorName,
    specialization: doctorSpec || null,
    qualification: doctorQual || null,
    experience: doctorExp || null,
    available_days: doctorDays || null,
    bio: doctorBio || null,
  })
  setDoctorName('')
  setDoctorSpec('')
  setDoctorQual('')
  setDoctorExp('')
  setDoctorDays('')
  setDoctorBio('')
  fetchData()
}

  async function deleteDoctor(id) {
    await supabase.from('doctors').delete().eq('id', id)
    fetchData()
  }

  if (loading) return <p style={{ padding: '20px' }}>Loading...</p>

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&family=DM+Serif+Display&display=swap');`}</style>
      <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '28px', color: '#111827', margin: '0 0 4px' }}>Settings</h1>

      {/* Clinic Info */}
      <div style={{ padding: '20px', background:'#fff' ,border: '1px solid #eee', borderRadius: '10px', marginBottom: '30px' }}>
        <h3 style={{ margin: '0 0 16px', color:'#000' }}>Clinic Info</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input
            placeholder="Clinic Name"
            onChange={e => setForm({ ...form, name: e.target.value })}
            style={{ padding: '12px', borderRadius: '8px',color:'#4f4e4e', border: '1px solid #ddd', fontSize: '15px' }}
          />
          <input
            placeholder="Phone  Number"
            /*value={form.phone}*/
            onChange={e => setForm({ ...form, phone: e.target.value })}
            style={{ padding: '12px', borderRadius: '8px',color:'#4f4e4e', border: '1px solid #ddd', fontSize: '15px' }}
          />
          <input
            placeholder="Address"
           /* value={form.address}*/
            onChange={e => setForm({ ...form, address: e.target.value })}
            style={{ padding: '12px', borderRadius: '8px', color:'#4f4e4e',border: '1px solid #ddd', fontSize: '15px' }}
          />
          <input
            placeholder="Timings (e.g. Mon-Sat, 9AM - 6PM)"
            /*value={form.timings}*/
            onChange={e => setForm({ ...form, timings: e.target.value })}
            style={{ padding: '12px', borderRadius: '8px', color:'#4f4e4e', border: '1px solid #ddd', fontSize: '15px' }}
          />
          <button
            onClick={handleSave}
            disabled={saving}
            style={{ padding: '14px', background: '#0D9488', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', cursor: 'pointer' }}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* QR Code */}
      <div style={{ padding: '20px', background:'#fff', border: '1px solid #eee', borderRadius: '10px', marginBottom: '30px' }}>
        <h3 style={{ margin: '0 0 8px', color:'#000' }}>Your Clinic QR Code</h3>
        <div style={{ marginBottom: '16px', display:'flex', alignItems:'center',justifyContent:'center'}}>
  <QRCodeSVG
    value={typeof window !== 'undefined' ? `${window.location.origin}/clinic/${clinic?.slug}` : ''}
    size={180}
  />
</div>
<p style={{ padding: '12px', background: '#f9f9f9', color:'#a29f9f', borderRadius: '8px', fontSize: '14px', wordBreak: 'break-all', margin: 0 }}>
  {typeof window !== 'undefined' ? `${window.location.origin}/clinic/${clinic?.slug}` : ''}
</p>

      </div>

      {/* Doctors */}

      
          <div style={{ padding: '20px', background:'#fff' ,border: '1px solid #eee', borderRadius: '10px', marginBottom: '30px' , display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '10px' }}>
    <input
      placeholder="Doctor Name *"
      value={doctorName}
      onChange={e => setDoctorName(e.target.value)}
      style={{ padding: '12px', borderRadius: '8px', color:'#4f4e4e',border: '1.5px solid #E5E7EB', fontSize: '15px', fontFamily: 'inherit' }}
    />
    <input
      placeholder="Specialization"
      value={doctorSpec}
      onChange={e => setDoctorSpec(e.target.value)}
      style={{ padding: '12px', borderRadius: '8px', color:'#4f4e4e',border: '1.5px solid #E5E7EB', fontSize: '15px', fontFamily: 'inherit' }}
    />
    <input
      placeholder="Qualification (e.g. MBBS, MD)"
      value={doctorQual}
      onChange={e => setDoctorQual(e.target.value)}
      style={{ padding: '12px', borderRadius: '8px', color:'#4f4e4e',border: '1.5px solid #E5E7EB', fontSize: '15px', fontFamily: 'inherit' }}
    />
    <input
      placeholder="Experience (e.g. 8 years)"
      value={doctorExp}
      onChange={e => setDoctorExp(e.target.value)}
      style={{ padding: '12px', borderRadius: '8px',color:'#4f4e4e', border: '1.5px solid #E5E7EB', fontSize: '15px', fontFamily: 'inherit' }}
    />
    <input
      placeholder="Available Days (e.g. Mon, Wed, Fri)"
      value={doctorDays}
      onChange={e => setDoctorDays(e.target.value)}
      style={{ padding: '12px', borderRadius: '8px', color:'#4f4e4e',border: '1.5px solid #E5E7EB', fontSize: '15px', fontFamily: 'inherit' }}
    />
  </div>
  <textarea
    placeholder="Short Bio"
    value={doctorBio}
    onChange={e => setDoctorBio(e.target.value)}
    rows={3}
    style={{ padding: '12px', borderRadius: '8px',color:'#4f4e4e', border: '1.5px solid #E5E7EB', fontSize: '15px', fontFamily: 'inherit', resize: 'vertical' }}
  />
  <button
    onClick={addDoctor}
    style={{ padding: '12px 20px', background: '#0D9488', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '15px', fontFamily: 'inherit', fontWeight: 600 }}
  >
    Add Doctor
  </button>
</div>
          

        {doctors.length === 0 ? (
          <p style={{ color: '#999' }}>No doctors added yet.</p>
        ) : (
          <div style={{ display: 'flex', background:'#fff', flexDirection: 'column', gap: '8px' }}>
            {doctors.map(d => (
              <div key={d.id} style={{ padding: '12px 16px', border: '1px solid #eee', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ margin: '0 0 2px', color:'#000',textTransform:'uppercase',fontWeight: 600 }}>{d.name}</p>
                  {d.specialization && <p style={{ margin: 0, color: '#666', fontSize: '13px' }}>{d.specialization}</p>}
                </div>
                <button
                  onClick={() => deleteDoctor(d.id)}
                  style={{ padding: '6px 12px', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Slot Management */}
<div style={{ padding: '20px', border: '1px solid #eee',background:'#fff', borderRadius: '10px', marginTop: '20px' }}>
  <h3 style={{ margin: '0 0 16px' ,color:'#000'}}>Doctor Slot Management</h3>
  <DoctorSlots clinicId={clinicId} doctors={doctors} />
</div>
      </div>
    
  )
}