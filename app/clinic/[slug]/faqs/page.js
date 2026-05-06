import { supabase } from '../../../lib/supabase'
import { notFound } from 'next/navigation'

export default async function FaqsPage({ params }) {
  const { slug } = params

  const { data: clinic } = await supabase
    .from('clinics').select('*').eq('slug', slug).single()

  if (!clinic) return notFound()

  const { data: faqs } = await supabase
    .from('faqs').select('*')
    .eq('clinic_id', clinic.id)
    .order('order_index', { ascending: true })

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

        .faq-list {
          margin-top: -32px;
          position: relative;
          z-index: 10;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .faq-item {
          background: white;
          border-radius: 16px;
          padding: 20px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.06);
        }

        .faq-q {
          font-size: 15px;
          font-weight: 600;
          color: #111827;
          margin-bottom: 10px;
          display: flex;
          gap: 12px;
          align-items: flex-start;
        }

        .faq-q-badge {
          background: #CCFBF1;
          color: #0D9488;
          font-size: 12px;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 6px;
          flex-shrink: 0;
          margin-top: 2px;
        }

        .faq-a {
          font-size: 14px;
          color: #6B7280;
          line-height: 1.6;
          padding-left: 36px;
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

        @keyframes fadeUp { from { opacity:0; transform: translateY(12px); } to { opacity:1; transform: translateY(0); } }
        .faq-item { animation: fadeUp 0.3s ease both; }
        ${faqs?.map((_, i) => `.faq-item:nth-child(${i + 1}) { animation-delay: ${i * 0.05}s; }`).join('\n')}
      `}</style>

      <div className="hero">
        <a href={`/clinic/${slug}`} className="back">← Back</a>
        <h1 className="hero-title">FAQs</h1>
        <p className="hero-sub">{clinic.name}</p>
      </div>

      <div className="content">
        {faqs && faqs.length > 0 ? (
          <div className="faq-list">
            {faqs.map((faq, i) => (
              <div key={faq.id} className="faq-item">
                <div className="faq-q">
                  <span className="faq-q-badge">Q{i + 1}</span>
                  {faq.question}
                </div>
                <p className="faq-a">{faq.answer}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty">No FAQs added yet.</div>
        )}
      </div>

      <div className="footer">Powered by ClinicApp</div>
    </>
  )
}