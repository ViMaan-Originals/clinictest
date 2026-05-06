import { supabase } from '../../../lib/supabase'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function DoctorsPage({ params }) {
  const { slug } = params

  const { data: clinic } = await supabase
    .from('clinics')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!clinic) return notFound()

  const { data: doctors } = await supabase
    .from('doctors').select('*')
    .eq('clinic_id', clinic.id)
    .order('created_at', { ascending: true })

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&family=DM+Serif+Display&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'DM Sans', sans-serif; background: #F7F9F8; }

        .hero {
          background: linear-gradient(160deg, #0D9488 0%, #0f766e 60%, #134e4a 100%);
          padding: 48px 24px 72px;
          position: relative;
          overflow: hidden;
        }
        .hero::before {
          content: '';
          position: absolute;
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

        .doctors-list {
          margin-top: -32px;
          position: relative;
          z-index: 10;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .doctor-card {
          background: white;
          border-radius: 16px;
          padding: 20px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.06);
        }

        .doctor-header {
          display: flex;
          align-items: center;
          gap: 14px;
          text-transform:uppercase;
          margin-bottom: 14px;
        }

        .doctor-avatar {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: #CCFBF1;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          flex-shrink: 0;
        }

        .doctor-name {
          font-size: 16px;
          font-weight: 600;
          color: #111827;
          margin-bottom: 3px;
        }

        .doctor-spec {
          font-size: 13px;
          color: #0D9488;
          font-weight: 500;
        }

        .doctor-tags {
          display: flex;
          gap: 8px;
          flex-direction:column;
          text-transform:uppercase;
          margin-bottom: 12px;
        }

        .tag {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 5px 10px;
          background: #F7F9F8;
          border-radius: 8px;
          font-size: 12px;
          color: #374151;
          font-weight: 500;
        }

        .doctor-bio {
          font-size: 13px;
          color: #6B7280;
          line-height: 1.6;
          border-top: 1px solid #F3F4F6;
          padding-top: 12px;
          margin-top: 4px;
        }

        .empty {
          text-align: center;
          padding: 60px 20px;
          color: #9CA3AF;
          font-size: 15px;
        }

        .footer {
          text-align: center;
          padding: 32px 24px 24px;
          color: #9CA3AF;
          font-size: 12px;
        }
        
        #tagid{
            color: #817f7f

        }

    #docImg{
        overflow:hidden;
        border-radius:50%;
        width:80px;
        height:80px}

        @keyframes fadeUp { from { opacity:0; transform: translateY(12px); } to { opacity:1; transform: translateY(0); } }
        .doctor-card { animation: fadeUp 0.3s ease both; }
        ${doctors?.map((_, i) => `.doctor-card:nth-child(${i + 1}) { animation-delay: ${i * 0.07}s; }`).join('\n')}
      `}</style>

      <div className="hero">
        <a href={`/clinic/${slug}`} className="back">← Back</a>
        <h1 className="hero-title">Our Doctors</h1>
        <p className="hero-sub">{clinic.name}</p>
      </div>

      <div className="content">
        {doctors && doctors.length > 0 ? (
          <div className="doctors-list">
            {doctors.map(doc => (
              <div key={doc.id} className="doctor-card">
                <div className="doctor-header">
                  <div className="doctor-avatar"><img id='docImg' src='https://imgs.search.brave.com/fA4-r5kNhKcDwFpuq2vp2Me2Bv7SSYEGp-ds3BHLEkI/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9kcnVw/YWwtY2RuLWhmYWVk/ZGNkYm5nNWhmYmcu/YTAxLmF6dXJlZmQu/bmV0L3NpdGVzL2Rl/ZmF1bHQvZmlsZXMv/c3R5bGVzL2RvY3Rv/cl9jYXJkL3B1Ymxp/Yy8yMDI2LTAyL2Ry/LWJoYWJhdG9zaC1i/aXN3YXMuanBnLndl/YnA_aXRvaz1BMDJ1/S0pBMQ'></img></div>
                  <div>
                    <p className="doctor-name">{doc.name}</p>
                    {doc.specialization && <p className="doctor-spec">{doc.specialization}</p>}
                  </div>
                </div>

                <div className="doctor-tags">
                  {doc.qualification && <span className="tag"> <h4 id='tagid'>Qualifications: </h4> {doc.qualification}</span>}
                  {doc.experience && <span className="tag"> <h4 id='tagid'> Experience: </h4> {doc.experience}</span>}
                  {doc.available_days && <span className="tag"> <h4 id='tagid'>Available: </h4> {doc.available_days}</span>}
                </div>

                {doc.bio && <p className="doctor-bio">{doc.bio}</p>}
              </div>
            ))}
          </div>
        ) : (
          <div className="empty">No doctors added yet.</div>
        )}
      </div>

      <div className="footer">Powered by ClinicApp</div>
    </>
  )
}
