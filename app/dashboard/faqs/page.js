'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'

export default function FaqsManagerPage() {
  const [faqs, setFaqs] = useState([])
  const [loading, setLoading] = useState(true)
  const [clinic, setClinic] = useState(null)
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [saving, setSaving] = useState(false)
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
      .from('faqs')
      .select('*')
      .eq('clinic_id', clinicUser.clinics.id)
      .order('order_index', { ascending: true })

    setFaqs(data || [])
    setLoading(false)
  }

  async function handleAdd() {
    if (!question || !answer) {
      alert('Please fill both question and answer')
      return
    }

    setSaving(true)

    await supabase.from('faqs').insert({
      clinic_id: clinic.id,
      question,
      answer,
      order_index: faqs.length,
    })

    setQuestion('')
    setAnswer('')
    setSaving(false)
    fetchData()
  }

  async function handleDelete(id) {
    await supabase.from('faqs').delete().eq('id', id)
    fetchData()
  }

  if (loading) return <p style={{ padding: '20px' }}>Loading...</p>

  return (
    <div>
      <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '28px', color: '#111827', margin: '0 0 4px'}}>FAQ Manager</h1>

      {/* Add FAQ */}
      <div style={{ background:'#fff', padding: '20px', border: '1px solid #eee', borderRadius: '10px', marginBottom: '30px' }}>
        <h3 style={{ margin: '0 0 16px' ,color:'#121212',}}>Add New FAQ</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input
            placeholder="Question *"
            value={question}
            onChange={e => setQuestion(e.target.value)}
            style={{ padding: '12px', borderRadius: '8px', color:'#4f4e4e',border: '1px solid #ddd', fontSize: '15px' }}
          />
          <textarea
            placeholder="Answer *"
            value={answer}
            onChange={e => setAnswer(e.target.value)}
            rows={4}
            style={{ padding: '12px', borderRadius: '8px', color:'#4f4e4e',border: '1px solid #ddd', fontSize: '15px', resize: 'vertical' }}
          />
          <button
            onClick={handleAdd}
            disabled={saving}
            style={{ padding: '14px', background: '#0D9488',color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', cursor: 'pointer' }}
          >
            {saving ? 'Adding...' : 'Add FAQ'}
          </button>
        </div>
      </div>

      {/* FAQs List */}
      <h3 style={{ margin: '0 0 16px' ,color:'rgb(25, 25, 25)'}}>Current FAQs</h3>
      {faqs.length === 0 ? (
        <p style={{ color: '#999' }}>No FAQs added yet.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {faqs.map((faq, index) => (
            <div key={faq.id} style={{ color: '#000',padding: '16px', border: '1px solid #eee', borderRadius: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: '0 0 8px', fontSize: '15px' }}>Q{index + 1}. {faq.question}</h3>
                  <p style={{ margin: 0, color: '#555', fontSize: '14px' }}>{faq.answer}</p>
                </div>
                <button
                  onClick={() => handleDelete(faq.id)}
                  style={{ marginLeft: '16px', padding: '6px 12px', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', flexShrink: 0 }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}