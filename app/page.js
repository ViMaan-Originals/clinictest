import { supabase } from './lib/supabase'

export default async function Home() {
  const { data, error } = await supabase.from('clinics').select('*')

  return (
    <div>
      <h1>Clinic App</h1>
      <pre>{JSON.stringify(data, null, 2)}</pre>
      {error && <p>Error: {error.message}</p>}
    </div>
  )
}

console.log('pages loading')