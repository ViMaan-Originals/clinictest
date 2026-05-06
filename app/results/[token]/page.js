import { supabase } from '../../lib/supabase'
import { notFound } from 'next/navigation'

/*
export default async function ResultPage({ params }) {
  const { token } = await params */

export const dynamic = 'force-dynamic'

export default async function DoctorsPage({ params }) {
  const { slug } = await Promise.resolve(params)

  // rest same


  const { data: result, error } = await supabase
    .from('test_results')
    .select('*, patients(name), clinics(name)')
    .eq('token', token)
    .single()

  if (!result || error) return notFound()

  return (
    <div style={{ fontFamily: 'sans-serif', maxWidth: '600px', margin: '80px auto', padding: '20px', textAlign: 'center' }}>
      <h1>🧪 Test Result</h1>
      <p style={{ color: '#666' }}>{result.clinics?.name}</p>

      <div style={{ padding: '20px', border: '1px solid #eee', borderRadius: '12px', margin: '30px 0' }}>
        <h2 style={{ margin: '0 0 8px' }}>{result.patients?.name}</h2>
        {result.description && <p style={{ color: '#666', margin: '0 0 16px' }}>{result.description}</p>}
        <p style={{ color: '#999', fontSize: '14px', margin: '0 0 20px' }}>
          Uploaded on {new Date(result.uploaded_at).toLocaleDateString()}
        </p>
        <a
          href={result.file_url}
          target="_blank"
          style={{ display: 'inline-block', padding: '14px 28px', background: '#0070f3', color: 'white', borderRadius: '8px', textDecoration: 'none', fontSize: '16px' }}
        >
          Download Result
        </a>
      </div>
    </div>
  )
}