'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'

export default function ResultsPage() {
  const [patients, setPatients] = useState([])
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [clinic, setClinic] = useState(null)
  const [selectedPatient, setSelectedPatient] = useState('')
  const [description, setDescription] = useState('')
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
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

    const { data: patientsData } = await supabase
      .from('patients')
      .select('*')
      .eq('clinic_id', clinicUser.clinics.id)
      .order('name', { ascending: true })
    setPatients(patientsData || [])

    const { data: resultsData } = await supabase
      .from('test_results')
      .select('*, patients(name, phone)')
      .eq('clinic_id', clinicUser.clinics.id)
      .order('uploaded_at', { ascending: false })
    setResults(resultsData || [])

    setLoading(false)
  }

  async function handleUpload() {
    if (!selectedPatient || !file) {
      alert('Please select a patient and a file')
      return
    }

    setUploading(true)

    // Upload file to Supabase Storage
    const fileExt = file.name.split('.').pop()
    const fileName = `${clinic.id}/${selectedPatient}/${Date.now()}.${fileExt}`

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('test-results')
      .upload(fileName, file)

    if (uploadError) {
      alert('File upload failed: ' + uploadError.message)
      setUploading(false)
      return
    }

    const { data: { publicUrl } } = supabase.storage
      .from('test-results')
      .getPublicUrl(fileName)

    await supabase.from('test_results').insert({
      clinic_id: clinic.id,
      patient_id: selectedPatient,
      file_url: publicUrl,
      description: description || null,
    })

    setSelectedPatient('')
    setDescription('')
    setFile(null)
    setUploading(false)
    fetchData()
  }

  function copyLink(token) {
    const link = `${window.location.origin}/results/${token}`
    navigator.clipboard.writeText(link)
    alert('Link copied! Send this to the patient on WhatsApp.')
  }

  if (loading) return <p style={{ padding: '20px' }}>Loading...</p>

  return (
    <div >
      <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '28px', color: '#111827', margin: '0 0 4px' }}>Test Results</h1>

      {/* Upload Section */}
      <div style={{ padding: '20px', background:'#fff',border: '1px solid #eee', borderRadius: '10px', marginBottom: '30px' }}>
        <h3 style={{ margin: '0 0 16px' ,color:'#000'}}>Upload New Result</h3>
        <div style={{ display: 'flex', flexDirection: 'column', color:'#4f4e4e', gap: '12px' }}>
          <select
            value={selectedPatient}
            onChange={e => setSelectedPatient(e.target.value)}
            style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '15px' }}
          >
            <option value="">Select Patient</option>
            {patients.map(p => (
              <option key={p.id} value={p.id}>{p.name} — {p.phone}</option>
            ))}
          </select>
          <input
            placeholder="Description (optional)"
            value={description}
            onChange={e => setDescription(e.target.value)}
            style={{ color:'#4f4e4e', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '15px' }}
          />
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={e => setFile(e.target.files[0])}
            style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '15px' }}
          />
          <button
            onClick={handleUpload}
            disabled={uploading}
            style={{ padding: '14px', background: '#0D9488', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', cursor: 'pointer' }}
          >
            {uploading ? 'Uploading...' : 'Upload Result'}
          </button>
        </div>
      </div>

      {/* Results List */}
      <h3 style={{ margin: '0 0 16px' ,color:'#000'}}>Uploaded Results</h3>
      {results.length === 0 ? (
        <p style={{ color: '#999' }}>No results uploaded yet.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {results.map(r => (
            <div key={r.id} style={{ background:'#fff',padding: '16px', border: '1px solid #eee', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: '0 0 4px' ,color:'#737373'}}>{r.patients?.name}</h3>
                <p style={{ margin: '0 0 4px', color: '#666', fontSize: '14px' }}>📞 {r.patients?.phone}</p>
                {r.description && <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>{r.description}</p>}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <a
                  href={r.file_url}
                  target="_blank"
                  style={{ padding: '8px 14px', background: '#f0f0f0', color: '#333', borderRadius: '8px', textDecoration: 'none', fontSize: '14px' }}
                >
                  View
                </a>
                <button
                  onClick={() => copyLink(r.token)}
                  style={{ padding: '8px 14px', background: '#0D9488', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' }}
                >
                  Copy Link
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}