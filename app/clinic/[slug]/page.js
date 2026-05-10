import { supabase } from '../../lib/supabase'
import { notFound } from 'next/navigation'
import { CalendarRange, ClipboardClock, Clock, FileUser, Hospital, MapPin, PhoneIcon, Smile, TableOfContents } from 'lucide-react'


export const dynamic = 'force-dynamic'

export default async function DoctorsPage({ params }) {
  const { slug } = await Promise.resolve(params)

  // rest same


  const { data: clinic, error } = await supabase
    .from('clinics')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!clinic || error) return notFound()

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&family=DM+Serif+Display:ital@0;1&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          font-family: 'DM Sans', sans-serif;
          background: #F7F9F8;
          color: #111827;
          min-height: 100vh;
        }

        .page {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }

        /* Hero */
        .hero {
          background: linear-gradient(160deg, #0D9488 0%, #0f766e 60%, #134e4a 100%);
          padding: 56px 24px 80px;
          position: relative;
          overflow: hidden;
        }

        .hero::before {
          content: '';
          position: absolute;
          top: -60px; right: -60px;
          width: 280px; height: 280px;
          border-radius: 50%;
          background: rgba(255,255,255,0.06);
        }

        .hero::after {
          content: '';
          position: absolute;
          bottom: -80px; left: -40px;
          width: 220px; height: 220px;
          border-radius: 50%;
          background: rgba(255,255,255,0.04);
        }

        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(255,255,255,0.15);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255,255,255,0.2);
          color: white;
          padding: 6px 14px;
          border-radius: 100px;
          font-size: 13px;
          font-weight: 500;
          margin-bottom: 20px;
          letter-spacing: 0.02em;
        }

        .hero-name {
          font-family: calibri;
          font-size: clamp(32px, 8vw, 48px);
          color: white;
          text-transform: uppercase;
          line-height: 1.15;
          margin-bottom: 24px;
          position: relative;
          z-index: 1;
        }

        .hero-info {
          display: flex;
          flex-direction: column;
          gap: 10px;
          position: relative;
          z-index: 1;
        }

        .hero-info-item {
          display: flex;
          align-items: center;
          gap: 10px;
          color: rgba(255,255,255,0.85);
          font-size: 14px;
          font-weight: 400;
        }

        .hero-info-icon {
          width: 32px;
          height: 32px;
          background: rgba(255,255,255,0.15);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 15px;
          flex-shrink: 0;
        }

        /* Cards */
        .content {
          padding: 0 20px 40px;
          max-width: 480px;
          margin: 0 auto;
          width: 100%;
          .card {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.05);
}
          flex: 1;
        }

        .actions-card {
          background: white;
          border-radius: 20px;
          padding: 8px;
          margin-top: -32px;
          position: relative;
          z-index: 10;
          box-shadow: 0 4px 24px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04);
          margin-bottom: 20px;
        }

        .action-btn {
          display: flex;
          align-items: center;
          gap: 16px;
          width: 100%;
          padding: 16px;
          border-radius: 14px;
          text-decoration: none;
          color: #111827;
          transition: background 0.15s ease;
          border: none;
          background: none;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
        }

        .action-btn:hover { background: #F7F9F8; }

        .action-btn:active { background: #ECFDF5; }

        .action-btn + .action-btn {
          border-top: 1px solid #F3F4F6;
        }

        .action-icon {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          flex-shrink: 0;
        }

        .action-icon.teal { background: #CCFBF1; }
        .action-icon.amber { background: #FEF3C7; }

        .action-label {
          flex: 1;
          text-align: left;
        }

        .action-label strong {
          display: block;
          font-size: 15px;
          font-weight: 600;
          margin-bottom: 2px;
        }

        .action-label span {
          font-size: 13px;
          color: #6B7280;
        }

        .action-arrow {
          color: #D1D5DB;
          font-size: 18px;
        }


        .footer {
          text-align: center;
          padding: 24px;
          color: #9CA3AF;
          font-size: 12px;
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .hero { animation: fadeUp 0.4s ease both; }
        .actions-card { animation: fadeUp 0.4s 0.1s ease both; }
        .info-card { animation: fadeUp 0.4s 0.2s ease both; }
      `}</style>

      <div className="page">
        <div className="hero">
          <div className="hero-badge"><Hospital/> Healthcare</div>
          <h1 className="hero-name">{clinic.name}</h1>
          <div className="hero-info">
            {clinic.address && (
              <div className="hero-info-item">
                <div className="hero-info-icon"><MapPin size={'20px'} /></div>
                <span>{clinic.address}</span>
              </div>
            )}
            {clinic.phone && (
              <div className="hero-info-item">
                <div className="hero-info-icon"><PhoneIcon size={'20px'} /></div>
                <span>{clinic.phone}</span>
              </div>
            )}
            {clinic.timings && (
              <div className="hero-info-item">
                <div className="hero-info-icon"><Clock size={'20px'} /></div>
                <span>{clinic.timings}</span>
              </div>
            )}
          </div>
        </div>

        <div className="content">
          <div className="actions-card">
            <a href={`/clinic/${slug}/book`} className="action-btn">
              <div className="action-icon teal"><CalendarRange size={'20px'} color='#4c4c4c'/></div>
              <div className="action-label">
                <strong>Book Appointment</strong>
                <span>Schedule a visit with our doctors</span>
              </div>
              <span className="action-arrow">›</span>
            </a>
            <a href={`/clinic/${slug}/checkstatus`} className="action-btn">
              <div className="action-icon amber"><ClipboardClock size={'20px'} color='#4c4c4c' /></div>
              <div className="action-label">
                <strong>Check Appointment Status</strong>
                <span></span>
              </div>
              <span className="action-arrow">›</span>
            </a>
            <a href={`/clinic/${slug}/doctors`} className="action-btn">
              <div className="action-icon amber"><Smile size={'20px'} color='#4c4c4c'/></div>
              <div className="action-label">
                <strong>Our Doctors</strong>
                <span>Know more about us</span>
              </div>
              <span className="action-arrow">›</span>
            </a>
            <a href={`/clinic/${slug}/faqs`} className="action-btn">
              <div className="action-icon amber"><TableOfContents size={'20px'} color='#4c4c4c'/></div>
              <div className="action-label">
                <strong>FAQs</strong>
                <span>Common questions answered</span>
              </div>
              <span className="action-arrow">›</span>
            </a>
          </div>

          

        </div>
        
        <div className="footer">Powered by ClinicApp</div>
      </div>
    </>
  )
}