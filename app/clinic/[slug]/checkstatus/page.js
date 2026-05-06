'use client'

import { useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { useEffect } from 'react'

const statusColors = {
  pending: { bg: '#FEF3C7', color: '#D97706', label: '⏳ Pending' },
  confirmed: { bg: '#D1FAE5', color: '#059669', label: '✅ Confirmed' },
  cancelled: { bg: '#FEE2E2', color: '#DC2626', label: '❌ Cancelled' },
  completed: { bg: '#F3F4F6', color: '#6B7280', label: '✔️ Completed' },
}

export default function CheckStatusPage() {
  const [slug, setSlug] = useState('')
  const [clinic, setClinic] = useState(null)
  const [phone, setPhone] = useState('')
  const [appointments, setAppointments] = useState([])
  const [searched, setSearched] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const s = window.location.pathname.split('/')[2]
    setSlug(s)
    async function fetchClinic() {
      const { data } = await supabase
        .from('clinics').select('*').eq('slug', s).single()
      setClinic(data)
    }
    fetchClinic()
  }, [])

  async function checkStatus() {
    if (!phone || !clinic) return
    setLoading(true)
    setSearched(false)

    const { data: patient } = await supabase
      .from('patients').select('*')
      .eq('clinic_id', clinic.id)
      .eq('phone', phone).single()

    if (!patient) {
      setAppointments([])
      setSearched(true)
      setLoading(false)
      return
    }

    const { data } = await supabase
      .from('appointments').select('*')
      .eq('patient_id', patient.id)
      .order('date', { ascending: false })

    setAppointments(data || [])
    setSearched(true)
    setLoading(false)
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&family=DM+Serif+Display&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'DM Sans', sans-serif; background: #F7F9F8; }

        .hero {
          background: linear-gradient(160deg, #0D9488 0%, #0f766e 60%, #134e4a 100%);
          padding: 48px 24px 72px;
          position: relative; overflow: hidden;
        }
        .hero::before {
          content: ''; position: absolute;
          top: -40px; right: -40px;
          width: 200px; height: 200px;
          border-radius: 50%;
          background: rgba(255,255,255,0.06);
        }
        .back {
          display: inline-flex; align-items: center; gap: 6px;
          color: rgba(255,255,255,0.8); text-decoration: none;
          font-size: 14px; font-weight: 500; margin-bottom: 20px;
        }
        .hero-title {
          font-family: 'DM Serif Display', serif;
          font-size: 36px; color: white; margin-bottom: 4px;
        }
        .hero-sub { font-size: 14px; color: rgba(255,255,255,0.7); }

        .content {
          max-width: 480px; margin: 0 auto;
          padding: 0 20px 48px;
        }

        .card {
          background: white;
          border-radius: 20px;
          padding: 24px;
          margin-top: -32px;
          position: relative;
          z-index: 10;
          box-shadow: 0 4px 24px rgba(0,0,0,0.08);
          margin-bottom: 16px;
        }

        .input-row {
          display: flex; gap: 8px; margin-bottom: 20px;
        }

        input {
          flex: 1; padding: 13px 16px;
          border-radius: 12px; border: 1.5px solid #E5E7EB;
          font-size: 15px; outline: none;
          font-family: 'DM Sans', sans-serif;
          transition: border-color 0.15s;
        }
        input:focus { border-color: #0D9488; }

        .check-btn {
          padding: 13px 20px; background: #0D9488;
          color: white; border: none; border-radius: 12px;
          font-size: 14px; font-weight: 600; cursor: pointer;
          font-family: 'DM Sans', sans-serif; white-space: nowrap;
        }
        .check-btn:disabled { background: #9CA3AF; cursor: not-allowed; }

        .apt-card {
          padding: 16px; border-radius: 12px;
          border: 1.5px solid #F3F4F6;
          display: flex; justify-content: space-between;
          align-items: center; margin-bottom: 10px;
        }

        .apt-date { font-size: 15px; font-weight: 600; color: #111827; margin-bottom: 3px; }
        .apt-time { font-size: 13px; color: #6B7280; }

        .status-badge {
          padding: 5px 12px; border-radius: 100px;
          font-size: 12px; font-weight: 600;
        }

        .empty { text-align: center; color: #9CA3AF; font-size: 14px; padding: 20px 0; }

        .footer { text-align: center; padding: 32px 24px 24px; color: #9CA3AF; font-size: 12px; }

        @keyframes fadeUp { from { opacity:0; transform: translateY(12px); } to { opacity:1; transform: translateY(0); } }
        .card { animation: fadeUp 0.3s ease; }
      `}</style>

      <div className="hero">
        <a href={slug ? `/clinic/${slug}` : '#'} className="back">← Back</a>
        <h1 className="hero-title">Appointment Status</h1>
        <p className="hero-sub">{clinic?.name}</p>
      </div>

      <div className="content">
        <div className="card">
          <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '16px' }}>
            Enter your phone number to check your appointment status.
          </p>
          <div className="input-row">
            <input
              placeholder="Your phone number"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && checkStatus()}
              style={{  color: '#6B7280'}}
            />
            <button className="check-btn" onClick={checkStatus} disabled={loading}>
              {loading ? '...' : 'Check'}
            </button>
          </div>

          {searched && appointments.length === 0 && (
            <p className="empty">No appointments found for this number.</p>
          )}

          {appointments.length > 0 && (
            <div>
              {appointments.map(apt => (
                <div key={apt.id} className="apt-card">
                  <div>
                    <p className="apt-date">{apt.date}</p>
                    <p className="apt-time">{apt.time_slot}</p>
                  </div>
                  <span
                    className="status-badge"
                    style={{ background: statusColors[apt.status]?.bg, color: statusColors[apt.status]?.color }}
                  >
                    {statusColors[apt.status]?.label}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="footer">Powered by ClinicApp</div>
    </>
  )
}